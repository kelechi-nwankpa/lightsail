import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Plus } from 'lucide-react';
import type { EnabledFramework } from '../../types/controls';

interface FrameworkProgressProps {
  frameworks: EnabledFramework[];
  isLoading?: boolean;
  onEnableClick?: () => void;
}

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="h-2 bg-muted rounded-full overflow-hidden">
      <div
        className="h-full bg-primary transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

export function FrameworkProgress({ frameworks, isLoading, onEnableClick }: FrameworkProgressProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-5 w-24 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-2 bg-muted animate-pulse rounded mb-2" />
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (frameworks.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground mb-4">
            No frameworks enabled yet. Enable a framework to start tracking compliance.
          </p>
          {onEnableClick && (
            <Button onClick={onEnableClick}>
              <Plus className="h-4 w-4 mr-2" />
              Enable Framework
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {frameworks.map((framework) => (
        <Card key={framework.id}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-base">
              <span>{framework.name}</span>
              {framework.version && (
                <Badge variant="outline" className="text-xs font-normal">
                  {framework.version}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressBar progress={framework.progress} />
            <div className="flex justify-between mt-2 text-sm">
              <span className="text-muted-foreground">
                {framework.implementedRequirements} / {framework.totalRequirements} requirements
              </span>
              <span className="font-medium">{framework.progress}%</span>
            </div>
          </CardContent>
        </Card>
      ))}
      {onEnableClick && (
        <Card
          className="border-dashed cursor-pointer hover:border-muted-foreground/50 transition-colors"
          onClick={onEnableClick}
        >
          <CardContent className="py-8 flex flex-col items-center justify-center text-muted-foreground">
            <Plus className="h-8 w-8 mb-2" />
            <span className="text-sm font-medium">Add Framework</span>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
