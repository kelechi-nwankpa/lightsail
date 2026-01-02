import { X, Pencil, Trash2, Shield, Calendar, User } from 'lucide-react';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { Separator } from '../ui/separator';
import { RiskStatusBadge } from './RiskStatusBadge';
import { RiskCategoryBadge } from './RiskCategoryBadge';
import { RiskScoreBadge } from './RiskScoreBadge';
import { format } from 'date-fns';
import type { RiskDetail } from '../../types/risks';
import { RISK_LIKELIHOOD_LABELS, RISK_IMPACT_LABELS } from '../../types/risks';

interface RiskDetailPanelProps {
  risk: RiskDetail | null;
  isLoading: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onUnlinkControl?: (controlId: string) => void;
}

export function RiskDetailPanel({
  risk,
  isLoading,
  onClose,
  onEdit,
  onDelete,
  onUnlinkControl,
}: RiskDetailPanelProps) {
  if (isLoading) {
    return (
      <div className="w-[420px] h-full bg-background border-l overflow-y-auto">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-24" />
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Skeleton className="h-8 w-full mt-4" />
        </div>
        <div className="p-4 space-y-6">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (!risk) {
    return (
      <div className="w-[420px] h-full bg-background border-l flex items-center justify-center">
        <p className="text-muted-foreground">Risk not found</p>
      </div>
    );
  }

  return (
    <div className="w-[420px] h-full bg-background border-l overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b sticky top-0 bg-background z-10">
        <div className="flex items-center justify-between mb-3">
          <RiskCategoryBadge category={risk.category} />
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <h2 className="text-xl font-semibold">{risk.title}</h2>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Status */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Status</h3>
          <RiskStatusBadge status={risk.status} />
        </div>

        {/* Risk Assessment */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Risk Assessment</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg border bg-muted/30">
              <p className="text-xs text-muted-foreground">Likelihood</p>
              <p className="font-medium mt-1">{RISK_LIKELIHOOD_LABELS[risk.likelihood]}</p>
            </div>
            <div className="p-3 rounded-lg border bg-muted/30">
              <p className="text-xs text-muted-foreground">Impact</p>
              <p className="font-medium mt-1">{RISK_IMPACT_LABELS[risk.impact]}</p>
            </div>
            <div className="p-3 rounded-lg border bg-muted/30">
              <p className="text-xs text-muted-foreground">Score</p>
              <div className="mt-1">
                <RiskScoreBadge score={risk.inherentScore} />
              </div>
            </div>
          </div>
          {risk.residualScore && (
            <div className="mt-3 p-3 rounded-lg border bg-green-50 border-green-200">
              <p className="text-xs text-muted-foreground">Residual Score (after controls)</p>
              <div className="mt-1">
                <RiskScoreBadge score={risk.residualScore} />
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Description */}
        {risk.description && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
            <p className="text-sm whitespace-pre-wrap">{risk.description}</p>
          </div>
        )}

        {/* Mitigation Plan */}
        {risk.mitigationPlan && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Mitigation Plan</h3>
            <p className="text-sm whitespace-pre-wrap">{risk.mitigationPlan}</p>
          </div>
        )}

        {/* Acceptance Notes */}
        {risk.acceptanceNotes && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Acceptance Notes</h3>
            <p className="text-sm whitespace-pre-wrap">{risk.acceptanceNotes}</p>
          </div>
        )}

        <Separator />

        {/* Details */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Details</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Owner:</span>
              <span>{risk.owner?.name || 'Unassigned'}</span>
            </div>
            {risk.dueDate && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Due Date:</span>
                <span>{format(new Date(risk.dueDate), 'MMM d, yyyy')}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Created:</span>
              <span>{format(new Date(risk.createdAt), 'MMM d, yyyy')}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Linked Controls */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-muted-foreground">Linked Controls</h3>
            <span className="text-xs text-muted-foreground">{risk.linkedControls.length} controls</span>
          </div>
          {risk.linkedControls.length === 0 ? (
            <p className="text-sm text-muted-foreground">No controls linked to this risk.</p>
          ) : (
            <div className="space-y-2">
              {risk.linkedControls.map((control) => (
                <div
                  key={control.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                >
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {control.code ? `${control.code}: ` : ''}{control.name}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {control.effectiveness} effectiveness
                      </p>
                    </div>
                  </div>
                  {onUnlinkControl && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onUnlinkControl(control.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t sticky bottom-0 bg-background">
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex-1" onClick={onEdit}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" size="icon" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
