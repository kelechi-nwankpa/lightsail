import { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { Progress } from '../ui/progress';
import { ControlStatusBadge } from './ControlStatusBadge';
import { VerificationStatusBadge } from './VerificationStatusBadge';
import { FrameworkMappingDialog } from '../frameworks/FrameworkMappingDialog';
import { useControlMutations } from '../../hooks/use-controls';
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
  ShieldCheck
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

export function ControlDetailPanel({ control, isLoading, onClose, onEdit, onMappingChange }: ControlDetailPanelProps) {
  const [isMappingDialogOpen, setIsMappingDialogOpen] = useState(false);
  const { addMapping, removeMapping, isLoading: isMutating } = useControlMutations();

  if (!control && !isLoading) {
    return null;
  }

  // Calculate completion metrics
  const hasEvidence = control?.evidence && control.evidence.length > 0;
  const hasMappings = control?.frameworkMappings && control.frameworkMappings.length > 0;
  const isImplemented = control?.implementationStatus === 'implemented';
  const completionItems = [hasEvidence, hasMappings, isImplemented].filter(Boolean).length;
  const completionPercent = Math.round((completionItems / 3) * 100);

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

            {/* Completion Progress */}
            <div className="bg-muted/50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Completion</span>
                <span className="text-sm text-muted-foreground">{completionPercent}%</span>
              </div>
              <Progress value={completionPercent} className="h-2 mb-3" />
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm">
                  {isImplemented ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className={isImplemented ? "text-green-700" : "text-muted-foreground"}>
                    Implementation status
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {hasEvidence ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                  )}
                  <span className={hasEvidence ? "text-green-700" : "text-orange-600"}>
                    {hasEvidence ? "Evidence attached" : "Evidence required"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {hasMappings ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className={hasMappings ? "text-green-700" : "text-muted-foreground"}>
                    Framework mappings
                  </span>
                </div>
              </div>
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
