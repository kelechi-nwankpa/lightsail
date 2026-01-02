import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';
import type { RiskCategory } from '@lightsail/shared';
import { RISK_CATEGORY_LABELS } from '../../types/risks';
import {
  Settings,
  Cpu,
  Shield,
  DollarSign,
  Users,
  Target,
} from 'lucide-react';

interface RiskCategoryBadgeProps {
  category: RiskCategory;
  className?: string;
}

const categoryStyles: Record<RiskCategory, { bg: string; text: string; icon: React.ElementType }> = {
  operational: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Settings },
  technical: { bg: 'bg-purple-100', text: 'text-purple-700', icon: Cpu },
  compliance: { bg: 'bg-green-100', text: 'text-green-700', icon: Shield },
  financial: { bg: 'bg-amber-100', text: 'text-amber-700', icon: DollarSign },
  reputational: { bg: 'bg-rose-100', text: 'text-rose-700', icon: Users },
  strategic: { bg: 'bg-indigo-100', text: 'text-indigo-700', icon: Target },
};

export function RiskCategoryBadge({ category, className }: RiskCategoryBadgeProps) {
  const { bg, text, icon: Icon } = categoryStyles[category];

  return (
    <Badge
      variant="secondary"
      className={cn(
        'gap-1 font-medium',
        bg,
        text,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {RISK_CATEGORY_LABELS[category]}
    </Badge>
  );
}
