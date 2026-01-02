import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';
import { getRiskScoreLevel } from '../../types/risks';

interface RiskScoreBadgeProps {
  score: number | null;
  label?: string;
  className?: string;
}

export function RiskScoreBadge({ score, label, className }: RiskScoreBadgeProps) {
  const level = getRiskScoreLevel(score);

  const levelStyles = {
    low: 'bg-green-100 text-green-700 border-green-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    critical: 'bg-red-100 text-red-700 border-red-200',
  };

  const levelLabels = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium gap-1',
        levelStyles[level],
        className
      )}
    >
      <span className="font-semibold">{score ?? '-'}</span>
      {label ? label : levelLabels[level]}
    </Badge>
  );
}
