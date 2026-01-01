import { Clock, CheckCircle2, XCircle } from 'lucide-react';
import type { ReviewStatus } from '@lightsail/shared';
import { cn } from '../../lib/utils';

interface EvidenceStatusBadgeProps {
  status: ReviewStatus;
  size?: 'sm' | 'md';
}

const statusConfig: Record<ReviewStatus, { icon: React.ElementType; label: string; color: string; bgColor: string }> = {
  pending: {
    icon: Clock,
    label: 'Pending',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
  },
  approved: {
    icon: CheckCircle2,
    label: 'Approved',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  rejected: {
    icon: XCircle,
    label: 'Rejected',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
};

export function EvidenceStatusBadge({ status, size = 'sm' }: EvidenceStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        config.bgColor,
        config.color,
        sizeClasses[size]
      )}
    >
      <Icon className={iconSizes[size]} />
      {config.label}
    </span>
  );
}
