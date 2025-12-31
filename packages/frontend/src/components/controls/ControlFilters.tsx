import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import type { ControlFilters as ControlFiltersType } from '../../types/controls';
import type { FrameworkListItem } from '../../types/controls';

interface ControlFiltersProps {
  filters: ControlFiltersType;
  frameworks: FrameworkListItem[];
  onFiltersChange: (filters: Partial<ControlFiltersType>) => void;
}

export function ControlFilters({ filters, frameworks, onFiltersChange }: ControlFiltersProps) {
  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <div className="flex-1 min-w-[200px]">
        <Input
          placeholder="Search controls..."
          value={filters.search || ''}
          onChange={(e) => onFiltersChange({ search: e.target.value || undefined })}
        />
      </div>

      <Select
        value={filters.status || 'all'}
        onValueChange={(value) => onFiltersChange({ status: value === 'all' ? undefined : value as ControlFiltersType['status'] })}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="not_started">Not Started</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="implemented">Implemented</SelectItem>
          <SelectItem value="not_applicable">Not Applicable</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.riskLevel || 'all'}
        onValueChange={(value) => onFiltersChange({ riskLevel: value === 'all' ? undefined : value as ControlFiltersType['riskLevel'] })}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Risk Level" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Risk Levels</SelectItem>
          <SelectItem value="critical">Critical</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="low">Low</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.frameworkId || 'all'}
        onValueChange={(value) => onFiltersChange({ frameworkId: value === 'all' ? undefined : value })}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Framework" />
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
    </div>
  );
}
