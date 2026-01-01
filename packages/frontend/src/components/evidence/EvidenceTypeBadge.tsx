import { FileText, Image, Terminal, Settings, FileBarChart } from 'lucide-react';
import type { EvidenceType } from '@lightsail/shared';
import { cn } from '../../lib/utils';

interface EvidenceTypeBadgeProps {
  type: EvidenceType;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

const typeConfig: Record<EvidenceType, { icon: React.ElementType; label: string; color: string; bgColor: string }> = {
  document: {
    icon: FileText,
    label: 'Document',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  screenshot: {
    icon: Image,
    label: 'Screenshot',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  log: {
    icon: Terminal,
    label: 'Log',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
  },
  config: {
    icon: Settings,
    label: 'Config',
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
  },
  report: {
    icon: FileBarChart,
    label: 'Report',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
};

export function EvidenceTypeBadge({ type, showLabel = true, size = 'sm' }: EvidenceTypeBadgeProps) {
  const config = typeConfig[type];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        config.bgColor,
        config.color,
        sizeClasses[size]
      )}
    >
      <Icon className={iconSizes[size]} />
      {showLabel && config.label}
    </span>
  );
}
