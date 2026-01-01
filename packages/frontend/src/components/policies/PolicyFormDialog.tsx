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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { PolicyEditor } from './PolicyEditor';
import { usePolicyMutations } from '../../hooks/use-policies';
import { POLICY_CATEGORIES } from '../../types/policies';
import type { PolicyDetail, CreatePolicyInput, UpdatePolicyInput } from '../../types/policies';

interface PolicyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policy?: PolicyDetail | null; // If provided, we're editing
  onSuccess: (isEdit: boolean) => void;
}

export function PolicyFormDialog({
  open,
  onOpenChange,
  policy,
  onSuccess,
}: PolicyFormDialogProps) {
  const isEditing = !!policy;
  const { createPolicy, updatePolicy, isLoading } = usePolicyMutations();

  const [formData, setFormData] = useState({
    title: '',
    code: '',
    description: '',
    category: '',
    content: '',
    changeSummary: '',
    reviewFrequencyDays: 365,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when dialog opens/closes or policy changes
  useEffect(() => {
    if (open) {
      if (policy) {
        const latestVersion = policy.versions[0];
        setFormData({
          title: policy.title,
          code: policy.code || '',
          description: policy.description || '',
          category: policy.category || '',
          content: latestVersion?.content || '',
          changeSummary: '',
          reviewFrequencyDays: policy.reviewFrequencyDays,
        });
      } else {
        setFormData({
          title: '',
          code: '',
          description: '',
          category: '',
          content: '',
          changeSummary: '',
          reviewFrequencyDays: 365,
        });
      }
      setErrors({});
    }
  }, [open, policy]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Policy content is required';
    }

    if (isEditing && formData.content !== policy?.versions[0]?.content && !formData.changeSummary.trim()) {
      newErrors.changeSummary = 'Please describe what changed in this version';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      if (isEditing && policy) {
        const input: UpdatePolicyInput = {
          title: formData.title,
          description: formData.description || undefined,
          category: formData.category || undefined,
          reviewFrequencyDays: formData.reviewFrequencyDays,
        };

        // Only include content and changeSummary if content changed
        if (formData.content !== policy.versions[0]?.content) {
          input.content = formData.content;
          input.changeSummary = formData.changeSummary;
        }

        await updatePolicy(policy.id, input);
      } else {
        const input: CreatePolicyInput = {
          title: formData.title,
          code: formData.code || undefined,
          description: formData.description || undefined,
          category: formData.category || undefined,
          content: formData.content,
          reviewFrequencyDays: formData.reviewFrequencyDays,
        };

        await createPolicy(input);
      }

      onOpenChange(false);
      onSuccess(isEditing);
    } catch (err) {
      console.error('Failed to save policy:', err);
      setErrors({ submit: 'Failed to save policy. Please try again.' });
    }
  };

  const contentChanged = isEditing && formData.content !== policy?.versions[0]?.content;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Policy' : 'Create New Policy'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-auto">
          <div className="space-y-6 py-4">
            {/* Title and Code */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-2">
                <label className="text-sm font-medium">
                  Title <span className="text-destructive">*</span>
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Information Security Policy"
                  className={errors.title ? 'border-destructive' : ''}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Policy Code</label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., POL-001"
                  disabled={isEditing}
                />
              </div>
            </div>

            {/* Category and Review Frequency */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {POLICY_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Review Frequency</label>
                <Select
                  value={String(formData.reviewFrequencyDays)}
                  onValueChange={(value) => setFormData({ ...formData, reviewFrequencyDays: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="90">Quarterly (90 days)</SelectItem>
                    <SelectItem value="180">Semi-annually (180 days)</SelectItem>
                    <SelectItem value="365">Annually (365 days)</SelectItem>
                    <SelectItem value="730">Every 2 years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this policy's purpose"
              />
            </div>

            {/* Content Editor */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Policy Content <span className="text-destructive">*</span>
              </label>
              <PolicyEditor
                value={formData.content}
                onChange={(content) => setFormData({ ...formData, content })}
                placeholder="Write your policy content here. You can use markdown formatting..."
                minHeight="300px"
              />
              {errors.content && (
                <p className="text-sm text-destructive">{errors.content}</p>
              )}
            </div>

            {/* Change Summary (only when editing and content changed) */}
            {contentChanged && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Change Summary <span className="text-destructive">*</span>
                </label>
                <Input
                  value={formData.changeSummary}
                  onChange={(e) => setFormData({ ...formData, changeSummary: e.target.value })}
                  placeholder="Describe what changed in this version"
                  className={errors.changeSummary ? 'border-destructive' : ''}
                />
                {errors.changeSummary && (
                  <p className="text-sm text-destructive">{errors.changeSummary}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  This will create version {(policy?.versions[0]?.version || 0) + 1}
                </p>
              </div>
            )}

            {/* Submit Error */}
            {errors.submit && (
              <p className="text-sm text-destructive">{errors.submit}</p>
            )}
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading
              ? 'Saving...'
              : isEditing
              ? 'Save Changes'
              : 'Create Policy'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
