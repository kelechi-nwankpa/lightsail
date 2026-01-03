/**
 * Control Health Score Calculator
 *
 * Calculates a 0-100 health score for controls based on:
 * - Verification status (0-40 points) - Is it verified by integrations?
 * - Freshness (0-25 points) - Is evidence fresh?
 * - Coverage (0-20 points) - Is evidence coverage complete?
 * - Review (0-15 points) - Has it been reviewed recently?
 */

import { prisma } from '../config/db.js';

// Score weights
const WEIGHTS = {
  VERIFICATION: 40,
  FRESHNESS: 25,
  COVERAGE: 20,
  REVIEW: 15,
} as const;

// Freshness thresholds (in days)
const FRESHNESS_THRESHOLDS = {
  EXCELLENT: 7, // Full score if evidence within 7 days
  GOOD: 30, // 75% if within 30 days
  ACCEPTABLE: 90, // 50% if within 90 days
  STALE: 180, // 25% if within 180 days
  // Beyond 180 days = 0%
} as const;

// Review thresholds (in days)
const REVIEW_THRESHOLDS = {
  EXCELLENT: 30, // Full score if reviewed within 30 days
  GOOD: 60, // 75% if within 60 days
  ACCEPTABLE: 90, // 50% if within 90 days
  // Beyond 90 days = 0%
} as const;

export interface ControlHealthFactors {
  verificationScore: number;
  verificationStatus: 'verified' | 'failed' | 'stale' | 'unverified';
  freshnessScore: number;
  daysSinceLastEvidence: number | null;
  coverageScore: number;
  evidenceCount: number;
  hasIntegrationEvidence: boolean;
  reviewScore: number;
  daysSinceLastReview: number | null;
  recommendations: string[];
}

export interface ControlHealthResult {
  controlId: string;
  overallScore: number;
  factors: ControlHealthFactors;
  calculatedAt: Date;
}

/**
 * Get verification score (0-40 points)
 * - Verified: 40 points
 * - Unverified: 20 points (benefit of the doubt, but needs verification)
 * - Stale: 10 points (was verified but evidence expired)
 * - Failed: 0 points
 */
function getVerificationScore(
  verificationStatus: string
): { score: number; status: 'verified' | 'failed' | 'stale' | 'unverified' } {
  switch (verificationStatus) {
    case 'verified':
      return { score: WEIGHTS.VERIFICATION, status: 'verified' };
    case 'unverified':
      return { score: WEIGHTS.VERIFICATION * 0.5, status: 'unverified' };
    case 'stale':
      return { score: WEIGHTS.VERIFICATION * 0.25, status: 'stale' };
    case 'failed':
      return { score: 0, status: 'failed' };
    default:
      return { score: WEIGHTS.VERIFICATION * 0.5, status: 'unverified' };
  }
}

/**
 * Get freshness score (0-25 points) based on most recent evidence
 */
function getFreshnessScore(daysSinceLastEvidence: number | null): number {
  if (daysSinceLastEvidence === null) {
    return 0;
  }

  if (daysSinceLastEvidence <= FRESHNESS_THRESHOLDS.EXCELLENT) {
    return WEIGHTS.FRESHNESS;
  } else if (daysSinceLastEvidence <= FRESHNESS_THRESHOLDS.GOOD) {
    return WEIGHTS.FRESHNESS * 0.75;
  } else if (daysSinceLastEvidence <= FRESHNESS_THRESHOLDS.ACCEPTABLE) {
    return WEIGHTS.FRESHNESS * 0.5;
  } else if (daysSinceLastEvidence <= FRESHNESS_THRESHOLDS.STALE) {
    return WEIGHTS.FRESHNESS * 0.25;
  }

  return 0;
}

/**
 * Get coverage score (0-20 points) based on evidence breadth
 * - Has integration-generated evidence: +10 points
 * - Has at least one piece of evidence: +5 points
 * - Has 3+ pieces of evidence: +5 points
 */
function getCoverageScore(
  evidenceCount: number,
  hasIntegrationEvidence: boolean
): number {
  let score = 0;

  // Integration evidence is highly valued
  if (hasIntegrationEvidence) {
    score += WEIGHTS.COVERAGE * 0.5; // 10 points
  }

  // Having any evidence
  if (evidenceCount > 0) {
    score += WEIGHTS.COVERAGE * 0.25; // 5 points
  }

  // Having multiple pieces of evidence
  if (evidenceCount >= 3) {
    score += WEIGHTS.COVERAGE * 0.25; // 5 points
  }

  return score;
}

/**
 * Get review score (0-15 points) based on last review date
 */
function getReviewScore(daysSinceLastReview: number | null): number {
  if (daysSinceLastReview === null) {
    return 0;
  }

  if (daysSinceLastReview <= REVIEW_THRESHOLDS.EXCELLENT) {
    return WEIGHTS.REVIEW;
  } else if (daysSinceLastReview <= REVIEW_THRESHOLDS.GOOD) {
    return WEIGHTS.REVIEW * 0.75;
  } else if (daysSinceLastReview <= REVIEW_THRESHOLDS.ACCEPTABLE) {
    return WEIGHTS.REVIEW * 0.5;
  }

  return 0;
}

/**
 * Generate actionable recommendations based on the health factors
 */
function generateRecommendations(factors: ControlHealthFactors): string[] {
  const recommendations: string[] = [];

  // Verification recommendations
  if (factors.verificationStatus === 'failed') {
    recommendations.push(
      'Control verification failed. Review the verification details and fix the underlying issue.'
    );
  } else if (factors.verificationStatus === 'stale') {
    recommendations.push(
      'Control verification is stale. Run a new sync to refresh verification status.'
    );
  } else if (factors.verificationStatus === 'unverified') {
    recommendations.push(
      'Control has not been verified. Connect an integration or add integration-backed evidence.'
    );
  }

  // Freshness recommendations
  if (factors.daysSinceLastEvidence === null) {
    recommendations.push('No evidence linked to this control. Add relevant evidence.');
  } else if (factors.daysSinceLastEvidence > FRESHNESS_THRESHOLDS.ACCEPTABLE) {
    recommendations.push(
      `Evidence is ${factors.daysSinceLastEvidence} days old. Collect fresh evidence.`
    );
  }

  // Coverage recommendations
  if (!factors.hasIntegrationEvidence) {
    recommendations.push(
      'No integration-generated evidence. Connect an integration for automated verification.'
    );
  }
  if (factors.evidenceCount < 3) {
    recommendations.push(
      'Limited evidence coverage. Add more supporting evidence for stronger compliance posture.'
    );
  }

  // Review recommendations
  if (factors.daysSinceLastReview === null) {
    recommendations.push('Control has never been reviewed. Schedule a review.');
  } else if (factors.daysSinceLastReview > REVIEW_THRESHOLDS.ACCEPTABLE) {
    recommendations.push(
      `Control was last reviewed ${factors.daysSinceLastReview} days ago. Schedule a review.`
    );
  }

  return recommendations;
}

/**
 * Calculate health score for a single control
 */
export async function calculateControlHealth(
  controlId: string
): Promise<ControlHealthResult> {
  const now = new Date();

  // Fetch control with evidence and review data
  const control = await prisma.control.findUnique({
    where: { id: controlId },
    include: {
      evidenceLinks: {
        include: {
          evidence: {
            select: {
              id: true,
              isProvisional: true,
              collectedAt: true,
              validUntil: true,
              deletedAt: true,
            },
          },
        },
      },
    },
  });

  if (!control) {
    throw new Error(`Control not found: ${controlId}`);
  }

  // Calculate days since last evidence
  const validEvidence = control.evidenceLinks
    .map((link) => link.evidence)
    .filter((e) => !e.deletedAt);

  let daysSinceLastEvidence: number | null = null;
  if (validEvidence.length > 0) {
    const mostRecentEvidence = validEvidence.reduce((latest, e) =>
      e.collectedAt > latest.collectedAt ? e : latest
    );
    const diffMs = now.getTime() - mostRecentEvidence.collectedAt.getTime();
    daysSinceLastEvidence = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  // Check for integration evidence (non-provisional)
  const hasIntegrationEvidence = validEvidence.some((e) => !e.isProvisional);

  // Calculate days since last review
  let daysSinceLastReview: number | null = null;
  if (control.lastReviewedAt) {
    const diffMs = now.getTime() - control.lastReviewedAt.getTime();
    daysSinceLastReview = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  // Calculate individual scores
  const { score: verificationScore, status: verificationStatus } =
    getVerificationScore(control.verificationStatus);
  const freshnessScore = getFreshnessScore(daysSinceLastEvidence);
  const coverageScore = getCoverageScore(validEvidence.length, hasIntegrationEvidence);
  const reviewScore = getReviewScore(daysSinceLastReview);

  // Calculate overall score
  const overallScore = Math.round(
    verificationScore + freshnessScore + coverageScore + reviewScore
  );

  // Build factors object
  const factors: ControlHealthFactors = {
    verificationScore,
    verificationStatus,
    freshnessScore,
    daysSinceLastEvidence,
    coverageScore,
    evidenceCount: validEvidence.length,
    hasIntegrationEvidence,
    reviewScore,
    daysSinceLastReview,
    recommendations: [],
  };

  // Generate recommendations
  factors.recommendations = generateRecommendations(factors);

  return {
    controlId,
    overallScore,
    factors,
    calculatedAt: now,
  };
}

/**
 * Calculate health scores for multiple controls
 */
export async function calculateControlHealthBatch(
  controlIds: string[]
): Promise<ControlHealthResult[]> {
  const results = await Promise.all(
    controlIds.map((id) => calculateControlHealth(id))
  );
  return results;
}

/**
 * Calculate and persist health score to ControlEffectivenessLog
 */
export async function calculateAndLogControlHealth(
  controlId: string,
  triggeredBy: string = 'manual'
): Promise<ControlHealthResult> {
  const healthResult = await calculateControlHealth(controlId);

  // Persist to effectiveness log
  await prisma.controlEffectivenessLog.create({
    data: {
      controlId,
      effectivenessScore: healthResult.overallScore,
      factors: healthResult.factors as object,
      triggeredBy,
      calculatedAt: healthResult.calculatedAt,
    },
  });

  return healthResult;
}

/**
 * Get verification history for a control
 */
export async function getVerificationHistory(
  controlId: string,
  limit: number = 50
): Promise<
  Array<{
    id: string;
    effectivenessScore: number;
    factors: Record<string, unknown>;
    triggeredBy: string | null;
    calculatedAt: Date;
  }>
> {
  const history = await prisma.controlEffectivenessLog.findMany({
    where: { controlId },
    orderBy: { calculatedAt: 'desc' },
    take: limit,
    select: {
      id: true,
      effectivenessScore: true,
      factors: true,
      triggeredBy: true,
      calculatedAt: true,
    },
  });

  return history.map((h) => ({
    id: h.id,
    effectivenessScore: Number(h.effectivenessScore),
    factors: (h.factors as Record<string, unknown>) || {},
    triggeredBy: h.triggeredBy,
    calculatedAt: h.calculatedAt,
  }));
}

/**
 * Mark a control as reviewed (human review)
 * Updates lastReviewedAt and recalculates health score
 */
export async function markControlReviewed(
  controlId: string,
  userId: string
): Promise<ControlHealthResult> {
  // Update control's lastReviewedAt
  await prisma.control.update({
    where: { id: controlId },
    data: { lastReviewedAt: new Date() },
  });

  // Log and calculate health score with updated review date
  const healthResult = await calculateAndLogControlHealth(controlId, `review_by_${userId}`);

  return healthResult;
}

/**
 * Recalculate health score without updating review date
 * Used for refreshing the score display
 */
export async function refreshControlHealth(
  controlId: string
): Promise<ControlHealthResult> {
  return calculateControlHealth(controlId);
}
