import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { CheckCircle2 } from 'lucide-react';
import type { FrameworkListItem } from '../../types/controls';

interface EnableFrameworkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  frameworks: FrameworkListItem[];
  enabledFrameworkIds: string[];
  onEnable: (frameworkId: string) => Promise<unknown>;
  isLoading?: boolean;
}

export function EnableFrameworkDialog({
  open,
  onOpenChange,
  frameworks,
  enabledFrameworkIds,
  onEnable,
  isLoading,
}: EnableFrameworkDialogProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isEnabling, setIsEnabling] = useState(false);

  const handleEnable = async () => {
    if (!selectedId) return;

    setIsEnabling(true);
    try {
      await onEnable(selectedId);
      setSelectedId(null);
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to enable framework:', err);
    } finally {
      setIsEnabling(false);
    }
  };

  const availableFrameworks = frameworks.filter(
    (f) => !enabledFrameworkIds.includes(f.id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Enable Framework</DialogTitle>
          <DialogDescription>
            Select a compliance framework to track. This will add all framework requirements to your compliance program.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : availableFrameworks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
              <p>All available frameworks have been enabled!</p>
            </div>
          ) : (
            availableFrameworks.map((framework) => (
              <Card
                key={framework.id}
                className={`cursor-pointer transition-colors ${
                  selectedId === framework.id
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'hover:border-muted-foreground/50'
                }`}
                onClick={() => setSelectedId(framework.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{framework.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      {framework.version && (
                        <Badge variant="outline">{framework.version}</Badge>
                      )}
                      <Badge variant="secondary">
                        {framework.requirementCount} requirements
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {framework.description || getFrameworkDescription(framework.code)}
                  </CardDescription>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleEnable}
            disabled={!selectedId || isEnabling || availableFrameworks.length === 0}
          >
            {isEnabling ? 'Enabling...' : 'Enable Framework'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getFrameworkDescription(code: string): string {
  const descriptions: Record<string, string> = {
    'SOC2': 'Service Organization Control 2 - Trust Services Criteria for security, availability, processing integrity, confidentiality, and privacy.',
    'ISO27001': 'International standard for information security management systems (ISMS) with comprehensive controls across 14 domains.',
  };
  return descriptions[code] || 'Compliance framework for security and governance.';
}
