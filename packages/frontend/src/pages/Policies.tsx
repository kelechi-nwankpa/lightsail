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
import { PolicyList } from '../components/policies/PolicyList';
import { PolicyFilters } from '../components/policies/PolicyFilters';
import { PolicyDetailPanel } from '../components/policies/PolicyDetailPanel';
import { PolicyFormDialog } from '../components/policies/PolicyFormDialog';
import { usePolicies, usePolicy, usePolicyMutations, usePolicyCategories } from '../hooks/use-policies';
import {
  Plus,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  Home,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import type { PolicyListItem } from '../types/policies';
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

export default function Policies() {
  const { user } = useUser();
  const { organization } = useOrganization();

  const [selectedPolicy, setSelectedPolicy] = useState<PolicyListItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<PolicyListItem | null>(null);

  const { policies, pagination, filters, isLoading, updateFilters, setPage, refetch } = usePolicies();
  const { policy: policyDetail, isLoading: isLoadingDetail, refetch: refetchPolicyDetail } = usePolicy(selectedPolicy?.id || null);
  const { deletePolicy, submitForReview, approvePolicy, archivePolicy } = usePolicyMutations();
  const { categories } = usePolicyCategories();

  // Calculate summary stats
  const stats = useMemo(() => {
    const draft = policies.filter(p => p.status === 'draft').length;
    const review = policies.filter(p => p.status === 'review').length;
    const approved = policies.filter(p => p.status === 'approved').length;
    const archived = policies.filter(p => p.status === 'archived').length;

    // Calculate policies needing review (approved but review date is soon)
    const now = new Date();
    const needsReview = policies.filter(p => {
      if (p.status !== 'approved' || !p.nextReviewAt) return false;
      const nextReview = new Date(p.nextReviewAt);
      const daysUntilReview = Math.ceil((nextReview.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilReview <= 30;
    }).length;

    return {
      total: policies.length,
      draft,
      review,
      approved,
      archived,
      needsReview,
    };
  }, [policies]);

  const handleViewPolicy = (policy: PolicyListItem) => {
    setSelectedPolicy(policy);
    setIsDetailOpen(true);
  };

  const handleEditPolicy = (policy: PolicyListItem) => {
    setEditingPolicy(policy);
    setSelectedPolicy(policy);
    // Need to wait for detail to load before opening form
    setIsFormOpen(true);
  };

  const handleCreatePolicy = () => {
    setEditingPolicy(null);
    setIsFormOpen(true);
  };

  const handleSubmitForReview = async (policy: PolicyListItem) => {
    try {
      await submitForReview(policy.id);
      refetch();
      if (isDetailOpen) refetchPolicyDetail();
      toast.success('Submitted for review', {
        description: `"${policy.title}" has been submitted for review.`,
      });
    } catch (err) {
      console.error('Failed to submit for review:', err);
      toast.error('Failed to submit for review', {
        description: 'Please try again later.',
      });
    }
  };

  const handleApprove = async (policy: PolicyListItem) => {
    try {
      await approvePolicy(policy.id);
      refetch();
      if (isDetailOpen) refetchPolicyDetail();
      toast.success('Policy approved', {
        description: `"${policy.title}" has been approved.`,
      });
    } catch (err) {
      console.error('Failed to approve policy:', err);
      toast.error('Failed to approve policy', {
        description: 'Please try again later.',
      });
    }
  };

  const handleArchive = async (policy: PolicyListItem) => {
    try {
      await archivePolicy(policy.id);
      refetch();
      if (isDetailOpen) {
        setIsDetailOpen(false);
        setSelectedPolicy(null);
      }
      toast.success('Policy archived', {
        description: `"${policy.title}" has been archived.`,
      });
    } catch (err) {
      console.error('Failed to archive policy:', err);
      toast.error('Failed to archive policy', {
        description: 'Please try again later.',
      });
    }
  };

  const handleDelete = async (policy: PolicyListItem) => {
    if (!confirm('Are you sure you want to delete this policy? This action cannot be undone.')) {
      return;
    }
    try {
      await deletePolicy(policy.id);
      refetch();
      if (selectedPolicy?.id === policy.id) {
        setIsDetailOpen(false);
        setSelectedPolicy(null);
      }
      toast.success('Policy deleted', {
        description: `"${policy.title}" has been deleted.`,
      });
    } catch (err) {
      console.error('Failed to delete policy:', err);
      toast.error('Failed to delete policy', {
        description: 'Please try again later.',
      });
    }
  };

  const handleFormSuccess = (isEdit: boolean) => {
    refetch();
    if (selectedPolicy) {
      refetchPolicyDetail();
    }
    toast.success(isEdit ? 'Policy updated' : 'Policy created', {
      description: isEdit
        ? 'Your changes have been saved.'
        : 'The new policy has been created.',
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
      <main className="flex-1">
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
                <BreadcrumbPage>Policies</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Page Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Policies</h1>
              <p className="text-muted-foreground mt-1">
                Manage your organization's security and compliance policies
              </p>
            </div>
            <Button onClick={handleCreatePolicy} className="gap-2">
              <Plus className="h-4 w-4" />
              New Policy
            </Button>
          </div>

          {/* Status Tabs */}
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
                value="draft"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-3"
              >
                Draft ({stats.draft})
              </TabsTrigger>
              <TabsTrigger
                value="review"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-3"
              >
                In Review ({stats.review})
              </TabsTrigger>
              <TabsTrigger
                value="approved"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-3"
              >
                Approved ({stats.approved})
              </TabsTrigger>
              <TabsTrigger
                value="archived"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-3"
              >
                Archived ({stats.archived})
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
                subtext="Active policies"
                variant="success"
                onClick={() => updateFilters({ status: 'approved' })}
              />
              <SummaryCard
                icon={Clock}
                label="In Review"
                value={stats.review}
                subtext="Awaiting approval"
                variant="warning"
                onClick={() => updateFilters({ status: 'review' })}
              />
              <SummaryCard
                icon={FileText}
                label="Draft"
                value={stats.draft}
                subtext="Policies in progress"
                variant="default"
                onClick={() => updateFilters({ status: 'draft' })}
              />
              <SummaryCard
                icon={AlertCircle}
                label="Needs Review"
                value={stats.needsReview}
                subtext="Review due within 30 days"
                variant={stats.needsReview > 0 ? "danger" : "success"}
              />
            </div>
          </section>

          {/* Policies List Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">All Policies</h2>
              <p className="text-sm text-muted-foreground">
                {pagination.total} total policies
              </p>
            </div>

            {/* Filters */}
            <PolicyFilters
              filters={filters}
              categories={categories}
              onFiltersChange={updateFilters}
            />

            {/* Policy List */}
            <PolicyList
              policies={policies}
              isLoading={isLoading}
              onView={handleViewPolicy}
              onEdit={handleEditPolicy}
              onSubmitForReview={handleSubmitForReview}
              onApprove={handleApprove}
              onArchive={handleArchive}
              onDelete={handleDelete}
            />

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {((pagination.page - 1) * pagination.pageSize) + 1} - {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} policies
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

      {/* Policy Detail Panel */}
      <PolicyDetailPanel
        policy={policyDetail}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onEdit={() => {
          setEditingPolicy(selectedPolicy);
          setIsFormOpen(true);
        }}
        onSubmitForReview={() => selectedPolicy && handleSubmitForReview(selectedPolicy)}
        onApprove={() => selectedPolicy && handleApprove(selectedPolicy)}
        onArchive={() => selectedPolicy && handleArchive(selectedPolicy)}
        isLoading={isLoadingDetail}
      />

      {/* Create/Edit Form Dialog */}
      <PolicyFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        policy={editingPolicy ? policyDetail : null}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
