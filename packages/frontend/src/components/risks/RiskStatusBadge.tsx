import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';
import type { RiskStatus } from '@lightsail/shared';
import { RISK_STATUS_LABELS } from '../../types/risks';

interface RiskStatusBadgeProps {
  status: RiskStatus;
  className?: string;
}

const statusStyles: Record<RiskStatus, string> = {
  identified: 'bg-blue-100 text-blue-700 border-blue-200',
  assessing: 'bg-purple-100 text-purple-700 border-purple-200',
  mitigating: 'bg-amber-100 text-amber-700 border-amber-200',
  monitoring: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  accepted: 'bg-green-100 text-green-700 border-green-200',
  transferred: 'bg-gray-100 text-gray-700 border-gray-200',
  closed: 'bg-slate-100 text-slate-700 border-slate-200',
};

export function RiskStatusBadge({ status, className }: RiskStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium',
        statusStyles[status],
        className
      )}
    >
      {RISK_STATUS_LABELS[status]}
    </Badge>
  );
}
