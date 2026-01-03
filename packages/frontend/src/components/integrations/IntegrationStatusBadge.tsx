import { cn } from '../../lib/utils';
import type { IntegrationStatus } from '@lightsail/shared';

interface IntegrationStatusBadgeProps {
  status: IntegrationStatus;
  size?: 'sm' | 'default';
}

const statusConfig: Record<IntegrationStatus, { label: string; dotColor: string; bgColor: string; textColor: string }> = {
  pending: {
    label: 'Connecting...',
    dotColor: 'bg-yellow-500 animate-pulse',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
  },
  active: {
    label: 'Connected',
    dotColor: 'bg-green-500',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
  },
  error: {
    label: 'Error',
    dotColor: 'bg-red-500',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
  },
  disconnected: {
    label: 'Disconnected',
    dotColor: 'bg-gray-400',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
  },
};

export function IntegrationStatusBadge({ status, size = 'default' }: IntegrationStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;

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
