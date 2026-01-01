import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { FileUpload } from './FileUpload';
import { useEvidenceMutations } from '../../hooks/use-evidence';
import { EVIDENCE_TYPES, EVIDENCE_TYPE_LABELS } from '../../types/evidence';
import type { EvidenceDetail, CreateEvidenceInput, UpdateEvidenceInput } from '../../types/evidence';
import type { EvidenceType } from '@lightsail/shared';
import { Upload, FileText } from 'lucide-react';

interface EvidenceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evidence?: EvidenceDetail | null;
  onSuccess: (isEdit: boolean) => void;
}

interface UploadedFile {
  fileKey: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

export function EvidenceFormDialog({
  open,
  onOpenChange,
  evidence,
  onSuccess,
}: EvidenceFormDialogProps) {
  const isEditing = !!evidence;
  const { createEvidence, updateEvidence, isLoading } = useEvidenceMutations();

  const [activeTab, setActiveTab] = useState<'upload' | 'manual'>('upload');
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'document' as EvidenceType,
    source: 'manual',
    fileName: '',
    validFrom: '',
    validUntil: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when dialog opens/closes or evidence changes
  useEffect(() => {
    if (open) {
      if (evidence) {
        setFormData({
          title: evidence.title,
          description: evidence.description || '',
          type: evidence.type,
          source: evidence.source,
          fileName: evidence.fileName || '',
          validFrom: evidence.validFrom?.split('T')[0] ?? '',
          validUntil: evidence.validUntil?.split('T')[0] ?? '',
        });
        setActiveTab('manual'); // Show manual tab when editing
      } else {
        setFormData({
          title: '',
          description: '',
          type: 'document',
          source: 'manual',
          fileName: '',
          validFrom: '',
          validUntil: '',
        });
        setActiveTab('upload');
        setUploadedFile(null);
      }
      setErrors({});
    }
  }, [open, evidence]);

  // Auto-fill title from uploaded file name if title is empty
  useEffect(() => {
    if (uploadedFile && !formData.title) {
      // Remove extension and clean up filename for title
      const nameWithoutExt = uploadedFile.fileName.replace(/\.[^.]+$/, '');
      const cleanName = nameWithoutExt.replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
      setFormData((prev) => ({
        ...prev,
        title: cleanName,
        fileName: uploadedFile.fileName,
      }));
    }
  }, [uploadedFile, formData.title]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (formData.validFrom && formData.validUntil) {
      if (new Date(formData.validFrom) > new Date(formData.validUntil)) {
        newErrors.validUntil = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      if (isEditing && evidence) {
        const input: UpdateEvidenceInput = {
          title: formData.title,
          description: formData.description || undefined,
          type: formData.type,
          validFrom: formData.validFrom || undefined,
          validUntil: formData.validUntil || undefined,
        };

        await updateEvidence(evidence.id, input);
      } else {
        const input: CreateEvidenceInput = {
          title: formData.title,
          description: formData.description || undefined,
          type: formData.type,
          source: uploadedFile ? 'upload' : formData.source,
          fileKey: uploadedFile?.fileKey,
          fileName: uploadedFile?.fileName || formData.fileName || undefined,
          fileSize: uploadedFile?.fileSize,
          fileType: uploadedFile?.fileType,
          validFrom: formData.validFrom || undefined,
          validUntil: formData.validUntil || undefined,
        };

        await createEvidence(input);
      }

      onOpenChange(false);
      onSuccess(isEditing);
    } catch (err) {
      console.error('Failed to save evidence:', err);
      setErrors({ submit: 'Failed to save evidence. Please try again.' });
    }
  };

  const handleUploadComplete = (file: UploadedFile) => {
    setUploadedFile(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Evidence' : 'Add New Evidence'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* File Upload / Manual Entry Tabs (only for new evidence) */}
            {!isEditing && (
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'upload' | 'manual')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upload" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Upload File
                  </TabsTrigger>
                  <TabsTrigger value="manual" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Manual Entry
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="mt-4">
                  <FileUpload
                    onUploadComplete={handleUploadComplete}
                    onError={(error) => setErrors({ upload: error })}
                    maxFiles={1}
                  />
                  {uploadedFile && (
                    <p className="text-sm text-green-600 mt-2">
                      File uploaded: {uploadedFile.fileName}
                    </p>
                  )}
                  {errors.upload && (
                    <p className="text-sm text-destructive mt-2">{errors.upload}</p>
                  )}
                </TabsContent>

                <TabsContent value="manual" className="mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="fileName">File Reference</Label>
                    <Input
                      id="fileName"
                      value={formData.fileName}
                      onChange={(e) => setFormData({ ...formData, fileName: e.target.value })}
                      placeholder="e.g., policy-screenshot-2024.png"
                    />
                    <p className="text-xs text-muted-foreground">
                      Optional: Enter a file name for reference when not uploading a file.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            )}

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., AWS IAM Policy Screenshot"
                className={errors.title ? 'border-destructive' : ''}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title}</p>
              )}
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as EvidenceType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVIDENCE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {EVIDENCE_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this evidence demonstrates..."
                rows={3}
              />
            </div>

            {/* Validity Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="validFrom">Valid From</Label>
                <Input
                  id="validFrom"
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="validUntil">Valid Until</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  className={errors.validUntil ? 'border-destructive' : ''}
                />
                {errors.validUntil && (
                  <p className="text-sm text-destructive">{errors.validUntil}</p>
                )}
              </div>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <p className="text-sm text-destructive">{errors.submit}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? 'Saving...'
                : isEditing
                ? 'Save Changes'
                : 'Add Evidence'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
