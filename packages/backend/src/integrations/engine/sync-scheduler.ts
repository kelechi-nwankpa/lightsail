import cron from 'node-cron';
import { prisma } from '../../config/db.js';
import { syncRunner } from './sync-runner.js';
import { logger } from '../../utils/logger.js';

/**
 * SyncScheduler manages automated sync jobs for integrations.
 *
 * Responsibilities:
 * 1. Check for integrations with due syncs every minute
 * 2. Queue and execute sync jobs (avoiding duplicates)
 * 3. Handle failed syncs with retry logic
 * 4. Respect concurrency limits
 */
export class SyncScheduler {
  private cronJob: cron.ScheduledTask | null = null;
  private isRunning = false;
  private activeSyncs = new Set<string>();
  private readonly maxConcurrentSyncs: number;

  constructor(options: { maxConcurrentSyncs?: number } = {}) {
    this.maxConcurrentSyncs = options.maxConcurrentSyncs ?? 3;
  }

  /**
   * Start the scheduler.
   * Runs every minute to check for due syncs.
   */
  start(): void {
    if (this.cronJob) {
      logger.warn('Sync scheduler already running');
      return;
    }

    // Run every minute
    this.cronJob = cron.schedule('* * * * *', async () => {
      await this.checkAndRunDueSyncs();
    });

    this.isRunning = true;
    logger.info('Sync scheduler started (checking every minute)');

    // Run immediately on start to catch any overdue syncs
    this.checkAndRunDueSyncs().catch((error) => {
      logger.error('Error in initial sync check', { error });
    });
  }

  /**
   * Stop the scheduler.
   */
  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }
    this.isRunning = false;
    logger.info('Sync scheduler stopped');
  }

  /**
   * Check if the scheduler is running.
   */
  get running(): boolean {
    return this.isRunning;
  }

  /**
   * Get currently active sync integration IDs.
   */
  get activeIntegrations(): string[] {
    return Array.from(this.activeSyncs);
  }

  /**
   * Check for due syncs and execute them.
   */
  private async checkAndRunDueSyncs(): Promise<void> {
    // Don't start new check if we're at capacity
    if (this.activeSyncs.size >= this.maxConcurrentSyncs) {
      logger.debug(`At max concurrent syncs (${this.maxConcurrentSyncs}), skipping check`);
      return;
    }

    try {
      // Find integrations with due syncs
      const dueIntegrations = await prisma.integration.findMany({
        where: {
          status: 'active',
          nextSyncAt: {
            lte: new Date(),
          },
          // Exclude integrations currently syncing
          id: {
            notIn: Array.from(this.activeSyncs),
          },
        },
        take: this.maxConcurrentSyncs - this.activeSyncs.size,
        orderBy: {
          nextSyncAt: 'asc', // Oldest first
        },
        select: {
          id: true,
          type: true,
          organizationId: true,
          nextSyncAt: true,
        },
      });

      if (dueIntegrations.length === 0) {
        return;
      }

      logger.info(`Found ${dueIntegrations.length} integration(s) due for sync`);

      // Start syncs concurrently (but don't await all together)
      for (const integration of dueIntegrations) {
        // Don't exceed limit
        if (this.activeSyncs.size >= this.maxConcurrentSyncs) {
          break;
        }

        // Start sync in background
        this.runSync(integration.id, integration.type).catch((error) => {
          logger.error(`Scheduled sync failed for ${integration.id}`, { error });
        });
      }
    } catch (error) {
      logger.error('Error checking for due syncs', { error });
    }
  }

  /**
   * Run a sync for a specific integration.
   * Handles tracking active syncs and cleanup.
   */
  private async runSync(integrationId: string, integrationType: string): Promise<void> {
    // Mark as active
    this.activeSyncs.add(integrationId);
    logger.info(`Starting scheduled sync for ${integrationId} (${integrationType})`);

    try {
      const result = await syncRunner.runSync(integrationId);

      logger.info(`Scheduled sync completed for ${integrationId}`, {
        evidenceGenerated: result.evidenceGenerated,
        controlsVerified: result.controlsVerified,
        controlsFailed: result.controlsFailed,
        durationMs: result.durationMs,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Scheduled sync failed for ${integrationId}`, { error: errorMessage });

      // Update integration with error (syncRunner already does this, but ensure it's set)
      await prisma.integration.update({
        where: { id: integrationId },
        data: {
          status: 'error',
          errorMessage: `Scheduled sync failed: ${errorMessage}`,
        },
      });
    } finally {
      // Remove from active set
      this.activeSyncs.delete(integrationId);
    }
  }

  /**
   * Manually trigger a sync for an integration (outside of schedule).
   * Returns immediately, sync runs in background.
   */
  async triggerSync(integrationId: string): Promise<{ queued: boolean; reason?: string }> {
    // Check if already syncing
    if (this.activeSyncs.has(integrationId)) {
      return { queued: false, reason: 'Sync already in progress' };
    }

    // Check if at capacity
    if (this.activeSyncs.size >= this.maxConcurrentSyncs) {
      return { queued: false, reason: 'Max concurrent syncs reached, try again later' };
    }

    // Get integration type for logging
    const integration = await prisma.integration.findUnique({
      where: { id: integrationId },
      select: { type: true },
    });

    if (!integration) {
      return { queued: false, reason: 'Integration not found' };
    }

    // Start sync in background
    this.runSync(integrationId, integration.type).catch((error) => {
      logger.error(`Manual sync trigger failed for ${integrationId}`, { error });
    });

    return { queued: true };
  }

  /**
   * Get scheduler status and statistics.
   */
  async getStatus(): Promise<{
    running: boolean;
    activeSyncs: string[];
    maxConcurrentSyncs: number;
    pendingSyncs: number;
    nextDueSync: Date | null;
  }> {
    const [pendingCount, nextDue] = await Promise.all([
      prisma.integration.count({
        where: {
          status: 'active',
          nextSyncAt: { lte: new Date() },
          id: { notIn: Array.from(this.activeSyncs) },
        },
      }),
      prisma.integration.findFirst({
        where: { status: 'active' },
        orderBy: { nextSyncAt: 'asc' },
        select: { nextSyncAt: true },
      }),
    ]);

    return {
      running: this.isRunning,
      activeSyncs: Array.from(this.activeSyncs),
      maxConcurrentSyncs: this.maxConcurrentSyncs,
      pendingSyncs: pendingCount,
      nextDueSync: nextDue?.nextSyncAt ?? null,
    };
  }
}

// Singleton instance
export const syncScheduler = new SyncScheduler();
