import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { IntegrationStatusBadge } from './IntegrationStatusBadge';
import { IntegrationTypeBadge } from './IntegrationTypeBadge';
import { RefreshCw, ChevronRight, FileText, Clock, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import type { IntegrationListItem } from '../../types/integrations';
import { INTEGRATION_TYPE_LABELS } from '../../types/integrations';

interface IntegrationCardProps {
  integration: IntegrationListItem;
  onView: (id: string) => void;
  onSync: (id: string) => void;
  isSyncing?: boolean;
}

export function IntegrationCard({
  integration,
  onView,
  onSync,
  isSyncing,
}: IntegrationCardProps) {
  const isActive = integration.status === 'active';
  const hasError = integration.status === 'error';

  return (
    <Card
      className={cn(
        'transition-all hover:shadow-md cursor-pointer',
        isActive ? 'border-green-200 bg-green-50/30' : '',
        hasError ? 'border-red-200 bg-red-50/30' : ''
      )}
      onClick={() => onView(integration.id)}
    >
      <CardContent className="p-5">
        {/* Header with type icon and status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <IntegrationTypeBadge type={integration.type} size="lg" />
            <div>
              <h3 className="font-semibold text-foreground">
                {integration.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {INTEGRATION_TYPE_LABELS[integration.type]}
              </p>
            </div>
          </div>
          <IntegrationStatusBadge status={integration.status} />
        </div>

        {/* Error message if any */}
        {integration.errorMessage && (
          <div className="mt-3 flex items-start gap-2 p-2 rounded-md bg-red-100 text-red-700 text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span className="line-clamp-2">{integration.errorMessage}</span>
          </div>
        )}

        {/* Stats */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>{integration.evidenceCount} evidence</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4" />
            <span>{integration.syncCount} syncs</span>
          </div>
        </div>

        {/* Last sync time */}
        {integration.lastSyncAt && (
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>
              Last synced {formatDistanceToNow(new Date(integration.lastSyncAt), { addSuffix: true })}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2">
          {isActive && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onSync(integration.id);
              }}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Now
                </>
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onView(integration.id);
            }}
          >
            View Details
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
