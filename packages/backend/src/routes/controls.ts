import { Router, type IRouter } from 'express';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '../config/db.js';
import { requireAuth, requireOrganization, validate } from '../middleware/index.js';
import { NotFoundError } from '../utils/errors.js';
import {
  createControlSchema,
  updateControlSchema,
  controlFiltersSchema,
} from '@lightsail/shared';

const router: IRouter = Router();

// All routes require auth and organization
router.use(requireAuth, requireOrganization());

// GET /controls - List controls with filters & pagination
router.get(
  '/',
  validate({ query: controlFiltersSchema }),
  async (req, res) => {
    const organizationId = req.organizationId!;
    const filters = req.query as unknown as z.infer<typeof controlFiltersSchema>;
    const { page, pageSize, status, ownerId, frameworkId, riskLevel, search } = filters;

    const where: Prisma.ControlWhereInput = {
      organizationId,
      deletedAt: null,
    };

    if (status) {
      where.implementationStatus = status;
    }

    if (ownerId) {
      where.ownerId = ownerId;
    }

    if (riskLevel) {
      where.riskLevel = riskLevel;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // If filtering by framework, we need a subquery for controls with mappings to that framework
    if (frameworkId) {
      const controlIdsWithFramework = await prisma.controlFrameworkMapping.findMany({
        where: {
          frameworkRequirement: { frameworkId },
          control: { organizationId, deletedAt: null },
        },
        select: { controlId: true },
        distinct: ['controlId'],
      });

      where.id = { in: controlIdsWithFramework.map((c) => c.controlId) };
    }

    const [controls, total] = await Promise.all([
      prisma.control.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          frameworkMappings: {
            include: {
              frameworkRequirement: {
                include: {
                  framework: { select: { id: true, code: true, name: true } },
                },
              },
            },
          },
          _count: {
            select: { evidenceLinks: true },
          },
        },
      }),
      prisma.control.count({ where }),
    ]);

    const data = controls.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      description: c.description,
      implementationStatus: c.implementationStatus,
      implementationNotes: c.implementationNotes,
      ownerId: c.ownerId,
      riskLevel: c.riskLevel,
      reviewFrequencyDays: c.reviewFrequencyDays,
      lastReviewedAt: c.lastReviewedAt,
      nextReviewAt: c.nextReviewAt,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      evidenceCount: c._count.evidenceLinks,
      frameworkMappings: c.frameworkMappings.map((m) => ({
        id: m.id,
        requirementId: m.frameworkRequirementId,
        requirementCode: m.frameworkRequirement.code,
        requirementName: m.frameworkRequirement.name,
        frameworkId: m.frameworkRequirement.framework.id,
        frameworkCode: m.frameworkRequirement.framework.code,
        frameworkName: m.frameworkRequirement.framework.name,
        coverage: m.coverage,
        notes: m.notes,
      })),
    }));

    res.json({
      success: true,
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  }
);

// GET /controls/:id - Get control with mappings & evidence
router.get(
  '/:id',
  validate({ params: z.object({ id: z.string().uuid() }) }),
  async (req, res) => {
    const { id } = req.params;
    const organizationId = req.organizationId!;

    const control = await prisma.control.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        frameworkMappings: {
          include: {
            frameworkRequirement: {
              include: {
                framework: { select: { id: true, code: true, name: true } },
              },
            },
          },
        },
        evidenceLinks: {
          include: {
            evidence: {
              select: {
                id: true,
                title: true,
                type: true,
                source: true,
                reviewStatus: true,
                validFrom: true,
                validUntil: true,
                createdAt: true,
                deletedAt: true,
              },
            },
          },
          take: 10,
        },
      },
    });

    if (!control) {
      throw new NotFoundError('Control not found');
    }

    // Filter out deleted evidence
    const evidence = control.evidenceLinks
      .filter((link) => !link.evidence.deletedAt)
      .map((link) => ({
        id: link.evidence.id,
        title: link.evidence.title,
        type: link.evidence.type,
        source: link.evidence.source,
        reviewStatus: link.evidence.reviewStatus,
        validFrom: link.evidence.validFrom,
        validUntil: link.evidence.validUntil,
        createdAt: link.evidence.createdAt,
      }));

    res.json({
      success: true,
      data: {
        id: control.id,
        code: control.code,
        name: control.name,
        description: control.description,
        implementationStatus: control.implementationStatus,
        implementationNotes: control.implementationNotes,
        ownerId: control.ownerId,
        riskLevel: control.riskLevel,
        reviewFrequencyDays: control.reviewFrequencyDays,
        lastReviewedAt: control.lastReviewedAt,
        nextReviewAt: control.nextReviewAt,
        createdAt: control.createdAt,
        updatedAt: control.updatedAt,
        frameworkMappings: control.frameworkMappings.map((m) => ({
          id: m.id,
          requirementId: m.frameworkRequirementId,
          requirementCode: m.frameworkRequirement.code,
          requirementName: m.frameworkRequirement.name,
          requirementDescription: m.frameworkRequirement.description,
          frameworkId: m.frameworkRequirement.framework.id,
          frameworkCode: m.frameworkRequirement.framework.code,
          frameworkName: m.frameworkRequirement.framework.name,
          coverage: m.coverage,
          notes: m.notes,
        })),
        evidence,
      },
    });
  }
);

// POST /controls - Create control
router.post(
  '/',
  validate({ body: createControlSchema }),
  async (req, res) => {
    const organizationId = req.organizationId!;
    const { frameworkRequirementIds, ...data } = req.body as z.infer<typeof createControlSchema>;

    const control = await prisma.control.create({
      data: {
        ...data,
        organizationId,
        frameworkMappings: frameworkRequirementIds?.length
          ? {
              create: frameworkRequirementIds.map((frameworkRequirementId) => ({
                frameworkRequirementId,
                coverage: 'full',
              })),
            }
          : undefined,
      },
      include: {
        frameworkMappings: {
          include: {
            frameworkRequirement: {
              include: {
                framework: { select: { id: true, code: true, name: true } },
              },
            },
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: control.id,
        code: control.code,
        name: control.name,
        description: control.description,
        implementationStatus: control.implementationStatus,
        ownerId: control.ownerId,
        riskLevel: control.riskLevel,
        createdAt: control.createdAt,
        frameworkMappings: control.frameworkMappings.map((m) => ({
          id: m.id,
          requirementId: m.frameworkRequirementId,
          requirementCode: m.frameworkRequirement.code,
          requirementName: m.frameworkRequirement.name,
          frameworkCode: m.frameworkRequirement.framework.code,
          coverage: m.coverage,
        })),
      },
    });
  }
);

// PATCH /controls/:id - Update control
router.patch(
  '/:id',
  validate({
    params: z.object({ id: z.string().uuid() }),
    body: updateControlSchema,
  }),
  async (req, res) => {
    const { id } = req.params;
    const organizationId = req.organizationId!;

    // Check control exists
    const existing = await prisma.control.findFirst({
      where: { id, organizationId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundError('Control not found');
    }

    const control = await prisma.control.update({
      where: { id },
      data: req.body,
    });

    res.json({
      success: true,
      data: {
        id: control.id,
        code: control.code,
        name: control.name,
        description: control.description,
        implementationStatus: control.implementationStatus,
        implementationNotes: control.implementationNotes,
        ownerId: control.ownerId,
        riskLevel: control.riskLevel,
        reviewFrequencyDays: control.reviewFrequencyDays,
        updatedAt: control.updatedAt,
      },
    });
  }
);

// DELETE /controls/:id - Soft delete control
router.delete(
  '/:id',
  validate({ params: z.object({ id: z.string().uuid() }) }),
  async (req, res) => {
    const { id } = req.params;
    const organizationId = req.organizationId!;

    const control = await prisma.control.findFirst({
      where: { id, organizationId, deletedAt: null },
    });

    if (!control) {
      throw new NotFoundError('Control not found');
    }

    await prisma.control.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    res.json({ success: true, message: 'Control deleted' });
  }
);

// POST /controls/:id/mappings - Add framework mapping
router.post(
  '/:id/mappings',
  validate({
    params: z.object({ id: z.string().uuid() }),
    body: z.object({
      requirementId: z.string().uuid(),
      coverage: z.enum(['full', 'partial', 'minimal']).default('full'),
      notes: z.string().optional(),
    }),
  }),
  async (req, res) => {
    const controlId = req.params.id!;
    const { requirementId, coverage, notes } = req.body as {
      requirementId: string;
      coverage: string;
      notes?: string;
    };
    const organizationId = req.organizationId!;

    // Verify control exists
    const control = await prisma.control.findFirst({
      where: { id: controlId, organizationId, deletedAt: null },
    });

    if (!control) {
      throw new NotFoundError('Control not found');
    }

    // Verify requirement exists
    const requirement = await prisma.frameworkRequirement.findUnique({
      where: { id: requirementId },
      include: { framework: { select: { id: true, code: true, name: true } } },
    });

    if (!requirement) {
      throw new NotFoundError('Framework requirement not found');
    }

    // Create mapping (upsert to handle duplicates)
    const mapping = await prisma.controlFrameworkMapping.upsert({
      where: {
        controlId_frameworkRequirementId: {
          controlId,
          frameworkRequirementId: requirementId,
        },
      },
      update: { coverage, notes },
      create: {
        controlId,
        frameworkRequirementId: requirementId,
        coverage,
        notes,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: mapping.id,
        controlId: mapping.controlId,
        requirementId: mapping.frameworkRequirementId,
        requirementCode: requirement.code,
        requirementName: requirement.name,
        frameworkId: requirement.framework.id,
        frameworkCode: requirement.framework.code,
        frameworkName: requirement.framework.name,
        coverage: mapping.coverage,
        notes: mapping.notes,
      },
    });
  }
);

// DELETE /controls/:id/mappings/:mappingId - Remove mapping
router.delete(
  '/:id/mappings/:mappingId',
  validate({
    params: z.object({
      id: z.string().uuid(),
      mappingId: z.string().uuid(),
    }),
  }),
  async (req, res) => {
    const { id, mappingId } = req.params;
    const organizationId = req.organizationId!;

    // Verify control exists
    const control = await prisma.control.findFirst({
      where: { id, organizationId, deletedAt: null },
    });

    if (!control) {
      throw new NotFoundError('Control not found');
    }

    // Verify mapping exists
    const mapping = await prisma.controlFrameworkMapping.findFirst({
      where: { id: mappingId, controlId: id },
    });

    if (!mapping) {
      throw new NotFoundError('Mapping not found');
    }

    await prisma.controlFrameworkMapping.delete({
      where: { id: mappingId },
    });

    res.json({ success: true, message: 'Mapping removed' });
  }
);

export const controlsRouter: IRouter = router;
