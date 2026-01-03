import { Github, Cloud, Mail, Users, ClipboardList, MessageSquare } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { IntegrationType } from '@lightsail/shared';

interface IntegrationTypeBadgeProps {
  type: IntegrationType;
  showLabel?: boolean;
  size?: 'sm' | 'default' | 'lg';
}

const typeConfig: Record<IntegrationType, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  bgColor: string;
  textColor: string;
}> = {
  github: {
    label: 'GitHub',
    icon: Github,
    bgColor: 'bg-gray-900',
    textColor: 'text-white',
  },
  aws: {
    label: 'AWS',
    icon: Cloud,
    bgColor: 'bg-orange-500',
    textColor: 'text-white',
  },
  gsuite: {
    label: 'Google Workspace',
    icon: Mail,
    bgColor: 'bg-blue-500',
    textColor: 'text-white',
  },
  azure_ad: {
    label: 'Azure AD',
    icon: Users,
    bgColor: 'bg-blue-600',
    textColor: 'text-white',
  },
  jira: {
    label: 'Jira',
    icon: ClipboardList,
    bgColor: 'bg-blue-700',
    textColor: 'text-white',
  },
  slack: {
    label: 'Slack',
    icon: MessageSquare,
    bgColor: 'bg-purple-600',
    textColor: 'text-white',
  },
};

const sizeConfig = {
  sm: { iconSize: 'h-3 w-3', padding: 'p-1', text: 'text-xs' },
  default: { iconSize: 'h-4 w-4', padding: 'p-1.5', text: 'text-sm' },
  lg: { iconSize: 'h-5 w-5', padding: 'p-2', text: 'text-base' },
};

export function IntegrationTypeBadge({ type, showLabel = false, size = 'default' }: IntegrationTypeBadgeProps) {
  const config = typeConfig[type];
  const sizeStyles = sizeConfig[size];

  if (!config) return null;

  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "rounded-lg flex items-center justify-center",
          sizeStyles.padding,
          config.bgColor,
          config.textColor
        )}
      >
        <Icon className={sizeStyles.iconSize} />
      </div>
      {showLabel && (
        <span className={cn("font-medium", sizeStyles.text)}>{config.label}</span>
      )}
    </div>
  );
}

export function getIntegrationIcon(type: IntegrationType) {
  return typeConfig[type]?.icon;
}

export function getIntegrationLabel(type: IntegrationType) {
  return typeConfig[type]?.label || type;
}
