import type { EvidenceType, ReviewStatus } from '@lightsail/shared';

export const EVIDENCE_TYPES: EvidenceType[] = ['document', 'screenshot', 'log', 'config', 'report'];

export const EVIDENCE_TYPE_LABELS: Record<EvidenceType, string> = {
  document: 'Document',
  screenshot: 'Screenshot',
  log: 'Log',
  config: 'Configuration',
  report: 'Report',
};

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
};

export interface LinkedControl {
  id: string;
  code: string | null;
  name: string;
  implementationStatus?: string;
  relevance: string;
  notes?: string | null;
  linkedAt?: string;
}

export interface CollectedBy {
  id: string;
  name: string;
}

export interface EvidenceListItem {
  id: string;
  title: string;
  description: string | null;
  type: EvidenceType;
  source: string;
  fileName: string | null;
  fileSize: number | null;
  fileType: string | null;
  collectedAt: string;
  collectedBy: CollectedBy | null;
  validFrom: string | null;
  validUntil: string | null;
  reviewStatus: ReviewStatus;
  createdAt: string;
  updatedAt: string;
  controlCount: number;
  linkedControls: LinkedControl[];
}

export interface EvidenceDetail extends EvidenceListItem {
  fileKey: string | null;
  reviewedAt: string | null;
  reviewedBy: CollectedBy | null;
  reviewNotes: string | null;
  metadata: Record<string, unknown>;
}

export interface EvidenceFilters {
  controlId?: string;
  type?: EvidenceType;
  source?: string;
  reviewStatus?: ReviewStatus;
  validOnly?: boolean;
  page?: number;
  pageSize?: number;
}

export interface CreateEvidenceInput {
  title: string;
  description?: string;
  type: EvidenceType;
  source?: string;
  fileKey?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  validFrom?: string;
  validUntil?: string;
  controlIds?: string[];
}

export interface UpdateEvidenceInput {
  title?: string;
  description?: string;
  type?: EvidenceType;
  source?: string;
  validFrom?: string | null;
  validUntil?: string | null;
  controlIds?: string[];
}

export interface ReviewEvidenceInput {
  status: 'approved' | 'rejected';
  notes?: string;
}

export interface LinkControlInput {
  controlId: string;
  relevance?: 'primary' | 'supporting' | 'related';
  notes?: string;
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
