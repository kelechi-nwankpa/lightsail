# Lightsail Integrations Guide

## Overview

Lightsail integrates with third-party services to automate evidence collection and compliance monitoring. This document covers integration architecture, implementation patterns, and specific provider details.

## Integration Architecture

### Generic Integration Interface

All integrations implement a common interface for consistency:

```typescript
interface IntegrationProvider {
  // Lifecycle
  connect(config: ConnectionConfig): Promise<ConnectionResult>;
  disconnect(): Promise<void>;
  testConnection(): Promise<TestResult>;

  // Evidence Collection
  collectEvidence(options: CollectionOptions): Promise<Evidence[]>;
  getAvailableEvidenceTypes(): EvidenceType[];

  // Status & Monitoring
  getStatus(): Promise<IntegrationStatus>;
  getLastSyncResult(): Promise<SyncResult>;
}

interface ConnectionConfig {
  credentials: EncryptedCredentials;
  settings: Record<string, unknown>;
}

interface CollectionOptions {
  evidenceTypes: string[];
  controlIds?: string[];
  dateRange?: { start: Date; end: Date };
}

interface Evidence {
  title: string;
  description: string;
  type: EvidenceType;
  source: string;
  data: unknown;
  metadata: Record<string, unknown>;
  collectedAt: Date;
  validFrom?: Date;
  validUntil?: Date;
}
```

### Integration Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    User     │────▶│   Lightsail │────▶│  Provider   │
│             │     │   Backend   │     │   (AWS,     │
│             │     │             │     │   GitHub)   │
└─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │
      │ 1. Initiate       │                   │
      │    Connection     │                   │
      │──────────────────▶│                   │
      │                   │                   │
      │                   │ 2. Validate       │
      │                   │    Credentials    │
      │                   │──────────────────▶│
      │                   │                   │
      │                   │ 3. Test           │
      │                   │    Connection     │
      │                   │◀──────────────────│
      │                   │                   │
      │ 4. Store          │                   │
      │    (encrypted)    │                   │
      │◀──────────────────│                   │
      │                   │                   │
      │                   │ 5. Schedule       │
      │                   │    Sync Jobs      │
      │                   │                   │
```

### Credential Storage

All credentials are encrypted using AES-256 before storage:

```typescript
interface EncryptedCredentials {
  encryptedData: string;  // AES-256 encrypted JSON
  iv: string;             // Initialization vector
  algorithm: 'aes-256-gcm';
}

// Encryption service
class CredentialService {
  private key: Buffer;

  constructor() {
    this.key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  }

  async encrypt(credentials: unknown): Promise<EncryptedCredentials> {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv);

    const data = JSON.stringify(credentials);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      encryptedData: encrypted + authTag.toString('hex'),
      iv: iv.toString('hex'),
      algorithm: 'aes-256-gcm'
    };
  }

  async decrypt(encrypted: EncryptedCredentials): Promise<unknown> {
    const iv = Buffer.from(encrypted.iv, 'hex');
    const authTag = Buffer.from(encrypted.encryptedData.slice(-32), 'hex');
    const encryptedData = encrypted.encryptedData.slice(0, -32);

    const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  }
}
```

---

## AWS Integration

### Overview

The AWS integration connects to customer AWS accounts to collect security configuration evidence and monitor compliance posture.

### Supported Evidence Types

| Evidence Type | Description | AWS Services Used |
|---------------|-------------|-------------------|
| `iam_policies` | IAM policies and permissions | IAM |
| `iam_users` | User configurations | IAM |
| `iam_roles` | Role configurations | IAM |
| `iam_mfa_status` | MFA enablement status | IAM |
| `cloudtrail_config` | CloudTrail configuration | CloudTrail |
| `cloudtrail_logs` | Audit log samples | CloudTrail, S3 |
| `config_rules` | AWS Config rule compliance | AWS Config |
| `s3_encryption` | S3 bucket encryption settings | S3 |
| `s3_public_access` | S3 public access blocks | S3 |
| `vpc_flow_logs` | VPC Flow Logs configuration | EC2, VPC |
| `security_groups` | Security group rules | EC2 |
| `kms_keys` | KMS key configurations | KMS |
| `rds_encryption` | RDS encryption status | RDS |

### Connection Requirements

#### Required IAM Permissions

Create an IAM policy with these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "LightsailReadOnly",
      "Effect": "Allow",
      "Action": [
        "iam:GetAccountPasswordPolicy",
        "iam:GetAccountSummary",
        "iam:ListUsers",
        "iam:ListRoles",
        "iam:ListPolicies",
        "iam:ListMFADevices",
        "iam:GetRole",
        "iam:GetPolicy",
        "iam:GetPolicyVersion",

        "cloudtrail:DescribeTrails",
        "cloudtrail:GetTrailStatus",
        "cloudtrail:LookupEvents",

        "config:DescribeConfigRules",
        "config:DescribeComplianceByConfigRule",
        "config:GetComplianceDetailsByConfigRule",

        "s3:GetBucketEncryption",
        "s3:GetBucketPublicAccessBlock",
        "s3:GetBucketVersioning",
        "s3:GetBucketLogging",
        "s3:ListAllMyBuckets",

        "ec2:DescribeVpcs",
        "ec2:DescribeFlowLogs",
        "ec2:DescribeSecurityGroups",

        "kms:ListKeys",
        "kms:DescribeKey",
        "kms:GetKeyRotationStatus",

        "rds:DescribeDBInstances",
        "rds:DescribeDBClusters"
      ],
      "Resource": "*"
    }
  ]
}
```

#### Connection Options

**Option 1: IAM Access Keys (Simpler)**
```typescript
interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
}
```

**Option 2: IAM Role with External ID (More Secure)**
```typescript
interface AWSRoleCredentials {
  roleArn: string;
  externalId: string;
}
```

### Implementation

```typescript
class AWSIntegrationProvider implements IntegrationProvider {
  private client: AWSClient;
  private organizationId: string;

  constructor(organizationId: string) {
    this.organizationId = organizationId;
  }

  async connect(config: AWSConnectionConfig): Promise<ConnectionResult> {
    // Validate credentials by calling STS GetCallerIdentity
    const sts = new STSClient(config.credentials);

    try {
      const identity = await sts.send(new GetCallerIdentityCommand({}));
      return {
        success: true,
        accountId: identity.Account,
        arn: identity.Arn
      };
    } catch (error) {
      return {
        success: false,
        error: 'Invalid AWS credentials'
      };
    }
  }

  async collectEvidence(options: CollectionOptions): Promise<Evidence[]> {
    const evidence: Evidence[] = [];

    for (const type of options.evidenceTypes) {
      switch (type) {
        case 'iam_mfa_status':
          evidence.push(...await this.collectIAMMFAStatus());
          break;
        case 's3_encryption':
          evidence.push(...await this.collectS3Encryption());
          break;
        case 'cloudtrail_config':
          evidence.push(...await this.collectCloudTrailConfig());
          break;
        // ... other types
      }
    }

    return evidence;
  }

  private async collectIAMMFAStatus(): Promise<Evidence[]> {
    const iam = new IAMClient(this.credentials);
    const users = await iam.send(new ListUsersCommand({}));

    const mfaStatus = await Promise.all(
      users.Users.map(async (user) => {
        const mfaDevices = await iam.send(
          new ListMFADevicesCommand({ UserName: user.UserName })
        );
        return {
          userName: user.UserName,
          hasMFA: mfaDevices.MFADevices.length > 0,
          mfaDevices: mfaDevices.MFADevices.map(d => d.SerialNumber)
        };
      })
    );

    return [{
      title: 'IAM MFA Status Report',
      description: `MFA status for ${users.Users.length} IAM users`,
      type: 'config',
      source: 'aws',
      data: {
        totalUsers: users.Users.length,
        usersWithMFA: mfaStatus.filter(u => u.hasMFA).length,
        usersWithoutMFA: mfaStatus.filter(u => !u.hasMFA).length,
        details: mfaStatus
      },
      metadata: {
        awsAccountId: this.accountId,
        region: 'global'
      },
      collectedAt: new Date(),
      validFrom: new Date(),
      validUntil: addDays(new Date(), 30)
    }];
  }

  private async collectS3Encryption(): Promise<Evidence[]> {
    const s3 = new S3Client(this.credentials);
    const buckets = await s3.send(new ListBucketsCommand({}));

    const encryptionStatus = await Promise.all(
      buckets.Buckets.map(async (bucket) => {
        try {
          const encryption = await s3.send(
            new GetBucketEncryptionCommand({ Bucket: bucket.Name })
          );
          return {
            bucketName: bucket.Name,
            encrypted: true,
            encryptionType: encryption.ServerSideEncryptionConfiguration
              ?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
          };
        } catch (error) {
          if (error.name === 'ServerSideEncryptionConfigurationNotFoundError') {
            return { bucketName: bucket.Name, encrypted: false };
          }
          throw error;
        }
      })
    );

    return [{
      title: 'S3 Bucket Encryption Status',
      description: `Encryption configuration for ${buckets.Buckets.length} S3 buckets`,
      type: 'config',
      source: 'aws',
      data: {
        totalBuckets: buckets.Buckets.length,
        encryptedBuckets: encryptionStatus.filter(b => b.encrypted).length,
        unencryptedBuckets: encryptionStatus.filter(b => !b.encrypted).length,
        details: encryptionStatus
      },
      metadata: { awsAccountId: this.accountId },
      collectedAt: new Date()
    }];
  }
}
```

### Control Mappings

| AWS Evidence | SOC 2 Criteria | ISO 27001 | Description |
|--------------|----------------|-----------|-------------|
| IAM MFA Status | CC6.1 | A.9.4.2 | Strong authentication |
| IAM Password Policy | CC6.1 | A.9.4.3 | Password management |
| CloudTrail Config | CC7.2 | A.12.4.1 | Audit logging |
| S3 Encryption | CC6.7 | A.10.1.1 | Encryption at rest |
| VPC Flow Logs | CC7.2 | A.12.4.1 | Network logging |
| Security Groups | CC6.6 | A.13.1.1 | Network security |

---

## GitHub Integration

### Overview

The GitHub integration monitors repository security settings, branch protection rules, and development practices.

### Supported Evidence Types

| Evidence Type | Description |
|---------------|-------------|
| `repo_settings` | Repository visibility and security settings |
| `branch_protection` | Branch protection rules |
| `collaborators` | Repository access and permissions |
| `webhooks` | Webhook configurations |
| `security_alerts` | Dependabot and security advisories |
| `ci_status` | CI/CD workflow status |
| `code_review_policy` | Pull request requirements |
| `commit_signing` | Commit signature verification |

### Connection Requirements

#### Required Permissions (GitHub App or Personal Access Token)

```
- repo (Full control of private repositories)
  - repo:status
  - repo_deployment
  - public_repo
  - repo:invite
  - security_events

- admin:org (For organization-level access)
  - read:org

- admin:repo_hook
  - read:repo_hook
```

#### Connection Options

**Option 1: Personal Access Token**
```typescript
interface GitHubPATCredentials {
  accessToken: string;
  type: 'pat';
}
```

**Option 2: GitHub App (Recommended for Organizations)**
```typescript
interface GitHubAppCredentials {
  appId: string;
  installationId: string;
  privateKey: string;
  type: 'app';
}
```

### Implementation

```typescript
class GitHubIntegrationProvider implements IntegrationProvider {
  private octokit: Octokit;
  private config: GitHubConfig;

  async connect(config: GitHubConnectionConfig): Promise<ConnectionResult> {
    this.octokit = new Octokit({ auth: config.credentials.accessToken });

    try {
      // Verify authentication
      const { data: user } = await this.octokit.users.getAuthenticated();

      // Get accessible organizations
      const { data: orgs } = await this.octokit.orgs.listForAuthenticatedUser();

      return {
        success: true,
        user: user.login,
        organizations: orgs.map(o => o.login)
      };
    } catch (error) {
      return {
        success: false,
        error: 'Invalid GitHub credentials'
      };
    }
  }

  async collectEvidence(options: CollectionOptions): Promise<Evidence[]> {
    const evidence: Evidence[] = [];

    for (const type of options.evidenceTypes) {
      switch (type) {
        case 'branch_protection':
          evidence.push(...await this.collectBranchProtection());
          break;
        case 'security_alerts':
          evidence.push(...await this.collectSecurityAlerts());
          break;
        // ... other types
      }
    }

    return evidence;
  }

  private async collectBranchProtection(): Promise<Evidence[]> {
    const repos = await this.getConfiguredRepos();
    const protectionStatus: BranchProtectionStatus[] = [];

    for (const repo of repos) {
      const defaultBranch = repo.default_branch;

      try {
        const { data: protection } = await this.octokit.repos.getBranchProtection({
          owner: repo.owner.login,
          repo: repo.name,
          branch: defaultBranch
        });

        protectionStatus.push({
          repository: repo.full_name,
          branch: defaultBranch,
          protected: true,
          requiresPullRequest: protection.required_pull_request_reviews !== undefined,
          requiredReviewers: protection.required_pull_request_reviews?.required_approving_review_count || 0,
          requiresStatusChecks: protection.required_status_checks !== undefined,
          statusChecks: protection.required_status_checks?.contexts || [],
          enforcesAdmins: protection.enforce_admins?.enabled || false,
          requiresSignedCommits: protection.required_signatures?.enabled || false
        });
      } catch (error) {
        if (error.status === 404) {
          protectionStatus.push({
            repository: repo.full_name,
            branch: defaultBranch,
            protected: false
          });
        } else {
          throw error;
        }
      }
    }

    const protectedCount = protectionStatus.filter(r => r.protected).length;

    return [{
      title: 'Branch Protection Status',
      description: `Branch protection rules for ${repos.length} repositories`,
      type: 'config',
      source: 'github',
      data: {
        totalRepositories: repos.length,
        protectedRepositories: protectedCount,
        unprotectedRepositories: repos.length - protectedCount,
        details: protectionStatus
      },
      metadata: {
        organization: this.config.organization
      },
      collectedAt: new Date()
    }];
  }

  private async collectSecurityAlerts(): Promise<Evidence[]> {
    const repos = await this.getConfiguredRepos();
    const alerts: SecurityAlert[] = [];

    for (const repo of repos) {
      try {
        // Dependabot alerts
        const { data: dependabotAlerts } = await this.octokit.dependabot.listAlertsForRepo({
          owner: repo.owner.login,
          repo: repo.name,
          state: 'open'
        });

        // Code scanning alerts
        const { data: codeScanAlerts } = await this.octokit.codeScanning.listAlertsForRepo({
          owner: repo.owner.login,
          repo: repo.name,
          state: 'open'
        }).catch(() => ({ data: [] }));

        alerts.push({
          repository: repo.full_name,
          dependabotAlerts: {
            total: dependabotAlerts.length,
            critical: dependabotAlerts.filter(a => a.security_advisory?.severity === 'critical').length,
            high: dependabotAlerts.filter(a => a.security_advisory?.severity === 'high').length,
            medium: dependabotAlerts.filter(a => a.security_advisory?.severity === 'medium').length,
            low: dependabotAlerts.filter(a => a.security_advisory?.severity === 'low').length
          },
          codeScanningAlerts: {
            total: codeScanAlerts.length,
            error: codeScanAlerts.filter(a => a.rule?.severity === 'error').length,
            warning: codeScanAlerts.filter(a => a.rule?.severity === 'warning').length
          }
        });
      } catch (error) {
        // Security features may not be enabled
        alerts.push({
          repository: repo.full_name,
          error: 'Security features not enabled'
        });
      }
    }

    return [{
      title: 'Security Alerts Summary',
      description: `Security alerts across ${repos.length} repositories`,
      type: 'report',
      source: 'github',
      data: {
        totalRepositories: repos.length,
        totalDependabotAlerts: alerts.reduce((sum, a) => sum + (a.dependabotAlerts?.total || 0), 0),
        criticalAlerts: alerts.reduce((sum, a) => sum + (a.dependabotAlerts?.critical || 0), 0),
        details: alerts
      },
      metadata: { organization: this.config.organization },
      collectedAt: new Date()
    }];
  }
}
```

### Control Mappings

| GitHub Evidence | SOC 2 Criteria | ISO 27001 | Description |
|-----------------|----------------|-----------|-------------|
| Branch Protection | CC8.1 | A.14.2.2 | Change management |
| Code Review Required | CC8.1 | A.14.2.2 | Review process |
| Security Alerts | CC7.1 | A.12.6.1 | Vulnerability management |
| CI/CD Status | CC8.1 | A.14.2.8 | Automated testing |
| Commit Signing | CC6.1 | A.9.4.2 | Code integrity |

---

## Google Workspace Integration

### Overview

Integrates with Google Workspace (GSuite) for user management and security settings evidence.

### Supported Evidence Types

| Evidence Type | Description |
|---------------|-------------|
| `users` | User accounts and status |
| `mfa_status` | 2-Step Verification enrollment |
| `admin_roles` | Admin role assignments |
| `security_settings` | Domain security configuration |
| `oauth_apps` | Third-party app access |
| `login_audit` | User login activity |

### Connection Requirements

#### Required OAuth Scopes
```
https://www.googleapis.com/auth/admin.directory.user.readonly
https://www.googleapis.com/auth/admin.directory.rolemanagement.readonly
https://www.googleapis.com/auth/admin.reports.audit.readonly
```

### Implementation Pattern

```typescript
class GoogleWorkspaceProvider implements IntegrationProvider {
  private admin: admin_directory_v1.Admin;

  async collectEvidence(options: CollectionOptions): Promise<Evidence[]> {
    const evidence: Evidence[] = [];

    if (options.evidenceTypes.includes('mfa_status')) {
      const users = await this.admin.users.list({
        customer: 'my_customer',
        maxResults: 500
      });

      const mfaStatus = users.data.users?.map(user => ({
        email: user.primaryEmail,
        isEnrolledIn2Sv: user.isEnrolledIn2Sv || false,
        isEnforcedIn2Sv: user.isEnforcedIn2Sv || false,
        lastLoginTime: user.lastLoginTime
      }));

      evidence.push({
        title: 'Google Workspace 2-Step Verification Status',
        description: 'MFA enrollment status for all users',
        type: 'config',
        source: 'gsuite',
        data: {
          totalUsers: mfaStatus?.length || 0,
          enrolledIn2SV: mfaStatus?.filter(u => u.isEnrolledIn2Sv).length || 0,
          notEnrolledIn2SV: mfaStatus?.filter(u => !u.isEnrolledIn2Sv).length || 0,
          details: mfaStatus
        },
        collectedAt: new Date()
      });
    }

    return evidence;
  }
}
```

---

## Azure AD Integration (Future)

### Overview

Integrates with Azure Active Directory for enterprise user management and identity security.

### Supported Evidence Types

| Evidence Type | Description |
|---------------|-------------|
| `users` | User accounts |
| `mfa_status` | MFA registration status |
| `conditional_access` | Conditional access policies |
| `sign_in_logs` | Authentication logs |
| `risky_users` | Risky user detections |

### Connection Requirements

#### Required Microsoft Graph Permissions
```
User.Read.All
AuditLog.Read.All
Policy.Read.All
IdentityRiskEvent.Read.All
```

---

## Integration Sync Scheduling

### Sync Job Architecture

```typescript
interface SyncJob {
  id: string;
  integrationId: string;
  organizationId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  evidenceTypes: string[];
  startedAt?: Date;
  completedAt?: Date;
  result?: SyncResult;
  error?: string;
}

interface SyncResult {
  evidenceCollected: number;
  evidenceFailed: number;
  controlsUpdated: number;
  errors: SyncError[];
}

// Sync scheduler
class IntegrationSyncScheduler {
  async scheduleSync(integrationId: string, options?: SyncOptions): Promise<string> {
    const job: SyncJob = {
      id: generateId(),
      integrationId,
      organizationId: await this.getOrganizationId(integrationId),
      status: 'pending',
      evidenceTypes: options?.evidenceTypes || await this.getDefaultEvidenceTypes(integrationId)
    };

    await this.jobQueue.add('integration-sync', job, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 }
    });

    return job.id;
  }

  async processSyncJob(job: SyncJob): Promise<SyncResult> {
    const integration = await this.integrationService.get(job.integrationId);
    const provider = this.getProvider(integration.type);

    const credentials = await this.credentialService.decrypt(integration.credentials);
    await provider.connect({ credentials, settings: integration.config });

    const evidence = await provider.collectEvidence({
      evidenceTypes: job.evidenceTypes
    });

    // Save evidence and update controls
    const savedEvidence = await this.evidenceService.saveMany(
      job.organizationId,
      evidence.map(e => ({
        ...e,
        integrationId: integration.id
      }))
    );

    // Update compliance scores
    await this.complianceScoreService.recalculate(job.organizationId);

    return {
      evidenceCollected: savedEvidence.length,
      evidenceFailed: evidence.length - savedEvidence.length,
      controlsUpdated: await this.getUpdatedControlCount(savedEvidence)
    };
  }
}
```

### Default Sync Frequencies

| Integration | Default Frequency | Configurable Range |
|-------------|-------------------|-------------------|
| AWS | Every 6 hours | 1 hour - 24 hours |
| GitHub | Every 4 hours | 1 hour - 24 hours |
| Google Workspace | Every 12 hours | 4 hours - 24 hours |
| Azure AD | Every 12 hours | 4 hours - 24 hours |

---

## Error Handling

### Common Error Types

```typescript
enum IntegrationErrorCode {
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  RATE_LIMITED = 'RATE_LIMITED',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  TIMEOUT = 'TIMEOUT'
}

class IntegrationError extends Error {
  constructor(
    public code: IntegrationErrorCode,
    message: string,
    public retryable: boolean = false,
    public details?: unknown
  ) {
    super(message);
  }
}
```

### Retry Strategy

```typescript
const RETRY_CONFIG = {
  maxAttempts: 3,
  backoff: {
    type: 'exponential',
    initialDelay: 1000,
    maxDelay: 30000,
    multiplier: 2
  },
  retryableErrors: [
    IntegrationErrorCode.RATE_LIMITED,
    IntegrationErrorCode.SERVICE_UNAVAILABLE,
    IntegrationErrorCode.TIMEOUT
  ]
};
```

---

## Security Considerations

### Credential Rotation
- Recommend credential rotation every 90 days
- Alert users when credentials are approaching expiration
- Support automatic token refresh where possible (OAuth)

### Least Privilege
- Request only necessary permissions
- Document all required permissions clearly
- Alert if integration has excessive permissions

### Audit Logging
- Log all integration connection attempts
- Log all evidence collection operations
- Never log actual credentials

### Data Handling
- Encrypt credentials at rest (AES-256)
- Use TLS for all API communications
- Implement secure credential deletion on disconnect
