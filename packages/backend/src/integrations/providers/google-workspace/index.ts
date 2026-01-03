import { google, type admin_directory_v1 } from 'googleapis';
import { JWT } from 'google-auth-library';

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
 * Google Workspace Integration Provider
 *
 * Collects security configuration data from Google Workspace:
 * - Directory: Users, groups, organizational units
 * - Security: MFA status, login activity, admin roles
 *
 * Requires a service account with domain-wide delegation and the following scopes:
 * - https://www.googleapis.com/auth/admin.directory.user.readonly
 * - https://www.googleapis.com/auth/admin.directory.group.readonly
 * - https://www.googleapis.com/auth/admin.reports.audit.readonly
 */
export class GoogleWorkspaceProvider extends BaseIntegrationProvider {
  readonly type = 'gsuite' as const;
  readonly displayName = 'Google Workspace';
  readonly description = 'User directory, MFA status, and security settings';
  readonly icon = 'google';

  readonly requiredCredentials: CredentialField[] = [
    {
      key: 'serviceAccountJson',
      label: 'Service Account JSON',
      type: 'textarea',
      placeholder: '{"type": "service_account", "project_id": "...", ...}',
      helpText: 'Service account key JSON with domain-wide delegation enabled',
      required: true,
    },
    {
      key: 'adminEmail',
      label: 'Admin Email',
      type: 'text',
      placeholder: 'admin@company.com',
      helpText: 'Email of a super admin to impersonate for API calls',
      required: true,
    },
  ];

  readonly configFields: ConfigField[] = [
    {
      key: 'domain',
      label: 'Domain',
      type: 'text',
      helpText: 'Primary Google Workspace domain (e.g., company.com)',
    },
    {
      key: 'includeDeletedUsers',
      label: 'Include Deleted Users',
      type: 'boolean',
      defaultValue: false,
      helpText: 'Include recently deleted users in collection',
    },
  ];

  private directoryClient: admin_directory_v1.Admin | null = null;
  private jwtClient: JWT | null = null;
  private domain: string | null = null;

  async connect(): Promise<ConnectionResult> {
    const missing = this.validateCredentials();
    if (missing.length > 0) {
      return {
        success: false,
        error: `Missing required credentials: ${missing.join(', ')}`,
      };
    }

    try {
      const serviceAccountJson = this.getCredential<string>('serviceAccountJson')!;
      const adminEmail = this.getCredential<string>('adminEmail')!;

      // Parse service account JSON
      let serviceAccount: {
        client_email: string;
        private_key: string;
        project_id: string;
      };
      try {
        serviceAccount = JSON.parse(serviceAccountJson);
      } catch {
        return {
          success: false,
          error: 'Invalid service account JSON format',
        };
      }

      // Create JWT client with domain-wide delegation
      this.jwtClient = new JWT({
        email: serviceAccount.client_email,
        key: serviceAccount.private_key,
        scopes: [
          'https://www.googleapis.com/auth/admin.directory.user.readonly',
          'https://www.googleapis.com/auth/admin.directory.group.readonly',
          'https://www.googleapis.com/auth/admin.reports.audit.readonly',
        ],
        subject: adminEmail, // Impersonate admin user
      });

      // Authorize the client
      await this.jwtClient.authorize();

      // Create Directory API client
      this.directoryClient = google.admin({
        version: 'directory_v1',
        auth: this.jwtClient,
      });

      // Verify we can list users (tests permissions)
      const usersResponse = await this.directoryClient.users.list({
        customer: 'my_customer',
        maxResults: 1,
      });

      // Extract domain from first user or config
      this.domain =
        this.getConfig<string>('domain') ||
        usersResponse.data.users?.[0]?.primaryEmail?.split('@')[1] ||
        'unknown';

      this.connected = true;

      return {
        success: true,
        metadata: {
          domain: this.domain,
          projectId: serviceAccount.project_id,
          serviceAccountEmail: serviceAccount.client_email,
        },
      };
    } catch (error) {
      logger.error('Google Workspace connection failed', { error });
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to authenticate with Google Workspace',
      };
    }
  }

  async disconnect(): Promise<void> {
    this.directoryClient = null;
    this.jwtClient = null;
    this.domain = null;
    this.connected = false;
  }

  async testConnection(): Promise<TestResult> {
    const start = Date.now();

    try {
      if (!this.directoryClient) {
        const connectResult = await this.connect();
        if (!connectResult.success) {
          return {
            success: false,
            latencyMs: Date.now() - start,
            error: connectResult.error,
          };
        }
      }

      // Simple users list test
      await this.directoryClient!.users.list({
        customer: 'my_customer',
        maxResults: 1,
      });

      return {
        success: true,
        latencyMs: Date.now() - start,
        scopes: [
          'admin.directory.user.readonly',
          'admin.directory.group.readonly',
          'admin.reports.audit.readonly',
        ],
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
        id: 'directory',
        name: 'User Directory',
        description: 'Collect users, groups, and organizational structure',
        evidenceTypes: ['config'],
        controlCategories: ['user-management', 'access-control', 'identity'],
      },
      {
        id: 'security',
        name: 'Security Settings',
        description: 'Collect MFA status, admin roles, and security configurations',
        evidenceTypes: ['config'],
        controlCategories: ['authentication', 'access-control', 'privileged-access'],
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
          case 'directory':
            results.push(await this.collectDirectory());
            break;
          case 'security':
            results.push(await this.collectSecurity());
            break;
        }
      } catch (error) {
        logger.error(`Google Workspace collector ${collector.id} failed`, { error });
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

  private async collectDirectory(): Promise<CollectionResult> {
    const errors: CollectionError[] = [];
    const collectedAt = new Date();
    const includeDeleted = this.getConfig<boolean>('includeDeletedUsers', false);

    try {
      // Collect all users with pagination
      const users: admin_directory_v1.Schema$User[] = [];
      let pageToken: string | undefined;

      do {
        const response = await this.directoryClient!.users.list({
          customer: 'my_customer',
          maxResults: 500,
          pageToken,
          showDeleted: includeDeleted ? 'true' : 'false',
        });

        if (response.data.users) {
          users.push(...response.data.users);
        }
        pageToken = response.data.nextPageToken ?? undefined;
      } while (pageToken);

      // Collect groups
      const groups: admin_directory_v1.Schema$Group[] = [];
      let groupsPageToken: string | undefined;

      do {
        const groupsResponse = await this.directoryClient!.groups.list({
          customer: 'my_customer',
          maxResults: 200,
          pageToken: groupsPageToken,
        });

        if (groupsResponse.data.groups) {
          groups.push(...groupsResponse.data.groups);
        }
        groupsPageToken = groupsResponse.data.nextPageToken ?? undefined;
      } while (groupsPageToken);

      // Calculate summary
      const activeUsers = users.filter((u) => !u.suspended && !u.archived);
      const suspendedUsers = users.filter((u) => u.suspended);
      const archivedUsers = users.filter((u) => u.archived);
      const adminUsers = users.filter((u) => u.isAdmin || u.isDelegatedAdmin);

      return {
        success: true,
        collector: 'directory',
        itemsCollected: users.length + groups.length,
        errors,
        rawData: {
          users: users.map((u) => ({
            id: u.id,
            email: u.primaryEmail,
            name: u.name?.fullName,
            isAdmin: u.isAdmin,
            isDelegatedAdmin: u.isDelegatedAdmin,
            isSuspended: u.suspended,
            isArchived: u.archived,
            creationTime: u.creationTime,
            lastLoginTime: u.lastLoginTime,
            orgUnitPath: u.orgUnitPath,
            isEnrolledIn2Sv: u.isEnrolledIn2Sv,
            isEnforcedIn2Sv: u.isEnforcedIn2Sv,
          })),
          groups: groups.map((g) => ({
            id: g.id,
            email: g.email,
            name: g.name,
            description: g.description,
            directMembersCount: g.directMembersCount,
          })),
          summary: {
            totalUsers: users.length,
            activeUsers: activeUsers.length,
            suspendedUsers: suspendedUsers.length,
            archivedUsers: archivedUsers.length,
            adminUsers: adminUsers.length,
            totalGroups: groups.length,
          },
        },
        collectedAt,
      };
    } catch (error) {
      return {
        success: false,
        collector: 'directory',
        itemsCollected: 0,
        errors: [
          {
            code: 'DIRECTORY_COLLECTION_FAILED',
            message: error instanceof Error ? error.message : 'Failed to collect directory data',
            retryable: true,
          },
        ],
        rawData: null,
        collectedAt,
      };
    }
  }

  private async collectSecurity(): Promise<CollectionResult> {
    const errors: CollectionError[] = [];
    const collectedAt = new Date();

    try {
      // Get all users with 2SV (MFA) status
      const users: admin_directory_v1.Schema$User[] = [];
      let pageToken: string | undefined;

      do {
        const response = await this.directoryClient!.users.list({
          customer: 'my_customer',
          maxResults: 500,
          pageToken,
        });

        if (response.data.users) {
          users.push(...response.data.users);
        }
        pageToken = response.data.nextPageToken ?? undefined;
      } while (pageToken);

      // Calculate MFA statistics
      const activeUsers = users.filter((u) => !u.suspended && !u.archived);
      const usersWithMFA = activeUsers.filter((u) => u.isEnrolledIn2Sv);
      const usersWithEnforcedMFA = activeUsers.filter((u) => u.isEnforcedIn2Sv);
      const usersWithoutMFA = activeUsers.filter((u) => !u.isEnrolledIn2Sv);
      const mfaEnforcementRate =
        activeUsers.length > 0
          ? Math.round((usersWithMFA.length / activeUsers.length) * 100)
          : 100;

      // Get admin users for privileged access tracking
      const adminUsers = users.filter((u) => u.isAdmin);
      const delegatedAdmins = users.filter((u) => u.isDelegatedAdmin && !u.isAdmin);

      // Check for inactive users (no login in 90 days)
      const inactiveThreshold = 90 * 24 * 60 * 60 * 1000;
      const now = Date.now();
      const inactiveUsers = activeUsers.filter((u) => {
        if (!u.lastLoginTime) return true;
        const lastLogin = new Date(u.lastLoginTime).getTime();
        return now - lastLogin > inactiveThreshold;
      });

      return {
        success: true,
        collector: 'security',
        itemsCollected: users.length,
        errors,
        rawData: {
          mfaStatus: {
            users: activeUsers.map((u) => ({
              email: u.primaryEmail,
              isEnrolledIn2Sv: u.isEnrolledIn2Sv,
              isEnforcedIn2Sv: u.isEnforcedIn2Sv,
            })),
          },
          adminAccess: {
            superAdmins: adminUsers.map((u) => ({
              email: u.primaryEmail,
              name: u.name?.fullName,
              hasMFA: u.isEnrolledIn2Sv,
            })),
            delegatedAdmins: delegatedAdmins.map((u) => ({
              email: u.primaryEmail,
              name: u.name?.fullName,
              hasMFA: u.isEnrolledIn2Sv,
            })),
          },
          inactiveUsers: inactiveUsers.map((u) => ({
            email: u.primaryEmail,
            lastLoginTime: u.lastLoginTime,
          })),
          summary: {
            totalActiveUsers: activeUsers.length,
            usersWithMFA: usersWithMFA.length,
            usersWithoutMFA: usersWithoutMFA.length,
            usersWithEnforcedMFA: usersWithEnforcedMFA.length,
            mfaEnforcementRate,
            superAdminCount: adminUsers.length,
            delegatedAdminCount: delegatedAdmins.length,
            inactiveUserCount: inactiveUsers.length,
            nonCompliantUsers: usersWithoutMFA.map((u) => ({
              email: u.primaryEmail,
              name: u.name?.fullName,
            })),
          },
        },
        collectedAt,
      };
    } catch (error) {
      return {
        success: false,
        collector: 'security',
        itemsCollected: 0,
        errors: [
          {
            code: 'SECURITY_COLLECTION_FAILED',
            message: error instanceof Error ? error.message : 'Failed to collect security data',
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
        case 'directory': {
          const data = result.rawData as {
            users: unknown[];
            groups: unknown[];
            summary: {
              totalUsers: number;
              activeUsers: number;
              suspendedUsers: number;
              archivedUsers: number;
              adminUsers: number;
              totalGroups: number;
            };
          };

          evidence.push({
            title: 'Google Workspace User Directory',
            description: `User inventory: ${data.summary.activeUsers} active users, ${data.summary.totalGroups} groups in ${this.domain}`,
            type: 'config',
            source: 'google-workspace',
            metadata: data,
            validFrom,
            validUntil,
            controlPatterns: [
              'user',
              'directory',
              'identity',
              'inventory',
              // ISO 27001:2022
              'A.5.9', // Inventory of Information and Other Associated Assets
              'A.5.16', // Identity Management
              // SOC 2
              'CC6.1', // Logical Access Security
              'CC6.2', // User Registration and Authorization
            ],
            verificationResult: {
              isImplemented: data.summary.totalUsers > 0,
              confidence: 'high',
              reason: `User directory maintained with ${data.summary.activeUsers} active users`,
              metrics: {
                totalUsers: data.summary.totalUsers,
                activeUsers: data.summary.activeUsers,
                adminUsers: data.summary.adminUsers,
                totalGroups: data.summary.totalGroups,
              },
            },
          });
          break;
        }

        case 'security': {
          const data = result.rawData as {
            mfaStatus: { users: unknown[] };
            adminAccess: {
              superAdmins: Array<{ email: string; name: string; hasMFA: boolean }>;
              delegatedAdmins: Array<{ email: string; name: string; hasMFA: boolean }>;
            };
            inactiveUsers: unknown[];
            summary: {
              totalActiveUsers: number;
              usersWithMFA: number;
              usersWithoutMFA: number;
              usersWithEnforcedMFA: number;
              mfaEnforcementRate: number;
              superAdminCount: number;
              delegatedAdminCount: number;
              inactiveUserCount: number;
              nonCompliantUsers: Array<{ email: string; name: string }>;
            };
          };

          // MFA evidence
          const mfaThreshold = 95;
          const isMFAImplemented = data.summary.mfaEnforcementRate >= mfaThreshold;
          const mfaConfidence =
            data.summary.mfaEnforcementRate >= 100
              ? 'high'
              : data.summary.mfaEnforcementRate >= 80
                ? 'medium'
                : 'low';

          evidence.push({
            title: 'Google Workspace MFA Enforcement Status',
            description: `MFA status for ${data.summary.totalActiveUsers} active users. ${data.summary.mfaEnforcementRate}% have MFA enabled.`,
            type: 'config',
            source: 'google-workspace',
            metadata: {
              mfaStatus: data.mfaStatus,
              summary: {
                totalActiveUsers: data.summary.totalActiveUsers,
                usersWithMFA: data.summary.usersWithMFA,
                usersWithoutMFA: data.summary.usersWithoutMFA,
                mfaEnforcementRate: data.summary.mfaEnforcementRate,
                nonCompliantUsers: data.summary.nonCompliantUsers,
              },
            },
            validFrom,
            validUntil,
            controlPatterns: [
              'mfa',
              'multi-factor',
              '2fa',
              'authentication',
              // ISO 27001:2022
              'A.5.17', // Authentication Information
              'A.8.5', // Secure Authentication
              // SOC 2
              'CC6.1', // Logical Access Security
            ],
            verificationResult: {
              isImplemented: isMFAImplemented,
              confidence: mfaConfidence,
              reason: isMFAImplemented
                ? `${data.summary.mfaEnforcementRate}% of users have MFA enabled (threshold: ${mfaThreshold}%)`
                : `Only ${data.summary.mfaEnforcementRate}% of users have MFA (requires ${mfaThreshold}%)`,
              metrics: {
                totalActiveUsers: data.summary.totalActiveUsers,
                usersWithMFA: data.summary.usersWithMFA,
                usersWithoutMFA: data.summary.usersWithoutMFA,
                mfaEnforcementRate: data.summary.mfaEnforcementRate,
                threshold: mfaThreshold,
              },
            },
          });

          // Admin access evidence
          const allAdminsHaveMFA = [
            ...data.adminAccess.superAdmins,
            ...data.adminAccess.delegatedAdmins,
          ].every((a) => a.hasMFA);

          evidence.push({
            title: 'Google Workspace Privileged Access Status',
            description: `Admin access: ${data.summary.superAdminCount} super admins, ${data.summary.delegatedAdminCount} delegated admins`,
            type: 'config',
            source: 'google-workspace',
            metadata: {
              adminAccess: data.adminAccess,
              summary: {
                superAdminCount: data.summary.superAdminCount,
                delegatedAdminCount: data.summary.delegatedAdminCount,
                allAdminsHaveMFA,
              },
            },
            validFrom,
            validUntil,
            controlPatterns: [
              'admin',
              'privileged',
              'access',
              'super admin',
              // ISO 27001:2022
              'A.8.2', // Privileged Access Rights
              'A.5.18', // Access Rights
              // SOC 2
              'CC6.3', // User Authentication
            ],
            verificationResult: {
              isImplemented: allAdminsHaveMFA,
              confidence: allAdminsHaveMFA ? 'high' : 'low',
              reason: allAdminsHaveMFA
                ? 'All admin accounts have MFA enabled'
                : 'Some admin accounts lack MFA protection',
              metrics: {
                superAdminCount: data.summary.superAdminCount,
                delegatedAdminCount: data.summary.delegatedAdminCount,
                allAdminsHaveMFA,
              },
            },
          });

          // Inactive users evidence
          if (data.summary.inactiveUserCount > 0) {
            evidence.push({
              title: 'Google Workspace Inactive Users',
              description: `${data.summary.inactiveUserCount} users have not logged in for 90+ days`,
              type: 'report',
              source: 'google-workspace',
              metadata: {
                inactiveUsers: data.inactiveUsers,
                count: data.summary.inactiveUserCount,
              },
              validFrom,
              validUntil,
              controlPatterns: [
                'inactive',
                'access review',
                'user lifecycle',
                // ISO 27001:2022
                'A.5.18', // Access Rights
                // SOC 2
                'CC6.2', // User Registration and Authorization
                'CC6.6', // User Access Termination
              ],
              verificationResult: {
                isImplemented: false,
                confidence: 'medium',
                reason: `${data.summary.inactiveUserCount} user accounts have been inactive for over 90 days`,
                metrics: {
                  inactiveUserCount: data.summary.inactiveUserCount,
                  totalActiveUsers: data.summary.totalActiveUsers,
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
        evidenceSource: 'google-workspace',
        controlNamePattern: /mfa|multi.?factor|2fa|authentication|identity/i,
        controlTags: ['authentication', 'identity', 'access-control'],
      },
      {
        evidenceSource: 'google-workspace',
        controlNamePattern: /user|directory|identity|access.?management/i,
        controlTags: ['user-management', 'identity', 'access-control'],
      },
      {
        evidenceSource: 'google-workspace',
        controlNamePattern: /admin|privileged|super.?user/i,
        controlTags: ['privileged-access', 'admin', 'access-control'],
      },
    ];
  }
}
