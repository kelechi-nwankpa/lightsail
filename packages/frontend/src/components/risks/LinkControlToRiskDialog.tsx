import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { useRiskMutations } from '../../hooks/use-risks';
import { useControls } from '../../hooks/use-controls';
import type { RiskListItem, LinkControlInput } from '../../types/risks';

interface LinkControlToRiskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  risk: RiskListItem | null;
  onSuccess: () => void;
}

export function LinkControlToRiskDialog({
  open,
  onOpenChange,
  risk,
  onSuccess,
}: LinkControlToRiskDialogProps) {
  const { linkControl, isLoading } = useRiskMutations();
  const { controls, isLoading: isLoadingControls } = useControls({ pageSize: 100 });

  const [formData, setFormData] = useState<LinkControlInput>({
    controlId: '',
    effectiveness: 'partial',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Filter out already linked controls
  const linkedControlIds = new Set(risk?.linkedControls.map((c) => c.id) || []);
  const availableControls = controls.filter((c) => !linkedControlIds.has(c.id));

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        controlId: '',
        effectiveness: 'partial',
        notes: '',
      });
      setErrors({});
    }
  }, [open]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.controlId) {
      newErrors.controlId = 'Please select a control';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate() || !risk) return;

    try {
      await linkControl(risk.id, formData);
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      console.error('Failed to link control:', err);
      setErrors({ submit: 'Failed to link control. Please try again.' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Link Control to Risk</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Control Selection */}
            <div className="space-y-2">
              <Label>
                Control <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.controlId}
                onValueChange={(value) => setFormData({ ...formData, controlId: value })}
                disabled={isLoadingControls}
              >
                <SelectTrigger className={errors.controlId ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select a control..." />
                </SelectTrigger>
                <SelectContent>
                  {availableControls.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No available controls
                    </SelectItem>
                  ) : (
                    availableControls.map((control) => (
                      <SelectItem key={control.id} value={control.id}>
                        {control.code ? `${control.code}: ` : ''}{control.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.controlId && (
                <p className="text-sm text-destructive">{errors.controlId}</p>
              )}
            </div>

            {/* Effectiveness */}
            <div className="space-y-2">
              <Label>Control Effectiveness</Label>
              <Select
                value={formData.effectiveness}
                onValueChange={(value) =>
                  setFormData({ ...formData, effectiveness: value as 'effective' | 'partial' | 'ineffective' })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="effective">Effective</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="ineffective">Ineffective</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                How effective is this control at mitigating this risk?
              </p>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Optional notes about this control's relationship to the risk..."
                rows={2}
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
            <Button type="submit" disabled={isLoading || availableControls.length === 0}>
              {isLoading ? 'Linking...' : 'Link Control'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
