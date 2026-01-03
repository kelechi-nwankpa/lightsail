import { Router, type IRouter } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db.js';
import { requireAuth, requireOrganization, validate } from '../middleware/index.js';
import { NotFoundError } from '../utils/errors.js';
import {
  enableFrameworkWithControls,
  getFrameworkEnablementPreview,
} from '../services/framework-enablement.js';

const router: IRouter = Router();

// GET /frameworks - List all available frameworks (public)
router.get('/', async (_req, res) => {
  const frameworks = await prisma.framework.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      code: true,
      name: true,
      version: true,
      description: true,
      _count: {
        select: { requirements: true },
      },
    },
  });

  const data = frameworks.map((f) => ({
    id: f.id,
    code: f.code,
    name: f.name,
    version: f.version,
    description: f.description,
    requirementCount: f._count.requirements,
  }));

  res.json({ success: true, data });
});

// ===========================================
// Protected routes (must be BEFORE /:id routes to avoid matching "enable"/"enabled" as :id)
// ===========================================

// POST /frameworks/enable - Enable a framework for the organization
// This also generates controls from the framework requirements
router.post(
  '/enable',
  requireAuth,
  requireOrganization(),
  validate({
    body: z.object({ frameworkId: z.string().uuid() }),
  }),
  async (req, res) => {
    const { frameworkId } = req.body;
    const organizationId = req.organizationId!;

    // Check framework exists
    const framework = await prisma.framework.findUnique({
      where: { id: frameworkId },
    });

    if (!framework) {
      throw new NotFoundError('Framework not found');
    }

    // Enable framework and generate controls from requirements
    const result = await enableFrameworkWithControls(organizationId, frameworkId);

    res.json({
      success: true,
      data: {
        id: result.organizationFrameworkId,
        frameworkId,
        frameworkName: framework.name,
        controlsCreated: result.controlsCreated,
        controlsSkipped: result.controlsSkipped,
        mappingsCreated: result.mappingsCreated,
        message: `Enabled ${framework.name}. Created ${result.controlsCreated} controls.`,
      },
    });
  }
);

// GET /frameworks/enable/preview - Preview what enabling a framework would create
router.get(
  '/enable/preview',
  requireAuth,
  requireOrganization(),
  validate({
    query: z.object({ frameworkId: z.string().uuid() }),
  }),
  async (req, res) => {
    const { frameworkId } = req.query as { frameworkId: string };
    const organizationId = req.organizationId!;

    const preview = await getFrameworkEnablementPreview(organizationId, frameworkId);

    res.json({
      success: true,
      data: preview,
    });
  }
);

// POST /frameworks/regenerate-controls - Regenerate controls for all enabled frameworks
// Useful when frameworks were enabled before control generation was implemented
router.post(
  '/regenerate-controls',
  requireAuth,
  requireOrganization(),
  async (req, res) => {
    const organizationId = req.organizationId!;

    // Get all enabled frameworks for this org
    const enabledFrameworks = await prisma.organizationFramework.findMany({
      where: { organizationId },
      include: { framework: true },
    });

    if (enabledFrameworks.length === 0) {
      res.json({
        success: true,
        data: {
          message: 'No frameworks enabled',
          totalControlsCreated: 0,
        },
      });
      return;
    }

    let totalControlsCreated = 0;
    const results: Array<{ framework: string; controlsCreated: number; controlsSkipped: number }> = [];

    for (const ef of enabledFrameworks) {
      const result = await enableFrameworkWithControls(organizationId, ef.frameworkId);
      totalControlsCreated += result.controlsCreated;
      results.push({
        framework: ef.framework.name,
        controlsCreated: result.controlsCreated,
        controlsSkipped: result.controlsSkipped,
      });
    }

    res.json({
      success: true,
      data: {
        message: `Generated ${totalControlsCreated} controls across ${enabledFrameworks.length} frameworks`,
        totalControlsCreated,
        results,
      },
    });
  }
);

// POST /frameworks/disable - Disable a framework for the organization
router.post(
  '/disable',
  requireAuth,
  requireOrganization(),
  validate({
    body: z.object({ frameworkId: z.string().uuid() }),
  }),
  async (req, res) => {
    const { frameworkId } = req.body;
    const organizationId = req.organizationId!;

    // Check if framework is enabled
    const orgFramework = await prisma.organizationFramework.findUnique({
      where: {
        organizationId_frameworkId: {
          organizationId,
          frameworkId,
        },
      },
    });

    if (!orgFramework) {
      throw new NotFoundError('Framework is not enabled for this organization');
    }

    // Delete the organization-framework relationship
    await prisma.organizationFramework.delete({
      where: { id: orgFramework.id },
    });

    res.json({
      success: true,
      data: { message: 'Framework disabled successfully' },
    });
  }
);

// GET /frameworks/enabled - List organization's enabled frameworks with progress
router.get('/enabled', requireAuth, requireOrganization(), async (req, res) => {
  const organizationId = req.organizationId!;

  const enabledFrameworks = await prisma.organizationFramework.findMany({
    where: { organizationId },
    include: {
      framework: {
        include: {
          requirements: {
            where: { parentId: { not: null } }, // Only count leaf requirements
            select: { id: true },
          },
        },
      },
    },
  });

  // Get control mappings for progress calculation
  const mappings = await prisma.controlFrameworkMapping.findMany({
    where: {
      frameworkRequirement: {
        frameworkId: { in: enabledFrameworks.map((ef) => ef.frameworkId) },
      },
      control: { organizationId, deletedAt: null },
    },
    select: {
      frameworkRequirementId: true,
      coverage: true,
      control: {
        select: { implementationStatus: true },
      },
    },
  });

  // Build a map from requirement ID to framework ID for efficient lookup
  const requirementToFramework = new Map<string, string>();
  for (const ef of enabledFrameworks) {
    for (const req of ef.framework.requirements) {
      requirementToFramework.set(req.id, ef.frameworkId);
    }
  }

  // Group mappings by framework
  const mappingsByFramework = new Map<string, typeof mappings>();
  for (const m of mappings) {
    const frameworkId = requirementToFramework.get(m.frameworkRequirementId);
    if (frameworkId) {
      const existing = mappingsByFramework.get(frameworkId) || [];
      existing.push(m);
      mappingsByFramework.set(frameworkId, existing);
    }
  }

  const data = enabledFrameworks.map((ef) => {
    const totalRequirements = ef.framework.requirements.length;
    const frameworkMappings = mappingsByFramework.get(ef.frameworkId) || [];

    // Count implemented requirements
    const implementedRequirements = new Set(
      frameworkMappings
        .filter((m) => m.control.implementationStatus === 'implemented')
        .map((m) => m.frameworkRequirementId)
    ).size;

    const progress = totalRequirements > 0 ? Math.round((implementedRequirements / totalRequirements) * 100) : 0;

    return {
      id: ef.id,
      frameworkId: ef.frameworkId,
      code: ef.framework.code,
      name: ef.framework.name,
      version: ef.framework.version,
      enabledAt: ef.createdAt,
      totalRequirements,
      implementedRequirements,
      progress,
    };
  });

  res.json({ success: true, data });
});

// ===========================================
// Public parameterized routes (after specific routes)
// ===========================================

// GET /frameworks/:id - Get framework with requirements tree
router.get(
  '/:id',
  validate({
    params: z.object({ id: z.string().uuid() }),
  }),
  async (req, res) => {
    const { id } = req.params;

    const framework = await prisma.framework.findUnique({
      where: { id },
      include: {
        requirements: {
          orderBy: { code: 'asc' },
        },
      },
    });

    if (!framework) {
      throw new NotFoundError('Framework not found');
    }

    // Build hierarchical tree
    type ReqWithChildren = (typeof framework.requirements)[0] & { children: typeof framework.requirements };
    const requirementsMap = new Map<string, ReqWithChildren>(
      framework.requirements.map((r) => [r.id, { ...r, children: [] }])
    );

    const rootRequirements: ReqWithChildren[] = [];

    for (const req of framework.requirements) {
      const node = requirementsMap.get(req.id)!;
      if (req.parentId) {
        const parent = requirementsMap.get(req.parentId);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        rootRequirements.push(node);
      }
    }

    res.json({
      success: true,
      data: {
        id: framework.id,
        code: framework.code,
        name: framework.name,
        version: framework.version,
        description: framework.description,
        requirements: rootRequirements,
      },
    });
  }
);

// GET /frameworks/:id/requirements - Get flat list of requirements
router.get(
  '/:id/requirements',
  validate({
    params: z.object({ id: z.string().uuid() }),
  }),
  async (req, res) => {
    const { id } = req.params;

    const framework = await prisma.framework.findUnique({
      where: { id },
    });

    if (!framework) {
      throw new NotFoundError('Framework not found');
    }

    const requirements = await prisma.frameworkRequirement.findMany({
      where: { frameworkId: id },
      orderBy: { code: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        guidance: true,
        parentId: true,
      },
    });

    res.json({ success: true, data: requirements });
  }
);

export const frameworksRouter: IRouter = router;
