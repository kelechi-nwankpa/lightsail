import { X } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import type { EvidenceFilters as EvidenceFiltersType } from '../../types/evidence';
import { EVIDENCE_TYPES, EVIDENCE_TYPE_LABELS, REVIEW_STATUS_LABELS } from '../../types/evidence';
import type { EvidenceType, ReviewStatus } from '@lightsail/shared';

interface EvidenceFiltersProps {
  filters: EvidenceFiltersType;
  onFiltersChange: (filters: Partial<EvidenceFiltersType>) => void;
}

export function EvidenceFilters({ filters, onFiltersChange }: EvidenceFiltersProps) {
  const hasActiveFilters = filters.type || filters.reviewStatus || filters.validOnly;

  const clearFilters = () => {
    onFiltersChange({
      type: undefined,
      reviewStatus: undefined,
      validOnly: undefined,
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4 p-4 bg-muted/30 rounded-lg border">
      {/* Type Filter */}
      <Select
        value={filters.type || 'all'}
        onValueChange={(value) => onFiltersChange({ type: value === 'all' ? undefined : (value as EvidenceType) })}
      >
        <SelectTrigger className="w-[150px] bg-background">
          <SelectValue placeholder="All Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          {EVIDENCE_TYPES.map((type) => (
            <SelectItem key={type} value={type}>
              {EVIDENCE_TYPE_LABELS[type]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Review Status Filter */}
      <Select
        value={filters.reviewStatus || 'all'}
        onValueChange={(value) => onFiltersChange({ reviewStatus: value === 'all' ? undefined : (value as ReviewStatus) })}
      >
        <SelectTrigger className="w-[160px] bg-background">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {(Object.keys(REVIEW_STATUS_LABELS) as ReviewStatus[]).map((status) => (
            <SelectItem key={status} value={status}>
              {REVIEW_STATUS_LABELS[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Valid Only Filter */}
      <Select
        value={filters.validOnly === undefined ? 'all' : filters.validOnly ? 'valid' : 'expired'}
        onValueChange={(value) => {
          if (value === 'all') {
            onFiltersChange({ validOnly: undefined });
          } else {
            onFiltersChange({ validOnly: value === 'valid' });
          }
        }}
      >
        <SelectTrigger className="w-[140px] bg-background">
          <SelectValue placeholder="Validity" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Evidence</SelectItem>
          <SelectItem value="valid">Valid Only</SelectItem>
          <SelectItem value="expired">Expired</SelectItem>
        </SelectContent>
      </Select>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
          <X className="h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  );
}
