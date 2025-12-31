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
import { ControlStatusBadge } from './ControlStatusBadge';
import type { ControlListItem } from '../../types/controls';

interface ControlsTableProps {
  controls: ControlListItem[];
  isLoading: boolean;
  onSelect: (control: ControlListItem) => void;
  selectedId?: string;
}

function RiskBadge({ level }: { level: string | null }) {
  if (!level) return <span className="text-muted-foreground">-</span>;

  const variants: Record<string, 'destructive' | 'default' | 'secondary' | 'outline'> = {
    critical: 'destructive',
    high: 'destructive',
    medium: 'default',
    low: 'secondary',
  };

  return (
    <Badge variant={variants[level] || 'outline'}>
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </Badge>
  );
}

function LoadingSkeleton() {
  return (
    <>
      {[...Array(5)].map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-48" /></TableCell>
          <TableCell><Skeleton className="h-6 w-24" /></TableCell>
          <TableCell><Skeleton className="h-6 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-8" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function ControlsTable({ controls, isLoading, onSelect, selectedId }: ControlsTableProps) {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            <TableHead className="w-[100px]">Risk</TableHead>
            <TableHead>Frameworks</TableHead>
            <TableHead className="w-[80px] text-center">Evidence</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <LoadingSkeleton />
          ) : controls.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                No controls found. Create your first control to get started.
              </TableCell>
            </TableRow>
          ) : (
            controls.map((control) => (
              <TableRow
                key={control.id}
                className={`cursor-pointer hover:bg-muted/50 ${selectedId === control.id ? 'bg-muted' : ''}`}
                onClick={() => onSelect(control)}
              >
                <TableCell className="font-mono text-sm">
                  {control.code || '-'}
                </TableCell>
                <TableCell className="font-medium">
                  {control.name}
                </TableCell>
                <TableCell>
                  <ControlStatusBadge status={control.implementationStatus} />
                </TableCell>
                <TableCell>
                  <RiskBadge level={control.riskLevel} />
                </TableCell>
                <TableCell>
                  {control.frameworkMappings.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {control.frameworkMappings.slice(0, 3).map((m) => (
                        <Badge key={m.id} variant="outline" className="text-xs">
                          {m.frameworkCode}:{m.requirementCode}
                        </Badge>
                      ))}
                      {control.frameworkMappings.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{control.frameworkMappings.length - 3}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">No mappings</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {control.evidenceCount > 0 ? (
                    <Badge variant="secondary">{control.evidenceCount}</Badge>
                  ) : (
                    <span className="text-muted-foreground">0</span>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
