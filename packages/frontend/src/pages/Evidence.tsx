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
import { EvidenceTable } from '../components/evidence/EvidenceTable';
import { EvidenceFilters } from '../components/evidence/EvidenceFilters';
import { EvidenceDetailPanel } from '../components/evidence/EvidenceDetailPanel';
import { EvidenceFormDialog } from '../components/evidence/EvidenceFormDialog';
import { LinkControlToEvidenceDialog } from '../components/evidence/LinkControlToEvidenceDialog';
import { useEvidence, useEvidenceDetail, useEvidenceMutations } from '../hooks/use-evidence';
import {
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  Home,
  Link2,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import type { EvidenceListItem } from '../types/evidence';
import type { ReviewStatus } from '@lightsail/shared';
import { cn } from '../lib/utils';

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

export default function Evidence() {
  const { user } = useUser();
  const { organization } = useOrganization();

  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceListItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [editingEvidence, setEditingEvidence] = useState<EvidenceListItem | null>(null);

  const { evidence, pagination, filters, isLoading, updateFilters, setPage, refetch } = useEvidence();
  const { evidence: evidenceDetail, isLoading: isLoadingDetail, refetch: refetchDetail } = useEvidenceDetail(selectedEvidence?.id || null);
  const { deleteEvidence, reviewEvidence, unlinkControl } = useEvidenceMutations();

  // Calculate summary stats
  const stats = useMemo(() => {
    const pending = evidence.filter(e => e.reviewStatus === 'pending').length;
    const approved = evidence.filter(e => e.reviewStatus === 'approved').length;
    const rejected = evidence.filter(e => e.reviewStatus === 'rejected').length;

    // Count evidence without control links
    const unlinked = evidence.filter(e => e.controlCount === 0).length;

    // Count expired evidence
    const now = new Date();
    const expired = evidence.filter(e => {
      if (!e.validUntil) return false;
      return new Date(e.validUntil) < now;
    }).length;

    return {
      total: evidence.length,
      pending,
      approved,
      rejected,
      unlinked,
      expired,
    };
  }, [evidence]);

  const handleSelectEvidence = (item: EvidenceListItem) => {
    setSelectedEvidence(item);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedEvidence(null);
  };

  const handleEdit = () => {
    if (selectedEvidence) {
      setEditingEvidence(selectedEvidence);
      setIsFormOpen(true);
    }
  };

  const handleCreate = () => {
    setEditingEvidence(null);
    setIsFormOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedEvidence) return;
    try {
      await reviewEvidence(selectedEvidence.id, { status: 'approved' });
      refetch();
      refetchDetail();
      toast.success('Evidence approved', {
        description: `"${selectedEvidence.title}" has been approved.`,
      });
    } catch (err) {
      console.error('Failed to approve evidence:', err);
      toast.error('Failed to approve evidence', {
        description: 'Please try again later.',
      });
    }
  };

  const handleReject = async () => {
    if (!selectedEvidence) return;
    try {
      await reviewEvidence(selectedEvidence.id, { status: 'rejected' });
      refetch();
      refetchDetail();
      toast.success('Evidence rejected', {
        description: `"${selectedEvidence.title}" has been rejected.`,
      });
    } catch (err) {
      console.error('Failed to reject evidence:', err);
      toast.error('Failed to reject evidence', {
        description: 'Please try again later.',
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedEvidence) return;
    if (!confirm('Are you sure you want to delete this evidence? This action cannot be undone.')) {
      return;
    }
    try {
      await deleteEvidence(selectedEvidence.id);
      refetch();
      setIsDetailOpen(false);
      setSelectedEvidence(null);
      toast.success('Evidence deleted', {
        description: `"${selectedEvidence.title}" has been deleted.`,
      });
    } catch (err) {
      console.error('Failed to delete evidence:', err);
      toast.error('Failed to delete evidence', {
        description: 'Please try again later.',
      });
    }
  };

  const handleUnlinkControl = async (controlId: string) => {
    if (!selectedEvidence) return;
    try {
      await unlinkControl(selectedEvidence.id, controlId);
      refetch();
      refetchDetail();
      toast.success('Control unlinked', {
        description: 'The control has been unlinked from this evidence.',
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
    if (selectedEvidence) {
      refetchDetail();
    }
    toast.success(isEdit ? 'Evidence updated' : 'Evidence added', {
      description: isEdit
        ? 'Your changes have been saved.'
        : 'The new evidence has been added.',
    });
  };

  const handleLinkSuccess = () => {
    refetch();
    refetchDetail();
    toast.success('Control linked', {
      description: 'The control has been linked to this evidence.',
    });
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
        isDetailOpen ? "mr-[420px]" : ""
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
                <BreadcrumbPage>Evidence</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Page Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Evidence</h1>
              <p className="text-muted-foreground mt-1">
                Upload and manage compliance evidence for your controls
              </p>
            </div>
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Evidence
            </Button>
          </div>

          {/* Status Tabs */}
          <Tabs
            value={filters.reviewStatus || 'all'}
            onValueChange={(value) => updateFilters({ reviewStatus: value === 'all' ? undefined : value as ReviewStatus })}
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
                value="pending"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-3"
              >
                Pending ({stats.pending})
              </TabsTrigger>
              <TabsTrigger
                value="approved"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-3"
              >
                Approved ({stats.approved})
              </TabsTrigger>
              <TabsTrigger
                value="rejected"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-3"
              >
                Rejected ({stats.rejected})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Summary Cards */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Overview</h2>
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <SummaryCard
                icon={CheckCircle2}
                label="Approved"
                value={stats.approved}
                subtext="Reviewed and approved"
                variant="success"
                onClick={() => updateFilters({ reviewStatus: 'approved' })}
              />
              <SummaryCard
                icon={Clock}
                label="Pending Review"
                value={stats.pending}
                subtext="Awaiting review"
                variant="warning"
                onClick={() => updateFilters({ reviewStatus: 'pending' })}
              />
              <SummaryCard
                icon={Link2}
                label="Unlinked"
                value={stats.unlinked}
                subtext="Not linked to controls"
                variant={stats.unlinked > 0 ? "danger" : "default"}
              />
              <SummaryCard
                icon={AlertCircle}
                label="Expired"
                value={stats.expired}
                subtext="Past validity date"
                variant={stats.expired > 0 ? "danger" : "success"}
              />
            </div>
          </section>

          {/* Evidence List Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">All Evidence</h2>
              <p className="text-sm text-muted-foreground">
                {pagination.total} total items
              </p>
            </div>

            {/* Filters */}
            <EvidenceFilters
              filters={filters}
              onFiltersChange={updateFilters}
            />

            {/* Evidence Table */}
            <EvidenceTable
              evidence={evidence}
              isLoading={isLoading}
              onSelect={handleSelectEvidence}
              selectedId={selectedEvidence?.id}
            />

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {((pagination.page - 1) * pagination.pageSize) + 1} - {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} items
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
      {isDetailOpen && selectedEvidence && (
        <>
          {/* Backdrop overlay - click to close */}
          <div
            className="fixed inset-0 bg-black/20 z-20"
            onClick={handleCloseDetail}
          />
          <div className="fixed right-0 top-0 h-screen z-30 shadow-xl">
            <EvidenceDetailPanel
              evidence={evidenceDetail}
              isLoading={isLoadingDetail}
              onClose={handleCloseDetail}
              onEdit={handleEdit}
              onApprove={handleApprove}
              onReject={handleReject}
              onDelete={handleDelete}
              onUnlinkControl={handleUnlinkControl}
            />
            {/* Link Control Button */}
            {evidenceDetail && (
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
      <EvidenceFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        evidence={editingEvidence ? evidenceDetail : null}
        onSuccess={handleFormSuccess}
      />

      {/* Link Control Dialog */}
      <LinkControlToEvidenceDialog
        open={isLinkDialogOpen}
        onOpenChange={setIsLinkDialogOpen}
        evidence={selectedEvidence}
        onSuccess={handleLinkSuccess}
      />
    </div>
  );
}
