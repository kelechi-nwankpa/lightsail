import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Target, CheckCircle2, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { FrameworkListItem, EnabledFramework } from '../../types/frameworks';

interface FrameworkCardProps {
  framework: FrameworkListItem;
  enabledFramework?: EnabledFramework;
  onEnable: (frameworkId: string) => void;
  onView: (frameworkId: string) => void;
  isEnabling?: boolean;
}

const frameworkIcons: Record<string, string> = {
  SOC2: 'SOC 2',
  ISO27001: 'ISO',
  GDPR: 'GDPR',
  NDPR: 'NDPR',
};

export function FrameworkCard({
  framework,
  enabledFramework,
  onEnable,
  onView,
  isEnabling,
}: FrameworkCardProps) {
  const isEnabled = !!enabledFramework;
  const progress = enabledFramework?.progress || 0;
  const implemented = enabledFramework?.implementedRequirements || 0;
  const total = enabledFramework?.totalRequirements || framework.requirementCount;

  return (
    <Card
      className={cn(
        'transition-all hover:shadow-md',
        isEnabled ? 'border-primary/50 bg-primary/5' : 'hover:border-primary/30'
      )}
    >
      <CardContent className="p-5">
        {/* Header with icon and title */}
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center font-bold text-sm',
              isEnabled
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {frameworkIcons[framework.code] || framework.code.substring(0, 4)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">
                {framework.name}
              </h3>
              {framework.version && (
                <span className="text-xs text-muted-foreground">
                  v{framework.version}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {framework.description}
            </p>
          </div>
        </div>

        {/* Progress section for enabled frameworks */}
        {isEnabled ? (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold text-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                {implemented} implemented
              </span>
              <span>{total} requirements</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              onClick={() => onView(framework.id)}
            >
              <Target className="h-4 w-4 mr-2" />
              View Requirements
              <ChevronRight className="h-4 w-4 ml-auto" />
            </Button>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Target className="h-4 w-4" />
              <span>{framework.requirementCount} requirements</span>
            </div>
            <Button
              size="sm"
              className="w-full"
              onClick={() => onEnable(framework.id)}
              disabled={isEnabling}
            >
              {isEnabling ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Enabling...
                </>
              ) : (
                'Enable Framework'
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
