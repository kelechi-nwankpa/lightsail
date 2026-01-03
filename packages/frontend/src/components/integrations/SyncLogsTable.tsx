import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import type { IntegrationLog } from '../../types/integrations';

interface SyncLogsTableProps {
  logs: IntegrationLog[];
  isLoading?: boolean;
}

interface StatusConfigItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
}

const statusConfig: Record<string, StatusConfigItem> = {
  completed: {
    label: 'Success',
    icon: CheckCircle2,
    variant: 'default',
  },
  failed: {
    label: 'Failed',
    icon: XCircle,
    variant: 'destructive',
  },
  running: {
    label: 'Running',
    icon: Clock,
    variant: 'secondary',
  },
  pending: {
    label: 'Pending',
    icon: Clock,
    variant: 'outline',
  },
};

function formatDuration(ms: number | null): string {
  if (ms === null) return '-';
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

export function SyncLogsTable({ logs, isLoading }: SyncLogsTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 p-3 border rounded-lg">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16 ml-auto" />
          </div>
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No sync history yet</p>
        <p className="text-sm">Trigger a sync to see activity here</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Status</TableHead>
          <TableHead>Operation</TableHead>
          <TableHead>Items</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead>Time</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((log) => {
          const defaultConfig: StatusConfigItem = { label: 'Pending', icon: Clock, variant: 'outline' };
          const cfg = statusConfig[log.status] || defaultConfig;
          const Icon = cfg.icon;
          const variant = cfg.variant;
          const label = cfg.label;

          return (
            <TableRow key={log.id}>
              <TableCell>
                <Badge variant={variant} className="gap-1">
                  <Icon className="h-3 w-3" />
                  {label}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="font-medium capitalize">{log.operation.replace(/_/g, ' ')}</span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="text-green-600">{log.itemsProcessed}</span>
                  {log.itemsFailed > 0 && (
                    <span className="text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {log.itemsFailed} failed
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDuration(log.durationMs)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                <span title={log.startedAt ? format(new Date(log.startedAt), 'PPpp') : ''}>
                  {log.startedAt
                    ? formatDistanceToNow(new Date(log.startedAt), { addSuffix: true })
                    : '-'}
                </span>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
