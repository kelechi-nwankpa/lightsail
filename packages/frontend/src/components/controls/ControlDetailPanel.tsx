import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { ControlStatusBadge } from './ControlStatusBadge';
import type { ControlDetail } from '../../types/controls';

interface ControlDetailPanelProps {
  control: ControlDetail | null;
  isLoading: boolean;
  onClose: () => void;
  onEdit: () => void;
}

export function ControlDetailPanel({ control, isLoading, onClose, onEdit }: ControlDetailPanelProps) {
  if (!control && !isLoading) {
    return null;
  }

  return (
    <div className="w-[400px] border-l bg-card p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Control Details</h2>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="text-sm text-primary hover:underline"
          >
            Edit
          </button>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : control ? (
        <div className="space-y-6">
          {/* Header */}
          <div>
            {control.code && (
              <p className="text-sm text-muted-foreground font-mono mb-1">{control.code}</p>
            )}
            <h3 className="text-xl font-semibold mb-2">{control.name}</h3>
            <ControlStatusBadge status={control.implementationStatus} />
          </div>

          {/* Description */}
          {control.description && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Description</h4>
              <p className="text-sm">{control.description}</p>
            </div>
          )}

          {/* Implementation Notes */}
          {control.implementationNotes && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Implementation Notes</h4>
              <p className="text-sm bg-muted p-3 rounded-md">{control.implementationNotes}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Risk Level</p>
              <p className="font-medium capitalize">{control.riskLevel || 'Not set'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Review Frequency</p>
              <p className="font-medium">{control.reviewFrequencyDays} days</p>
            </div>
            <div>
              <p className="text-muted-foreground">Last Review</p>
              <p className="font-medium">
                {control.lastReviewedAt
                  ? new Date(control.lastReviewedAt).toLocaleDateString()
                  : 'Never'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Next Review</p>
              <p className="font-medium">
                {control.nextReviewAt
                  ? new Date(control.nextReviewAt).toLocaleDateString()
                  : 'Not scheduled'}
              </p>
            </div>
          </div>

          {/* Framework Mappings */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              Framework Mappings ({control.frameworkMappings.length})
            </h4>
            {control.frameworkMappings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No framework mappings</p>
            ) : (
              <div className="space-y-2">
                {control.frameworkMappings.map((m) => (
                  <div key={m.id} className="p-3 bg-muted rounded-md">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{m.frameworkCode}</Badge>
                      <span className="font-mono text-sm">{m.requirementCode}</span>
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {m.coverage}
                      </Badge>
                    </div>
                    <p className="text-sm">{m.requirementName}</p>
                    {m.requirementDescription && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {m.requirementDescription}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Evidence */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              Evidence ({control.evidence.length})
            </h4>
            {control.evidence.length === 0 ? (
              <p className="text-sm text-muted-foreground">No evidence attached</p>
            ) : (
              <div className="space-y-2">
                {control.evidence.map((e) => (
                  <div key={e.id} className="p-3 bg-muted rounded-md">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{e.title}</span>
                      <Badge variant="outline" className="text-xs">{e.type}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {e.source} • {new Date(e.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Timestamps */}
          <div className="text-xs text-muted-foreground pt-4 border-t">
            <p>Created: {new Date(control.createdAt).toLocaleString()}</p>
            <p>Updated: {new Date(control.updatedAt).toLocaleString()}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
