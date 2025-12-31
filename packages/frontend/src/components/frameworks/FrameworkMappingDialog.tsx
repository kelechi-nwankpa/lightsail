import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Textarea } from '../ui/textarea';
import { useEnabledFrameworks, useFrameworkRequirements } from '../../hooks/use-frameworks';
import { Search, ChevronRight, Check, AlertCircle, Loader2 } from 'lucide-react';
import type { FrameworkRequirementNode, FrameworkMapping } from '../../types/controls';
import { cn } from '../../lib/utils';

interface FrameworkMappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  controlId: string;
  controlName: string;
  existingMappings: FrameworkMapping[];
  onAddMapping: (
    controlId: string,
    requirementId: string,
    coverage: 'full' | 'partial' | 'minimal',
    notes?: string
  ) => Promise<FrameworkMapping>;
  onSuccess?: () => void;
}

function RequirementItem({
  requirement,
  depth = 0,
  isSelected,
  isAlreadyMapped,
  onSelect,
  searchQuery,
}: {
  requirement: FrameworkRequirementNode;
  depth?: number;
  isSelected: boolean;
  isAlreadyMapped: boolean;
  onSelect: (req: FrameworkRequirementNode) => void;
  searchQuery: string;
}) {
  const [isExpanded, setIsExpanded] = useState(depth < 1);
  const hasChildren = requirement.children && requirement.children.length > 0;
  const isLeaf = !hasChildren;

  // Check if this requirement or any children match the search
  const matchesSearch = useMemo(() => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const matches =
      requirement.code.toLowerCase().includes(query) ||
      requirement.name.toLowerCase().includes(query) ||
      (requirement.description?.toLowerCase().includes(query) ?? false);

    if (matches) return true;

    // Check children recursively
    const checkChildren = (children: FrameworkRequirementNode[]): boolean => {
      return children.some(child => {
        const childMatches =
          child.code.toLowerCase().includes(query) ||
          child.name.toLowerCase().includes(query) ||
          (child.description?.toLowerCase().includes(query) ?? false);
        if (childMatches) return true;
        if (child.children) return checkChildren(child.children);
        return false;
      });
    };

    return requirement.children ? checkChildren(requirement.children) : false;
  }, [requirement, searchQuery]);

  if (!matchesSearch) return null;

  return (
    <div>
      <div
        className={cn(
          "flex items-start gap-2 p-2 rounded-md transition-colors",
          isLeaf && !isAlreadyMapped && "cursor-pointer hover:bg-muted",
          isSelected && "bg-primary/10 border border-primary",
          isAlreadyMapped && "opacity-50"
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => {
          if (hasChildren) {
            setIsExpanded(!isExpanded);
          } else if (!isAlreadyMapped) {
            onSelect(requirement);
          }
        }}
      >
        {hasChildren && (
          <ChevronRight
            className={cn(
              "h-4 w-4 mt-0.5 text-muted-foreground transition-transform shrink-0",
              isExpanded && "rotate-90"
            )}
          />
        )}
        {!hasChildren && (
          <div className={cn(
            "h-4 w-4 mt-0.5 shrink-0 border rounded flex items-center justify-center",
            isSelected && "bg-primary border-primary",
            isAlreadyMapped && "bg-muted border-muted-foreground/30"
          )}>
            {(isSelected || isAlreadyMapped) && (
              <Check className="h-3 w-3 text-white" />
            )}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">
              {requirement.code}
            </span>
            {isAlreadyMapped && (
              <Badge variant="secondary" className="text-xs">
                Already mapped
              </Badge>
            )}
          </div>
          <p className={cn(
            "text-sm font-medium",
            !isLeaf && "text-muted-foreground"
          )}>
            {requirement.name}
          </p>
          {requirement.description && isLeaf && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {requirement.description}
            </p>
          )}
        </div>
      </div>
      {hasChildren && isExpanded && (
        <div>
          {requirement.children!.map((child) => (
            <RequirementItem
              key={child.id}
              requirement={child}
              depth={depth + 1}
              isSelected={isSelected}
              isAlreadyMapped={isAlreadyMapped}
              onSelect={onSelect}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RequirementsList({
  requirements,
  isLoading,
  selectedRequirement,
  existingMappingIds,
  onSelect,
  searchQuery,
}: {
  requirements: FrameworkRequirementNode[];
  isLoading: boolean;
  selectedRequirement: FrameworkRequirementNode | null;
  existingMappingIds: Set<string>;
  onSelect: (req: FrameworkRequirementNode) => void;
  searchQuery: string;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-start gap-2 p-2">
            <Skeleton className="h-4 w-4 shrink-0" />
            <div className="flex-1">
              <Skeleton className="h-3 w-16 mb-1" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (requirements.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No requirements found</p>
        <p className="text-xs">Select a framework to view its requirements</p>
      </div>
    );
  }

  // Build hierarchical structure from flat list
  const buildTree = (reqs: FrameworkRequirementNode[]): FrameworkRequirementNode[] => {
    const map = new Map<string, FrameworkRequirementNode>();
    const roots: FrameworkRequirementNode[] = [];

    // First pass: create all nodes
    reqs.forEach((req) => {
      map.set(req.id, { ...req, children: [] });
    });

    // Second pass: build tree
    reqs.forEach((req) => {
      const node = map.get(req.id)!;
      if (req.parentId && map.has(req.parentId)) {
        map.get(req.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const tree = buildTree(requirements);

  return (
    <div className="space-y-1">
      {tree.map((req) => (
        <RequirementItem
          key={req.id}
          requirement={req}
          isSelected={selectedRequirement?.id === req.id}
          isAlreadyMapped={existingMappingIds.has(req.id)}
          onSelect={onSelect}
          searchQuery={searchQuery}
        />
      ))}
    </div>
  );
}

export function FrameworkMappingDialog({
  open,
  onOpenChange,
  controlId,
  controlName,
  existingMappings,
  onAddMapping,
  onSuccess,
}: FrameworkMappingDialogProps) {
  const { enabledFrameworks } = useEnabledFrameworks();
  const [selectedFrameworkId, setSelectedFrameworkId] = useState<string | null>(null);
  const { requirements, isLoading: isLoadingRequirements } = useFrameworkRequirements(selectedFrameworkId);

  const [selectedRequirement, setSelectedRequirement] = useState<FrameworkRequirementNode | null>(null);
  const [coverage, setCoverage] = useState<'full' | 'partial' | 'minimal'>('full');
  const [notes, setNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get existing mapping requirement IDs for the selected framework
  const existingMappingIds = useMemo(() => {
    return new Set(
      existingMappings
        .filter((m) => m.frameworkId === selectedFrameworkId)
        .map((m) => m.requirementId)
    );
  }, [existingMappings, selectedFrameworkId]);

  const handleSubmit = async () => {
    if (!selectedRequirement) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await onAddMapping(controlId, selectedRequirement.id, coverage, notes || undefined);
      onSuccess?.();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add mapping');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedFrameworkId(null);
    setSelectedRequirement(null);
    setCoverage('full');
    setNotes('');
    setSearchQuery('');
    setError(null);
    onOpenChange(false);
  };

  const selectedFramework = enabledFrameworks.find((f) => f.frameworkId === selectedFrameworkId);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Framework Mapping</DialogTitle>
          <DialogDescription>
            Map "{controlName}" to a framework requirement
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4 py-4">
          {/* Framework Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Framework</label>
            <Select
              value={selectedFrameworkId || ''}
              onValueChange={(value) => {
                setSelectedFrameworkId(value);
                setSelectedRequirement(null);
                setSearchQuery('');
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a framework..." />
              </SelectTrigger>
              <SelectContent>
                {enabledFrameworks.map((framework) => (
                  <SelectItem key={framework.frameworkId} value={framework.frameworkId}>
                    <div className="flex items-center gap-2">
                      <span>{framework.name}</span>
                      {framework.version && (
                        <Badge variant="outline" className="text-xs">
                          {framework.version}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Requirements Search & List */}
          {selectedFrameworkId && (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search requirements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="flex-1 overflow-y-auto border rounded-md p-2 min-h-[200px] max-h-[300px]">
                <RequirementsList
                  requirements={requirements}
                  isLoading={isLoadingRequirements}
                  selectedRequirement={selectedRequirement}
                  existingMappingIds={existingMappingIds}
                  onSelect={setSelectedRequirement}
                  searchQuery={searchQuery}
                />
              </div>
            </>
          )}

          {/* Selected Requirement Details */}
          {selectedRequirement && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline">{selectedFramework?.code}</Badge>
                  <span className="font-mono text-sm">{selectedRequirement.code}</span>
                </div>
                <p className="font-medium">{selectedRequirement.name}</p>
                {selectedRequirement.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedRequirement.description}
                  </p>
                )}
              </div>

              {/* Coverage Level */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Coverage Level</label>
                <Select value={coverage} onValueChange={(v) => setCoverage(v as typeof coverage)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <span>Full</span>
                        <span className="text-muted-foreground">- Completely addresses the requirement</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="partial">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-yellow-500" />
                        <span>Partial</span>
                        <span className="text-muted-foreground">- Addresses some aspects</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="minimal">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-orange-500" />
                        <span>Minimal</span>
                        <span className="text-muted-foreground">- Minimal coverage</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes (optional)</label>
                <Textarea
                  placeholder="Add any notes about how this control addresses the requirement..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedRequirement || isSubmitting}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Add Mapping
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
