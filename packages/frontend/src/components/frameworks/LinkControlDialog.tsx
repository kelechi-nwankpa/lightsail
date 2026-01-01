import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Search, Shield, CheckCircle2, Plus, Link2 } from 'lucide-react';
import { useControls } from '../../hooks/use-controls';
import { api } from '../../lib/api';
import { cn } from '../../lib/utils';
import type { ControlListItem } from '../../types/controls';
import type { FrameworkRequirementNode } from '../../types/frameworks';
import type { ControlStatus, CoverageLevel } from '@lightsail/shared';

interface LinkControlDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requirement: FrameworkRequirementNode | null;
  frameworkName: string;
  onSuccess?: () => void;
}

const statusConfig: Record<ControlStatus, { label: string; color: string }> = {
  not_started: { label: 'Not Started', color: 'text-gray-500' },
  in_progress: { label: 'In Progress', color: 'text-blue-600' },
  implemented: { label: 'Implemented', color: 'text-green-600' },
  not_applicable: { label: 'N/A', color: 'text-gray-400' },
};

export function LinkControlDialog({
  open,
  onOpenChange,
  requirement,
  frameworkName,
  onSuccess,
}: LinkControlDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedControlId, setSelectedControlId] = useState<string | null>(null);
  const [coverage, setCoverage] = useState<CoverageLevel>('full');
  const [isLinking, setIsLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { controls, isLoading } = useControls({
    search: searchQuery || undefined,
    pageSize: 50,
  });

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setSelectedControlId(null);
      setCoverage('full');
      setError(null);
    }
  }, [open]);

  const handleLinkControl = async () => {
    if (!selectedControlId || !requirement) return;

    setIsLinking(true);
    setError(null);

    try {
      await api.post(`/controls/${selectedControlId}/mappings`, {
        requirementId: requirement.id,
        coverage,
      });
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to link control:', err);
      setError(err instanceof Error ? err.message : 'Failed to link control');
      toast.error('Failed to link control', {
        description: 'Please try again later.',
      });
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Link Control to Requirement
          </DialogTitle>
          <DialogDescription>
            Select an existing control to map to this requirement, or create a new one.
          </DialogDescription>
        </DialogHeader>

        {/* Requirement Info */}
        {requirement && (
          <div className="p-3 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono bg-primary/20 text-primary px-2 py-0.5 rounded">
                {requirement.code}
              </span>
              <span className="text-xs text-muted-foreground">{frameworkName}</span>
            </div>
            <p className="text-sm font-medium">{requirement.name}</p>
          </div>
        )}

        {/* Search Controls */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Search Controls</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Controls List */}
          <div className="space-y-2">
            <Label>Select Control</Label>
            <div className="border rounded-lg max-h-48 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Loading controls...
                </div>
              ) : controls.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No controls found</p>
                  {searchQuery && (
                    <p className="text-xs mt-1">Try a different search term</p>
                  )}
                </div>
              ) : (
                <div className="divide-y">
                  {controls.map((control) => (
                    <ControlItem
                      key={control.id}
                      control={control}
                      isSelected={selectedControlId === control.id}
                      onSelect={() => setSelectedControlId(control.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Coverage Selection */}
          {selectedControlId && (
            <div className="space-y-2">
              <Label>Coverage Level</Label>
              <Select value={coverage} onValueChange={(v) => setCoverage(v as CoverageLevel)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full - Control fully addresses requirement</SelectItem>
                  <SelectItem value="partial">Partial - Control partially addresses requirement</SelectItem>
                  <SelectItem value="minimal">Minimal - Control minimally addresses requirement</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onOpenChange(false);
              // Could open create control dialog here
              window.location.href = `/controls?createFor=${requirement?.id}`;
            }}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Create New Control
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleLinkControl}
              disabled={!selectedControlId || isLinking}
            >
              {isLinking ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Linking...
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4 mr-1.5" />
                  Link Control
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ControlItem({
  control,
  isSelected,
  onSelect,
}: {
  control: ControlListItem;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const status = statusConfig[control.implementationStatus];

  return (
    <button
      className={cn(
        'w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors',
        isSelected && 'bg-primary/10'
      )}
      onClick={onSelect}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'w-5 h-5 rounded-full border-2 flex items-center justify-center',
            isSelected
              ? 'border-primary bg-primary'
              : 'border-muted-foreground/30'
          )}
        >
          {isSelected && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {control.code && (
              <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                {control.code}
              </span>
            )}
            <span className="text-sm font-medium truncate">{control.name}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={cn('text-xs', status.color)}>{status.label}</span>
            {control.frameworkMappings.length > 0 && (
              <span className="text-xs text-muted-foreground">
                • {control.frameworkMappings.length} mapping{control.frameworkMappings.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
