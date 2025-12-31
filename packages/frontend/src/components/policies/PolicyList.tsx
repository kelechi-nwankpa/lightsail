import { cn } from '../../lib/utils';
import { PolicyStatusBadge } from './PolicyStatusBadge';
import {
  FileText,
  Calendar,
  User,
  Link2,
  MoreHorizontal,
  Eye,
  Edit,
  Send,
  CheckCircle,
  Archive,
  Trash2,
} from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import type { PolicyListItem } from '../../types/policies';

interface PolicyListProps {
  policies: PolicyListItem[];
  isLoading: boolean;
  onView: (policy: PolicyListItem) => void;
  onEdit: (policy: PolicyListItem) => void;
  onSubmitForReview: (policy: PolicyListItem) => void;
  onApprove: (policy: PolicyListItem) => void;
  onArchive: (policy: PolicyListItem) => void;
  onDelete: (policy: PolicyListItem) => void;
}

export function PolicyList({
  policies,
  isLoading,
  onView,
  onEdit,
  onSubmitForReview,
  onApprove,
  onArchive,
  onDelete,
}: PolicyListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="bg-background rounded-lg border p-4 animate-pulse"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-5 bg-muted rounded w-1/3" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </div>
              <div className="h-6 w-20 bg-muted rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (policies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium mb-1">No policies found</h3>
        <p className="text-muted-foreground text-sm">
          Create your first policy to get started with compliance documentation.
        </p>
      </div>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isReviewDue = (policy: PolicyListItem) => {
    if (!policy.nextReviewAt) return false;
    const nextReview = new Date(policy.nextReviewAt);
    const now = new Date();
    const daysUntilReview = Math.ceil((nextReview.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilReview <= 30;
  };

  return (
    <div className="space-y-3">
      {policies.map((policy) => (
        <div
          key={policy.id}
          className={cn(
            "bg-background rounded-lg border p-4 hover:border-primary/30 transition-colors cursor-pointer group",
            isReviewDue(policy) && policy.status === 'approved' && "border-amber-200"
          )}
          onClick={() => onView(policy)}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Title Row */}
              <div className="flex items-center gap-3 mb-1">
                <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <h3 className="font-medium truncate">{policy.title}</h3>
                {policy.code && (
                  <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                    {policy.code}
                  </span>
                )}
              </div>

              {/* Description */}
              {policy.description && (
                <p className="text-sm text-muted-foreground line-clamp-1 ml-8 mb-2">
                  {policy.description}
                </p>
              )}

              {/* Metadata Row */}
              <div className="flex flex-wrap items-center gap-4 ml-8 text-xs text-muted-foreground">
                {policy.category && (
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                    {policy.category}
                  </span>
                )}
                {policy.owner && (
                  <span className="inline-flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {policy.owner.name}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  v{policy.currentVersion}
                </span>
                {policy.controlCount > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Link2 className="h-3 w-3" />
                    {policy.controlCount} control{policy.controlCount !== 1 ? 's' : ''}
                  </span>
                )}
                {isReviewDue(policy) && policy.status === 'approved' && (
                  <span className="inline-flex items-center gap-1 text-amber-600">
                    <Calendar className="h-3 w-3" />
                    Review due {formatDate(policy.nextReviewAt)}
                  </span>
                )}
              </div>
            </div>

            {/* Status and Actions */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <PolicyStatusBadge status={policy.status} />

              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem onClick={() => onView(policy)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(policy)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>

                  {policy.status === 'draft' && (
                    <DropdownMenuItem onClick={() => onSubmitForReview(policy)}>
                      <Send className="h-4 w-4 mr-2" />
                      Submit for Review
                    </DropdownMenuItem>
                  )}

                  {policy.status === 'review' && (
                    <DropdownMenuItem onClick={() => onApprove(policy)}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </DropdownMenuItem>
                  )}

                  {policy.status !== 'archived' && (
                    <DropdownMenuItem onClick={() => onArchive(policy)}>
                      <Archive className="h-4 w-4 mr-2" />
                      Archive
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={() => onDelete(policy)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
