import type { RiskCategory, RiskStatus, RiskLikelihood, RiskImpact, ControlEffectiveness } from '@lightsail/shared';

export const RISK_CATEGORIES: RiskCategory[] = ['operational', 'technical', 'compliance', 'financial', 'reputational', 'strategic'];

export const RISK_CATEGORY_LABELS: Record<RiskCategory, string> = {
  operational: 'Operational',
  technical: 'Technical',
  compliance: 'Compliance',
  financial: 'Financial',
  reputational: 'Reputational',
  strategic: 'Strategic',
};

export const RISK_STATUSES: RiskStatus[] = ['identified', 'assessing', 'mitigating', 'monitoring', 'accepted', 'transferred', 'closed'];

export const RISK_STATUS_LABELS: Record<RiskStatus, string> = {
  identified: 'Identified',
  assessing: 'Assessing',
  mitigating: 'Mitigating',
  monitoring: 'Monitoring',
  accepted: 'Accepted',
  transferred: 'Transferred',
  closed: 'Closed',
};

export const RISK_LIKELIHOODS: RiskLikelihood[] = ['rare', 'unlikely', 'possible', 'likely', 'almost_certain'];

export const RISK_LIKELIHOOD_LABELS: Record<RiskLikelihood, string> = {
  rare: 'Rare',
  unlikely: 'Unlikely',
  possible: 'Possible',
  likely: 'Likely',
  almost_certain: 'Almost Certain',
};

export const RISK_IMPACTS: RiskImpact[] = ['insignificant', 'minor', 'moderate', 'major', 'severe'];

export const RISK_IMPACT_LABELS: Record<RiskImpact, string> = {
  insignificant: 'Insignificant',
  minor: 'Minor',
  moderate: 'Moderate',
  major: 'Major',
  severe: 'Severe',
};

export const CONTROL_EFFECTIVENESS_LABELS: Record<ControlEffectiveness, string> = {
  effective: 'Effective',
  partial: 'Partial',
  ineffective: 'Ineffective',
};

export interface LinkedControl {
  id: string;
  code: string | null;
  name: string;
  implementationStatus?: string;
  effectiveness: string;
  notes?: string | null;
  linkedAt?: string;
}

export interface RiskOwner {
  id: string;
  name: string;
}

export interface RiskListItem {
  id: string;
  title: string;
  description: string | null;
  category: RiskCategory;
  status: RiskStatus;
  likelihood: RiskLikelihood;
  impact: RiskImpact;
  inherentScore: number | null;
  residualScore: number | null;
  owner: RiskOwner | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  controlCount: number;
  linkedControls: LinkedControl[];
}

export interface RiskDetail extends RiskListItem {
  mitigationPlan: string | null;
  acceptanceNotes: string | null;
  reviewedAt: string | null;
  nextReviewAt: string | null;
}

export interface RiskFilters {
  status?: RiskStatus;
  category?: RiskCategory;
  likelihood?: RiskLikelihood;
  impact?: RiskImpact;
  ownerId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateRiskInput {
  title: string;
  description?: string;
  category?: RiskCategory;
  likelihood?: RiskLikelihood;
  impact?: RiskImpact;
  ownerId?: string;
  mitigationPlan?: string;
  dueDate?: string;
  controlIds?: string[];
}

export interface UpdateRiskInput {
  title?: string;
  description?: string;
  category?: RiskCategory;
  status?: RiskStatus;
  likelihood?: RiskLikelihood;
  impact?: RiskImpact;
  ownerId?: string | null;
  mitigationPlan?: string;
  acceptanceNotes?: string;
  dueDate?: string | null;
  controlIds?: string[];
}

export interface LinkControlInput {
  controlId: string;
  effectiveness?: 'effective' | 'partial' | 'ineffective';
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

// Risk score helpers
export function getRiskScoreLevel(score: number | null): 'low' | 'medium' | 'high' | 'critical' {
  if (!score) return 'low';
  if (score <= 4) return 'low';
  if (score <= 9) return 'medium';
  if (score <= 16) return 'high';
  return 'critical';
}

export function getRiskScoreColor(score: number | null): string {
  const level = getRiskScoreLevel(score);
  switch (level) {
    case 'low':
      return 'text-green-600 bg-green-100';
    case 'medium':
      return 'text-amber-600 bg-amber-100';
    case 'high':
      return 'text-orange-600 bg-orange-100';
    case 'critical':
      return 'text-red-600 bg-red-100';
  }
}
