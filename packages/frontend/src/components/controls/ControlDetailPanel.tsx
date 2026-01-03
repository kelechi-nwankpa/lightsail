import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { Progress } from '../ui/progress';
import { ControlStatusBadge } from './ControlStatusBadge';
import { VerificationStatusBadge } from './VerificationStatusBadge';
import { FrameworkMappingDialog } from '../frameworks/FrameworkMappingDialog';
import { useControlMutations, useControlHealth } from '../../hooks/use-controls';
import {
  X,
  Edit2,
  FileText,
  Link2,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Plus,
  Trash2,
  ShieldCheck,
  Zap,
  Bot,
  RefreshCw,
  TrendingUp,
  Lightbulb,
  Activity,
  Eye,
} from 'lucide-react';
import type { ControlDetail } from '../../types/controls';
import { cn } from '../../lib/utils';

interface ControlDetailPanelProps {
  control: ControlDetail | null;
  isLoading: boolean;
  onClose: () => void;
  onEdit: () => void;
  onMappingChange?: () => void;
}

function DetailSection({
  title,
  children,
  action
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="py-4 border-b last:border-b-0">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        {action}
      </div>
      {children}
    </div>
  );
}

function MetadataItem({
  icon: Icon,
  label,
  value,
  valueClassName
}: {
  icon: React.ElementType;
  label: string;
  value: string | React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="p-1.5 rounded-md bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn("text-sm font-medium mt-0.5", valueClassName)}>{value}</p>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-6 w-24" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
    </div>
  );
}

// Remediation guidance based on source and verification details
function RemediationGuidance({
  source,
  details
}: {
  source: string | null | undefined;
  details: { reason?: string; metrics?: Record<string, unknown> } | null | undefined;
}) {
  // Generate remediation steps based on the source and what failed
  const getRemediationSteps = (): string[] => {
    const reason = details?.reason?.toLowerCase() || '';
    const metrics = details?.metrics || {};

    // AWS-specific remediation
    if (source === 'aws-iam' || source === 'aws') {
      if (reason.includes('mfa') || metrics.mfaEnabled === false) {
        return [
          'Enable MFA for all IAM users in AWS Console',
          'Go to IAM → Users → Select user → Security credentials',
          'Click "Assign MFA device" and follow the setup wizard',
          'Use a virtual MFA app like Google Authenticator or Authy'
        ];
      }
      if (reason.includes('password policy') || reason.includes('password')) {
        return [
          'Update the IAM password policy in AWS Console',
          'Go to IAM → Account settings → Password policy',
          'Set minimum length to 14+ characters',
          'Require uppercase, lowercase, numbers, and symbols',
          'Enable password expiration (90 days recommended)'
        ];
      }
      if (reason.includes('root') || reason.includes('access key')) {
        return [
          'Remove root account access keys',
          'Go to IAM → Security credentials (as root)',
          'Delete any active access keys for root',
          'Use IAM users with appropriate permissions instead'
        ];
      }
      if (reason.includes('cloudtrail') || reason.includes('logging')) {
        return [
          'Enable CloudTrail for all regions',
          'Go to CloudTrail → Create trail',
          'Enable "Apply trail to all regions"',
          'Configure S3 bucket for log storage',
          'Enable log file validation'
        ];
      }
      if (reason.includes('s3') || reason.includes('encryption') || reason.includes('bucket')) {
        return [
          'Enable default encryption on S3 buckets',
          'Go to S3 → Select bucket → Properties',
          'Enable "Default encryption" with SSE-S3 or SSE-KMS',
          'Block public access at bucket or account level'
        ];
      }
    }

    // GitHub-specific remediation
    if (source === 'github') {
      if (reason.includes('branch protection')) {
        return [
          'Enable branch protection on main/master branch',
          'Go to Repository → Settings → Branches',
          'Add branch protection rule for "main"',
          'Require pull request reviews before merging',
          'Require status checks to pass'
        ];
      }
      if (reason.includes('2fa') || reason.includes('mfa')) {
        return [
          'Enable 2FA for all organization members',
          'Go to Organization → Settings → Security',
          'Enable "Require two-factor authentication"',
          'Members without 2FA will be removed from the org'
        ];
      }
    }

    // Google Workspace remediation
    if (source === 'google-workspace' || source === 'gsuite') {
      if (reason.includes('2fa') || reason.includes('mfa') || reason.includes('2-step')) {
        return [
          'Enforce 2-Step Verification for all users',
          'Go to Admin Console → Security → 2-Step Verification',
          'Set enforcement to "On" for all organizational units',
          'Allow users to set up their 2FA method'
        ];
      }
    }

    // Generic remediation if no specific match
    return [
      'Review the failed verification details above',
      'Check your security configuration in the relevant system',
      'Implement the required security controls',
      'Re-run the integration sync to verify the fix'
    ];
  };

  const steps = getRemediationSteps();

  return (
    <ol className="list-decimal list-inside space-y-1.5 text-sm text-red-800">
      {steps.map((step, index) => (
        <li key={index} className="leading-relaxed">{step}</li>
      ))}
    </ol>
  );
}

export function ControlDetailPanel({ control, isLoading, onClose, onEdit, onMappingChange }: ControlDetailPanelProps) {
  const [isMappingDialogOpen, setIsMappingDialogOpen] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { addMapping, removeMapping, isLoading: isMutating } = useControlMutations();
  const { health, isLoading: isLoadingHealth, markReviewed, refreshHealth } = useControlHealth(control?.id || null);

  if (!control && !isLoading) {
    return null;
  }

  // Mark as reviewed - updates lastReviewedAt and grants Review points
  const handleMarkReviewed = async () => {
    setIsReviewing(true);
    try {
      await markReviewed();
      toast.success('Control marked as reviewed', {
        description: 'Review date updated and health score recalculated.',
      });
    } catch {
      toast.error('Failed to mark as reviewed', {
        description: 'Could not update review status. Please try again.',
      });
    } finally {
      setIsReviewing(false);
    }
  };

  // Refresh health score without updating review date
  const handleRefreshHealth = async () => {
    setIsRefreshing(true);
    try {
      await refreshHealth();
      toast.success('Health score refreshed', {
        description: 'Score recalculated based on current data.',
      });
    } catch {
      toast.error('Refresh failed', {
        description: 'Could not refresh health score. Please try again.',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Get score color based on value
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 border-green-200';
    if (score >= 60) return 'bg-blue-100 border-blue-200';
    if (score >= 40) return 'bg-yellow-100 border-yellow-200';
    return 'bg-red-100 border-red-200';
  };

  return (
    <div className="w-[420px] h-full border-l bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <h2 className="text-sm font-semibold text-muted-foreground">Control Details</h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="h-8 px-2"
          >
            <Edit2 className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <LoadingSkeleton />
        ) : control ? (
          <div className="p-4">
            {/* Control Header */}
            <div className="mb-6">
              {control.code && (
                <p className="text-xs font-mono text-muted-foreground mb-1">{control.code}</p>
              )}
              <h3 className="text-xl font-semibold mb-3">{control.name}</h3>
              <div className="flex items-center gap-2 flex-wrap">
                <ControlStatusBadge status={control.implementationStatus} />
                <VerificationStatusBadge status={control.verificationStatus} showIcon />
                {control.riskLevel && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      control.riskLevel === 'critical' && "border-red-300 text-red-700 bg-red-50",
                      control.riskLevel === 'high' && "border-orange-300 text-orange-700 bg-orange-50",
                      control.riskLevel === 'medium' && "border-yellow-300 text-yellow-700 bg-yellow-50",
                      control.riskLevel === 'low' && "border-green-300 text-green-700 bg-green-50"
                    )}
                  >
                    {control.riskLevel.charAt(0).toUpperCase() + control.riskLevel.slice(1)} Risk
                  </Badge>
                )}
              </div>
            </div>

            {/* Health Score */}
            <div className={cn(
              "rounded-lg p-4 mb-6 border",
              health ? getScoreBgColor(health.overallScore) : "bg-muted/50"
            )}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Health Score</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefreshHealth}
                    disabled={isRefreshing || isLoadingHealth}
                    className="h-7 px-2 text-xs"
                    title="Refresh score without updating review date"
                  >
                    <RefreshCw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMarkReviewed}
                    disabled={isReviewing || isLoadingHealth}
                    className="h-7 px-2 text-xs"
                    title="Mark as reviewed (updates review date, grants 15 Review points)"
                  >
                    <Eye className={cn("h-3 w-3 mr-1", isReviewing && "animate-pulse")} />
                    {isReviewing ? 'Reviewing...' : 'Mark Reviewed'}
                  </Button>
                </div>
              </div>

              {isLoadingHealth ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-20" />
                  <Skeleton className="h-2 w-full" />
                </div>
              ) : health ? (
                <>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className={cn("text-4xl font-bold", getScoreColor(health.overallScore))}>
                      {health.overallScore}
                    </span>
                    <span className="text-sm text-muted-foreground">/ 100</span>
                  </div>

                  {/* Score Breakdown */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Verification</span>
                      <span className="font-medium">{health.factors.verificationScore}/40</span>
                    </div>
                    <Progress value={(health.factors.verificationScore / 40) * 100} className="h-1" />

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Freshness</span>
                      <span className="font-medium">{health.factors.freshnessScore}/25</span>
                    </div>
                    <Progress value={(health.factors.freshnessScore / 25) * 100} className="h-1" />

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Coverage</span>
                      <span className="font-medium">{health.factors.coverageScore}/20</span>
                    </div>
                    <Progress value={(health.factors.coverageScore / 20) * 100} className="h-1" />

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Review</span>
                      <span className="font-medium">{health.factors.reviewScore}/15</span>
                    </div>
                    <Progress value={(health.factors.reviewScore / 15) * 100} className="h-1" />
                  </div>

                  {/* Recommendations */}
                  {health.factors.recommendations.length > 0 && (
                    <div className="border-t pt-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                        <span className="text-xs font-medium text-muted-foreground">Recommendations</span>
                      </div>
                      <ul className="space-y-1">
                        {health.factors.recommendations.slice(0, 3).map((rec, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <TrendingUp className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground/60" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-2">No health data available</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshHealth}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={cn("h-3 w-3 mr-1", isRefreshing && "animate-spin")} />
                    Calculate Health Score
                  </Button>
                </div>
              )}
            </div>

            {/* Description */}
            {control.description && (
              <DetailSection title="Description">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {control.description}
                </p>
              </DetailSection>
            )}

            {/* Implementation Notes */}
            {control.implementationNotes && (
              <DetailSection title="Implementation Notes">
                <div className="bg-blue-50 border border-blue-100 rounded-md p-3">
                  <p className="text-sm text-blue-800">{control.implementationNotes}</p>
                </div>
              </DetailSection>
            )}

            {/* Automation Status */}
            {control.isAutomated && (
              <DetailSection title="Automation Status">
                <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-md bg-violet-100">
                      <Bot className="h-4 w-4 text-violet-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-violet-900">Automated Control</span>
                        <Badge variant="secondary" className="bg-violet-100 text-violet-700 text-xs">
                          <Zap className="h-3 w-3 mr-1" />
                          Auto-verified
                        </Badge>
                      </div>
                      <p className="text-xs text-violet-600 mt-0.5">
                        Status managed by integration
                      </p>
                    </div>
                  </div>

                  {control.automationSource && (
                    <div className="flex items-center gap-2 text-sm mb-2">
                      <span className="text-violet-600">Source:</span>
                      <Badge variant="outline" className="text-xs capitalize">
                        {control.automationSource}
                      </Badge>
                    </div>
                  )}

                  {control.verificationDetails && (
                    <div className="space-y-2 pt-2 border-t border-violet-200">
                      {control.verificationDetails.confidence && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-violet-600">Confidence:</span>
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-xs",
                              control.verificationDetails.confidence === 'high' && "bg-green-100 text-green-700",
                              control.verificationDetails.confidence === 'medium' && "bg-yellow-100 text-yellow-700",
                              control.verificationDetails.confidence === 'low' && "bg-orange-100 text-orange-700"
                            )}
                          >
                            {control.verificationDetails.confidence}
                          </Badge>
                        </div>
                      )}
                      {control.verificationDetails.reason && (
                        <div className="text-sm">
                          <span className="text-violet-600">Finding: </span>
                          <span className="text-violet-900">{control.verificationDetails.reason}</span>
                        </div>
                      )}
                      {control.verificationDetails.metrics && Object.keys(control.verificationDetails.metrics).length > 0 && (
                        <div className="mt-2 pt-2 border-t border-violet-200">
                          <p className="text-xs text-violet-600 mb-1.5">Metrics:</p>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(control.verificationDetails.metrics).map(([key, value]) => (
                              <div key={key} className="bg-white/60 rounded px-2 py-1">
                                <p className="text-xs text-violet-500 capitalize">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}
                                </p>
                                <p className="text-sm font-medium text-violet-900">
                                  {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </DetailSection>
            )}

            {/* Remediation Guidance for Failed Controls */}
            {control.verificationStatus === 'failed' && (
              <DetailSection title="Remediation Required">
                <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-md bg-red-100">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-red-900">Action Required</span>
                      <p className="text-xs text-red-600 mt-0.5">
                        This control failed automated verification
                      </p>
                    </div>
                  </div>

                  {control.verificationDetails?.reason && (
                    <div className="mb-3 p-2 bg-white/60 rounded border border-red-100">
                      <p className="text-xs text-red-600 mb-1">Issue:</p>
                      <p className="text-sm text-red-900">{control.verificationDetails.reason}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-red-700">Remediation Steps:</p>
                    <RemediationGuidance
                      source={control.automationSource || control.verificationSource}
                      details={control.verificationDetails}
                    />
                  </div>
                </div>
              </DetailSection>
            )}

            {/* Metadata */}
            <DetailSection title="Details">
              <div className="space-y-1">
                <MetadataItem
                  icon={User}
                  label="Owner"
                  value={control.ownerId || "Unassigned"}
                  valueClassName={!control.ownerId ? "text-muted-foreground italic" : ""}
                />
                <MetadataItem
                  icon={Calendar}
                  label="Review Frequency"
                  value={`Every ${control.reviewFrequencyDays} days`}
                />
                <MetadataItem
                  icon={Clock}
                  label="Last Reviewed"
                  value={
                    control.lastReviewedAt
                      ? new Date(control.lastReviewedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })
                      : "Never"
                  }
                  valueClassName={!control.lastReviewedAt ? "text-orange-600" : ""}
                />
                <MetadataItem
                  icon={Calendar}
                  label="Next Review"
                  value={
                    control.nextReviewAt
                      ? new Date(control.nextReviewAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })
                      : "Not scheduled"
                  }
                />
                <MetadataItem
                  icon={ShieldCheck}
                  label="Verification Source"
                  value={control.verificationSource || "Not verified by integration"}
                  valueClassName={!control.verificationSource ? "text-muted-foreground italic" : ""}
                />
                {control.verifiedAt && (
                  <MetadataItem
                    icon={CheckCircle2}
                    label="Last Verified"
                    value={new Date(control.verifiedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  />
                )}
              </div>
            </DetailSection>

            {/* Framework Mappings */}
            <DetailSection
              title={`Framework Mappings (${control.frameworkMappings.length})`}
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setIsMappingDialogOpen(true)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              }
            >
              {control.frameworkMappings.length === 0 ? (
                <div className="text-center py-4">
                  <Link2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No framework mappings</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Link this control to framework requirements
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => setIsMappingDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Mapping
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {control.frameworkMappings.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors group"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs font-medium">
                          {m.frameworkCode}
                        </Badge>
                        <span className="font-mono text-sm">{m.requirementCode}</span>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "ml-auto text-xs",
                            m.coverage === 'full' && "bg-green-100 text-green-700",
                            m.coverage === 'partial' && "bg-yellow-100 text-yellow-700",
                            m.coverage === 'minimal' && "bg-orange-100 text-orange-700"
                          )}
                        >
                          {m.coverage}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-600"
                          disabled={isMutating}
                          onClick={async (e) => {
                            e.stopPropagation();
                            await removeMapping(control.id, m.id);
                            onMappingChange?.();
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-sm font-medium">{m.requirementName}</p>
                      {m.requirementDescription && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {m.requirementDescription}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </DetailSection>

            {/* Evidence */}
            <DetailSection
              title={`Evidence (${control.evidence.length})`}
              action={
                <Button variant="ghost" size="sm" className="h-7 text-xs">
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              }
            >
              {control.evidence.length === 0 ? (
                <div className="text-center py-4 border-2 border-dashed rounded-lg">
                  <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No evidence attached</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload documents or connect integrations
                  </p>
                  <Button variant="outline" size="sm" className="mt-3">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Evidence
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {control.evidence.map((e) => (
                    <div
                      key={e.id}
                      className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer group"
                    >
                      <div className="p-2 bg-background rounded-md">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{e.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {e.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {e.source}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Added {new Date(e.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </div>
              )}
            </DetailSection>

            {/* Timestamps */}
            <div className="pt-4 text-xs text-muted-foreground space-y-1">
              <p>Created: {new Date(control.createdAt).toLocaleString()}</p>
              <p>Last updated: {new Date(control.updatedAt).toLocaleString()}</p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Framework Mapping Dialog */}
      {control && (
        <FrameworkMappingDialog
          open={isMappingDialogOpen}
          onOpenChange={setIsMappingDialogOpen}
          controlId={control.id}
          controlName={control.name}
          existingMappings={control.frameworkMappings}
          onAddMapping={addMapping}
          onSuccess={onMappingChange}
        />
      )}
    </div>
  );
}
