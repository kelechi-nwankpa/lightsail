import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useUser, useOrganization } from '@clerk/clerk-react';
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
import { ControlsTable } from '../components/controls/ControlsTable';
import { ControlFilters } from '../components/controls/ControlFilters';
import { ControlDetailPanel } from '../components/controls/ControlDetailPanel';
import { ControlForm } from '../components/controls/ControlForm';
import { FrameworkProgress } from '../components/frameworks/FrameworkProgress';
import { EnableFrameworkDialog } from '../components/frameworks/EnableFrameworkDialog';
import { useControls, useControl, useControlMutations, useControlStats } from '../hooks/use-controls';
import { useFrameworks, useEnabledFrameworks } from '../hooks/use-frameworks';
import {
  Plus,
  AlertTriangle,
  Clock,
  ChevronRight,
  Home,
  ShieldCheck,
  ShieldOff,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import type { ControlListItem, CreateControlInput, UpdateControlInput, EnabledFramework } from '../types/controls';
import { cn } from '../lib/utils';

// Summary card component for "Needs Attention" section
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
    warning: 'text-orange-500',
    danger: 'text-red-500'
  };

  const iconBgStyles = {
    default: 'bg-muted',
    success: 'bg-green-100',
    warning: 'bg-orange-100',
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

export default function Controls() {
  const { user } = useUser();
  const { organization } = useOrganization();

  const [selectedControl, setSelectedControl] = useState<ControlListItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingControl, setEditingControl] = useState<ControlListItem | undefined>();
  const [isFrameworkDialogOpen, setIsFrameworkDialogOpen] = useState(false);
  const [selectedFramework, setSelectedFramework] = useState<EnabledFramework | null>(null);

  const { controls, pagination, filters, isLoading, updateFilters, setPage, refetch } = useControls();
  const { control: controlDetail, isLoading: isLoadingDetail, refetch: refetchControlDetail } = useControl(selectedControl?.id || null);
  const { createControl, updateControl, isLoading: isMutating } = useControlMutations();
  const { frameworks, isLoading: isLoadingAllFrameworks } = useFrameworks();
  const { enabledFrameworks, isLoading: isLoadingFrameworks, enableFramework } = useEnabledFrameworks();

  // Fetch stats from dedicated endpoint (independent of filters)
  const { stats: controlStats } = useControlStats(filters.frameworkId);

  // Map stats from the API response
  const stats = useMemo(() => {
    if (!controlStats) {
      return {
        total: 0,
        implemented: 0,
        inProgress: 0,
        notStarted: 0,
        needsEvidence: 0,
        completionRate: 0,
        verified: 0,
        unverified: 0,
        verificationFailed: 0,
        stale: 0,
        verificationRate: 0
      };
    }
    return {
      total: controlStats.total,
      implemented: controlStats.implementationStatus.implemented,
      inProgress: controlStats.implementationStatus.inProgress,
      notStarted: controlStats.implementationStatus.notStarted,
      needsEvidence: controlStats.needsEvidence,
      completionRate: controlStats.completionRate,
      verified: controlStats.verificationStatus.verified,
      unverified: controlStats.verificationStatus.unverified,
      verificationFailed: controlStats.verificationStatus.failed,
      stale: controlStats.verificationStatus.stale,
      verificationRate: controlStats.verificationRate
    };
  }, [controlStats]);

  const handleSelectControl = (control: ControlListItem) => {
    setSelectedControl(control);
  };

  const handleCloseDetail = () => {
    setSelectedControl(null);
  };

  const handleEdit = () => {
    if (selectedControl) {
      setEditingControl(selectedControl);
      setIsFormOpen(true);
    }
  };

  const handleCreate = () => {
    setEditingControl(undefined);
    setIsFormOpen(true);
  };

  const handleSubmit = async (data: CreateControlInput | UpdateControlInput) => {
    const isEditing = !!editingControl;
    try {
      if (isEditing) {
        await updateControl(editingControl.id, data as UpdateControlInput);
      } else {
        await createControl(data as CreateControlInput);
      }
      refetch();
      setEditingControl(undefined);
      toast.success(isEditing ? 'Control updated' : 'Control created', {
        description: isEditing
          ? 'Your changes have been saved.'
          : 'The new control has been created.',
      });
    } catch (err) {
      console.error('Failed to save control:', err);
      toast.error(isEditing ? 'Failed to update control' : 'Failed to create control', {
        description: 'Please try again later.',
      });
    }
  };

  const handleFrameworkClick = (framework: EnabledFramework) => {
    setSelectedFramework(framework);
    // Use frameworkId (the actual Framework ID) not id (OrganizationFramework ID)
    updateFilters({ frameworkId: framework.frameworkId });
  };

  if (!user || !organization) {
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
        selectedControl ? "mr-[420px]" : ""
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
                  <BreadcrumbPage>Controls</BreadcrumbPage>
                </BreadcrumbItem>
                {selectedFramework && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{selectedFramework.name}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )}
              </BreadcrumbList>
            </Breadcrumb>

            {/* Page Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Controls</h1>
                <p className="text-muted-foreground mt-1">
                  Manage your security controls and framework mappings
                </p>
              </div>
              <Button onClick={handleCreate} className="gap-2">
                <Plus className="h-4 w-4" />
                New Control
              </Button>
            </div>

            {/* Status Tabs (Vanta-style) */}
            <Tabs
              value={filters.status || 'all'}
              onValueChange={(value) => updateFilters({ status: value === 'all' ? undefined : value as any })}
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
                  value="implemented"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-3"
                >
                  Implemented ({stats.implemented})
                </TabsTrigger>
                <TabsTrigger
                  value="in_progress"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-3"
                >
                  In Progress ({stats.inProgress})
                </TabsTrigger>
                <TabsTrigger
                  value="not_started"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-3"
                >
                  Not Started ({stats.notStarted})
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Framework Compliance Section */}
            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Framework Compliance</h2>
                {selectedFramework && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedFramework(null);
                      updateFilters({ frameworkId: undefined });
                    }}
                    className="text-muted-foreground"
                  >
                    Clear selection
                  </Button>
                )}
              </div>
              <FrameworkProgress
                frameworks={enabledFrameworks}
                isLoading={isLoadingFrameworks}
                onEnableClick={() => setIsFrameworkDialogOpen(true)}
                onFrameworkClick={handleFrameworkClick}
                selectedFrameworkId={selectedFramework?.frameworkId}
              />
            </section>

            {/* Control Health - Consolidated view */}
            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold">Control Health</h2>
                  <p className="text-sm text-muted-foreground">
                    Verified by integrations = proven working. Failed = needs remediation.
                  </p>
                </div>
                {(filters.verificationStatus || filters.status) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateFilters({ verificationStatus: undefined, status: undefined })}
                    className="text-muted-foreground"
                  >
                    Clear filters
                  </Button>
                )}
              </div>
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <SummaryCard
                  icon={ShieldCheck}
                  label="Verified"
                  value={stats.verified}
                  subtext={`${stats.verificationRate}% proven by integrations`}
                  variant="success"
                  onClick={() => updateFilters({ verificationStatus: 'verified', status: undefined })}
                />
                <SummaryCard
                  icon={AlertTriangle}
                  label="Needs Attention"
                  value={stats.verificationFailed}
                  subtext="Failed verification, fix required"
                  variant={stats.verificationFailed > 0 ? "danger" : "default"}
                  onClick={() => updateFilters({ verificationStatus: 'failed', status: undefined })}
                />
                <SummaryCard
                  icon={Clock}
                  label="Pending"
                  value={stats.unverified + stats.inProgress}
                  subtext="Awaiting verification or in progress"
                  variant="default"
                  onClick={() => updateFilters({ verificationStatus: 'unverified', status: undefined })}
                />
                <SummaryCard
                  icon={ShieldOff}
                  label="Not Started"
                  value={stats.notStarted}
                  subtext="Controls not yet implemented"
                  variant={stats.notStarted > 0 ? "warning" : "default"}
                  onClick={() => updateFilters({ status: 'not_started', verificationStatus: undefined })}
                />
              </div>
            </section>

            {/* Controls List Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">All Controls</h2>
                <p className="text-sm text-muted-foreground">
                  {pagination.total} total controls
                </p>
              </div>

              {/* Filters */}
              <ControlFilters
                filters={filters}
                frameworks={frameworks}
                onFiltersChange={updateFilters}
              />

              {/* Controls Table */}
              <ControlsTable
                controls={controls}
                isLoading={isLoading}
                onSelect={handleSelectControl}
                selectedId={selectedControl?.id}
              />

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {((pagination.page - 1) * pagination.pageSize) + 1} - {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} controls
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
      {selectedControl && (
        <>
          {/* Backdrop overlay - click to close */}
          <div
            className="fixed inset-0 bg-black/20 z-20"
            onClick={handleCloseDetail}
          />
          <div className="fixed right-0 top-0 h-screen z-30 shadow-xl">
            <ControlDetailPanel
              control={controlDetail}
              isLoading={isLoadingDetail}
              onClose={handleCloseDetail}
              onEdit={handleEdit}
              onMappingChange={() => {
                refetchControlDetail();
                refetch();
              }}
            />
          </div>
        </>
      )}

      {/* Create/Edit Form Dialog */}
      <ControlForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        control={editingControl}
        onSubmit={handleSubmit}
        isLoading={isMutating}
      />

      {/* Enable Framework Dialog */}
      <EnableFrameworkDialog
        open={isFrameworkDialogOpen}
        onOpenChange={setIsFrameworkDialogOpen}
        frameworks={frameworks}
        enabledFrameworkIds={enabledFrameworks.map((f) => f.id)}
        onEnable={enableFramework}
        isLoading={isLoadingAllFrameworks}
      />
    </div>
  );
}
