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
import { useControls, useControl, useControlMutations } from '../hooks/use-controls';
import { useFrameworks, useEnabledFrameworks } from '../hooks/use-frameworks';
import {
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  ChevronRight,
  Home,
  ShieldCheck,
  ShieldQuestion,
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

  // Calculate summary stats
  const stats = useMemo(() => {
    const implemented = controls.filter(c => c.implementationStatus === 'implemented').length;
    const inProgress = controls.filter(c => c.implementationStatus === 'in_progress').length;
    const notStarted = controls.filter(c => c.implementationStatus === 'not_started').length;
    const needsEvidence = controls.filter(c => c.evidenceCount === 0 && c.implementationStatus !== 'not_applicable').length;

    // Phase 0: Verification status tracking
    const verified = controls.filter(c => c.verificationStatus === 'verified').length;
    const unverified = controls.filter(c => c.verificationStatus === 'unverified').length;
    const verificationFailed = controls.filter(c => c.verificationStatus === 'failed').length;
    const stale = controls.filter(c => c.verificationStatus === 'stale').length;

    return {
      total: controls.length,
      implemented,
      inProgress,
      notStarted,
      needsEvidence,
      completionRate: controls.length > 0 ? Math.round((implemented / controls.length) * 100) : 0,
      // Phase 0: Verification stats
      verified,
      unverified,
      verificationFailed,
      stale,
      verificationRate: controls.length > 0 ? Math.round((verified / controls.length) * 100) : 0
    };
  }, [controls]);

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

  const handleFilterByStatus = (status: string) => {
    updateFilters({ status: status as any });
  };

  const handleFilterNeedsEvidence = () => {
    updateFilters({ hasEvidence: false });
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
    <div className="flex">
      <main className={cn(
        "flex-1 transition-all duration-300",
        selectedControl ? "mr-[420px]" : ""
      )}>
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

            {/* Summary Cards - Vanta-style monitoring */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Implementation Status</h2>
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <SummaryCard
                  icon={CheckCircle2}
                  label="Implemented"
                  value={stats.implemented}
                  subtext={`${stats.completionRate}% of total controls`}
                  variant="success"
                  onClick={() => handleFilterByStatus('implemented')}
                />
                <SummaryCard
                  icon={Clock}
                  label="In Progress"
                  value={stats.inProgress}
                  subtext="Controls being worked on"
                  variant="default"
                  onClick={() => handleFilterByStatus('in_progress')}
                />
                <SummaryCard
                  icon={AlertCircle}
                  label="Not Started"
                  value={stats.notStarted}
                  subtext="Controls pending implementation"
                  variant={stats.notStarted > 0 ? "warning" : "default"}
                  onClick={() => handleFilterByStatus('not_started')}
                />
                <SummaryCard
                  icon={FileText}
                  label="Needs Evidence"
                  value={stats.needsEvidence}
                  subtext="Controls without evidence"
                  variant={stats.needsEvidence > 0 ? "danger" : "success"}
                  onClick={handleFilterNeedsEvidence}
                />
              </div>
            </section>

            {/* Phase 0: Verification Status Section */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Verification Status</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Controls verified by integrations have higher confidence than self-attested controls.
              </p>
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <SummaryCard
                  icon={ShieldCheck}
                  label="Verified"
                  value={stats.verified}
                  subtext={`${stats.verificationRate}% verified by integrations`}
                  variant="success"
                />
                <SummaryCard
                  icon={ShieldQuestion}
                  label="Unverified"
                  value={stats.unverified}
                  subtext="Self-attested, needs verification"
                  variant={stats.unverified > 0 ? "warning" : "default"}
                />
                <SummaryCard
                  icon={AlertCircle}
                  label="Failed"
                  value={stats.verificationFailed}
                  subtext="Verification checks failed"
                  variant={stats.verificationFailed > 0 ? "danger" : "default"}
                />
                <SummaryCard
                  icon={Clock}
                  label="Stale"
                  value={stats.stale}
                  subtext="Evidence has expired"
                  variant={stats.stale > 0 ? "warning" : "default"}
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
