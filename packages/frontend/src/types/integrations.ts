import type { IntegrationType, IntegrationStatus } from '@lightsail/shared';

export const INTEGRATION_TYPES: IntegrationType[] = ['github', 'aws', 'gsuite', 'azure_ad', 'jira', 'slack'];

export const INTEGRATION_TYPE_LABELS: Record<IntegrationType, string> = {
  github: 'GitHub',
  aws: 'Amazon Web Services',
  gsuite: 'Google Workspace',
  azure_ad: 'Azure Active Directory',
  jira: 'Jira',
  slack: 'Slack',
};

export const INTEGRATION_TYPE_DESCRIPTIONS: Record<IntegrationType, string> = {
  github: 'Repository security, branch protection, and vulnerability alerts',
  aws: 'IAM, CloudTrail, S3 encryption, and security configuration',
  gsuite: 'User directory, MFA status, and security settings',
  azure_ad: 'User directory, MFA, and conditional access',
  jira: 'Issue tracking and task management',
  slack: 'Communication and security notifications',
};

export const INTEGRATION_TYPE_ICONS: Record<IntegrationType, string> = {
  github: 'github',
  aws: 'cloud',
  gsuite: 'mail',
  azure_ad: 'users',
  jira: 'clipboard-list',
  slack: 'message-square',
};

export const INTEGRATION_STATUSES: IntegrationStatus[] = ['pending', 'active', 'error', 'disconnected'];

export const INTEGRATION_STATUS_LABELS: Record<IntegrationStatus, string> = {
  pending: 'Connecting...',
  active: 'Connected',
  error: 'Error',
  disconnected: 'Disconnected',
};

export interface ConnectedBy {
  id: string;
  name: string;
}

export interface IntegrationLog {
  id: string;
  operation: string;
  status: string;
  itemsProcessed: number;
  itemsFailed: number;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
}

export interface IntegrationListItem {
  id: string;
  type: IntegrationType;
  name: string;
  status: IntegrationStatus;
  errorMessage: string | null;
  config: Record<string, unknown>;
  lastSyncAt: string | null;
  nextSyncAt: string | null;
  syncFrequencyMinutes: number;
  connectedBy: ConnectedBy | null;
  evidenceCount: number;
  syncCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface IntegrationDetail extends IntegrationListItem {
  recentLogs: IntegrationLog[];
}

export interface IntegrationTypeInfo {
  type: IntegrationType;
  displayName: string;
  description: string;
  icon: string;
  available: boolean;
}

export interface ConnectIntegrationInput {
  type: IntegrationType;
  name: string;
  credentials: Record<string, string>;
  config?: Record<string, unknown>;
}

export interface UpdateIntegrationInput {
  name?: string;
  config?: Record<string, unknown>;
  syncFrequencyMinutes?: number;
}

export interface IntegrationFilters {
  type?: IntegrationType;
  status?: IntegrationStatus;
}

export interface SyncResult {
  message: string;
  evidenceGenerated: number;
  controlsVerified: number;
  controlsFailed: number;
  errors: Array<{ code: string; message: string }>;
  durationMs: number;
}

export interface TestConnectionResult {
  connected: boolean;
  latencyMs: number;
  error?: string;
}

// GitHub-specific credential fields
export interface GitHubCredentials {
  accessToken: string;
}

export interface GitHubConfig {
  organization?: string;
  includePrivate?: boolean;
}

// AWS-specific credential fields (for future)
export interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region?: string;
}

// Google Workspace-specific credential fields (for future)
export interface GoogleWorkspaceCredentials {
  serviceAccountKey: string;
  adminEmail: string;
}
