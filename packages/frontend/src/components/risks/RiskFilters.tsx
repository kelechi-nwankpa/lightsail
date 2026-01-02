import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import type { RiskFilters as RiskFiltersType } from '../../types/risks';
import {
  RISK_CATEGORIES,
  RISK_CATEGORY_LABELS,
  RISK_LIKELIHOODS,
  RISK_LIKELIHOOD_LABELS,
  RISK_IMPACTS,
  RISK_IMPACT_LABELS,
} from '../../types/risks';

interface RiskFiltersProps {
  filters: RiskFiltersType;
  onFiltersChange: (filters: Partial<RiskFiltersType>) => void;
}

export function RiskFilters({ filters, onFiltersChange }: RiskFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3 mb-4">
      <Select
        value={filters.category || 'all'}
        onValueChange={(value) => onFiltersChange({ category: value === 'all' ? undefined : value as typeof filters.category })}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {RISK_CATEGORIES.map((category) => (
            <SelectItem key={category} value={category}>
              {RISK_CATEGORY_LABELS[category]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.likelihood || 'all'}
        onValueChange={(value) => onFiltersChange({ likelihood: value === 'all' ? undefined : value as typeof filters.likelihood })}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="All Likelihoods" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Likelihoods</SelectItem>
          {RISK_LIKELIHOODS.map((likelihood) => (
            <SelectItem key={likelihood} value={likelihood}>
              {RISK_LIKELIHOOD_LABELS[likelihood]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.impact || 'all'}
        onValueChange={(value) => onFiltersChange({ impact: value === 'all' ? undefined : value as typeof filters.impact })}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="All Impacts" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Impacts</SelectItem>
          {RISK_IMPACTS.map((impact) => (
            <SelectItem key={impact} value={impact}>
              {RISK_IMPACT_LABELS[impact]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
