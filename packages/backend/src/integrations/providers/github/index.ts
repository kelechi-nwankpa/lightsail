import { Octokit } from '@octokit/rest';
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
} from '../../engine/types.js';

// Common repo interface for the properties we actually use
interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  visibility?: string;
  default_branch: string;
  archived?: boolean;
  disabled?: boolean;
  fork: boolean;
  has_issues: boolean;
  has_wiki: boolean;
  has_pages: boolean;
  forks_count: number;
  stargazers_count: number;
  open_issues_count: number;
  language: string | null;
  created_at: string | null;
  updated_at: string | null;
  pushed_at: string | null;
  owner: {
    login: string;
  };
}

/**
 * GitHub Integration Provider
 *
 * Collects security-relevant data from GitHub:
 * - Repository inventory
 * - Branch protection rules
 * - Security alerts (Dependabot)
 *
 * Authentication: Personal Access Token (PAT) with required scopes:
 * - repo (for private repos)
 * - read:org (for org data)
 * - security_events (for security alerts)
 */
export class GitHubProvider extends BaseIntegrationProvider {
  readonly type = 'github' as const;
  readonly displayName = 'GitHub';
  readonly description = 'Connect to GitHub to collect repository security data, branch protection status, and vulnerability alerts.';
  readonly icon = 'github';

  readonly requiredCredentials: CredentialField[] = [
    {
      key: 'accessToken',
      label: 'Personal Access Token',
      type: 'password',
      placeholder: 'ghp_xxxxxxxxxxxxxxxxxxxx',
      helpText: 'Generate a PAT with repo, read:org, and security_events scopes',
      required: true,
    },
  ];

  readonly configFields: ConfigField[] = [
    {
      key: 'organization',
      label: 'Organization',
      type: 'text',
      helpText: 'Limit to a specific GitHub organization (optional)',
    },
    {
      key: 'includePrivate',
      label: 'Include Private Repos',
      type: 'boolean',
      defaultValue: true,
      helpText: 'Whether to include private repositories',
    },
  ];

  private octokit: Octokit | null = null;

  async connect(): Promise<ConnectionResult> {
    const missing = this.validateCredentials();
    if (missing.length > 0) {
      return {
        success: false,
        error: `Missing required credentials: ${missing.join(', ')}`,
      };
    }

    try {
      const accessToken = this.getCredential<string>('accessToken')!;
      this.octokit = new Octokit({ auth: accessToken });

      // Verify authentication
      const { data: user } = await this.octokit.users.getAuthenticated();
      // Get accessible organizations
      const { data: orgs } = await this.octokit.orgs.listForAuthenticatedUser();

      this.connected = true;

      return {
        success: true,
        metadata: {
          username: user.login,
          name: user.name,
          avatarUrl: user.avatar_url,
          organizations: orgs.map((o) => ({
            login: o.login,
            name: o.login,
          })),
        },
      };
    } catch (error) {
      this.connected = false;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to authenticate with GitHub',
      };
    }
  }

  async disconnect(): Promise<void> {
    this.octokit = null;
    this.connected = false;
  }

  async testConnection(): Promise<TestResult> {
    const start = Date.now();

    try {
      if (!this.octokit) {
        const connectResult = await this.connect();
        if (!connectResult.success) {
          return {
            success: false,
            latencyMs: Date.now() - start,
            error: connectResult.error,
          };
        }
      }

      // Check rate limit as a quick health check
      const { data: rateLimit } = await this.octokit!.rateLimit.get();

      return {
        success: true,
        latencyMs: Date.now() - start,
        scopes: ['repo', 'read:org'], // Would need to parse headers for actual scopes
        metadata: {
          rateLimit: {
            limit: rateLimit.rate.limit,
            remaining: rateLimit.rate.remaining,
            reset: new Date(rateLimit.rate.reset * 1000).toISOString(),
          },
        },
      } as TestResult;
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
        id: 'repos',
        name: 'Repositories',
        description: 'Inventory of all accessible repositories with visibility and configuration',
        evidenceTypes: ['config'],
        controlCategories: ['asset-management', 'configuration'],
      },
      {
        id: 'branch-protection',
        name: 'Branch Protection',
        description: 'Branch protection rules for default branches',
        evidenceTypes: ['config'],
        controlCategories: ['change-management', 'code-review'],
      },
      {
        id: 'security-alerts',
        name: 'Security Alerts',
        description: 'Dependabot and code scanning alerts',
        evidenceTypes: ['report'],
        controlCategories: ['vulnerability-management', 'secure-development'],
      },
    ];
  }

  async collect(collectors?: string[]): Promise<CollectionResult[]> {
    this.ensureConnected();

    const toCollect = collectors || this.getAvailableCollectors().map((c) => c.id);
    const results: CollectionResult[] = [];

    for (const collector of toCollect) {
      switch (collector) {
        case 'repos':
          results.push(await this.collectRepositories());
          break;
        case 'branch-protection':
          results.push(await this.collectBranchProtection());
          break;
        case 'security-alerts':
          results.push(await this.collectSecurityAlerts());
          break;
        default:
          results.push({
            success: false,
            collector,
            itemsCollected: 0,
            errors: [
              {
                code: 'UNKNOWN_COLLECTOR',
                message: `Unknown collector: ${collector}`,
                retryable: false,
              },
            ],
            rawData: null,
            collectedAt: new Date(),
          });
      }
    }

    return results;
  }

  private async collectRepositories(): Promise<CollectionResult> {
    const collectedAt = new Date();

    try {
      const organization = this.getConfig<string | undefined>('organization');
      const includePrivate = this.getConfig<boolean>('includePrivate', true);

      let repos: GitHubRepo[];

      if (organization) {
        const { data } = await this.octokit!.repos.listForOrg({
          org: organization,
          per_page: 100,
          type: includePrivate ? 'all' : 'public',
        });
        repos = data as GitHubRepo[];
      } else {
        const { data } = await this.octokit!.repos.listForAuthenticatedUser({
          per_page: 100,
          visibility: includePrivate ? 'all' : 'public',
        });
        repos = data as GitHubRepo[];
      }

      const repoData = repos.map((r) => ({
        id: r.id,
        name: r.name,
        fullName: r.full_name,
        private: r.private,
        visibility: r.visibility,
        defaultBranch: r.default_branch,
        archived: r.archived,
        disabled: r.disabled,
        fork: r.fork,
        hasIssues: r.has_issues,
        hasWiki: r.has_wiki,
        hasPages: r.has_pages,
        forksCount: r.forks_count,
        stargazersCount: r.stargazers_count,
        openIssuesCount: r.open_issues_count,
        language: r.language,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        pushedAt: r.pushed_at,
      }));

      return {
        success: true,
        collector: 'repos',
        itemsCollected: repoData.length,
        errors: [],
        rawData: {
          repositories: repoData,
          summary: {
            total: repoData.length,
            private: repoData.filter((r) => r.private).length,
            public: repoData.filter((r) => !r.private).length,
            archived: repoData.filter((r) => r.archived).length,
            forks: repoData.filter((r) => r.fork).length,
          },
        },
        collectedAt,
      };
    } catch (error) {
      return {
        success: false,
        collector: 'repos',
        itemsCollected: 0,
        errors: [
          {
            code: 'COLLECTION_ERROR',
            message: error instanceof Error ? error.message : 'Failed to collect repositories',
            retryable: true,
          },
        ],
        rawData: null,
        collectedAt,
      };
    }
  }

  private async collectBranchProtection(): Promise<CollectionResult> {
    const collectedAt = new Date();

    try {
      const organization = this.getConfig<string | undefined>('organization');

      // First get repos to check branch protection on
      let repos: GitHubRepo[];

      if (organization) {
        const { data } = await this.octokit!.repos.listForOrg({
          org: organization,
          per_page: 100,
        });
        repos = data as GitHubRepo[];
      } else {
        const { data } = await this.octokit!.repos.listForAuthenticatedUser({
          per_page: 100,
        });
        repos = data as GitHubRepo[];
      }

      // Filter to non-archived, non-fork repos
      const activeRepos = repos.filter((r) => !r.archived && !r.fork);

      const protectionData: Array<{
        repo: string;
        branch: string;
        protected: boolean;
        protection?: {
          requiredReviews: boolean;
          requiredReviewers: number;
          dismissStaleReviews: boolean;
          requireCodeOwners: boolean;
          requiredStatusChecks: boolean;
          strictStatusChecks: boolean;
          enforceAdmins: boolean;
        };
        error?: string;
      }> = [];

      // Check branch protection for each repo's default branch
      for (const repo of activeRepos.slice(0, 20)) {
        // Limit to 20 to avoid rate limits
        try {
          const { data: protection } = await this.octokit!.repos.getBranchProtection({
            owner: repo.owner.login,
            repo: repo.name,
            branch: repo.default_branch,
          });

          protectionData.push({
            repo: repo.full_name,
            branch: repo.default_branch,
            protected: true,
            protection: {
              requiredReviews: !!protection.required_pull_request_reviews,
              requiredReviewers:
                protection.required_pull_request_reviews?.required_approving_review_count || 0,
              dismissStaleReviews:
                protection.required_pull_request_reviews?.dismiss_stale_reviews || false,
              requireCodeOwners:
                protection.required_pull_request_reviews?.require_code_owner_reviews || false,
              requiredStatusChecks: !!protection.required_status_checks,
              strictStatusChecks: protection.required_status_checks?.strict || false,
              enforceAdmins: protection.enforce_admins?.enabled || false,
            },
          });
        } catch (error: unknown) {
          // 404 means no protection, which is valid data
          if ((error as { status?: number }).status === 404) {
            protectionData.push({
              repo: repo.full_name,
              branch: repo.default_branch,
              protected: false,
            });
          } else {
            protectionData.push({
              repo: repo.full_name,
              branch: repo.default_branch,
              protected: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }
      }

      const summary = {
        totalRepos: protectionData.length,
        protectedRepos: protectionData.filter((p) => p.protected).length,
        unprotectedRepos: protectionData.filter((p) => !p.protected && !p.error).length,
        withRequiredReviews: protectionData.filter((p) => p.protection?.requiredReviews).length,
        withStatusChecks: protectionData.filter((p) => p.protection?.requiredStatusChecks).length,
        protectionRate:
          protectionData.length > 0
            ? Math.round(
                (protectionData.filter((p) => p.protected).length / protectionData.length) * 100
              )
            : 0,
      };

      return {
        success: true,
        collector: 'branch-protection',
        itemsCollected: protectionData.length,
        errors: [],
        rawData: {
          branchProtection: protectionData,
          summary,
        },
        collectedAt,
      };
    } catch (error) {
      return {
        success: false,
        collector: 'branch-protection',
        itemsCollected: 0,
        errors: [
          {
            code: 'COLLECTION_ERROR',
            message: error instanceof Error ? error.message : 'Failed to collect branch protection',
            retryable: true,
          },
        ],
        rawData: null,
        collectedAt,
      };
    }
  }

  private async collectSecurityAlerts(): Promise<CollectionResult> {
    const collectedAt = new Date();

    try {
      const organization = this.getConfig<string | undefined>('organization');

      // Get repos first
      let repos: GitHubRepo[];

      if (organization) {
        const { data } = await this.octokit!.repos.listForOrg({
          org: organization,
          per_page: 100,
        });
        repos = data as GitHubRepo[];
      } else {
        const { data } = await this.octokit!.repos.listForAuthenticatedUser({
          per_page: 100,
        });
        repos = data as GitHubRepo[];
      }

      const activeRepos = repos.filter((r) => !r.archived);

      const alertsData: Array<{
        repo: string;
        dependabotAlerts: number;
        criticalAlerts: number;
        highAlerts: number;
        mediumAlerts: number;
        lowAlerts: number;
        error?: string;
      }> = [];

      // Check Dependabot alerts for each repo
      for (const repo of activeRepos.slice(0, 10)) {
        // Limit to avoid rate limits
        try {
          const { data: alerts } = await this.octokit!.dependabot.listAlertsForRepo({
            owner: repo.owner.login,
            repo: repo.name,
            state: 'open',
            per_page: 100,
          });

          alertsData.push({
            repo: repo.full_name,
            dependabotAlerts: alerts.length,
            criticalAlerts: alerts.filter((a) => a.security_vulnerability?.severity === 'critical')
              .length,
            highAlerts: alerts.filter((a) => a.security_vulnerability?.severity === 'high').length,
            mediumAlerts: alerts.filter((a) => a.security_vulnerability?.severity === 'medium')
              .length,
            lowAlerts: alerts.filter((a) => a.security_vulnerability?.severity === 'low').length,
          });
        } catch (error: unknown) {
          // 404 or 403 might mean Dependabot is not enabled
          alertsData.push({
            repo: repo.full_name,
            dependabotAlerts: 0,
            criticalAlerts: 0,
            highAlerts: 0,
            mediumAlerts: 0,
            lowAlerts: 0,
            error:
              (error as { status?: number }).status === 404 || (error as { status?: number }).status === 403
                ? 'Dependabot not enabled'
                : error instanceof Error
                  ? error.message
                  : 'Unknown error',
          });
        }
      }

      const summary = {
        totalRepos: alertsData.length,
        reposWithAlerts: alertsData.filter((a) => a.dependabotAlerts > 0).length,
        totalAlerts: alertsData.reduce((sum, a) => sum + a.dependabotAlerts, 0),
        criticalAlerts: alertsData.reduce((sum, a) => sum + a.criticalAlerts, 0),
        highAlerts: alertsData.reduce((sum, a) => sum + a.highAlerts, 0),
        mediumAlerts: alertsData.reduce((sum, a) => sum + a.mediumAlerts, 0),
        lowAlerts: alertsData.reduce((sum, a) => sum + a.lowAlerts, 0),
      };

      return {
        success: true,
        collector: 'security-alerts',
        itemsCollected: alertsData.reduce((sum, a) => sum + a.dependabotAlerts, 0),
        errors: [],
        rawData: {
          securityAlerts: alertsData,
          summary,
        },
        collectedAt,
      };
    } catch (error) {
      return {
        success: false,
        collector: 'security-alerts',
        itemsCollected: 0,
        errors: [
          {
            code: 'COLLECTION_ERROR',
            message: error instanceof Error ? error.message : 'Failed to collect security alerts',
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
        case 'repos': {
          const data = result.rawData as {
            repositories: unknown[];
            summary: { total: number; private: number; public: number; archived: number; forks: number };
          };
          // Inventory is "implemented" if we found any repositories
          const hasRepos = data.summary.total > 0;
          evidence.push({
            title: 'GitHub Repository Inventory',
            description: `Automated inventory of ${data.summary.total} GitHub repositories. ${data.summary.private} private, ${data.summary.public} public.`,
            type: 'config',
            source: 'github',
            metadata: data,
            validFrom,
            validUntil,
            // Keywords + official framework requirement codes
            controlPatterns: [
              'asset', 'inventory', 'repository', 'source code',
              // ISO 27001:2022
              'A.5.9',   // Inventory of Information and Other Associated Assets
              'A.8.4',   // Access to Source Code
              // SOC 2
              'CC6.1',   // Logical Access Security
            ],
            verificationResult: {
              isImplemented: hasRepos,
              confidence: 'high',
              reason: hasRepos
                ? `Repository inventory maintained with ${data.summary.total} repositories tracked`
                : 'No repositories found in connected account',
              metrics: {
                totalRepositories: data.summary.total,
                privateRepositories: data.summary.private,
                publicRepositories: data.summary.public,
              },
            },
          });
          break;
        }

        case 'branch-protection': {
          const data = result.rawData as {
            branchProtection: unknown[];
            summary: {
              totalRepos: number;
              protectedRepos: number;
              unprotectedRepos: number;
              withRequiredReviews: number;
              withStatusChecks: number;
              protectionRate: number;
            };
          };
          // Branch protection is "implemented" if >= 80% of repos have it enabled
          const protectionThreshold = 80;
          const isImplemented = data.summary.protectionRate >= protectionThreshold;
          const confidence = data.summary.protectionRate >= 90 ? 'high' : data.summary.protectionRate >= 50 ? 'medium' : 'low';
          evidence.push({
            title: 'GitHub Branch Protection Status',
            description: `Branch protection analysis for ${data.summary.totalRepos} repositories. ${data.summary.protectionRate}% have protection enabled.`,
            type: 'config',
            source: 'github',
            metadata: data,
            validFrom,
            validUntil,
            // Keywords + official framework requirement codes
            controlPatterns: [
              'change management', 'code review', 'approval', 'branch protection', 'pull request',
              // ISO 27001:2022
              'A.8.9',   // Configuration Management
              'A.8.25',  // Secure Development Life Cycle
              'A.8.32',  // Change Management
              // SOC 2
              'CC8.1',   // Manage Changes
              'CC6.1',   // Logical Access Security
            ],
            verificationResult: {
              isImplemented,
              confidence,
              reason: isImplemented
                ? `${data.summary.protectionRate}% of repositories have branch protection enabled (threshold: ${protectionThreshold}%)`
                : `Only ${data.summary.protectionRate}% of repositories have branch protection (requires ${protectionThreshold}%)`,
              metrics: {
                protectionRate: data.summary.protectionRate,
                protectedRepos: data.summary.protectedRepos,
                unprotectedRepos: data.summary.unprotectedRepos,
                withRequiredReviews: data.summary.withRequiredReviews,
                threshold: protectionThreshold,
              },
            },
          });
          break;
        }

        case 'security-alerts': {
          const data = result.rawData as {
            securityAlerts: unknown[];
            summary: {
              totalRepos: number;
              reposWithAlerts: number;
              totalAlerts: number;
              criticalAlerts: number;
              highAlerts: number;
              mediumAlerts: number;
              lowAlerts: number;
            };
          };
          // Security scanning is "implemented" if Dependabot is enabled (we got data)
          // Control is verified if no critical/high alerts OR alerts are being tracked
          const hasScanning = data.summary.totalRepos > 0;
          const noCriticalAlerts = data.summary.criticalAlerts === 0 && data.summary.highAlerts === 0;
          const isImplemented = hasScanning; // Scanning is enabled
          const confidence = noCriticalAlerts ? 'high' : data.summary.criticalAlerts === 0 ? 'medium' : 'low';
          evidence.push({
            title: 'GitHub Security Alerts Summary',
            description: `Security vulnerability analysis: ${data.summary.totalAlerts} open alerts across ${data.summary.reposWithAlerts} repositories. ${data.summary.criticalAlerts} critical, ${data.summary.highAlerts} high severity.`,
            type: 'report',
            source: 'github',
            metadata: data,
            validFrom,
            validUntil,
            // Keywords + official framework requirement codes
            controlPatterns: [
              'vulnerability', 'security scan', 'dependabot', 'dependency', 'secure development',
              // ISO 27001:2022
              'A.8.8',   // Management of Technical Vulnerabilities
              'A.8.7',   // Protection Against Malware
              'A.8.25',  // Secure Development Life Cycle
              'A.8.28',  // Secure Coding
              // SOC 2
              'CC7.1',   // Detect and Monitor Security Events
              'CC3.2',   // Identify Risks (COSO Principle 7)
            ],
            verificationResult: {
              isImplemented,
              confidence,
              reason: isImplemented
                ? noCriticalAlerts
                  ? 'Security scanning enabled with no critical or high severity alerts'
                  : `Security scanning enabled but ${data.summary.criticalAlerts} critical and ${data.summary.highAlerts} high alerts need attention`
                : 'Security scanning not detected on repositories',
              metrics: {
                totalAlerts: data.summary.totalAlerts,
                criticalAlerts: data.summary.criticalAlerts,
                highAlerts: data.summary.highAlerts,
                mediumAlerts: data.summary.mediumAlerts,
                lowAlerts: data.summary.lowAlerts,
                reposScanned: data.summary.totalRepos,
              },
            },
          });
          break;
        }
      }
    }

    return evidence;
  }

  getControlMappings(): ControlMapping[] {
    return [
      {
        evidenceSource: 'github',
        controlNamePattern: /asset.*management|inventory|source.*code/i,
        controlTags: ['asset-management'],
      },
      {
        evidenceSource: 'github',
        controlNamePattern: /change.*management|code.*review|pull.*request|approval/i,
        controlTags: ['change-management', 'code-review'],
      },
      {
        evidenceSource: 'github',
        controlNamePattern: /vulnerab|security.*scan|dependabot|dependency/i,
        controlTags: ['vulnerability-management', 'secure-development'],
      },
    ];
  }
}
