import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Skeleton } from '../ui/skeleton';
import { RiskStatusBadge } from './RiskStatusBadge';
import { RiskCategoryBadge } from './RiskCategoryBadge';
import { RiskScoreBadge } from './RiskScoreBadge';
import { cn } from '../../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import type { RiskListItem } from '../../types/risks';
import { RISK_LIKELIHOOD_LABELS, RISK_IMPACT_LABELS } from '../../types/risks';

interface RiskTableProps {
  risks: RiskListItem[];
  isLoading: boolean;
  onSelect: (risk: RiskListItem) => void;
  selectedId?: string;
}

export function RiskTable({ risks, isLoading, onSelect, selectedId }: RiskTableProps) {
  if (isLoading) {
    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Risk</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Likelihood</TableHead>
              <TableHead>Impact</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Controls</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (risks.length === 0) {
    return (
      <div className="border rounded-lg p-12 text-center">
        <p className="text-muted-foreground">No risks found</p>
        <p className="text-sm text-muted-foreground mt-1">
          Add a risk to start tracking and managing risk
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Risk</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Likelihood</TableHead>
            <TableHead>Impact</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Controls</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {risks.map((risk) => (
            <TableRow
              key={risk.id}
              className={cn(
                'cursor-pointer transition-colors hover:bg-muted/50',
                selectedId === risk.id && 'bg-muted'
              )}
              onClick={() => onSelect(risk)}
            >
              <TableCell>
                <div>
                  <p className="font-medium">{risk.title}</p>
                  {risk.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {risk.description}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <RiskCategoryBadge category={risk.category} />
              </TableCell>
              <TableCell>
                <RiskStatusBadge status={risk.status} />
              </TableCell>
              <TableCell>
                <span className="text-sm">
                  {RISK_LIKELIHOOD_LABELS[risk.likelihood]}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-sm">
                  {RISK_IMPACT_LABELS[risk.impact]}
                </span>
              </TableCell>
              <TableCell>
                <RiskScoreBadge score={risk.inherentScore} />
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {risk.controlCount}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(risk.createdAt), { addSuffix: true })}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
