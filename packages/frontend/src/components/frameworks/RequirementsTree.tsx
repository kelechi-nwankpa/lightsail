import { useState } from 'react';
import { ChevronRight, ChevronDown, FileText, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { cn } from '../../lib/utils';
import type { FrameworkRequirementNode } from '../../types/frameworks';

interface RequirementsTreeProps {
  requirements: FrameworkRequirementNode[];
  selectedId?: string | null;
  onSelect?: (requirement: FrameworkRequirementNode) => void;
  className?: string;
}

interface RequirementNodeProps {
  requirement: FrameworkRequirementNode;
  level: number;
  selectedId?: string | null;
  onSelect?: (requirement: FrameworkRequirementNode) => void;
}

function RequirementNode({
  requirement,
  level,
  selectedId,
  onSelect,
}: RequirementNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 1);
  const hasChildren = requirement.children && requirement.children.length > 0;
  const isSelected = selectedId === requirement.id;
  const isLeaf = !hasChildren;

  return (
    <div className="select-none">
      <div
        className={cn(
          'flex items-center gap-2 py-2 px-2 rounded-md cursor-pointer transition-colors',
          isSelected
            ? 'bg-primary/10 text-primary'
            : 'hover:bg-muted text-foreground',
          level > 0 && 'ml-4'
        )}
        onClick={() => {
          if (hasChildren) {
            setIsExpanded(!isExpanded);
          }
          if (isLeaf && onSelect) {
            onSelect(requirement);
          }
        }}
      >
        {/* Expand/Collapse or Leaf indicator */}
        {hasChildren ? (
          <button
            className="p-0.5 hover:bg-muted-foreground/20 rounded"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        ) : (
          <FileText className="h-4 w-4 text-muted-foreground ml-0.5" />
        )}

        {/* Code badge */}
        <span
          className={cn(
            'text-xs font-mono px-1.5 py-0.5 rounded',
            isSelected ? 'bg-primary/20' : 'bg-muted'
          )}
        >
          {requirement.code}
        </span>

        {/* Name */}
        <span className="flex-1 text-sm truncate">{requirement.name}</span>

        {/* Guidance tooltip */}
        {requirement.guidance && (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="p-1 hover:bg-muted-foreground/20 rounded"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p className="text-xs">{requirement.guidance}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="border-l border-muted ml-4">
          {requirement.children.map((child) => (
            <RequirementNode
              key={child.id}
              requirement={child}
              level={level + 1}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function RequirementsTree({
  requirements,
  selectedId,
  onSelect,
  className,
}: RequirementsTreeProps) {
  if (requirements.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No requirements found</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-1', className)}>
      {requirements.map((requirement) => (
        <RequirementNode
          key={requirement.id}
          requirement={requirement}
          level={0}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
