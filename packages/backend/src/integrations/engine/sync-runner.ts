import { prisma } from '../../config/db.js';
import { credentialVault } from '../../services/credential-vault.js';
import { GitHubProvider } from '../providers/github/index.js';
import { AWSProvider } from '../providers/aws/index.js';
import { GoogleWorkspaceProvider } from '../providers/google-workspace/index.js';
import type { BaseIntegrationProvider } from '../providers/base-provider.js';
import type { SyncResult, GeneratedEvidence, IntegrationProviderConfig, ControlMapping } from './types.js';
import { logger } from '../../utils/logger.js';

/**
 * SyncRunner orchestrates the execution of integration syncs.
 *
 * Flow:
 * 1. Load integration and decrypt credentials
 * 2. Create appropriate provider instance
 * 3. Connect and run collectors
 * 4. Generate and save evidence
 * 5. Update control verification status
 * 6. Log results
 */
export class SyncRunner {
  /**
   * Get the appropriate provider class for an integration type.
   */
  private createProvider(
    type: string,
    config: IntegrationProviderConfig
  ): BaseIntegrationProvider {
    switch (type) {
      case 'github':
        return new GitHubProvider(config);
      case 'aws':
        return new AWSProvider(config);
      case 'gsuite':
        return new GoogleWorkspaceProvider(config);
      default:
        throw new Error(`Unsupported integration type: ${type}`);
    }
  }

  /**
   * Run a sync for a specific integration.
   *
   * @param integrationId - The integration to sync
   * @param collectors - Optional specific collectors to run (default: all)
   * @returns Sync result with evidence and control updates
   */
  async runSync(integrationId: string, collectors?: string[]): Promise<SyncResult> {
    const startTime = Date.now();

    // Load integration
    const integration = await prisma.integration.findUnique({
      where: { id: integrationId },
    });

    if (!integration) {
      throw new Error(`Integration not found: ${integrationId}`);
    }

    if (!integration.credentialsEncrypted) {
      throw new Error('Integration has no credentials configured');
    }

    logger.info(`Starting sync for integration ${integrationId} (${integration.type})`);

    // Create integration log
    const log = await prisma.integrationLog.create({
      data: {
        integrationId,
        operation: 'sync',
        status: 'running',
        startedAt: new Date(),
        details: { collectors: collectors || 'all' },
      },
    });

    try {
      // Decrypt credentials
      const credentials = await credentialVault.decrypt(integration.credentialsEncrypted);

      // Create provider
      const provider = this.createProvider(integration.type, {
        organizationId: integration.organizationId,
        integrationId: integration.id,
        credentials,
        config: integration.config as Record<string, unknown>,
      });

      // Connect
      const connectionResult = await provider.connect();
      if (!connectionResult.success) {
        throw new Error(connectionResult.error || 'Failed to connect');
      }

      logger.info(`Connected to ${integration.type}`, { metadata: connectionResult.metadata });

      // Run collectors
      const collectionResults = await provider.collect(collectors);

      const successfulCollections = collectionResults.filter((r) => r.success);
      const failedCollections = collectionResults.filter((r) => !r.success);

      logger.info(`Collection completed: ${successfulCollections.length} successful, ${failedCollections.length} failed`);

      // Generate evidence
      const generatedEvidence = provider.generateEvidence(collectionResults);

      logger.info(`Generated ${generatedEvidence.length} evidence records`);

      // Save evidence
      const savedEvidenceMap = await this.saveEvidence(
        integration.organizationId,
        integrationId,
        generatedEvidence
      );

      // Match controls and update verification status, and link evidence to controls
      const { verified, failed } = await this.updateControlVerification(
        integration.organizationId,
        generatedEvidence,
        provider.getControlMappings(),
        savedEvidenceMap
      );

      // Disconnect
      await provider.disconnect();

      // Calculate result
      const result: SyncResult = {
        evidenceGenerated: savedEvidenceMap.size,
        controlsVerified: verified,
        controlsFailed: failed,
        errors: collectionResults.flatMap((r) => r.errors),
        durationMs: Date.now() - startTime,
      };

      // Update integration and log as successful
      await prisma.$transaction([
        prisma.integration.update({
          where: { id: integrationId },
          data: {
            status: 'active',
            errorMessage: null,
            lastSyncAt: new Date(),
            nextSyncAt: this.calculateNextSync(integration.syncFrequencyMinutes),
          },
        }),
        prisma.integrationLog.update({
          where: { id: log.id },
          data: {
            status: 'completed',
            itemsProcessed: result.evidenceGenerated,
            itemsFailed: result.errors.length,
            completedAt: new Date(),
            durationMs: result.durationMs,
            details: JSON.parse(JSON.stringify(result)),
          },
        }),
      ]);

      logger.info(`Sync completed for ${integrationId}`, result);

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';

      logger.error(`Sync failed for ${integrationId}`, { error: errorMessage });

      // Update integration and log as failed
      await prisma.$transaction([
        prisma.integration.update({
          where: { id: integrationId },
          data: {
            status: 'error',
            errorMessage,
          },
        }),
        prisma.integrationLog.update({
          where: { id: log.id },
          data: {
            status: 'failed',
            errorMessage,
            completedAt: new Date(),
            durationMs: Date.now() - startTime,
          },
        }),
      ]);

      throw error;
    }
  }

  /**
   * Save generated evidence to the database.
   * Returns a map from evidence index to saved evidence ID.
   */
  private async saveEvidence(
    organizationId: string,
    integrationId: string,
    evidence: GeneratedEvidence[]
  ): Promise<Map<number, string>> {
    const savedMap = new Map<number, string>();

    for (let i = 0; i < evidence.length; i++) {
      const e = evidence[i]!;
      const saved = await prisma.evidence.create({
        data: {
          organizationId,
          integrationId,
          title: e.title,
          description: e.description,
          type: e.type,
          source: e.source,
          metadata: JSON.parse(JSON.stringify(e.metadata)),
          validFrom: e.validFrom,
          validUntil: e.validUntil,
          isProvisional: false, // Integration-generated = verified source
          reviewStatus: 'pending',
          collectedAt: new Date(),
        },
      });

      savedMap.set(i, saved.id);
      logger.debug(`Saved evidence: ${saved.id} - ${e.title}`);
    }

    return savedMap;
  }

  /**
   * Update control implementation and verification status based on evidence.
   *
   * For automated controls (matched by integration evidence):
   * - Implementation status is set based on evidence verification result
   * - Verification status confirms the integration checked it
   * - Evidence is linked to the control via EvidenceControlLink
   *
   * Matches controls by:
   * 1. Control name containing pattern keywords
   * 2. Control code matching pattern
   * 3. Framework requirement codes (e.g., A.5.9, CC8.1) that the control is mapped to
   */
  private async updateControlVerification(
    organizationId: string,
    evidence: GeneratedEvidence[],
    mappings: ControlMapping[],
    savedEvidenceMap: Map<number, string>
  ): Promise<{ verified: number; failed: number }> {
    let verified = 0;
    let failed = 0;

    // Get all controls for the organization with their framework mappings
    const controls = await prisma.control.findMany({
      where: {
        organizationId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        code: true,
        implementationStatus: true,
        isAutomated: true,
        frameworkMappings: {
          select: {
            frameworkRequirement: {
              select: {
                code: true,
                name: true,
              },
            },
          },
        },
      },
    });

    logger.debug(`Found ${controls.length} controls for organization ${organizationId}`);

    // Track which controls have been processed to avoid duplicates
    const processedControlIds = new Set<string>();

    // For each piece of evidence, find matching controls and update
    for (let evidenceIndex = 0; evidenceIndex < evidence.length; evidenceIndex++) {
      const e = evidence[evidenceIndex]!;
      const savedEvidenceId = savedEvidenceMap.get(evidenceIndex);

      const relevantMappings = mappings.filter(
        (m) => m.evidenceSource === e.source || m.evidenceSource === `${e.source}-*`
      );

      for (const mapping of relevantMappings) {
        for (const control of controls) {
          // Skip if already processed in this sync
          if (processedControlIds.has(control.id)) continue;

          // Check if control matches mapping criteria
          const nameMatch = mapping.controlNamePattern
            ? mapping.controlNamePattern.test(control.name)
            : false;
          const codeMatch = mapping.controlCodePattern && control.code
            ? mapping.controlCodePattern.test(control.code)
            : false;

          // Check evidence control patterns against control name
          const patternMatch = e.controlPatterns?.some((pattern) =>
            control.name.toLowerCase().includes(pattern.toLowerCase())
          );

          // Check evidence control patterns against framework requirement codes
          // This allows matching A.5.9, CC8.1, etc.
          const frameworkCodeMatch = e.controlPatterns?.some((pattern) =>
            control.frameworkMappings.some(
              (fm) => fm.frameworkRequirement.code.toLowerCase() === pattern.toLowerCase()
            )
          );

          if (nameMatch || codeMatch || patternMatch || frameworkCodeMatch) {
            processedControlIds.add(control.id);

            const verificationSource = e.source;
            const verificationResult = e.verificationResult;
            const matchedBy = frameworkCodeMatch
              ? `Framework requirement: ${control.frameworkMappings.map((fm) => fm.frameworkRequirement.code).join(', ')}`
              : 'Control name/code pattern';

            // Link evidence to control if we have a saved evidence ID
            if (savedEvidenceId) {
              await prisma.evidenceControlLink.upsert({
                where: {
                  evidenceId_controlId: {
                    evidenceId: savedEvidenceId,
                    controlId: control.id,
                  },
                },
                create: {
                  evidenceId: savedEvidenceId,
                  controlId: control.id,
                  relevance: 'primary',
                  notes: `Auto-linked by integration sync. ${matchedBy}`,
                },
                update: {
                  notes: `Auto-linked by integration sync. ${matchedBy}`,
                },
              });
              logger.debug(`Linked evidence ${savedEvidenceId} to control ${control.id}`);
            }

            // Determine implementation and verification status based on evidence
            if (verificationResult) {
              // Auto-set implementation status based on evidence findings
              const newImplementationStatus = verificationResult.isImplemented
                ? 'implemented'
                : 'not_started';
              const newVerificationStatus = verificationResult.isImplemented
                ? 'verified'
                : 'failed';

              await prisma.control.update({
                where: { id: control.id },
                data: {
                  // Auto-set implementation status from integration evidence
                  implementationStatus: newImplementationStatus,
                  // Mark as automated control
                  isAutomated: true,
                  automationSource: verificationSource,
                  // Set verification status
                  verificationStatus: newVerificationStatus,
                  verifiedAt: new Date(),
                  verificationSource,
                  verificationDetails: JSON.parse(JSON.stringify({
                    evidenceTitle: e.title,
                    evidenceId: savedEvidenceId,
                    verifiedAt: new Date().toISOString(),
                    source: verificationSource,
                    matchedBy,
                    confidence: verificationResult.confidence,
                    reason: verificationResult.reason,
                    metrics: verificationResult.metrics,
                  })),
                },
              });

              if (verificationResult.isImplemented) {
                verified++;
                logger.debug(`Verified control (auto): ${control.name} - ${verificationResult.reason}`);
              } else {
                failed++;
                logger.debug(`Failed control (auto): ${control.name} - ${verificationResult.reason}`);
              }
            } else {
              // No verification result - just link evidence without changing status
              // This handles evidence that doesn't have pass/fail criteria
              await prisma.control.update({
                where: { id: control.id },
                data: {
                  isAutomated: true,
                  automationSource: verificationSource,
                  verificationSource,
                  verificationDetails: JSON.parse(JSON.stringify({
                    evidenceTitle: e.title,
                    evidenceId: savedEvidenceId,
                    linkedAt: new Date().toISOString(),
                    source: verificationSource,
                    matchedBy,
                    note: 'Evidence linked but no automated verification criteria',
                  })),
                },
              });
              logger.debug(`Linked evidence to control: ${control.name} (no verification criteria)`);
            }
          }
        }
      }
    }

    return { verified, failed };
  }

  /**
   * Calculate next sync time based on frequency.
   */
  private calculateNextSync(frequencyMinutes: number): Date {
    return new Date(Date.now() + frequencyMinutes * 60 * 1000);
  }

  /**
   * Test connection for an integration without running full sync.
   */
  async testConnection(integrationId: string): Promise<{
    success: boolean;
    latencyMs: number;
    error?: string;
  }> {
    const integration = await prisma.integration.findUnique({
      where: { id: integrationId },
    });

    if (!integration) {
      throw new Error(`Integration not found: ${integrationId}`);
    }

    if (!integration.credentialsEncrypted) {
      throw new Error('Integration has no credentials configured');
    }

    const credentials = await credentialVault.decrypt(integration.credentialsEncrypted);

    const provider = this.createProvider(integration.type, {
      organizationId: integration.organizationId,
      integrationId: integration.id,
      credentials,
      config: integration.config as Record<string, unknown>,
    });

    const result = await provider.testConnection();

    // Update integration status based on test
    await prisma.integration.update({
      where: { id: integrationId },
      data: {
        status: result.success ? 'active' : 'error',
        errorMessage: result.success ? null : result.error,
      },
    });

    return result;
  }
}

// Singleton instance
export const syncRunner = new SyncRunner();
