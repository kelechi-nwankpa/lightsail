/**
 * Framework Enablement Service
 *
 * When an organization enables a compliance framework, this service:
 * 1. Creates Controls for each leaf-level requirement
 * 2. Maps each Control to its source FrameworkRequirement
 * 3. Sets up the org for integration auto-verification
 */

import { prisma } from '../config/db.js';
import { logger } from '../utils/logger.js';

interface EnableFrameworkResult {
  organizationFrameworkId: string;
  controlsCreated: number;
  controlsSkipped: number;
  mappingsCreated: number;
}

/**
 * Enable a framework for an organization and generate controls
 */
export async function enableFrameworkWithControls(
  organizationId: string,
  frameworkId: string
): Promise<EnableFrameworkResult> {
  // Get the framework with all requirements
  const framework = await prisma.framework.findUnique({
    where: { id: frameworkId },
    include: {
      requirements: {
        orderBy: { code: 'asc' },
      },
    },
  });

  if (!framework) {
    throw new Error('Framework not found');
  }

  // Build a set of parent IDs to identify leaf requirements
  const parentIds = new Set(
    framework.requirements.filter((r) => r.parentId).map((r) => r.parentId!)
  );

  // Leaf requirements are those that have no children (not in parentIds set)
  const leafRequirements = framework.requirements.filter((r) => !parentIds.has(r.id));

  logger.info(`Enabling ${framework.name} for org ${organizationId}`, {
    totalRequirements: framework.requirements.length,
    leafRequirements: leafRequirements.length,
  });

  // Check for existing controls in this org that might already be mapped to these requirements
  const existingMappings = await prisma.controlFrameworkMapping.findMany({
    where: {
      control: { organizationId, deletedAt: null },
      frameworkRequirementId: { in: leafRequirements.map((r) => r.id) },
    },
    select: { frameworkRequirementId: true },
  });

  const alreadyMappedRequirementIds = new Set(existingMappings.map((m) => m.frameworkRequirementId));

  // Filter to requirements that don't have controls yet
  const requirementsNeedingControls = leafRequirements.filter(
    (r) => !alreadyMappedRequirementIds.has(r.id)
  );

  logger.info(`Creating controls for ${requirementsNeedingControls.length} requirements`, {
    skipping: alreadyMappedRequirementIds.size,
  });

  // Use a transaction to create everything atomically
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create or update the OrganizationFramework record
    const orgFramework = await tx.organizationFramework.upsert({
      where: {
        organizationId_frameworkId: {
          organizationId,
          frameworkId,
        },
      },
      update: {
        status: 'active',
      },
      create: {
        organizationId,
        frameworkId,
        status: 'active',
      },
    });

    // 2. Create controls and mappings for each requirement
    let controlsCreated = 0;
    let mappingsCreated = 0;

    for (const requirement of requirementsNeedingControls) {
      // Generate a control code from the requirement code
      // e.g., "A.5.1" becomes "CTRL-A.5.1"
      const controlCode = `CTRL-${requirement.code}`;

      // Create the control
      const control = await tx.control.create({
        data: {
          organizationId,
          code: controlCode,
          name: requirement.name,
          description: requirement.description || undefined,
          implementationStatus: 'not_started',
          implementationNotes: requirement.guidance || undefined,
          isAutomated: false,
          reviewFrequencyDays: 90,
        },
      });

      controlsCreated++;

      // Create the mapping to the framework requirement
      await tx.controlFrameworkMapping.create({
        data: {
          controlId: control.id,
          frameworkRequirementId: requirement.id,
          coverage: 'full',
          notes: `Auto-generated when ${framework.name} was enabled`,
        },
      });

      mappingsCreated++;
    }

    return {
      organizationFrameworkId: orgFramework.id,
      controlsCreated,
      controlsSkipped: alreadyMappedRequirementIds.size,
      mappingsCreated,
    };
  });

  logger.info(`Framework ${framework.name} enabled successfully`, result);

  return result;
}

/**
 * Check if a framework is already enabled for an organization
 */
export async function isFrameworkEnabled(
  organizationId: string,
  frameworkId: string
): Promise<boolean> {
  const existing = await prisma.organizationFramework.findUnique({
    where: {
      organizationId_frameworkId: {
        organizationId,
        frameworkId,
      },
    },
  });

  return !!existing;
}

/**
 * Get statistics about what enabling a framework would create
 */
export async function getFrameworkEnablementPreview(
  organizationId: string,
  frameworkId: string
): Promise<{
  framework: { code: string; name: string };
  totalRequirements: number;
  leafRequirements: number;
  existingControls: number;
  controlsToCreate: number;
}> {
  const framework = await prisma.framework.findUnique({
    where: { id: frameworkId },
    include: {
      requirements: true,
    },
  });

  if (!framework) {
    throw new Error('Framework not found');
  }

  // Build parent IDs set
  const parentIds = new Set(
    framework.requirements.filter((r) => r.parentId).map((r) => r.parentId!)
  );

  const leafRequirements = framework.requirements.filter((r) => !parentIds.has(r.id));

  // Check existing mappings
  const existingMappings = await prisma.controlFrameworkMapping.findMany({
    where: {
      control: { organizationId, deletedAt: null },
      frameworkRequirementId: { in: leafRequirements.map((r) => r.id) },
    },
    select: { frameworkRequirementId: true },
  });

  return {
    framework: { code: framework.code, name: framework.name },
    totalRequirements: framework.requirements.length,
    leafRequirements: leafRequirements.length,
    existingControls: existingMappings.length,
    controlsToCreate: leafRequirements.length - existingMappings.length,
  };
}
