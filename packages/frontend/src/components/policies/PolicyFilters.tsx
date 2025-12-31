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
import type { PolicyFilters as PolicyFiltersType } from '../../types/policies';
import { POLICY_CATEGORIES } from '../../types/policies';

interface PolicyFiltersProps {
  filters: PolicyFiltersType;
  categories: string[];
  onFiltersChange: (filters: Partial<PolicyFiltersType>) => void;
}

export function PolicyFilters({ filters, categories, onFiltersChange }: PolicyFiltersProps) {
  const hasActiveFilters = filters.status || filters.category;

  const clearFilters = () => {
    onFiltersChange({
      status: undefined,
      category: undefined,
    });
  };

  // Combine predefined categories with any custom ones from the database
  const allCategories = [...new Set([...POLICY_CATEGORIES, ...categories])];

  return (
    <div className="flex flex-col gap-4 mb-6">
      {/* Search and filter row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search policies..."
            value={filters.search || ''}
            onChange={(e) => onFiltersChange({ search: e.target.value || undefined })}
            className="pl-9"
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex items-center gap-2">
          <Select
            value={filters.status || 'all'}
            onValueChange={(value) => onFiltersChange({ status: value === 'all' ? undefined : value as PolicyFiltersType['status'] })}
          >
            <SelectTrigger className="w-[150px] bg-background">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gray-400" />
                  Draft
                </div>
              </SelectItem>
              <SelectItem value="review">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  In Review
                </div>
              </SelectItem>
              <SelectItem value="approved">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Approved
                </div>
              </SelectItem>
              <SelectItem value="archived">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gray-300" />
                  Archived
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.category || 'all'}
            onValueChange={(value) => onFiltersChange({ category: value === 'all' ? undefined : value })}
          >
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {allCategories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
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
              Status: {filters.status}
              <button
                onClick={() => onFiltersChange({ status: undefined })}
                className="hover:text-primary/70"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filters.category && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
              Category: {filters.category}
              <button
                onClick={() => onFiltersChange({ category: undefined })}
                className="hover:text-primary/70"
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
