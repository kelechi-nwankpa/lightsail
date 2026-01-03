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
import { RiskTable } from '../components/risks/RiskTable';
import { RiskFilters } from '../components/risks/RiskFilters';
import { RiskDetailPanel } from '../components/risks/RiskDetailPanel';
import { RiskFormDialog } from '../components/risks/RiskFormDialog';
import { LinkControlToRiskDialog } from '../components/risks/LinkControlToRiskDialog';
import { useRisks, useRisk, useRiskMutations } from '../hooks/use-risks';
import {
  Plus,
  AlertTriangle,
  Shield,
  CheckCircle2,
  Clock,
  ChevronRight,
  Home,
  Link2,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import type { RiskListItem } from '../types/risks';
import type { RiskStatus } from '@lightsail/shared';
import { cn } from '../lib/utils';
import { getRiskScoreLevel } from '../types/risks';

// Summary card component
function SummaryCard({
  icon: Icon,
  label,
  value,
  subtext,
  variant = 'default',
  onClick
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  subtext: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  onClick?: () => void;
}) {
  const variantStyles = {
    default: 'text-muted-foreground',
    success: 'text-green-600',
    warning: 'text-amber-600',
    danger: 'text-red-500'
  };

  const iconBgStyles = {
    default: 'bg-muted',
    success: 'bg-green-100',
    warning: 'bg-amber-100',
    danger: 'bg-red-100'
  };

  return (
    <Card
      className={cn(
        "transition-all",
        onClick && "cursor-pointer hover:shadow-md hover:border-primary/30"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className={cn("p-2 rounded-lg", iconBgStyles[variant])}>
            <Icon className={cn("h-5 w-5", variantStyles[variant])} />
          </div>
          {onClick && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </div>
        <div className="mt-3">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className={cn("text-2xl font-semibold mt-1", variantStyles[variant])}>
            {value}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Risks() {
  const { isLoaded, isSignedIn } = useAuth();

  const [selectedRisk, setSelectedRisk] = useState<RiskListItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [editingRisk, setEditingRisk] = useState<RiskListItem | null>(null);

  const { risks, pagination, filters, isLoading, updateFilters, setPage, refetch } = useRisks();
  const { risk: riskDetail, isLoading: isLoadingDetail, refetch: refetchDetail } = useRisk(selectedRisk?.id || null);
  const { deleteRisk, unlinkControl } = useRiskMutations();

  // Calculate summary stats
  const stats = useMemo(() => {
    const identified = risks.filter(r => r.status === 'identified').length;
    const mitigating = risks.filter(r => r.status === 'mitigating' || r.status === 'assessing').length;
    const accepted = risks.filter(r => r.status === 'accepted' || r.status === 'transferred').length;
    const closed = risks.filter(r => r.status === 'closed').length;

    // Count high/critical risks
    const highCritical = risks.filter(r => {
      const level = getRiskScoreLevel(r.inherentScore);
      return level === 'high' || level === 'critical';
    }).length;

    // Count risks without controls
    const unmitigated = risks.filter(r => r.controlCount === 0).length;

    return {
      total: risks.length,
      identified,
      mitigating,
      accepted,
      closed,
      highCritical,
      unmitigated,
    };
  }, [risks]);

  const handleSelectRisk = (item: RiskListItem) => {
    setSelectedRisk(item);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedRisk(null);
  };

  const handleEdit = () => {
    if (selectedRisk) {
      setEditingRisk(selectedRisk);
      setIsFormOpen(true);
    }
  };

  const handleCreate = () => {
    setEditingRisk(null);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedRisk) return;
    if (!confirm('Are you sure you want to delete this risk? This action cannot be undone.')) {
      return;
    }
    try {
      await deleteRisk(selectedRisk.id);
      refetch();
      setIsDetailOpen(false);
      setSelectedRisk(null);
      toast.success('Risk deleted', {
        description: `"${selectedRisk.title}" has been deleted.`,
      });
    } catch (err) {
      console.error('Failed to delete risk:', err);
      toast.error('Failed to delete risk', {
        description: 'Please try again later.',
      });
    }
  };

  const handleUnlinkControl = async (controlId: string) => {
    if (!selectedRisk) return;
    try {
      await unlinkControl(selectedRisk.id, controlId);
      refetch();
      refetchDetail();
      toast.success('Control unlinked', {
        description: 'The control has been unlinked from this risk.',
      });
    } catch (err) {
      console.error('Failed to unlink control:', err);
      toast.error('Failed to unlink control', {
        description: 'Please try again later.',
      });
    }
  };

  const handleFormSuccess = (isEdit: boolean) => {
    refetch();
    if (selectedRisk) {
      refetchDetail();
    }
    toast.success(isEdit ? 'Risk updated' : 'Risk added', {
      description: isEdit
        ? 'Your changes have been saved.'
        : 'The new risk has been added to your register.',
    });
  };

  const handleLinkSuccess = () => {
    refetch();
    refetchDetail();
    toast.success('Control linked', {
      description: 'The control has been linked to this risk.',
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
    <div className="flex min-h-screen">
      <main className={cn(
        "flex-1 min-w-0 transition-all duration-300",
        isDetailOpen ? "mr-[420px]" : ""
      )}>
        <div className="px-4 py-6 lg:px-6 xl:px-8">
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
                <BreadcrumbPage>Risk Management</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Page Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Risk Management</h1>
              <p className="text-muted-foreground mt-1">
                Identify, assess, and manage organizational risks
              </p>
            </div>
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Risk
            </Button>
          </div>

          {/* Status Tabs */}
          <Tabs
            value={filters.status || 'all'}
            onValueChange={(value) => updateFilters({ status: value === 'all' ? undefined : value as RiskStatus })}
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
                value="identified"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-3"
              >
                Identified ({stats.identified})
              </TabsTrigger>
              <TabsTrigger
                value="mitigating"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-3"
              >
                Mitigating ({stats.mitigating})
              </TabsTrigger>
              <TabsTrigger
                value="accepted"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-3"
              >
                Accepted ({stats.accepted})
              </TabsTrigger>
              <TabsTrigger
                value="closed"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-3"
              >
                Closed ({stats.closed})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Summary Cards */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Overview</h2>
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <SummaryCard
                icon={AlertTriangle}
                label="High/Critical"
                value={stats.highCritical}
                subtext="Require attention"
                variant={stats.highCritical > 0 ? "danger" : "success"}
              />
              <SummaryCard
                icon={Clock}
                label="Being Mitigated"
                value={stats.mitigating}
                subtext="In progress"
                variant="warning"
                onClick={() => updateFilters({ status: 'mitigating' })}
              />
              <SummaryCard
                icon={Shield}
                label="Unmitigated"
                value={stats.unmitigated}
                subtext="No controls linked"
                variant={stats.unmitigated > 0 ? "danger" : "success"}
              />
              <SummaryCard
                icon={CheckCircle2}
                label="Accepted/Closed"
                value={stats.accepted + stats.closed}
                subtext="Resolved or accepted"
                variant="success"
              />
            </div>
          </section>

          {/* Risks List Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Risk Register</h2>
              <p className="text-sm text-muted-foreground">
                {pagination.total} total risks
              </p>
            </div>

            {/* Filters */}
            <RiskFilters
              filters={filters}
              onFiltersChange={updateFilters}
            />

            {/* Risk Table */}
            <RiskTable
              risks={risks}
              isLoading={isLoading}
              onSelect={handleSelectRisk}
              selectedId={selectedRisk?.id}
            />

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {((pagination.page - 1) * pagination.pageSize) + 1} - {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} risks
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === 1}
                    onClick={() => setPage(pagination.page - 1)}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <Button
                          key={page}
                          variant={pagination.page === page ? "default" : "ghost"}
                          size="sm"
                          className="w-8 h-8 p-0"
                          onClick={() => setPage(page)}
                        >
                          {page}
                        </Button>
                      );
                    })}
                    {pagination.totalPages > 5 && (
                      <>
                        <span className="text-muted-foreground">...</span>
                        <Button
                          variant={pagination.page === pagination.totalPages ? "default" : "ghost"}
                          size="sm"
                          className="w-8 h-8 p-0"
                          onClick={() => setPage(pagination.totalPages)}
                        >
                          {pagination.totalPages}
                        </Button>
                      </>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() => setPage(pagination.page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Detail Panel - Slide in from right */}
      {isDetailOpen && selectedRisk && (
        <>
          {/* Backdrop overlay - click to close */}
          <div
            className="fixed inset-0 bg-black/20 z-20"
            onClick={handleCloseDetail}
          />
          <div className="fixed right-0 top-0 h-screen z-30 shadow-xl">
            <RiskDetailPanel
              risk={riskDetail}
              isLoading={isLoadingDetail}
              onClose={handleCloseDetail}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onUnlinkControl={handleUnlinkControl}
            />
            {/* Link Control Button */}
            {riskDetail && (
              <div className="absolute bottom-20 right-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsLinkDialogOpen(true)}
                >
                  <Link2 className="h-4 w-4 mr-1" />
                  Link Control
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Create/Edit Form Dialog */}
      <RiskFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        risk={editingRisk ? riskDetail : null}
        onSuccess={handleFormSuccess}
      />

      {/* Link Control Dialog */}
      <LinkControlToRiskDialog
        open={isLinkDialogOpen}
        onOpenChange={setIsLinkDialogOpen}
        risk={selectedRisk}
        onSuccess={handleLinkSuccess}
      />
    </div>
  );
}
