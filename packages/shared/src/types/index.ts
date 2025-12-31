// ============================================
// Core Entity Types
// ============================================

// User & Organization
export interface User {
  id: string;
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: OrganizationPlan;
  industry: string | null;
  employeeCount: string | null;
  country: string | null;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: MemberRole;
  invitedAt: Date | null;
  acceptedAt: Date | null;
  createdAt: Date;
}

// Compliance Framework
export interface Framework {
  id: string;
  code: FrameworkCode;
  name: string;
  description: string | null;
  version: string | null;
  category: string | null;
  regions: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FrameworkRequirement {
  id: string;
  frameworkId: string;
  code: string;
  name: string;
  description: string | null;
  parentId: string | null;
  category: string | null;
  guidance: string | null;
  sortOrder: number;
}

// Controls
export interface Control {
  id: string;
  organizationId: string;
  code: string | null;
  name: string;
  description: string | null;
  implementationStatus: ControlStatus;
  implementationNotes: string | null;
  ownerId: string | null;
  riskLevel: RiskLevel | null;
  isAutomated: boolean;
  automationSource: string | null;
  lastReviewedAt: Date | null;
  nextReviewAt: Date | null;
  reviewFrequencyDays: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ControlFrameworkMapping {
  id: string;
  controlId: string;
  frameworkRequirementId: string;
  coverage: CoverageLevel;
  notes: string | null;
  createdAt: Date;
}

// Evidence
export interface Evidence {
  id: string;
  organizationId: string;
  title: string;
  description: string | null;
  type: EvidenceType;
  source: string;
  fileKey: string | null;
  fileName: string | null;
  fileSize: number | null;
  fileType: string | null;
  collectedAt: Date;
  collectedById: string | null;
  integrationId: string | null;
  validFrom: Date | null;
  validUntil: Date | null;
  reviewStatus: ReviewStatus;
  reviewedById: string | null;
  reviewedAt: Date | null;
  reviewNotes: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// Policies
export interface Policy {
  id: string;
  organizationId: string;
  code: string | null;
  title: string;
  description: string | null;
  category: string | null;
  status: PolicyStatus;
  ownerId: string | null;
  approvedById: string | null;
  approvedAt: Date | null;
  lastReviewedAt: Date | null;
  nextReviewAt: Date | null;
  reviewFrequencyDays: number;
  isAiGenerated: boolean;
  aiTemplateId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PolicyVersion {
  id: string;
  policyId: string;
  version: number;
  content: string;
  fileKey: string | null;
  changeSummary: string | null;
  createdById: string | null;
  createdAt: Date;
}

// Integrations
export interface Integration {
  id: string;
  organizationId: string;
  type: IntegrationType;
  name: string;
  status: IntegrationStatus;
  errorMessage: string | null;
  config: Record<string, unknown>;
  lastSyncAt: Date | null;
  nextSyncAt: Date | null;
  syncFrequencyMinutes: number;
  connectedById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Tasks
export interface Task {
  id: string;
  organizationId: string;
  title: string;
  description: string | null;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  assigneeId: string | null;
  createdById: string | null;
  dueDate: Date | null;
  completedAt: Date | null;
  controlId: string | null;
  policyId: string | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Audit Logs
export interface AuditLog {
  id: string;
  organizationId: string | null;
  userId: string | null;
  userEmail: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  changes: Record<string, { old: unknown; new: unknown }> | null;
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

// ============================================
// Enums
// ============================================

export type OrganizationPlan = 'trial' | 'starter' | 'professional' | 'enterprise';

export type MemberRole = 'owner' | 'admin' | 'member' | 'viewer';

export type FrameworkCode = 'SOC2' | 'ISO27001' | 'GDPR' | 'NDPR';

export type ControlStatus = 'not_started' | 'in_progress' | 'implemented' | 'not_applicable';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type CoverageLevel = 'full' | 'partial' | 'minimal';

export type EvidenceType = 'document' | 'screenshot' | 'log' | 'config' | 'report';

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export type PolicyStatus = 'draft' | 'review' | 'approved' | 'archived';

export type IntegrationType = 'aws' | 'github' | 'gsuite' | 'azure_ad' | 'jira' | 'slack';

export type IntegrationStatus = 'pending' | 'active' | 'error' | 'disconnected';

export type TaskType = 'general' | 'remediation' | 'review' | 'implementation';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export type TaskStatus = 'open' | 'in_progress' | 'blocked' | 'completed' | 'cancelled';

// ============================================
// API Types
// ============================================

export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

// ============================================
// Auth Types
// ============================================

export interface AuthUser {
  id: string;
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  organizationId: string | null;
  organizationRole: MemberRole | null;
}

export interface AuthContext {
  userId: string;
  clerkId: string;
  organizationId: string;
  role: MemberRole;
}
