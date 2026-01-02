import { cn } from '../../lib/utils';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';

interface ProvisionalBadgeProps {
  isProvisional: boolean;
  size?: 'sm' | 'default';
  showTooltip?: boolean;
}

export function ProvisionalBadge({
  isProvisional,
  size = 'default',
  showTooltip = true
}: ProvisionalBadgeProps) {
  const badge = (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        isProvisional
          ? "bg-amber-100 text-amber-700"
          : "bg-emerald-100 text-emerald-700",
        size === 'sm' ? "px-1.5 py-0.5 text-xs" : "px-2 py-0.5 text-xs"
      )}
    >
      {isProvisional ? (
        <>
          <AlertTriangle className={cn("h-3 w-3", size === 'sm' && "h-2.5 w-2.5")} />
          Provisional
        </>
      ) : (
        <>
          <ShieldCheck className={cn("h-3 w-3", size === 'sm' && "h-2.5 w-2.5")} />
          Verified
        </>
      )}
    </span>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs max-w-xs">
            {isProvisional
              ? "Manual upload - requires review for verification"
              : "Integration-sourced - automatically verified"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
