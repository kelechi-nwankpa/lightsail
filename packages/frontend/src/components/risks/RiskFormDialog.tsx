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
import { useRiskMutations } from '../../hooks/use-risks';
import {
  RISK_CATEGORIES,
  RISK_CATEGORY_LABELS,
  RISK_STATUSES,
  RISK_STATUS_LABELS,
  RISK_LIKELIHOODS,
  RISK_LIKELIHOOD_LABELS,
  RISK_IMPACTS,
  RISK_IMPACT_LABELS,
} from '../../types/risks';
import type { RiskDetail, CreateRiskInput, UpdateRiskInput } from '../../types/risks';
import type { RiskCategory, RiskStatus, RiskLikelihood, RiskImpact } from '@lightsail/shared';

interface RiskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  risk?: RiskDetail | null;
  onSuccess: (isEdit: boolean) => void;
}

export function RiskFormDialog({
  open,
  onOpenChange,
  risk,
  onSuccess,
}: RiskFormDialogProps) {
  const isEditing = !!risk;
  const { createRisk, updateRisk, isLoading } = useRiskMutations();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'operational' as RiskCategory,
    status: 'identified' as RiskStatus,
    likelihood: 'possible' as RiskLikelihood,
    impact: 'moderate' as RiskImpact,
    mitigationPlan: '',
    acceptanceNotes: '',
    dueDate: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when dialog opens/closes or risk changes
  useEffect(() => {
    if (open) {
      if (risk) {
        setFormData({
          title: risk.title,
          description: risk.description || '',
          category: risk.category,
          status: risk.status,
          likelihood: risk.likelihood,
          impact: risk.impact,
          mitigationPlan: risk.mitigationPlan || '',
          acceptanceNotes: risk.acceptanceNotes || '',
          dueDate: risk.dueDate?.split('T')[0] ?? '',
        });
      } else {
        setFormData({
          title: '',
          description: '',
          category: 'operational',
          status: 'identified',
          likelihood: 'possible',
          impact: 'moderate',
          mitigationPlan: '',
          acceptanceNotes: '',
          dueDate: '',
        });
      }
      setErrors({});
    }
  }, [open, risk]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      if (isEditing && risk) {
        const input: UpdateRiskInput = {
          title: formData.title,
          description: formData.description || undefined,
          category: formData.category,
          status: formData.status,
          likelihood: formData.likelihood,
          impact: formData.impact,
          mitigationPlan: formData.mitigationPlan || undefined,
          acceptanceNotes: formData.acceptanceNotes || undefined,
          dueDate: formData.dueDate || undefined,
        };

        await updateRisk(risk.id, input);
      } else {
        const input: CreateRiskInput = {
          title: formData.title,
          description: formData.description || undefined,
          category: formData.category,
          likelihood: formData.likelihood,
          impact: formData.impact,
          mitigationPlan: formData.mitigationPlan || undefined,
          dueDate: formData.dueDate || undefined,
        };

        await createRisk(input);
      }

      onOpenChange(false);
      onSuccess(isEditing);
    } catch (err) {
      console.error('Failed to save risk:', err);
      setErrors({ submit: 'Failed to save risk. Please try again.' });
    }
  };

  // Calculate risk score preview
  const likelihoodScore: Record<RiskLikelihood, number> = {
    rare: 1,
    unlikely: 2,
    possible: 3,
    likely: 4,
    almost_certain: 5,
  };

  const impactScore: Record<RiskImpact, number> = {
    insignificant: 1,
    minor: 2,
    moderate: 3,
    major: 4,
    severe: 5,
  };

  const previewScore = likelihoodScore[formData.likelihood] * impactScore[formData.impact];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Risk' : 'Add New Risk'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Data Breach Risk"
                className={errors.title ? 'border-destructive' : ''}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title}</p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value as RiskCategory })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RISK_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {RISK_CATEGORY_LABELS[category]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status (only for editing) */}
            {isEditing && (
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as RiskStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RISK_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {RISK_STATUS_LABELS[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Likelihood & Impact */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Likelihood</Label>
                <Select
                  value={formData.likelihood}
                  onValueChange={(value) => setFormData({ ...formData, likelihood: value as RiskLikelihood })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RISK_LIKELIHOODS.map((likelihood) => (
                      <SelectItem key={likelihood} value={likelihood}>
                        {RISK_LIKELIHOOD_LABELS[likelihood]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Impact</Label>
                <Select
                  value={formData.impact}
                  onValueChange={(value) => setFormData({ ...formData, impact: value as RiskImpact })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RISK_IMPACTS.map((impact) => (
                      <SelectItem key={impact} value={impact}>
                        {RISK_IMPACT_LABELS[impact]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Risk Score Preview */}
            <div className="p-3 rounded-lg bg-muted">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Calculated Risk Score:</span>
                <span className={`font-semibold ${
                  previewScore <= 4 ? 'text-green-600' :
                  previewScore <= 9 ? 'text-amber-600' :
                  previewScore <= 16 ? 'text-orange-600' :
                  'text-red-600'
                }`}>
                  {previewScore} / 25
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the risk in detail..."
                rows={3}
              />
            </div>

            {/* Mitigation Plan */}
            <div className="space-y-2">
              <Label htmlFor="mitigationPlan">Mitigation Plan</Label>
              <Textarea
                id="mitigationPlan"
                value={formData.mitigationPlan}
                onChange={(e) => setFormData({ ...formData, mitigationPlan: e.target.value })}
                placeholder="How will this risk be mitigated?"
                rows={3}
              />
            </div>

            {/* Acceptance Notes (only for editing) */}
            {isEditing && (
              <div className="space-y-2">
                <Label htmlFor="acceptanceNotes">Acceptance Notes</Label>
                <Textarea
                  id="acceptanceNotes"
                  value={formData.acceptanceNotes}
                  onChange={(e) => setFormData({ ...formData, acceptanceNotes: e.target.value })}
                  placeholder="Notes for risk acceptance..."
                  rows={2}
                />
              </div>
            )}

            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="dueDate">Target Resolution Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
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
                : 'Add Risk'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
