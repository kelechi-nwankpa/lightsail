import { Input } from '../ui/input';
import { Button } from '../ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import type { ControlFilters as ControlFiltersType } from '../../types/controls';
import type { FrameworkListItem } from '../../types/controls';

interface ControlFiltersProps {
  filters: ControlFiltersType;
  frameworks: FrameworkListItem[];
  onFiltersChange: (filters: Partial<ControlFiltersType>) => void;
}

export function ControlFilters({ filters, frameworks, onFiltersChange }: ControlFiltersProps) {
  const hasActiveFilters = filters.status || filters.riskLevel || filters.frameworkId || filters.hasEvidence !== undefined;

  const clearFilters = () => {
    onFiltersChange({
      status: undefined,
      riskLevel: undefined,
      frameworkId: undefined,
      hasEvidence: undefined,
    });
  };

  return (
    <div className="flex flex-col gap-4 mb-6">
      {/* Search and filter row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search controls..."
            value={filters.search || ''}
            onChange={(e) => onFiltersChange({ search: e.target.value || undefined })}
            className="pl-9"
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex items-center gap-2">
          <Select
            value={filters.status || 'all'}
            onValueChange={(value) => onFiltersChange({ status: value === 'all' ? undefined : value as ControlFiltersType['status'] })}
          >
            <SelectTrigger className="w-[150px] bg-background">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="not_started">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gray-400" />
                  Not Started
                </div>
              </SelectItem>
              <SelectItem value="in_progress">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  In Progress
                </div>
              </SelectItem>
              <SelectItem value="implemented">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Implemented
                </div>
              </SelectItem>
              <SelectItem value="not_applicable">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gray-300" />
                  Not Applicable
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.riskLevel || 'all'}
            onValueChange={(value) => onFiltersChange({ riskLevel: value === 'all' ? undefined : value as ControlFiltersType['riskLevel'] })}
          >
            <SelectTrigger className="w-[150px] bg-background">
              <SelectValue placeholder="All Risk Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risk Levels</SelectItem>
              <SelectItem value="critical">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  Critical
                </div>
              </SelectItem>
              <SelectItem value="high">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  High
                </div>
              </SelectItem>
              <SelectItem value="medium">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-500" />
                  Medium
                </div>
              </SelectItem>
              <SelectItem value="low">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Low
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.frameworkId || 'all'}
            onValueChange={(value) => onFiltersChange({ frameworkId: value === 'all' ? undefined : value })}
          >
            <SelectTrigger className="w-[160px] bg-background">
              <SelectValue placeholder="All Frameworks" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Frameworks</SelectItem>
              {frameworks.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Clear filters button */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Active filters indicator */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-sm">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Filtering by:</span>
          {filters.status && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
              Status: {filters.status.replace('_', ' ')}
              <button
                onClick={() => onFiltersChange({ status: undefined })}
                className="hover:text-primary/70"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filters.riskLevel && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
              Risk: {filters.riskLevel}
              <button
                onClick={() => onFiltersChange({ riskLevel: undefined })}
                className="hover:text-primary/70"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filters.frameworkId && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
              Framework: {frameworks.find(f => f.id === filters.frameworkId)?.name || filters.frameworkId}
              <button
                onClick={() => onFiltersChange({ frameworkId: undefined })}
                className="hover:text-primary/70"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filters.hasEvidence !== undefined && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">
              {filters.hasEvidence ? 'Has evidence' : 'Needs evidence'}
              <button
                onClick={() => onFiltersChange({ hasEvidence: undefined })}
                className="hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
