import type { ControlStatus, RiskLevel, CoverageLevel } from '@lightsail/shared';

export interface FrameworkMapping {
  id: string;
  requirementId: string;
  requirementCode: string;
  requirementName: string;
  requirementDescription?: string;
  frameworkId: string;
  frameworkCode: string;
  frameworkName: string;
  coverage: CoverageLevel;
  notes: string | null;
}

export interface ControlListItem {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  implementationStatus: ControlStatus;
  implementationNotes: string | null;
  ownerId: string | null;
  riskLevel: RiskLevel | null;
  reviewFrequencyDays: number;
  lastReviewedAt: string | null;
  nextReviewAt: string | null;
  createdAt: string;
  updatedAt: string;
  evidenceCount: number;
  frameworkMappings: FrameworkMapping[];
}

export interface ControlDetail extends ControlListItem {
  evidence: EvidenceItem[];
}

export interface EvidenceItem {
  id: string;
  title: string;
  type: string;
  source: string;
  reviewStatus: string;
  validFrom: string | null;
  validUntil: string | null;
  createdAt: string;
}

export interface ControlFilters {
  status?: ControlStatus;
  ownerId?: string;
  frameworkId?: string;
  riskLevel?: RiskLevel;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface FrameworkListItem {
  id: string;
  code: string;
  name: string;
  version: string | null;
  description: string | null;
  requirementCount: number;
}

export interface FrameworkRequirementNode {
  id: string;
  code: string;
  name: string;
  description: string | null;
  guidance: string | null;
  parentId: string | null;
  children: FrameworkRequirementNode[];
}

export interface FrameworkDetail {
  id: string;
  code: string;
  name: string;
  version: string | null;
  description: string | null;
  requirements: FrameworkRequirementNode[];
}

export interface EnabledFramework {
  id: string;
  frameworkId: string;
  code: string;
  name: string;
  version: string | null;
  enabledAt: string;
  totalRequirements: number;
  implementedRequirements: number;
  progress: number;
}

export interface CreateControlInput {
  code?: string;
  name: string;
  description?: string;
  ownerId?: string;
  riskLevel?: RiskLevel;
  reviewFrequencyDays?: number;
  frameworkRequirementIds?: string[];
}

export interface UpdateControlInput {
  code?: string;
  name?: string;
  description?: string;
  implementationStatus?: ControlStatus;
  implementationNotes?: string;
  ownerId?: string | null;
  riskLevel?: RiskLevel | null;
  reviewFrequencyDays?: number;
}
