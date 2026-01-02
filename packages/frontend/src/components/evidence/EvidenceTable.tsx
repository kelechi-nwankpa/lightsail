import { formatDistanceToNow, isAfter, isBefore } from 'date-fns';
import { FileCheck, Link2, AlertTriangle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { EvidenceTypeBadge } from './EvidenceTypeBadge';
import { EvidenceStatusBadge } from './EvidenceStatusBadge';
import { ProvisionalBadge } from './ProvisionalBadge';
import { cn } from '../../lib/utils';
import type { EvidenceListItem } from '../../types/evidence';
import type { EvidenceType, ReviewStatus } from '@lightsail/shared';

interface EvidenceTableProps {
  evidence: EvidenceListItem[];
  isLoading: boolean;
  onSelect: (evidence: EvidenceListItem) => void;
  selectedId?: string;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isExpired(validUntil: string | null): boolean {
  if (!validUntil) return false;
  return isBefore(new Date(validUntil), new Date());
}

function isNotYetValid(validFrom: string | null): boolean {
  if (!validFrom) return false;
  return isAfter(new Date(validFrom), new Date());
}

export function EvidenceTable({ evidence, isLoading, onSelect, selectedId }: EvidenceTableProps) {
  if (isLoading) {
    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Evidence</TableHead>
              <TableHead className="w-[100px]">Type</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="w-[100px]">Source</TableHead>
              <TableHead>Controls</TableHead>
              <TableHead className="w-[100px]">Size</TableHead>
              <TableHead className="w-[140px]">Collected</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="h-5 bg-muted rounded animate-pulse w-3/4" />
                </TableCell>
                <TableCell>
                  <div className="h-5 bg-muted rounded animate-pulse w-20" />
                </TableCell>
                <TableCell>
                  <div className="h-5 bg-muted rounded animate-pulse w-16" />
                </TableCell>
                <TableCell>
                  <div className="h-5 bg-muted rounded animate-pulse w-16" />
                </TableCell>
                <TableCell>
                  <div className="h-5 bg-muted rounded animate-pulse w-12" />
                </TableCell>
                <TableCell>
                  <div className="h-5 bg-muted rounded animate-pulse w-16" />
                </TableCell>
                <TableCell>
                  <div className="h-5 bg-muted rounded animate-pulse w-24" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (evidence.length === 0) {
    return (
      <div className="border rounded-lg p-12 text-center">
        <FileCheck className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No evidence found</h3>
        <p className="text-muted-foreground text-sm">
          Upload evidence to link to your controls and demonstrate compliance.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Evidence</TableHead>
            <TableHead className="w-[100px]">Type</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            <TableHead className="w-[100px]">Source</TableHead>
            <TableHead>Controls</TableHead>
            <TableHead className="w-[100px]">Size</TableHead>
            <TableHead className="w-[140px]">Collected</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {evidence.map((item) => {
            const expired = isExpired(item.validUntil);
            const notYetValid = isNotYetValid(item.validFrom);
            const hasValidityIssue = expired || notYetValid;

            return (
              <TableRow
                key={item.id}
                onClick={() => onSelect(item)}
                className={cn(
                  'cursor-pointer',
                  selectedId === item.id && 'bg-muted/50'
                )}
              >
                <TableCell>
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.title}</p>
                      {item.fileName && (
                        <p className="text-xs text-muted-foreground truncate">
                          {item.fileName}
                        </p>
                      )}
                      {hasValidityIssue && (
                        <div className="flex items-center gap-1 mt-1">
                          <AlertTriangle className="h-3 w-3 text-amber-500" />
                          <span className="text-xs text-amber-600">
                            {expired ? 'Expired' : 'Not yet valid'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <EvidenceTypeBadge type={item.type as EvidenceType} />
                </TableCell>
                <TableCell>
                  <EvidenceStatusBadge status={item.reviewStatus as ReviewStatus} />
                </TableCell>
                <TableCell>
                  <ProvisionalBadge isProvisional={item.isProvisional} size="sm" />
                </TableCell>
                <TableCell>
                  {item.controlCount > 0 ? (
                    <div className="flex items-center gap-1 text-sm">
                      <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{item.controlCount}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {formatFileSize(item.fileSize)}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(item.collectedAt), { addSuffix: true })}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
