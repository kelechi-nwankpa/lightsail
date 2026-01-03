import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Skeleton } from '../ui/skeleton';
import { Checkbox } from '../ui/checkbox';
import { ControlStatusBadge } from './ControlStatusBadge';
import { VerificationStatusBadge } from './VerificationStatusBadge';
import { FileText, ChevronRight, Bot, AlertCircle } from 'lucide-react';
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

function LoadingSkeleton() {
  return (
    <>
      {[...Array(5)].map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-48" /></TableCell>
          <TableCell><Skeleton className="h-6 w-24" /></TableCell>
          <TableCell><Skeleton className="h-6 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-4" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

function EmptyState() {
  return (
    <TableRow>
      <TableCell colSpan={6} className="h-64">
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
    <div className="border rounded-lg bg-card">
      <Table className="table-fixed w-full">
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
            <TableHead className="w-24 font-semibold">Code</TableHead>
            <TableHead className="font-semibold">Name</TableHead>
            <TableHead className="w-28 font-semibold">Status</TableHead>
            <TableHead className="w-24 font-semibold">Verification</TableHead>
            <TableHead className="w-20 font-semibold">Evidence</TableHead>
            <TableHead className="w-8"></TableHead>
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
                <TableCell className="font-mono text-sm text-muted-foreground truncate">
                  {control.code || '—'}
                </TableCell>
                <TableCell className="max-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-medium truncate">{control.name}</span>
                    {control.isAutomated && (
                      <span title={`Auto-verified by ${control.automationSource || 'integration'}`}>
                        <Bot className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                      </span>
                    )}
                  </div>
                  {control.description && (
                    <div className="text-sm text-muted-foreground truncate mt-0.5">
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
                  {control.evidenceCount > 0 ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm font-medium">{control.evidenceCount}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      <span className="text-sm">0</span>
                    </div>
                  )}
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
