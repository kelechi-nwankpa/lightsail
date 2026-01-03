import {
  IAMClient,
  ListUsersCommand,
  ListMFADevicesCommand,
  GetAccountPasswordPolicyCommand,
  ListAccessKeysCommand,
  GetAccessKeyLastUsedCommand,
  type User,
} from '@aws-sdk/client-iam';
import {
  CloudTrailClient,
  DescribeTrailsCommand,
  GetTrailStatusCommand,
} from '@aws-sdk/client-cloudtrail';
import {
  S3Client,
  ListBucketsCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  GetBucketVersioningCommand,
} from '@aws-sdk/client-s3';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';

import { BaseIntegrationProvider } from '../base-provider.js';
import type {
  ConnectionResult,
  TestResult,
  CollectionResult,
  GeneratedEvidence,
  ControlMapping,
  CollectorInfo,
  CredentialField,
  ConfigField,
  CollectionError,
} from '../../engine/types.js';
import { logger } from '../../../utils/logger.js';

/**
 * AWS Integration Provider
 *
 * Collects security configuration data from AWS:
 * - IAM: Users, MFA status, password policies, access keys
 * - CloudTrail: Audit logging configuration
 * - S3: Bucket encryption, public access, versioning
 */
export class AWSProvider extends BaseIntegrationProvider {
  readonly type = 'aws' as const;
  readonly displayName = 'Amazon Web Services';
  readonly description = 'IAM, CloudTrail, S3 encryption, and security configuration';
  readonly icon = 'aws';

  readonly requiredCredentials: CredentialField[] = [
    {
      key: 'accessKeyId',
      label: 'Access Key ID',
      type: 'text',
      placeholder: 'AKIAIOSFODNN7EXAMPLE',
      helpText: 'AWS Access Key ID with SecurityAudit permissions',
      required: true,
    },
    {
      key: 'secretAccessKey',
      label: 'Secret Access Key',
      type: 'password',
      placeholder: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
      helpText: 'AWS Secret Access Key',
      required: true,
    },
  ];

  readonly configFields: ConfigField[] = [
    {
      key: 'region',
      label: 'AWS Region',
      type: 'text',
      defaultValue: 'us-east-1',
      helpText: 'Primary AWS region (e.g., us-east-1, eu-west-1)',
    },
    {
      key: 'roleArn',
      label: 'Assume Role ARN (Optional)',
      type: 'text',
      helpText: 'ARN of IAM role to assume for cross-account access',
    },
  ];

  private iamClient: IAMClient | null = null;
  private cloudTrailClient: CloudTrailClient | null = null;
  private s3Client: S3Client | null = null;
  private stsClient: STSClient | null = null;
  private accountId: string | null = null;

  async connect(): Promise<ConnectionResult> {
    const missing = this.validateCredentials();
    if (missing.length > 0) {
      return {
        success: false,
        error: `Missing required credentials: ${missing.join(', ')}`,
      };
    }

    try {
      const region = this.getConfig<string>('region', 'us-east-1');
      const credentials = {
        accessKeyId: this.getCredential<string>('accessKeyId')!,
        secretAccessKey: this.getCredential<string>('secretAccessKey')!,
      };

      // Initialize clients
      this.stsClient = new STSClient({ region, credentials });
      this.iamClient = new IAMClient({ region, credentials });
      this.cloudTrailClient = new CloudTrailClient({ region, credentials });
      this.s3Client = new S3Client({ region, credentials });

      // Verify authentication
      const identity = await this.stsClient.send(new GetCallerIdentityCommand({}));
      this.accountId = identity.Account ?? null;

      this.connected = true;

      return {
        success: true,
        metadata: {
          accountId: this.accountId,
          userId: identity.UserId,
          arn: identity.Arn,
          region,
        },
      };
    } catch (error) {
      logger.error('AWS connection failed', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to authenticate with AWS',
      };
    }
  }

  async disconnect(): Promise<void> {
    this.iamClient = null;
    this.cloudTrailClient = null;
    this.s3Client = null;
    this.stsClient = null;
    this.accountId = null;
    this.connected = false;
  }

  async testConnection(): Promise<TestResult> {
    const start = Date.now();

    try {
      if (!this.stsClient) {
        const connectResult = await this.connect();
        if (!connectResult.success) {
          return {
            success: false,
            latencyMs: Date.now() - start,
            error: connectResult.error,
          };
        }
      }

      // Simple identity check
      await this.stsClient!.send(new GetCallerIdentityCommand({}));

      return {
        success: true,
        latencyMs: Date.now() - start,
        scopes: ['iam:ListUsers', 'cloudtrail:DescribeTrails', 's3:ListBuckets'],
      };
    } catch (error) {
      return {
        success: false,
        latencyMs: Date.now() - start,
        error: error instanceof Error ? error.message : 'Connection test failed',
      };
    }
  }

  getAvailableCollectors(): CollectorInfo[] {
    return [
      {
        id: 'iam',
        name: 'IAM Users & MFA',
        description: 'Collect IAM users, MFA status, password policy, and access keys',
        evidenceTypes: ['config'],
        controlCategories: ['access-control', 'authentication', 'user-management'],
      },
      {
        id: 'cloudtrail',
        name: 'CloudTrail Configuration',
        description: 'Collect CloudTrail audit logging configuration',
        evidenceTypes: ['config'],
        controlCategories: ['audit-logging', 'monitoring'],
      },
      {
        id: 's3',
        name: 'S3 Bucket Security',
        description: 'Collect S3 bucket encryption, public access, and versioning settings',
        evidenceTypes: ['config'],
        controlCategories: ['data-protection', 'encryption'],
      },
    ];
  }

  async collect(collectors?: string[]): Promise<CollectionResult[]> {
    this.ensureConnected();

    const availableCollectors = this.getAvailableCollectors();
    const collectorsToRun = collectors?.length
      ? availableCollectors.filter((c) => collectors.includes(c.id))
      : availableCollectors;

    const results: CollectionResult[] = [];

    for (const collector of collectorsToRun) {
      try {
        switch (collector.id) {
          case 'iam':
            results.push(await this.collectIAM());
            break;
          case 'cloudtrail':
            results.push(await this.collectCloudTrail());
            break;
          case 's3':
            results.push(await this.collectS3());
            break;
        }
      } catch (error) {
        logger.error(`AWS collector ${collector.id} failed`, { error });
        results.push({
          success: false,
          collector: collector.id,
          itemsCollected: 0,
          errors: [
            {
              code: 'COLLECTOR_ERROR',
              message: error instanceof Error ? error.message : 'Unknown error',
              retryable: true,
            },
          ],
          rawData: null,
          collectedAt: new Date(),
        });
      }
    }

    return results;
  }

  private async collectIAM(): Promise<CollectionResult> {
    const errors: CollectionError[] = [];
    const collectedAt = new Date();

    try {
      // List all IAM users
      const usersResponse = await this.iamClient!.send(new ListUsersCommand({}));
      const users = usersResponse.Users ?? [];

      // Get MFA status for each user
      const usersWithMFA: Array<{
        user: User;
        hasMFA: boolean;
        mfaDevices: number;
        accessKeys: Array<{ id: string; status: string; lastUsed: Date | null }>;
      }> = [];

      for (const user of users) {
        try {
          // Get MFA devices
          const mfaResponse = await this.iamClient!.send(
            new ListMFADevicesCommand({ UserName: user.UserName })
          );
          const mfaDevices = mfaResponse.MFADevices ?? [];

          // Get access keys
          const keysResponse = await this.iamClient!.send(
            new ListAccessKeysCommand({ UserName: user.UserName })
          );
          const accessKeys: Array<{ id: string; status: string; lastUsed: Date | null }> = [];

          for (const key of keysResponse.AccessKeyMetadata ?? []) {
            try {
              const lastUsedResponse = await this.iamClient!.send(
                new GetAccessKeyLastUsedCommand({ AccessKeyId: key.AccessKeyId })
              );
              accessKeys.push({
                id: key.AccessKeyId ?? '',
                status: key.Status ?? 'Unknown',
                lastUsed: lastUsedResponse.AccessKeyLastUsed?.LastUsedDate ?? null,
              });
            } catch {
              accessKeys.push({
                id: key.AccessKeyId ?? '',
                status: key.Status ?? 'Unknown',
                lastUsed: null,
              });
            }
          }

          usersWithMFA.push({
            user,
            hasMFA: mfaDevices.length > 0,
            mfaDevices: mfaDevices.length,
            accessKeys,
          });
        } catch (error) {
          errors.push({
            code: 'MFA_CHECK_FAILED',
            message: `Failed to check MFA for user ${user.UserName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            retryable: true,
            context: { userName: user.UserName },
          });
        }
      }

      // Get password policy
      let passwordPolicy: Record<string, unknown> | null = null;
      try {
        const policyResponse = await this.iamClient!.send(
          new GetAccountPasswordPolicyCommand({})
        );
        passwordPolicy = {
          minimumPasswordLength: policyResponse.PasswordPolicy?.MinimumPasswordLength,
          requireSymbols: policyResponse.PasswordPolicy?.RequireSymbols,
          requireNumbers: policyResponse.PasswordPolicy?.RequireNumbers,
          requireUppercaseCharacters: policyResponse.PasswordPolicy?.RequireUppercaseCharacters,
          requireLowercaseCharacters: policyResponse.PasswordPolicy?.RequireLowercaseCharacters,
          allowUsersToChangePassword: policyResponse.PasswordPolicy?.AllowUsersToChangePassword,
          maxPasswordAge: policyResponse.PasswordPolicy?.MaxPasswordAge,
          passwordReusePrevention: policyResponse.PasswordPolicy?.PasswordReusePrevention,
          hardExpiry: policyResponse.PasswordPolicy?.HardExpiry,
        };
      } catch (error) {
        // Password policy might not be set
        if (!(error instanceof Error && error.name === 'NoSuchEntityException')) {
          errors.push({
            code: 'PASSWORD_POLICY_ERROR',
            message: error instanceof Error ? error.message : 'Failed to get password policy',
            retryable: true,
          });
        }
      }

      // Calculate summary
      const usersWithMFACount = usersWithMFA.filter((u) => u.hasMFA).length;
      const usersWithoutMFA = usersWithMFA.filter((u) => !u.hasMFA);
      const mfaEnforcementRate =
        users.length > 0 ? Math.round((usersWithMFACount / users.length) * 100) : 100;

      // Find stale access keys (not used in 90 days)
      const staleKeyThreshold = 90 * 24 * 60 * 60 * 1000; // 90 days
      const now = Date.now();
      const staleAccessKeys = usersWithMFA.flatMap((u) =>
        u.accessKeys
          .filter(
            (k) =>
              k.status === 'Active' &&
              k.lastUsed &&
              now - k.lastUsed.getTime() > staleKeyThreshold
          )
          .map((k) => ({ userName: u.user.UserName, keyId: k.id, lastUsed: k.lastUsed }))
      );

      return {
        success: true,
        collector: 'iam',
        itemsCollected: users.length,
        errors,
        rawData: {
          users: usersWithMFA.map((u) => ({
            userName: u.user.UserName,
            userId: u.user.UserId,
            arn: u.user.Arn,
            createDate: u.user.CreateDate,
            passwordLastUsed: u.user.PasswordLastUsed,
            hasMFA: u.hasMFA,
            mfaDeviceCount: u.mfaDevices,
            accessKeyCount: u.accessKeys.length,
          })),
          passwordPolicy,
          summary: {
            totalUsers: users.length,
            usersWithMFA: usersWithMFACount,
            usersWithoutMFA: usersWithoutMFA.length,
            mfaEnforcementRate,
            staleAccessKeys: staleAccessKeys.length,
            nonCompliantUsers: usersWithoutMFA.map((u) => ({
              userName: u.user.UserName,
              email: u.user.UserName, // Often username is email
            })),
          },
        },
        collectedAt,
      };
    } catch (error) {
      return {
        success: false,
        collector: 'iam',
        itemsCollected: 0,
        errors: [
          {
            code: 'IAM_COLLECTION_FAILED',
            message: error instanceof Error ? error.message : 'Failed to collect IAM data',
            retryable: true,
          },
        ],
        rawData: null,
        collectedAt,
      };
    }
  }

  private async collectCloudTrail(): Promise<CollectionResult> {
    const errors: CollectionError[] = [];
    const collectedAt = new Date();

    try {
      // Get all trails
      const trailsResponse = await this.cloudTrailClient!.send(new DescribeTrailsCommand({}));
      const trails = trailsResponse.trailList ?? [];

      const trailDetails: Array<{
        name: string;
        s3BucketName: string | undefined;
        isMultiRegion: boolean;
        isOrganizationTrail: boolean;
        isLogging: boolean;
        hasLogFileValidation: boolean;
        kmsKeyId: string | undefined;
        includeGlobalEvents: boolean;
      }> = [];

      for (const trail of trails) {
        try {
          const statusResponse = await this.cloudTrailClient!.send(
            new GetTrailStatusCommand({ Name: trail.Name })
          );

          trailDetails.push({
            name: trail.Name ?? 'Unknown',
            s3BucketName: trail.S3BucketName,
            isMultiRegion: trail.IsMultiRegionTrail ?? false,
            isOrganizationTrail: trail.IsOrganizationTrail ?? false,
            isLogging: statusResponse.IsLogging ?? false,
            hasLogFileValidation: trail.LogFileValidationEnabled ?? false,
            kmsKeyId: trail.KmsKeyId,
            includeGlobalEvents: trail.IncludeGlobalServiceEvents ?? false,
          });
        } catch (error) {
          errors.push({
            code: 'TRAIL_STATUS_ERROR',
            message: `Failed to get status for trail ${trail.Name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            retryable: true,
            context: { trailName: trail.Name },
          });
        }
      }

      // Calculate summary
      const activeTrails = trailDetails.filter((t) => t.isLogging);
      const multiRegionTrails = trailDetails.filter((t) => t.isMultiRegion);
      const encryptedTrails = trailDetails.filter((t) => t.kmsKeyId);
      const validatedTrails = trailDetails.filter((t) => t.hasLogFileValidation);

      return {
        success: true,
        collector: 'cloudtrail',
        itemsCollected: trails.length,
        errors,
        rawData: {
          trails: trailDetails,
          summary: {
            totalTrails: trails.length,
            activeTrails: activeTrails.length,
            multiRegionTrails: multiRegionTrails.length,
            encryptedTrails: encryptedTrails.length,
            validatedTrails: validatedTrails.length,
            hasActiveMultiRegionTrail: multiRegionTrails.some((t) => t.isLogging),
            allTrailsLogging: trails.length > 0 && activeTrails.length === trails.length,
          },
        },
        collectedAt,
      };
    } catch (error) {
      return {
        success: false,
        collector: 'cloudtrail',
        itemsCollected: 0,
        errors: [
          {
            code: 'CLOUDTRAIL_COLLECTION_FAILED',
            message: error instanceof Error ? error.message : 'Failed to collect CloudTrail data',
            retryable: true,
          },
        ],
        rawData: null,
        collectedAt,
      };
    }
  }

  private async collectS3(): Promise<CollectionResult> {
    const errors: CollectionError[] = [];
    const collectedAt = new Date();

    try {
      // List all buckets
      const bucketsResponse = await this.s3Client!.send(new ListBucketsCommand({}));
      const buckets = bucketsResponse.Buckets ?? [];

      const bucketDetails: Array<{
        name: string;
        creationDate: Date | undefined;
        isEncrypted: boolean;
        encryptionType: string | null;
        publicAccessBlocked: boolean;
        versioningEnabled: boolean;
      }> = [];

      for (const bucket of buckets) {
        const bucketName = bucket.Name!;
        let isEncrypted = false;
        let encryptionType: string | null = null;
        let publicAccessBlocked = false;
        let versioningEnabled = false;

        // Check encryption
        try {
          const encryptionResponse = await this.s3Client!.send(
            new GetBucketEncryptionCommand({ Bucket: bucketName })
          );
          const rules = encryptionResponse.ServerSideEncryptionConfiguration?.Rules ?? [];
          if (rules.length > 0) {
            isEncrypted = true;
            encryptionType =
              rules[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm ?? 'Unknown';
          }
        } catch (error) {
          // No encryption configured is not an error
          if (
            !(
              error instanceof Error &&
              error.name === 'ServerSideEncryptionConfigurationNotFoundError'
            )
          ) {
            errors.push({
              code: 'ENCRYPTION_CHECK_ERROR',
              message: `Failed to check encryption for ${bucketName}`,
              retryable: true,
              context: { bucketName },
            });
          }
        }

        // Check public access block
        try {
          const publicAccessResponse = await this.s3Client!.send(
            new GetPublicAccessBlockCommand({ Bucket: bucketName })
          );
          const config = publicAccessResponse.PublicAccessBlockConfiguration;
          publicAccessBlocked =
            (config?.BlockPublicAcls ?? false) &&
            (config?.BlockPublicPolicy ?? false) &&
            (config?.IgnorePublicAcls ?? false) &&
            (config?.RestrictPublicBuckets ?? false);
        } catch (error) {
          // No public access block might not be configured
          if (!(error instanceof Error && error.name === 'NoSuchPublicAccessBlockConfiguration')) {
            errors.push({
              code: 'PUBLIC_ACCESS_CHECK_ERROR',
              message: `Failed to check public access for ${bucketName}`,
              retryable: true,
              context: { bucketName },
            });
          }
        }

        // Check versioning
        try {
          const versioningResponse = await this.s3Client!.send(
            new GetBucketVersioningCommand({ Bucket: bucketName })
          );
          versioningEnabled = versioningResponse.Status === 'Enabled';
        } catch (error) {
          errors.push({
            code: 'VERSIONING_CHECK_ERROR',
            message: `Failed to check versioning for ${bucketName}`,
            retryable: true,
            context: { bucketName },
          });
        }

        bucketDetails.push({
          name: bucketName,
          creationDate: bucket.CreationDate,
          isEncrypted,
          encryptionType,
          publicAccessBlocked,
          versioningEnabled,
        });
      }

      // Calculate summary
      const encryptedBuckets = bucketDetails.filter((b) => b.isEncrypted);
      const publiclyAccessible = bucketDetails.filter((b) => !b.publicAccessBlocked);
      const versionedBuckets = bucketDetails.filter((b) => b.versioningEnabled);

      return {
        success: true,
        collector: 's3',
        itemsCollected: buckets.length,
        errors,
        rawData: {
          buckets: bucketDetails,
          summary: {
            totalBuckets: buckets.length,
            encryptedBuckets: encryptedBuckets.length,
            unencryptedBuckets: buckets.length - encryptedBuckets.length,
            publiclyAccessible: publiclyAccessible.length,
            versionedBuckets: versionedBuckets.length,
            encryptionRate:
              buckets.length > 0
                ? Math.round((encryptedBuckets.length / buckets.length) * 100)
                : 100,
            nonCompliantBuckets: bucketDetails
              .filter((b) => !b.isEncrypted || !b.publicAccessBlocked)
              .map((b) => ({
                name: b.name,
                issues: [
                  !b.isEncrypted && 'Not encrypted',
                  !b.publicAccessBlocked && 'Public access not blocked',
                ].filter(Boolean),
              })),
          },
        },
        collectedAt,
      };
    } catch (error) {
      return {
        success: false,
        collector: 's3',
        itemsCollected: 0,
        errors: [
          {
            code: 'S3_COLLECTION_FAILED',
            message: error instanceof Error ? error.message : 'Failed to collect S3 data',
            retryable: true,
          },
        ],
        rawData: null,
        collectedAt,
      };
    }
  }

  generateEvidence(results: CollectionResult[]): GeneratedEvidence[] {
    const evidence: GeneratedEvidence[] = [];
    const { validFrom, validUntil } = this.createValidityWindow(24);

    for (const result of results) {
      if (!result.success || !result.rawData) continue;

      switch (result.collector) {
        case 'iam': {
          const data = result.rawData as {
            users: unknown[];
            passwordPolicy: Record<string, unknown> | null;
            summary: {
              totalUsers: number;
              usersWithMFA: number;
              usersWithoutMFA: number;
              mfaEnforcementRate: number;
              staleAccessKeys: number;
              nonCompliantUsers: Array<{ userName: string; email: string }>;
            };
          };

          // MFA is "implemented" if >= 95% of users have it enabled
          const mfaThreshold = 95;
          const isMFAImplemented = data.summary.mfaEnforcementRate >= mfaThreshold;
          const mfaConfidence =
            data.summary.mfaEnforcementRate >= 100
              ? 'high'
              : data.summary.mfaEnforcementRate >= 80
                ? 'medium'
                : 'low';

          evidence.push({
            title: 'AWS IAM MFA Enforcement Status',
            description: `MFA status for ${data.summary.totalUsers} IAM users. ${data.summary.mfaEnforcementRate}% have MFA enabled.`,
            type: 'config',
            source: 'aws-iam',
            metadata: data,
            validFrom,
            validUntil,
            controlPatterns: [
              'mfa',
              'multi-factor',
              'authentication',
              'access control',
              // ISO 27001:2022
              'A.5.17', // Authentication Information
              'A.8.5', // Secure Authentication
              // SOC 2
              'CC6.1', // Logical Access Security
              'CC6.6', // User Access Termination
            ],
            verificationResult: {
              isImplemented: isMFAImplemented,
              confidence: mfaConfidence,
              reason: isMFAImplemented
                ? `${data.summary.mfaEnforcementRate}% of IAM users have MFA enabled (threshold: ${mfaThreshold}%)`
                : `Only ${data.summary.mfaEnforcementRate}% of IAM users have MFA (requires ${mfaThreshold}%)`,
              metrics: {
                totalUsers: data.summary.totalUsers,
                usersWithMFA: data.summary.usersWithMFA,
                usersWithoutMFA: data.summary.usersWithoutMFA,
                mfaEnforcementRate: data.summary.mfaEnforcementRate,
                threshold: mfaThreshold,
              },
            },
          });

          // Password policy evidence
          if (data.passwordPolicy) {
            const hasStrongPolicy =
              (data.passwordPolicy.minimumPasswordLength as number) >= 14 &&
              Boolean(data.passwordPolicy.requireSymbols) &&
              Boolean(data.passwordPolicy.requireNumbers) &&
              Boolean(data.passwordPolicy.requireUppercaseCharacters) &&
              Boolean(data.passwordPolicy.requireLowercaseCharacters);

            evidence.push({
              title: 'AWS IAM Password Policy',
              description: `Password policy configuration for AWS account ${this.accountId}`,
              type: 'config',
              source: 'aws-iam',
              metadata: { passwordPolicy: data.passwordPolicy },
              validFrom,
              validUntil,
              controlPatterns: [
                'password',
                'credential',
                'authentication',
                // ISO 27001:2022
                'A.5.17', // Authentication Information
                // SOC 2
                'CC6.1', // Logical Access Security
              ],
              verificationResult: {
                isImplemented: hasStrongPolicy,
                confidence: hasStrongPolicy ? 'high' : 'medium',
                reason: hasStrongPolicy
                  ? 'Password policy meets security requirements'
                  : 'Password policy does not meet all security requirements',
                metrics: data.passwordPolicy,
              },
            });
          }
          break;
        }

        case 'cloudtrail': {
          const data = result.rawData as {
            trails: unknown[];
            summary: {
              totalTrails: number;
              activeTrails: number;
              multiRegionTrails: number;
              encryptedTrails: number;
              validatedTrails: number;
              hasActiveMultiRegionTrail: boolean;
              allTrailsLogging: boolean;
            };
          };

          // CloudTrail is "implemented" if there's an active multi-region trail
          const isImplemented = data.summary.hasActiveMultiRegionTrail;
          const confidence = data.summary.encryptedTrails > 0 ? 'high' : 'medium';

          evidence.push({
            title: 'AWS CloudTrail Audit Logging Status',
            description: `CloudTrail configuration: ${data.summary.activeTrails} active trails, ${data.summary.multiRegionTrails} multi-region.`,
            type: 'config',
            source: 'aws-cloudtrail',
            metadata: data,
            validFrom,
            validUntil,
            controlPatterns: [
              'audit',
              'logging',
              'monitoring',
              'trail',
              // ISO 27001:2022
              'A.8.15', // Logging
              'A.8.16', // Monitoring Activities
              // SOC 2
              'CC7.2', // Monitor System Components
              'CC7.3', // Evaluate Security Events
            ],
            verificationResult: {
              isImplemented,
              confidence,
              reason: isImplemented
                ? `Active multi-region CloudTrail configured with ${data.summary.activeTrails} trails`
                : 'No active multi-region CloudTrail found - audit logging may be incomplete',
              metrics: {
                totalTrails: data.summary.totalTrails,
                activeTrails: data.summary.activeTrails,
                multiRegionTrails: data.summary.multiRegionTrails,
                encryptedTrails: data.summary.encryptedTrails,
              },
            },
          });
          break;
        }

        case 's3': {
          const data = result.rawData as {
            buckets: unknown[];
            summary: {
              totalBuckets: number;
              encryptedBuckets: number;
              unencryptedBuckets: number;
              publiclyAccessible: number;
              versionedBuckets: number;
              encryptionRate: number;
              nonCompliantBuckets: Array<{ name: string; issues: string[] }>;
            };
          };

          // S3 encryption is "implemented" if all buckets are encrypted
          const encryptionThreshold = 100;
          const isEncrypted = data.summary.encryptionRate >= encryptionThreshold;
          const confidence =
            data.summary.encryptionRate >= 100
              ? 'high'
              : data.summary.encryptionRate >= 80
                ? 'medium'
                : 'low';

          evidence.push({
            title: 'AWS S3 Bucket Encryption Status',
            description: `S3 encryption status: ${data.summary.encryptedBuckets}/${data.summary.totalBuckets} buckets encrypted (${data.summary.encryptionRate}%).`,
            type: 'config',
            source: 'aws-s3',
            metadata: data,
            validFrom,
            validUntil,
            controlPatterns: [
              'encryption',
              'data protection',
              's3',
              'storage',
              // ISO 27001:2022
              'A.8.24', // Use of Cryptography
              'A.5.33', // Protection of Records
              // SOC 2
              'CC6.1', // Logical Access Security
              'CC6.7', // Data Protection
            ],
            verificationResult: {
              isImplemented: isEncrypted,
              confidence,
              reason: isEncrypted
                ? `All ${data.summary.totalBuckets} S3 buckets have encryption enabled`
                : `${data.summary.unencryptedBuckets} of ${data.summary.totalBuckets} buckets lack encryption`,
              metrics: {
                totalBuckets: data.summary.totalBuckets,
                encryptedBuckets: data.summary.encryptedBuckets,
                unencryptedBuckets: data.summary.unencryptedBuckets,
                encryptionRate: data.summary.encryptionRate,
              },
            },
          });

          // Public access evidence
          if (data.summary.publiclyAccessible > 0) {
            evidence.push({
              title: 'AWS S3 Public Access Warning',
              description: `${data.summary.publiclyAccessible} S3 buckets may be publicly accessible.`,
              type: 'report',
              source: 'aws-s3',
              metadata: {
                publiclyAccessibleBuckets: data.summary.publiclyAccessible,
                nonCompliantBuckets: data.summary.nonCompliantBuckets.filter((b) =>
                  b.issues.includes('Public access not blocked')
                ),
              },
              validFrom,
              validUntil,
              controlPatterns: [
                'public access',
                'data exposure',
                'data protection',
                // ISO 27001:2022
                'A.8.12', // Data Leakage Prevention
                // SOC 2
                'CC6.7', // Data Protection
              ],
              verificationResult: {
                isImplemented: false,
                confidence: 'high',
                reason: `${data.summary.publiclyAccessible} buckets have public access not fully blocked`,
                metrics: {
                  publiclyAccessibleBuckets: data.summary.publiclyAccessible,
                  totalBuckets: data.summary.totalBuckets,
                },
              },
            });
          }
          break;
        }
      }
    }

    return evidence;
  }

  getControlMappings(): ControlMapping[] {
    return [
      {
        evidenceSource: 'aws-iam',
        controlNamePattern: /mfa|multi.?factor|authentication|access.?control/i,
        controlTags: ['access-control', 'authentication', 'identity'],
      },
      {
        evidenceSource: 'aws-cloudtrail',
        controlNamePattern: /audit|log|monitor|trail/i,
        controlTags: ['audit-logging', 'monitoring', 'detection'],
      },
      {
        evidenceSource: 'aws-s3',
        controlNamePattern: /encrypt|data.?protect|storage|s3/i,
        controlTags: ['encryption', 'data-protection', 'storage'],
      },
    ];
  }
}
