import { cn } from '../../lib/utils';
import type { VerificationStatus } from '@lightsail/shared';
import { ShieldCheck, ShieldAlert, ShieldX, ShieldQuestion } from 'lucide-react';

interface VerificationStatusBadgeProps {
  status: VerificationStatus;
  size?: 'sm' | 'default';
  showIcon?: boolean;
}

const statusConfig: Record<VerificationStatus, {
  label: string;
  dotColor: string;
  bgColor: string;
  textColor: string;
  Icon: typeof ShieldCheck;
}> = {
  unverified: {
    label: 'Unverified',
    dotColor: 'bg-gray-400',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    Icon: ShieldQuestion,
  },
  verified: {
    label: 'Verified',
    dotColor: 'bg-emerald-500',
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-700',
    Icon: ShieldCheck,
  },
  failed: {
    label: 'Failed',
    dotColor: 'bg-red-500',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    Icon: ShieldX,
  },
  stale: {
    label: 'Stale',
    dotColor: 'bg-amber-500',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-700',
    Icon: ShieldAlert,
  },
};

export function VerificationStatusBadge({
  status,
  size = 'default',
  showIcon = false
}: VerificationStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.unverified;
  const { Icon } = config;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        config.bgColor,
        config.textColor,
        size === 'sm' ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"
      )}
    >
      {showIcon ? (
        <Icon className={cn("h-3 w-3", size === 'sm' && "h-2.5 w-2.5")} />
      ) : (
        <span className={cn("w-1.5 h-1.5 rounded-full", config.dotColor)} />
      )}
      {config.label}
    </span>
  );
}
