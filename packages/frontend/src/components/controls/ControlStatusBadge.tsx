import { cn } from '../../lib/utils';
import type { ControlStatus } from '@lightsail/shared';

interface ControlStatusBadgeProps {
  status: ControlStatus;
  size?: 'sm' | 'default';
}

const statusConfig: Record<ControlStatus, { label: string; dotColor: string; bgColor: string; textColor: string }> = {
  not_started: {
    label: 'Not Started',
    dotColor: 'bg-gray-400',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
  },
  in_progress: {
    label: 'In Progress',
    dotColor: 'bg-blue-500',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
  },
  implemented: {
    label: 'Implemented',
    dotColor: 'bg-green-500',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
  },
  not_applicable: {
    label: 'N/A',
    dotColor: 'bg-gray-300',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-500',
  },
};

export function ControlStatusBadge({ status, size = 'default' }: ControlStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.not_started;

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
