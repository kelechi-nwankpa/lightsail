import type { PolicyStatus, ControlStatus } from '@lightsail/shared';

export interface PolicyOwner {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

export interface PolicyListItem {
  id: string;
  code: string | null;
  title: string;
  description: string | null;
  category: string | null;
  status: PolicyStatus;
  owner: PolicyOwner | null;
  approvedBy: { id: string; name: string } | null;
  approvedAt: string | null;
  lastReviewedAt: string | null;
  nextReviewAt: string | null;
  reviewFrequencyDays: number;
  currentVersion: number;
  controlCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PolicyVersion {
  id: string;
  version: number;
  content: string;
  changeSummary: string | null;
  createdBy: { id: string; name: string } | null;
  createdAt: string;
}

export interface LinkedControl {
  id: string;
  code: string | null;
  name: string;
  implementationStatus: ControlStatus;
}

export interface PolicyDetail extends Omit<PolicyListItem, 'currentVersion' | 'controlCount'> {
  isAiGenerated: boolean;
  versions: PolicyVersion[];
  linkedControls: LinkedControl[];
}

export interface PolicyFilters {
  status?: PolicyStatus;
  category?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CreatePolicyInput {
  code?: string;
  title: string;
  description?: string;
  category?: string;
  content: string;
  ownerId?: string;
  reviewFrequencyDays?: number;
}

export interface UpdatePolicyInput {
  code?: string;
  title?: string;
  description?: string;
  category?: string;
  content?: string;
  changeSummary?: string;
  ownerId?: string | null;
  reviewFrequencyDays?: number;
}

export interface PaginatedPoliciesResponse {
  data: PolicyListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// Common policy categories
export const POLICY_CATEGORIES = [
  'Information Security',
  'Access Control',
  'Data Protection',
  'Incident Response',
  'Business Continuity',
  'Human Resources',
  'Asset Management',
  'Vendor Management',
  'Change Management',
  'Risk Management',
  'Compliance',
  'Privacy',
] as const;

export type PolicyCategory = typeof POLICY_CATEGORIES[number];
