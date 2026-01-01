import type { ControlStatus } from '@lightsail/shared';

export interface FrameworkListItem {
  id: string;
  code: string;
  name: string;
  version: string | null;
  description: string | null;
  requirementCount: number;
}

export interface FrameworkRequirementNode {
  id: string;
  code: string;
  name: string;
  description: string | null;
  guidance: string | null;
  parentId: string | null;
  children: FrameworkRequirementNode[];
}

export interface FrameworkDetail {
  id: string;
  code: string;
  name: string;
  version: string | null;
  description: string | null;
  requirements: FrameworkRequirementNode[];
}

export interface EnabledFramework {
  id: string;
  frameworkId: string;
  code: string;
  name: string;
  version: string | null;
  enabledAt: string;
  totalRequirements: number;
  implementedRequirements: number;
  progress: number;
}

export interface RequirementWithMapping extends FrameworkRequirementNode {
  mappedControls: MappedControl[];
}

export interface MappedControl {
  id: string;
  code: string | null;
  name: string;
  implementationStatus: ControlStatus;
  coverage: 'full' | 'partial' | 'minimal';
}
