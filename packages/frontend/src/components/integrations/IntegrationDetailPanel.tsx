import { X, RefreshCw, Trash2, Unplug, Clock, FileText, Calendar, User, Settings, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { Separator } from '../ui/separator';
import { IntegrationStatusBadge } from './IntegrationStatusBadge';
import { IntegrationTypeBadge } from './IntegrationTypeBadge';
import { SyncLogsTable } from './SyncLogsTable';
import { format, formatDistanceToNow } from 'date-fns';
import type { IntegrationDetail, IntegrationLog } from '../../types/integrations';
import { INTEGRATION_TYPE_DESCRIPTIONS } from '../../types/integrations';

interface IntegrationDetailPanelProps {
  integration: IntegrationDetail | null;
  logs: IntegrationLog[];
  isLoading: boolean;
  isLogsLoading: boolean;
  onClose: () => void;
  onSync: () => void;
  onTest: () => void;
  onDisconnect: () => void;
  isSyncing?: boolean;
  isTesting?: boolean;
  testResult?: { connected: boolean; latencyMs: number; error?: string } | null;
}

export function IntegrationDetailPanel({
  integration,
  logs,
  isLoading,
  isLogsLoading,
  onClose,
  onSync,
  onTest,
  onDisconnect,
  isSyncing,
  isTesting,
  testResult,
}: IntegrationDetailPanelProps) {
  if (isLoading) {
    return (
      <div className="w-[480px] h-full bg-background border-l overflow-y-auto">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-24" />
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Skeleton className="h-8 w-full mt-4" />
        </div>
        <div className="p-4 space-y-6">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (!integration) {
    return (
      <div className="w-[480px] h-full bg-background border-l flex items-center justify-center">
        <p className="text-muted-foreground">Integration not found</p>
      </div>
    );
  }

  const isActive = integration.status === 'active';

  return (
    <div className="w-[480px] h-full bg-background border-l overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b sticky top-0 bg-background z-10">
        <div className="flex items-center justify-between mb-3">
          <IntegrationTypeBadge type={integration.type} showLabel size="lg" />
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{integration.name}</h2>
          <IntegrationStatusBadge status={integration.status} />
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {INTEGRATION_TYPE_DESCRIPTIONS[integration.type]}
        </p>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Error message if any */}
        {integration.errorMessage && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-100 text-red-700 text-sm border border-red-200">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Connection Error</p>
              <p className="mt-1">{integration.errorMessage}</p>
            </div>
          </div>
        )}

        {/* Test Result */}
        {testResult && (
          <div className={`flex items-start gap-2 p-3 rounded-lg text-sm border ${
            testResult.connected
              ? 'bg-green-100 text-green-700 border-green-200'
              : 'bg-red-100 text-red-700 border-red-200'
          }`}>
            {testResult.connected ? (
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-medium">
                {testResult.connected ? 'Connection Successful' : 'Connection Failed'}
              </p>
              {testResult.connected && (
                <p className="mt-1">Latency: {testResult.latencyMs}ms</p>
              )}
              {testResult.error && (
                <p className="mt-1">{testResult.error}</p>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          {isActive && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSync}
              disabled={isSyncing}
              className="flex-1"
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
            variant="outline"
            size="sm"
            onClick={onTest}
            disabled={isTesting}
            className="flex-1"
          >
            {isTesting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Unplug className="h-4 w-4 mr-2" />
                Test Connection
              </>
            )}
          </Button>
        </div>

        <Separator />

        {/* Stats */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Statistics</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <FileText className="h-4 w-4" />
                <span className="text-xs">Evidence Generated</span>
              </div>
              <p className="text-2xl font-semibold">{integration.evidenceCount}</p>
            </div>
            <div className="p-3 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <RefreshCw className="h-4 w-4" />
                <span className="text-xs">Total Syncs</span>
              </div>
              <p className="text-2xl font-semibold">{integration.syncCount}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Details */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Details</h3>
          <div className="space-y-3">
            {integration.connectedBy && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Connected by:</span>
                <span>{integration.connectedBy.name}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Sync frequency:</span>
              <span>Every {integration.syncFrequencyMinutes} minutes</span>
            </div>
            {integration.lastSyncAt && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Last sync:</span>
                <span title={format(new Date(integration.lastSyncAt), 'PPpp')}>
                  {formatDistanceToNow(new Date(integration.lastSyncAt), { addSuffix: true })}
                </span>
              </div>
            )}
            {integration.nextSyncAt && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Next sync:</span>
                <span title={format(new Date(integration.nextSyncAt), 'PPpp')}>
                  {formatDistanceToNow(new Date(integration.nextSyncAt), { addSuffix: true })}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Connected:</span>
              <span>{format(new Date(integration.createdAt), 'MMM d, yyyy')}</span>
            </div>
          </div>
        </div>

        {/* Configuration */}
        {Object.keys(integration.config).length > 0 && (
          <>
            <Separator />
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configuration
              </h3>
              <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
                {Object.entries(integration.config).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="font-mono text-xs">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* Sync History */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Sync History</h3>
          <SyncLogsTable logs={logs} isLoading={isLogsLoading} />
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t sticky bottom-0 bg-background">
        <Button
          variant="destructive"
          className="w-full"
          onClick={onDisconnect}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Disconnect Integration
        </Button>
      </div>
    </div>
  );
}
