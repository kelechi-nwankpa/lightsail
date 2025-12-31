import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Button } from '../ui/button';
import type { CreateControlInput, UpdateControlInput, ControlListItem } from '../../types/controls';
import type { ControlStatus, RiskLevel } from '@lightsail/shared';

interface ControlFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  control?: ControlListItem;
  onSubmit: (data: CreateControlInput | UpdateControlInput) => Promise<void>;
  isLoading?: boolean;
}

export function ControlForm({ open, onOpenChange, control, onSubmit, isLoading }: ControlFormProps) {
  const isEditing = !!control;

  const [formData, setFormData] = useState<CreateControlInput & { implementationStatus?: ControlStatus; implementationNotes?: string }>({
    code: control?.code || '',
    name: control?.name || '',
    description: control?.description || '',
    riskLevel: control?.riskLevel || undefined,
    reviewFrequencyDays: control?.reviewFrequencyDays || 90,
    implementationStatus: control?.implementationStatus,
    implementationNotes: control?.implementationNotes || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data: CreateControlInput | UpdateControlInput = {
      code: formData.code || undefined,
      name: formData.name,
      description: formData.description || undefined,
      riskLevel: formData.riskLevel || undefined,
      reviewFrequencyDays: formData.reviewFrequencyDays,
    };

    if (isEditing) {
      (data as UpdateControlInput).implementationStatus = formData.implementationStatus;
      (data as UpdateControlInput).implementationNotes = formData.implementationNotes || undefined;
    }

    await onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Control' : 'Create Control'}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Update the control details below.'
                : 'Add a new control to your compliance program.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="code" className="text-right text-sm font-medium">
                Code
              </label>
              <Input
                id="code"
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="col-span-3"
                placeholder="e.g., AC-001"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="name" className="text-right text-sm font-medium">
                Name *
              </label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="col-span-3"
                placeholder="Control name"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <label htmlFor="description" className="text-right text-sm font-medium pt-2">
                Description
              </label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="col-span-3"
                placeholder="Describe the control..."
                rows={3}
              />
            </div>

            {isEditing && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right text-sm font-medium">
                    Status
                  </label>
                  <Select
                    value={formData.implementationStatus}
                    onValueChange={(value) => setFormData({ ...formData, implementationStatus: value as ControlStatus })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_started">Not Started</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="implemented">Implemented</SelectItem>
                      <SelectItem value="not_applicable">Not Applicable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-start gap-4">
                  <label htmlFor="notes" className="text-right text-sm font-medium pt-2">
                    Notes
                  </label>
                  <Textarea
                    id="notes"
                    value={formData.implementationNotes || ''}
                    onChange={(e) => setFormData({ ...formData, implementationNotes: e.target.value })}
                    className="col-span-3"
                    placeholder="Implementation notes..."
                    rows={2}
                  />
                </div>
              </>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium">
                Risk Level
              </label>
              <Select
                value={formData.riskLevel || 'none'}
                onValueChange={(value) => setFormData({ ...formData, riskLevel: value === 'none' ? undefined : value as RiskLevel })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select risk level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not Set</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="frequency" className="text-right text-sm font-medium">
                Review (days)
              </label>
              <Input
                id="frequency"
                type="number"
                min={1}
                max={365}
                value={formData.reviewFrequencyDays}
                onChange={(e) => setFormData({ ...formData, reviewFrequencyDays: parseInt(e.target.value) || 90 })}
                className="col-span-3"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.name}>
              {isLoading ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
