import { useState } from 'react';
import { format, formatDistanceToNow, isAfter, isBefore } from 'date-fns';
import {
  X,
  Calendar,
  User,
  Link2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Pencil,
  Trash2,
  Download,
  Loader2,
} from 'lucide-react';
import { Button } from '../ui/button';
import { EvidenceTypeBadge } from './EvidenceTypeBadge';
import { EvidenceStatusBadge } from './EvidenceStatusBadge';
import { api } from '../../lib/api';
import type { EvidenceDetail } from '../../types/evidence';
import type { EvidenceType, ReviewStatus } from '@lightsail/shared';

interface EvidenceDetailPanelProps {
  evidence: EvidenceDetail | null;
  isLoading: boolean;
  onClose: () => void;
  onEdit: () => void;
  onApprove: () => void;
  onReject: () => void;
  onDelete: () => void;
  onUnlinkControl: (controlId: string) => void;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function EvidenceDetailPanel({
  evidence,
  isLoading,
  onClose,
  onEdit,
  onApprove,
  onReject,
  onDelete,
  onUnlinkControl,
}: EvidenceDetailPanelProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!evidence?.fileKey) return;

    setIsDownloading(true);
    try {
      const response = await api.get<{ downloadUrl: string; fileName: string }>(
        `/evidence/${evidence.id}/download`
      );
      // Open download URL in new tab
      window.open(response.downloadUrl, '_blank');
    } catch (err) {
      console.error('Failed to download file:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading || !evidence) {
    return (
      <div className="w-[420px] h-full bg-background border-l flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="h-6 w-32 bg-muted rounded animate-pulse" />
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 p-4 space-y-4">
          <div className="h-8 bg-muted rounded animate-pulse" />
          <div className="h-24 bg-muted rounded animate-pulse" />
          <div className="h-32 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  const now = new Date();
  const isExpired = evidence.validUntil ? isBefore(new Date(evidence.validUntil), now) : false;
  const isNotYetValid = evidence.validFrom ? isAfter(new Date(evidence.validFrom), now) : false;
  const canReview = evidence.reviewStatus === 'pending';

  return (
    <div className="w-[420px] h-full bg-background border-l flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <EvidenceTypeBadge type={evidence.type as EvidenceType} size="md" />
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <h2 className="text-lg font-semibold">{evidence.title}</h2>
        {evidence.fileName && (
          <div className="flex items-center justify-between mt-1">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {evidence.fileName}
              <span className="text-xs">({formatFileSize(evidence.fileSize)})</span>
            </p>
            {evidence.fileKey && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                disabled={isDownloading}
                className="h-8"
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Status & Actions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Review Status</span>
            <EvidenceStatusBadge status={evidence.reviewStatus as ReviewStatus} size="md" />
          </div>

          {canReview && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-green-600 border-green-200 hover:bg-green-50"
                onClick={onApprove}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                onClick={onReject}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </div>
          )}

          {evidence.reviewedAt && evidence.reviewedBy && (
            <p className="text-xs text-muted-foreground">
              Reviewed by {evidence.reviewedBy.name} on{' '}
              {format(new Date(evidence.reviewedAt), 'MMM d, yyyy')}
              {evidence.reviewNotes && (
                <span className="block mt-1 italic">"{evidence.reviewNotes}"</span>
              )}
            </p>
          )}
        </div>

        {/* Validity Period */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Validity Period</h3>
          <div className="p-3 rounded-lg bg-muted/50 space-y-2">
            {(isExpired || isNotYetValid) && (
              <div className="flex items-center gap-2 text-amber-600 text-sm mb-2">
                <AlertTriangle className="h-4 w-4" />
                {isExpired ? 'This evidence has expired' : 'This evidence is not yet valid'}
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {evidence.validFrom
                  ? format(new Date(evidence.validFrom), 'MMM d, yyyy')
                  : 'No start date'}
                {' → '}
                {evidence.validUntil
                  ? format(new Date(evidence.validUntil), 'MMM d, yyyy')
                  : 'No end date'}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        {evidence.description && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Description</h3>
            <p className="text-sm text-muted-foreground">{evidence.description}</p>
          </div>
        )}

        {/* Collection Info */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Collection Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{evidence.collectedBy?.name || 'Unknown'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {format(new Date(evidence.collectedAt), 'MMM d, yyyy')} (
                {formatDistanceToNow(new Date(evidence.collectedAt), { addSuffix: true })})
              </span>
            </div>
            <div className="text-muted-foreground">
              Source: <span className="capitalize">{evidence.source}</span>
            </div>
          </div>
        </div>

        {/* Linked Controls */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Linked Controls</h3>
            <span className="text-xs text-muted-foreground">
              {evidence.linkedControls.length} control{evidence.linkedControls.length !== 1 ? 's' : ''}
            </span>
          </div>
          {evidence.linkedControls.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              No controls linked to this evidence.
            </p>
          ) : (
            <div className="space-y-2">
              {evidence.linkedControls.map((control) => (
                <div
                  key={control.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50 group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Link2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      {control.code && (
                        <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded mr-2">
                          {control.code}
                        </span>
                      )}
                      <span className="text-sm truncate">{control.name}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onUnlinkControl(control.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onEdit} className="flex-1">
          <Pencil className="h-4 w-4 mr-1" />
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
