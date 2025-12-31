import { useState } from 'react';
import { useUser, useOrganization, OrganizationSwitcher } from '@clerk/clerk-react';
import { Button } from '../components/ui/button';
import { ControlsTable } from '../components/controls/ControlsTable';
import { ControlFilters } from '../components/controls/ControlFilters';
import { ControlDetailPanel } from '../components/controls/ControlDetailPanel';
import { ControlForm } from '../components/controls/ControlForm';
import { FrameworkProgress } from '../components/frameworks/FrameworkProgress';
import { EnableFrameworkDialog } from '../components/frameworks/EnableFrameworkDialog';
import { useControls, useControl, useControlMutations } from '../hooks/use-controls';
import { useFrameworks, useEnabledFrameworks } from '../hooks/use-frameworks';
import type { ControlListItem, CreateControlInput, UpdateControlInput } from '../types/controls';

export default function Controls() {
  const { user } = useUser();
  const { organization } = useOrganization();

  const [selectedControl, setSelectedControl] = useState<ControlListItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingControl, setEditingControl] = useState<ControlListItem | undefined>();
  const [isFrameworkDialogOpen, setIsFrameworkDialogOpen] = useState(false);

  const { controls, pagination, filters, isLoading, updateFilters, setPage, refetch } = useControls();
  const { control: controlDetail, isLoading: isLoadingDetail } = useControl(selectedControl?.id || null);
  const { createControl, updateControl, isLoading: isMutating } = useControlMutations();
  const { frameworks, isLoading: isLoadingAllFrameworks } = useFrameworks();
  const { enabledFrameworks, isLoading: isLoadingFrameworks, enableFramework } = useEnabledFrameworks();

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
    if (editingControl) {
      await updateControl(editingControl.id, data as UpdateControlInput);
    } else {
      await createControl(data as CreateControlInput);
    }
    refetch();
    setEditingControl(undefined);
  };

  if (!user || !organization) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">Lightsail</h1>
            <OrganizationSwitcher />
          </div>
          <nav className="flex items-center gap-6">
            <a href="/" className="text-muted-foreground hover:text-foreground">Dashboard</a>
            <a href="/controls" className="text-foreground font-medium">Controls</a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1">
        <main className={`flex-1 container mx-auto px-4 py-8 ${selectedControl ? 'mr-[400px]' : ''}`}>
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Controls</h1>
              <p className="text-muted-foreground mt-1">
                Manage your security controls and framework mappings
              </p>
            </div>
            <Button onClick={handleCreate}>+ New Control</Button>
          </div>

          {/* Framework Progress */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Framework Compliance</h2>
            <FrameworkProgress
              frameworks={enabledFrameworks}
              isLoading={isLoadingFrameworks}
              onEnableClick={() => setIsFrameworkDialogOpen(true)}
            />
          </section>

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
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {controls.length} of {pagination.total} controls
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => setPage(pagination.page - 1)}
                >
                  Previous
                </Button>
                <span className="flex items-center px-3 text-sm">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
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
        </main>

        {/* Detail Panel */}
        {selectedControl && (
          <div className="fixed right-0 top-0 h-full">
            <ControlDetailPanel
              control={controlDetail}
              isLoading={isLoadingDetail}
              onClose={handleCloseDetail}
              onEdit={handleEdit}
            />
          </div>
        )}
      </div>

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
