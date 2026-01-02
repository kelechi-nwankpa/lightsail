import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { Checkbox } from '../ui/checkbox';
import { ControlStatusBadge } from './ControlStatusBadge';
import { VerificationStatusBadge } from './VerificationStatusBadge';
import { FileText, AlertCircle, ChevronRight } from 'lucide-react';
import type { ControlListItem } from '../../types/controls';
import { cn } from '../../lib/utils';

interface ControlsTableProps {
  controls: ControlListItem[];
  isLoading: boolean;
  onSelect: (control: ControlListItem) => void;
  selectedId?: string;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

function RiskBadge({ level }: { level: string | null }) {
  if (!level) return <span className="text-muted-foreground text-sm">—</span>;

  const config: Record<string, { className: string; label: string }> = {
    critical: { className: 'bg-red-100 text-red-700 border-red-200', label: 'Critical' },
    high: { className: 'bg-orange-100 text-orange-700 border-orange-200', label: 'High' },
    medium: { className: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: 'Medium' },
    low: { className: 'bg-green-100 text-green-700 border-green-200', label: 'Low' },
  };

  const { className, label } = config[level] || { className: 'bg-gray-100 text-gray-700', label: level };

  return (
    <span className={cn('px-2 py-0.5 rounded text-xs font-medium border', className)}>
      {label}
    </span>
  );
}

function EvidenceIndicator({ count }: { count: number }) {
  if (count === 0) {
    return (
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <AlertCircle className="h-4 w-4 text-orange-500" />
        <span className="text-sm">None</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-green-600">
      <FileText className="h-4 w-4" />
      <span className="text-sm font-medium">{count}</span>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <>
      {[...Array(5)].map((_, i) => (
        <TableRow key={i}>
          <TableCell className="w-10">
            <Skeleton className="h-4 w-4" />
          </TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-48" /></TableCell>
          <TableCell><Skeleton className="h-6 w-24" /></TableCell>
          <TableCell><Skeleton className="h-6 w-20" /></TableCell>
          <TableCell><Skeleton className="h-6 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-12" /></TableCell>
          <TableCell><Skeleton className="h-4 w-4" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

function EmptyState() {
  return (
    <TableRow>
      <TableCell colSpan={9} className="h-64">
        <div className="flex flex-col items-center justify-center text-center py-8">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No controls yet</h3>
          <p className="text-muted-foreground max-w-sm mb-4">
            Controls are the security measures you implement to meet compliance requirements.
            Create your first control to get started.
          </p>
          <p className="text-sm text-primary">
            Click "+ New Control" above to create one
          </p>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function ControlsTable({
  controls,
  isLoading,
  onSelect,
  selectedId,
  selectedIds = [],
  onSelectionChange
}: ControlsTableProps) {
  const allSelected = controls.length > 0 && selectedIds.length === controls.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < controls.length;

  const handleSelectAll = () => {
    if (onSelectionChange) {
      if (allSelected) {
        onSelectionChange([]);
      } else {
        onSelectionChange(controls.map(c => c.id));
      }
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (onSelectionChange) {
      if (checked) {
        onSelectionChange([...selectedIds, id]);
      } else {
        onSelectionChange(selectedIds.filter(i => i !== id));
      }
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            {onSelectionChange && (
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  // @ts-ignore - indeterminate is valid but not in types
                  indeterminate={someSelected}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
            )}
            <TableHead className="w-[100px] font-semibold">Code</TableHead>
            <TableHead className="font-semibold">Name</TableHead>
            <TableHead className="w-[130px] font-semibold">Status</TableHead>
            <TableHead className="w-[110px] font-semibold">Verification</TableHead>
            <TableHead className="w-[100px] font-semibold">Risk</TableHead>
            <TableHead className="font-semibold">Frameworks</TableHead>
            <TableHead className="w-[100px] font-semibold">Evidence</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <LoadingSkeleton />
          ) : controls.length === 0 ? (
            <EmptyState />
          ) : (
            controls.map((control) => (
              <TableRow
                key={control.id}
                className={cn(
                  "cursor-pointer transition-colors",
                  selectedId === control.id
                    ? "bg-primary/5 hover:bg-primary/10"
                    : "hover:bg-muted/50"
                )}
                onClick={() => onSelect(control)}
              >
                {onSelectionChange && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.includes(control.id)}
                      onCheckedChange={(checked) => handleSelectOne(control.id, checked as boolean)}
                    />
                  </TableCell>
                )}
                <TableCell className="font-mono text-sm text-muted-foreground">
                  {control.code || '—'}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{control.name}</div>
                  {control.description && (
                    <div className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                      {control.description}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <ControlStatusBadge status={control.implementationStatus} />
                </TableCell>
                <TableCell>
                  <VerificationStatusBadge status={control.verificationStatus} size="sm" />
                </TableCell>
                <TableCell>
                  <RiskBadge level={control.riskLevel} />
                </TableCell>
                <TableCell>
                  {control.frameworkMappings.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {control.frameworkMappings.slice(0, 2).map((m) => (
                        <Badge
                          key={m.id}
                          variant="outline"
                          className="text-xs bg-background"
                        >
                          {m.frameworkCode}
                        </Badge>
                      ))}
                      {control.frameworkMappings.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{control.frameworkMappings.length - 2}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">No mappings</span>
                  )}
                </TableCell>
                <TableCell>
                  <EvidenceIndicator count={control.evidenceCount} />
                </TableCell>
                <TableCell>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
