import { cn } from '../../lib/utils';
import type { PolicyStatus } from '@lightsail/shared';

interface PolicyStatusBadgeProps {
  status: PolicyStatus;
  size?: 'sm' | 'default';
}

const statusConfig: Record<PolicyStatus, { label: string; dotColor: string; bgColor: string; textColor: string }> = {
  draft: {
    label: 'Draft',
    dotColor: 'bg-gray-400',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
  },
  review: {
    label: 'In Review',
    dotColor: 'bg-amber-500',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-700',
  },
  approved: {
    label: 'Approved',
    dotColor: 'bg-green-500',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
  },
  archived: {
    label: 'Archived',
    dotColor: 'bg-gray-300',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-500',
  },
};

export function PolicyStatusBadge({ status, size = 'default' }: PolicyStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.draft;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        config.bgColor,
        config.textColor,
        size === 'sm' ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", config.dotColor)} />
      {config.label}
    </span>
  );
}
