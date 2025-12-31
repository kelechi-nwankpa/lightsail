import { Badge } from '../ui/badge';
import type { ControlStatus } from '@lightsail/shared';

interface ControlStatusBadgeProps {
  status: ControlStatus;
}

const statusConfig: Record<ControlStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  not_started: { label: 'Not Started', variant: 'outline' },
  in_progress: { label: 'In Progress', variant: 'secondary' },
  implemented: { label: 'Implemented', variant: 'default' },
  not_applicable: { label: 'N/A', variant: 'outline' },
};

export function ControlStatusBadge({ status }: ControlStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.not_started;

  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
}
