import { Card, CardContent } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Plus, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import type { EnabledFramework } from '../../types/controls';
import { cn } from '../../lib/utils';

interface FrameworkProgressProps {
  frameworks: EnabledFramework[];
  isLoading?: boolean;
  onEnableClick?: () => void;
  onFrameworkClick?: (framework: EnabledFramework) => void;
  selectedFrameworkId?: string;
}

function FrameworkCard({
  framework,
  isSelected,
  onClick
}: {
  framework: EnabledFramework;
  isSelected?: boolean;
  onClick?: () => void;
}) {
  const isComplete = framework.progress >= 100;
  const needsAttention = framework.progress < 50;

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md hover:border-primary/50",
        isSelected && "ring-2 ring-primary border-primary",
        isComplete && "border-green-200 bg-green-50/30"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-base">{framework.name}</h3>
            {framework.version && (
              <Badge variant="outline" className="text-xs font-normal">
                {framework.version}
              </Badge>
            )}
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Progress bar */}
        <Progress
          value={framework.progress}
          className="h-2 mb-2"
          indicatorClassName={cn(
            framework.progress >= 100 && "bg-green-500",
            framework.progress >= 75 && framework.progress < 100 && "bg-primary",
            framework.progress >= 50 && framework.progress < 75 && "bg-yellow-500",
            framework.progress < 50 && "bg-orange-500"
          )}
        />

        {/* Stats */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {framework.implementedRequirements} / {framework.totalRequirements} requirements
          </span>
          <span className={cn(
            "font-semibold",
            framework.progress >= 100 && "text-green-600",
            framework.progress >= 75 && framework.progress < 100 && "text-primary",
            framework.progress < 75 && "text-muted-foreground"
          )}>
            {framework.progress}%
          </span>
        </div>

        {/* Status indicator */}
        {isComplete ? (
          <div className="flex items-center gap-1.5 mt-3 text-green-600 text-sm">
            <CheckCircle2 className="h-4 w-4" />
            <span>Audit ready</span>
          </div>
        ) : needsAttention ? (
          <div className="flex items-center gap-1.5 mt-3 text-orange-600 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>Needs attention</span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function AddFrameworkCard({ onClick }: { onClick?: () => void }) {
  return (
    <Card
      className="border-dashed cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all"
      onClick={onClick}
    >
      <CardContent className="p-4 h-full flex flex-col items-center justify-center min-h-[120px] text-muted-foreground">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-2">
          <Plus className="h-5 w-5" />
        </div>
        <span className="text-sm font-medium">Add Framework</span>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2].map((i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="h-5 w-24 bg-muted animate-pulse rounded" />
              <div className="h-5 w-12 bg-muted animate-pulse rounded" />
            </div>
            <div className="h-2 bg-muted animate-pulse rounded mb-2" />
            <div className="flex justify-between">
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              <div className="h-4 w-8 bg-muted animate-pulse rounded" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmptyState({ onEnableClick }: { onEnableClick?: () => void }) {
  return (
    <Card className="border-dashed">
      <CardContent className="py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <Plus className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No frameworks enabled</h3>
        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
          Enable a compliance framework to start tracking your security controls and preparing for audits.
        </p>
        {onEnableClick && (
          <button
            onClick={onEnableClick}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Enable Framework
          </button>
        )}
      </CardContent>
    </Card>
  );
}

export function FrameworkProgress({
  frameworks,
  isLoading,
  onEnableClick,
  onFrameworkClick,
  selectedFrameworkId
}: FrameworkProgressProps) {
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (frameworks.length === 0) {
    return <EmptyState onEnableClick={onEnableClick} />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {frameworks.map((framework) => (
        <FrameworkCard
          key={framework.id}
          framework={framework}
          isSelected={selectedFrameworkId === framework.frameworkId}
          onClick={() => onFrameworkClick?.(framework)}
        />
      ))}
      {onEnableClick && <AddFrameworkCard onClick={onEnableClick} />}
    </div>
  );
}
