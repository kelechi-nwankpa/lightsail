import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../ui/sheet';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { PolicyStatusBadge } from './PolicyStatusBadge';
import {
  Edit,
  Send,
  CheckCircle,
  Archive,
  Calendar,
  User,
  Link2,
  Clock,
  FileText,
} from 'lucide-react';
import type { PolicyDetail } from '../../types/policies';
import type { ControlStatus } from '@lightsail/shared';

interface PolicyDetailPanelProps {
  policy: PolicyDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onSubmitForReview: () => void;
  onApprove: () => void;
  onArchive: () => void;
  isLoading?: boolean;
}

const controlStatusConfig: Record<ControlStatus, { label: string; color: string }> = {
  not_started: { label: 'Not Started', color: 'text-gray-500' },
  in_progress: { label: 'In Progress', color: 'text-blue-600' },
  implemented: { label: 'Implemented', color: 'text-green-600' },
  not_applicable: { label: 'N/A', color: 'text-gray-400' },
};

export function PolicyDetailPanel({
  policy,
  open,
  onOpenChange,
  onEdit,
  onSubmitForReview,
  onApprove,
  onArchive,
  isLoading,
}: PolicyDetailPanelProps) {
  const [activeTab, setActiveTab] = useState('content');

  if (!policy && !isLoading) return null;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const currentVersion = policy?.versions[0];

  // Simple markdown to HTML for preview
  const renderContent = (text: string): string => {
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold mt-5 mb-2">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-6 mb-3">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-primary underline">$1</a>')
      .replace(/^\d+\. (.+)$/gm, '<li class="ml-5 list-decimal">$1</li>')
      .replace(/^- (.+)$/gm, '<li class="ml-5 list-disc">$1</li>')
      .replace(/^&gt; (.+)$/gm, '<blockquote class="border-l-2 border-muted-foreground/30 pl-3 italic text-muted-foreground">$1</blockquote>')
      .replace(/\n\n/g, '</p><p class="mb-3">')
      .replace(/\n/g, '<br />');

    return `<p class="mb-3">${html}</p>`;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-0">
        {isLoading ? (
          <div className="p-6 space-y-4 animate-pulse">
            <div className="h-6 bg-muted rounded w-1/4" />
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-px bg-muted my-4" />
            <div className="h-64 bg-muted rounded" />
          </div>
        ) : policy ? (
          <div className="flex flex-col h-full">
            {/* Header Section */}
            <SheetHeader className="p-6 pb-4 space-y-0 border-b bg-background">
              {/* Policy Code and Status */}
              <div className="flex items-center gap-2 mb-2">
                {policy.code && (
                  <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
                    {policy.code}
                  </span>
                )}
                <PolicyStatusBadge status={policy.status} size="sm" />
              </div>

              {/* Title */}
              <SheetTitle className="text-xl font-semibold pr-8">
                {policy.title}
              </SheetTitle>

              {/* Description */}
              {policy.description && (
                <SheetDescription className="mt-1">
                  {policy.description}
                </SheetDescription>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-4">
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-1.5" />
                  Edit
                </Button>
                {policy.status === 'draft' && (
                  <Button variant="outline" size="sm" onClick={onSubmitForReview}>
                    <Send className="h-4 w-4 mr-1.5" />
                    Submit for Review
                  </Button>
                )}
                {policy.status === 'review' && (
                  <Button size="sm" onClick={onApprove}>
                    <CheckCircle className="h-4 w-4 mr-1.5" />
                    Approve
                  </Button>
                )}
                {policy.status !== 'archived' && (
                  <Button variant="ghost" size="sm" onClick={onArchive}>
                    <Archive className="h-4 w-4 mr-1.5" />
                    Archive
                  </Button>
                )}
              </div>
            </SheetHeader>

            {/* Metadata Section */}
            <div className="px-6 py-4 border-b bg-muted/30">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">
                    {policy.owner?.name || 'Unassigned'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                  <span className="truncate">{policy.category || 'No category'}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  <span>Version {currentVersion?.version || 1}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span>Review: {formatDate(policy.nextReviewAt)}</span>
                </div>
              </div>
            </div>

            {/* Tabs Section */}
            <div className="flex-1 overflow-y-auto">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                <TabsList className="mx-6 mt-4 bg-muted/50 p-1 h-auto">
                  <TabsTrigger value="content" className="text-xs px-3 py-1.5">
                    Content
                  </TabsTrigger>
                  <TabsTrigger value="controls" className="text-xs px-3 py-1.5">
                    Controls ({policy.linkedControls.length})
                  </TabsTrigger>
                  <TabsTrigger value="history" className="text-xs px-3 py-1.5">
                    History ({policy.versions.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="content" className="flex-1 px-6 py-4 mt-0">
                  <div
                    className="prose prose-sm max-w-none text-foreground"
                    dangerouslySetInnerHTML={{ __html: renderContent(currentVersion?.content || '') }}
                  />
                </TabsContent>

                <TabsContent value="controls" className="flex-1 px-6 py-4 mt-0">
                  {policy.linkedControls.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Link2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
                      <p className="text-sm font-medium">No linked controls</p>
                      <p className="text-xs mt-1">Link controls to this policy from the Controls page</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {policy.linkedControls.map((control) => {
                        const statusConfig = controlStatusConfig[control.implementationStatus];
                        return (
                          <div
                            key={control.id}
                            className="flex items-center justify-between p-3 rounded-lg border bg-background hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate">{control.name}</p>
                                {control.code && (
                                  <p className="text-xs text-muted-foreground font-mono">{control.code}</p>
                                )}
                              </div>
                            </div>
                            <span className={`text-xs font-medium flex-shrink-0 ${statusConfig.color}`}>
                              {statusConfig.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="history" className="flex-1 px-6 py-4 mt-0">
                  <div className="space-y-0">
                    {policy.versions.map((version, index) => (
                      <div
                        key={version.id}
                        className="relative pl-6 pb-6 last:pb-0"
                      >
                        {/* Timeline line */}
                        {index !== policy.versions.length - 1 && (
                          <div className="absolute left-[7px] top-4 bottom-0 w-0.5 bg-muted" />
                        )}
                        {/* Timeline dot */}
                        <div className={`absolute left-0 top-1 w-4 h-4 rounded-full border-2 ${
                          index === 0 ? 'border-primary bg-primary' : 'border-muted-foreground/30 bg-background'
                        }`} />

                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                Version {version.version}
                              </span>
                              {index === 0 && (
                                <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                  Current
                                </span>
                              )}
                            </div>
                            {version.changeSummary && (
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {version.changeSummary}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              {version.createdBy && (
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {version.createdBy.name}
                                </span>
                              )}
                              <span>{formatDateTime(version.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
