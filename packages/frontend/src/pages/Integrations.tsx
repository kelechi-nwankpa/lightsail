import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../components/ui/breadcrumb';
import { IntegrationCard } from '../components/integrations/IntegrationCard';
import { IntegrationDetailPanel } from '../components/integrations/IntegrationDetailPanel';
import { ConnectIntegrationDialog } from '../components/integrations/ConnectIntegrationDialog';
import {
  useIntegrations,
  useIntegrationDetail,
  useIntegrationLogs,
  useIntegrationMutations,
} from '../hooks/use-integrations';
import {
  Plus,
  Plug,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  Home,
  FileText,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import type { IntegrationListItem } from '../types/integrations';
import type { IntegrationStatus } from '@lightsail/shared';
import { cn } from '../lib/utils';
import { formatDistanceToNow } from 'date-fns';

// Summary card component
function SummaryCard({
  icon: Icon,
  label,
  value,
  subtext,
  variant = 'default',
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  subtext: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  onClick?: () => void;
}) {
  const variantStyles = {
    default: 'text-muted-foreground',
    success: 'text-green-600',
    warning: 'text-amber-600',
    danger: 'text-red-500',
  };

  const iconBgStyles = {
    default: 'bg-muted',
    success: 'bg-green-100',
    warning: 'bg-amber-100',
    danger: 'bg-red-100',
  };

  return (
    <Card
      className={cn(
        'transition-all',
        onClick && 'cursor-pointer hover:shadow-md hover:border-primary/30'
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className={cn('p-2 rounded-lg', iconBgStyles[variant])}>
            <Icon className={cn('h-5 w-5', variantStyles[variant])} />
          </div>
          {onClick && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </div>
        <div className="mt-3">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className={cn('text-2xl font-semibold mt-1', variantStyles[variant])}>{value}</p>
          <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Integrations() {
  const { isLoaded, isSignedIn } = useAuth();

  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationListItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    connected: boolean;
    latencyMs: number;
    error?: string;
  } | null>(null);

  const { integrations, filters, isLoading, updateFilters, refetch } = useIntegrations();
  const {
    integration: integrationDetail,
    isLoading: isLoadingDetail,
    refetch: refetchDetail,
  } = useIntegrationDetail(selectedIntegration?.id || null);
  const {
    logs,
    isLoading: isLogsLoading,
    refetch: refetchLogs,
  } = useIntegrationLogs(selectedIntegration?.id || null);
  const { triggerSync, testConnection, disconnectIntegration } = useIntegrationMutations();

  // Calculate summary stats
  const stats = useMemo(() => {
    const active = integrations.filter((i) => i.status === 'active').length;
    const error = integrations.filter((i) => i.status === 'error').length;
    const pending = integrations.filter((i) => i.status === 'pending').length;
    const disconnected = integrations.filter((i) => i.status === 'disconnected').length;

    const totalEvidence = integrations.reduce((sum, i) => sum + i.evidenceCount, 0);
    const totalSyncs = integrations.reduce((sum, i) => sum + i.syncCount, 0);

    // Find most recent sync
    const sortedBySyncTime = [...integrations]
      .filter((i) => i.lastSyncAt)
      .sort((a, b) => new Date(b.lastSyncAt!).getTime() - new Date(a.lastSyncAt!).getTime());
    const lastSyncTime = sortedBySyncTime[0]?.lastSyncAt;

    return {
      total: integrations.length,
      active,
      error,
      pending,
      disconnected,
      totalEvidence,
      totalSyncs,
      lastSyncTime,
    };
  }, [integrations]);

  const handleSelectIntegration = (id: string) => {
    const integration = integrations.find((i) => i.id === id);
    if (integration) {
      setSelectedIntegration(integration);
      setIsDetailOpen(true);
      setTestResult(null);
    }
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedIntegration(null);
    setTestResult(null);
  };

  const handleSync = async (id: string) => {
    setSyncingIds((prev) => new Set(prev).add(id));
    try {
      const result = await triggerSync(id);
      const totalControlsChecked = result.controlsVerified + result.controlsFailed;

      // Build a descriptive message based on results
      let description = `Generated ${result.evidenceGenerated} evidence`;
      if (totalControlsChecked > 0) {
        if (result.controlsVerified > 0 && result.controlsFailed === 0) {
          description += `, verified ${result.controlsVerified} controls`;
        } else if (result.controlsVerified === 0 && result.controlsFailed > 0) {
          description += `, ${result.controlsFailed} controls need attention`;
        } else {
          description += `, ${result.controlsVerified} verified, ${result.controlsFailed} need attention`;
        }
      }

      // Use appropriate toast type based on results
      if (result.controlsFailed > 0 && result.controlsVerified === 0) {
        toast.warning('Sync completed', { description });
      } else {
        toast.success('Sync completed', { description });
      }
      refetch();
      if (selectedIntegration?.id === id) {
        refetchDetail();
        refetchLogs();
      }
    } catch (err) {
      console.error('Failed to sync:', err);
      toast.error('Sync failed', {
        description: err instanceof Error ? err.message : 'Please try again later.',
      });
    } finally {
      setSyncingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleTest = async () => {
    if (!selectedIntegration) return;
    setTestingId(selectedIntegration.id);
    setTestResult(null);
    try {
      const result = await testConnection(selectedIntegration.id);
      setTestResult(result);
      if (result.connected) {
        toast.success('Connection successful', {
          description: `Latency: ${result.latencyMs}ms`,
        });
      } else {
        toast.error('Connection failed', {
          description: result.error || 'Unable to connect to the integration.',
        });
      }
    } catch (err) {
      console.error('Failed to test connection:', err);
      toast.error('Test failed', {
        description: 'Unable to test the connection. Please try again.',
      });
    } finally {
      setTestingId(null);
    }
  };

  const handleDisconnect = async () => {
    if (!selectedIntegration) return;
    if (!confirm('Are you sure you want to disconnect this integration? This will stop automatic syncing.')) {
      return;
    }
    try {
      await disconnectIntegration(selectedIntegration.id);
      refetch();
      setIsDetailOpen(false);
      setSelectedIntegration(null);
      toast.success('Integration disconnected', {
        description: `"${selectedIntegration.name}" has been disconnected.`,
      });
    } catch (err) {
      console.error('Failed to disconnect:', err);
      toast.error('Failed to disconnect', {
        description: 'Please try again later.',
      });
    }
  };

  const handleConnectSuccess = () => {
    refetch();
    toast.success('Integration connected', {
      description: 'Your integration is now active and syncing.',
    });
  };

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <main className={cn('flex-1 transition-all duration-300', isDetailOpen ? 'mr-[480px]' : '')}>
        <div className="container mx-auto px-4 py-6">
          {/* Breadcrumb */}
          <Breadcrumb className="mb-4">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/dashboard">
                    <Home className="h-4 w-4" />
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Integrations</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Page Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Integrations</h1>
              <p className="text-muted-foreground mt-1">
                Connect your tools to automatically collect compliance evidence
              </p>
            </div>
            <Button onClick={() => setIsConnectDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Connect Integration
            </Button>
          </div>

          {/* Status Tabs */}
          <Tabs
            value={filters.status || 'all'}
            onValueChange={(value) =>
              updateFilters({ status: value === 'all' ? undefined : (value as IntegrationStatus) })
            }
            className="mb-6"
          >
            <TabsList className="bg-transparent border-b rounded-none h-auto p-0 gap-4">
              <TabsTrigger
                value="all"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-3"
              >
                All ({stats.total})
              </TabsTrigger>
              <TabsTrigger
                value="active"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-3"
              >
                Active ({stats.active})
              </TabsTrigger>
              <TabsTrigger
                value="error"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-3"
              >
                Error ({stats.error})
              </TabsTrigger>
              <TabsTrigger
                value="disconnected"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-3"
              >
                Disconnected ({stats.disconnected})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Summary Cards */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Overview</h2>
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <SummaryCard
                icon={CheckCircle2}
                label="Active Integrations"
                value={stats.active}
                subtext="Connected and syncing"
                variant="success"
                onClick={() => updateFilters({ status: 'active' })}
              />
              <SummaryCard
                icon={AlertCircle}
                label="Errors"
                value={stats.error}
                subtext="Require attention"
                variant={stats.error > 0 ? 'danger' : 'success'}
                onClick={() => updateFilters({ status: 'error' })}
              />
              <SummaryCard
                icon={FileText}
                label="Evidence Generated"
                value={stats.totalEvidence}
                subtext="From all integrations"
                variant="default"
              />
              <SummaryCard
                icon={Clock}
                label="Last Sync"
                value={
                  stats.lastSyncTime
                    ? formatDistanceToNow(new Date(stats.lastSyncTime), { addSuffix: true })
                    : 'Never'
                }
                subtext={`${stats.totalSyncs} total syncs`}
                variant="default"
              />
            </div>
          </section>

          {/* Integrations Grid */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Connected Services</h2>
              <p className="text-sm text-muted-foreground">{stats.total} integrations</p>
            </div>

            {isLoading ? (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="h-[200px] animate-pulse bg-muted/50" />
                ))}
              </div>
            ) : integrations.length === 0 ? (
              <Card className="p-12 text-center">
                <Plug className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No integrations connected</h3>
                <p className="text-muted-foreground mb-4">
                  Connect your tools and services to automatically collect compliance evidence.
                </p>
                <Button onClick={() => setIsConnectDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Connect Your First Integration
                </Button>
              </Card>
            ) : (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {integrations.map((integration) => (
                  <IntegrationCard
                    key={integration.id}
                    integration={integration}
                    onView={handleSelectIntegration}
                    onSync={handleSync}
                    isSyncing={syncingIds.has(integration.id)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Detail Panel - Slide in from right */}
      {isDetailOpen && selectedIntegration && (
        <>
          {/* Backdrop overlay - click to close */}
          <div className="fixed inset-0 bg-black/20 z-20" onClick={handleCloseDetail} />
          <div className="fixed right-0 top-0 h-screen z-30 shadow-xl">
            <IntegrationDetailPanel
              integration={integrationDetail}
              logs={logs}
              isLoading={isLoadingDetail}
              isLogsLoading={isLogsLoading}
              onClose={handleCloseDetail}
              onSync={() => handleSync(selectedIntegration.id)}
              onTest={handleTest}
              onDisconnect={handleDisconnect}
              isSyncing={syncingIds.has(selectedIntegration.id)}
              isTesting={testingId === selectedIntegration.id}
              testResult={testResult}
            />
          </div>
        </>
      )}

      {/* Connect Integration Dialog */}
      <ConnectIntegrationDialog
        open={isConnectDialogOpen}
        onOpenChange={setIsConnectDialogOpen}
        onSuccess={handleConnectSuccess}
      />
    </div>
  );
}
