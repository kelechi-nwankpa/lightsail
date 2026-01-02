import { Router, type IRouter } from 'express';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '../config/db.js';
import { requireAuth, requireOrganization, validate } from '../middleware/index.js';
import { NotFoundError } from '../utils/errors.js';
import {
  createRiskSchema,
  updateRiskSchema,
  riskFiltersSchema,
} from '@lightsail/shared';

const router: IRouter = Router();

// All routes require auth and organization
router.use(requireAuth, requireOrganization());

// Risk score calculation helper
// Likelihood: rare=1, unlikely=2, possible=3, likely=4, almost_certain=5
// Impact: insignificant=1, minor=2, moderate=3, major=4, severe=5
// Score = likelihood * impact (1-25)
const LIKELIHOOD_SCORES: Record<string, number> = {
  rare: 1,
  unlikely: 2,
  possible: 3,
  likely: 4,
  almost_certain: 5,
};

const IMPACT_SCORES: Record<string, number> = {
  insignificant: 1,
  minor: 2,
  moderate: 3,
  major: 4,
  severe: 5,
};

function calculateRiskScore(likelihood: string, impact: string): number {
  return (LIKELIHOOD_SCORES[likelihood] || 3) * (IMPACT_SCORES[impact] || 3);
}

// Phase 0: Calculate residual score based on linked controls and their effectiveness
// Effective controls reduce risk by 30%, partial by 15%, ineffective by 0%
const EFFECTIVENESS_REDUCTION: Record<string, number> = {
  effective: 0.30,
  partial: 0.15,
  ineffective: 0.00,
};

function calculateResidualScore(
  inherentScore: number,
  controlLinks: Array<{ effectiveness: string; control: { implementationStatus: string } }>
): number {
  if (controlLinks.length === 0) {
    // No controls = residual equals inherent
    return inherentScore;
  }

  // Only count implemented controls
  const implementedLinks = controlLinks.filter(
    (link) => link.control.implementationStatus === 'implemented'
  );

  if (implementedLinks.length === 0) {
    return inherentScore;
  }

  // Calculate total reduction (capped at 80% max reduction)
  let totalReduction = 0;
  for (const link of implementedLinks) {
    totalReduction += EFFECTIVENESS_REDUCTION[link.effectiveness] || 0;
  }

  // Cap the reduction at 80% - some residual risk always remains
  const cappedReduction = Math.min(totalReduction, 0.80);

  // Calculate residual score (minimum of 1)
  const residual = Math.max(1, Math.round(inherentScore * (1 - cappedReduction)));

  return residual;
}

// GET /risks - List risks with filters & pagination
router.get(
  '/',
  validate({ query: riskFiltersSchema }),
  async (req, res) => {
    const organizationId = req.organizationId!;
    const filters = req.query as unknown as z.infer<typeof riskFiltersSchema>;
    const { page, pageSize, status, category, likelihood, impact, ownerId, search } = filters;

    const where: Prisma.RiskWhereInput = {
      organizationId,
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    if (likelihood) {
      where.likelihood = likelihood;
    }

    if (impact) {
      where.impact = impact;
    }

    if (ownerId) {
      where.ownerId = ownerId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [risks, total] = await Promise.all([
      prisma.risk.findMany({
        where,
        orderBy: [{ inherentScore: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          owner: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          controlLinks: {
            include: {
              control: {
                select: { id: true, code: true, name: true, implementationStatus: true },
              },
            },
          },
        },
      }),
      prisma.risk.count({ where }),
    ]);

    const data = risks.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      category: r.category,
      status: r.status,
      likelihood: r.likelihood,
      impact: r.impact,
      inherentScore: r.inherentScore,
      residualScore: r.residualScore,
      owner: r.owner
        ? {
            id: r.owner.id,
            name: [r.owner.firstName, r.owner.lastName].filter(Boolean).join(' ') || r.owner.email,
          }
        : null,
      dueDate: r.dueDate,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      controlCount: r.controlLinks.length,
      linkedControls: r.controlLinks.map((link) => ({
        id: link.control.id,
        code: link.control.code,
        name: link.control.name,
        implementationStatus: link.control.implementationStatus,
        effectiveness: link.effectiveness,
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

// GET /risks/:id - Get risk detail
router.get(
  '/:id',
  validate({ params: z.object({ id: z.string().uuid() }) }),
  async (req, res) => {
    const { id } = req.params;
    const organizationId = req.organizationId!;

    const risk = await prisma.risk.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        controlLinks: {
          include: {
            control: {
              select: {
                id: true,
                code: true,
                name: true,
                implementationStatus: true,
              },
            },
          },
        },
      },
    });

    if (!risk) {
      throw new NotFoundError('Risk not found');
    }

    res.json({
      success: true,
      data: {
        id: risk.id,
        title: risk.title,
        description: risk.description,
        category: risk.category,
        status: risk.status,
        likelihood: risk.likelihood,
        impact: risk.impact,
        inherentScore: risk.inherentScore,
        residualScore: risk.residualScore,
        owner: risk.owner
          ? {
              id: risk.owner.id,
              name: [risk.owner.firstName, risk.owner.lastName].filter(Boolean).join(' ') || risk.owner.email,
            }
          : null,
        mitigationPlan: risk.mitigationPlan,
        acceptanceNotes: risk.acceptanceNotes,
        dueDate: risk.dueDate,
        reviewedAt: risk.reviewedAt,
        nextReviewAt: risk.nextReviewAt,
        createdAt: risk.createdAt,
        updatedAt: risk.updatedAt,
        linkedControls: risk.controlLinks.map((link) => ({
          id: link.control.id,
          code: link.control.code,
          name: link.control.name,
          implementationStatus: link.control.implementationStatus,
          effectiveness: link.effectiveness,
          notes: link.notes,
          linkedAt: link.createdAt,
        })),
      },
    });
  }
);

// POST /risks - Create risk
router.post(
  '/',
  validate({ body: createRiskSchema }),
  async (req, res) => {
    const organizationId = req.organizationId!;
    const { controlIds, ...data } = req.body as z.infer<typeof createRiskSchema>;

    // Calculate inherent risk score
    const inherentScore = calculateRiskScore(data.likelihood, data.impact);

    // If controls are being linked, fetch their implementation status for residual calculation
    let controlsForResidual: Array<{ effectiveness: string; control: { implementationStatus: string } }> = [];
    if (controlIds?.length) {
      const controls = await prisma.control.findMany({
        where: { id: { in: controlIds }, organizationId, deletedAt: null },
        select: { id: true, implementationStatus: true },
      });
      controlsForResidual = controlIds.map((controlId) => ({
        effectiveness: 'partial', // Default effectiveness for new links
        control: {
          implementationStatus: controls.find((c) => c.id === controlId)?.implementationStatus || 'not_started',
        },
      }));
    }

    // Phase 0: Auto-calculate residual score based on linked controls
    const residualScore = calculateResidualScore(inherentScore, controlsForResidual);

    const risk = await prisma.risk.create({
      data: {
        ...data,
        organizationId,
        inherentScore,
        residualScore,
        controlLinks: controlIds?.length
          ? {
              create: controlIds.map((controlId) => ({
                controlId,
                effectiveness: 'partial',
              })),
            }
          : undefined,
      },
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        controlLinks: {
          include: {
            control: { select: { id: true, code: true, name: true } },
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: risk.id,
        title: risk.title,
        description: risk.description,
        category: risk.category,
        status: risk.status,
        likelihood: risk.likelihood,
        impact: risk.impact,
        inherentScore: risk.inherentScore,
        residualScore: risk.residualScore,
        dueDate: risk.dueDate,
        createdAt: risk.createdAt,
        linkedControls: risk.controlLinks.map((link) => ({
          id: link.control.id,
          code: link.control.code,
          name: link.control.name,
          effectiveness: link.effectiveness,
        })),
      },
    });
  }
);

// PATCH /risks/:id - Update risk
router.patch(
  '/:id',
  validate({
    params: z.object({ id: z.string().uuid() }),
    body: updateRiskSchema,
  }),
  async (req, res) => {
    const id = req.params.id!;
    const organizationId = req.organizationId!;
    const { controlIds, ...data } = req.body as z.infer<typeof updateRiskSchema>;

    // Check risk exists with current control links
    const existing = await prisma.risk.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        controlLinks: {
          include: {
            control: { select: { id: true, implementationStatus: true } },
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundError('Risk not found');
    }

    // Recalculate inherent score if likelihood or impact changed
    const newLikelihood = data.likelihood || existing.likelihood;
    const newImpact = data.impact || existing.impact;
    const inherentScore = calculateRiskScore(newLikelihood, newImpact);

    // Update risk and optionally replace control links
    const risk = await prisma.$transaction(async (tx) => {
      // Determine control links for residual calculation
      let controlLinksForResidual: Array<{ effectiveness: string; control: { implementationStatus: string } }>;

      // If controlIds provided, replace all links
      if (controlIds !== undefined) {
        await tx.riskControlLink.deleteMany({
          where: { riskId: id },
        });

        if (controlIds.length > 0) {
          // Fetch the implementation status of the new controls
          const controls = await tx.control.findMany({
            where: { id: { in: controlIds }, organizationId, deletedAt: null },
            select: { id: true, implementationStatus: true },
          });

          await tx.riskControlLink.createMany({
            data: controlIds.map((controlId) => ({
              riskId: id,
              controlId,
              effectiveness: 'partial',
            })),
          });

          controlLinksForResidual = controlIds.map((controlId) => ({
            effectiveness: 'partial',
            control: {
              implementationStatus: controls.find((c) => c.id === controlId)?.implementationStatus || 'not_started',
            },
          }));
        } else {
          controlLinksForResidual = [];
        }
      } else {
        // Use existing control links
        controlLinksForResidual = existing.controlLinks.map((link) => ({
          effectiveness: link.effectiveness,
          control: { implementationStatus: link.control.implementationStatus },
        }));
      }

      // Phase 0: Auto-calculate residual score based on linked controls
      const residualScore = calculateResidualScore(inherentScore, controlLinksForResidual);

      return tx.risk.update({
        where: { id },
        data: {
          ...data,
          inherentScore,
          residualScore,
        },
        include: {
          owner: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          controlLinks: {
            include: {
              control: { select: { id: true, code: true, name: true } },
            },
          },
        },
      });
    });

    res.json({
      success: true,
      data: {
        id: risk.id,
        title: risk.title,
        description: risk.description,
        category: risk.category,
        status: risk.status,
        likelihood: risk.likelihood,
        impact: risk.impact,
        inherentScore: risk.inherentScore,
        residualScore: risk.residualScore,
        dueDate: risk.dueDate,
        updatedAt: risk.updatedAt,
        linkedControls: risk.controlLinks.map((link) => ({
          id: link.control.id,
          code: link.control.code,
          name: link.control.name,
          effectiveness: link.effectiveness,
        })),
      },
    });
  }
);

// DELETE /risks/:id - Soft delete risk
router.delete(
  '/:id',
  validate({ params: z.object({ id: z.string().uuid() }) }),
  async (req, res) => {
    const { id } = req.params;
    const organizationId = req.organizationId!;

    const risk = await prisma.risk.findFirst({
      where: { id, organizationId, deletedAt: null },
    });

    if (!risk) {
      throw new NotFoundError('Risk not found');
    }

    await prisma.risk.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    res.json({ success: true, message: 'Risk deleted' });
  }
);

// POST /risks/:id/controls - Link risk to control
router.post(
  '/:id/controls',
  validate({
    params: z.object({ id: z.string().uuid() }),
    body: z.object({
      controlId: z.string().uuid(),
      effectiveness: z.enum(['effective', 'partial', 'ineffective']).default('partial'),
      notes: z.string().optional(),
    }),
  }),
  async (req, res) => {
    const riskId = req.params.id!;
    const { controlId, effectiveness, notes } = req.body as {
      controlId: string;
      effectiveness: string;
      notes?: string;
    };
    const organizationId = req.organizationId!;

    // Verify risk exists with current control links
    const risk = await prisma.risk.findFirst({
      where: { id: riskId, organizationId, deletedAt: null },
      include: {
        controlLinks: {
          include: {
            control: { select: { id: true, implementationStatus: true } },
          },
        },
      },
    });

    if (!risk) {
      throw new NotFoundError('Risk not found');
    }

    // Verify control exists
    const control = await prisma.control.findFirst({
      where: { id: controlId, organizationId, deletedAt: null },
    });

    if (!control) {
      throw new NotFoundError('Control not found');
    }

    // Create link and recalculate residual score
    const result = await prisma.$transaction(async (tx) => {
      // Create link (upsert to handle duplicates)
      const link = await tx.riskControlLink.upsert({
        where: {
          riskId_controlId: {
            riskId,
            controlId,
          },
        },
        update: { effectiveness, notes },
        create: {
          riskId,
          controlId,
          effectiveness,
          notes,
        },
        include: {
          control: { select: { id: true, code: true, name: true, implementationStatus: true } },
        },
      });

      // Phase 0: Recalculate residual score with the new/updated link
      const existingLinks = risk.controlLinks.filter((l) => l.controlId !== controlId);
      const allLinks = [
        ...existingLinks.map((l) => ({
          effectiveness: l.effectiveness,
          control: { implementationStatus: l.control.implementationStatus },
        })),
        {
          effectiveness,
          control: { implementationStatus: control.implementationStatus },
        },
      ];

      const residualScore = calculateResidualScore(risk.inherentScore || 9, allLinks);

      await tx.risk.update({
        where: { id: riskId },
        data: { residualScore },
      });

      return link;
    });

    res.status(201).json({
      success: true,
      data: {
        id: result.id,
        riskId: result.riskId,
        controlId: result.controlId,
        controlCode: result.control.code,
        controlName: result.control.name,
        effectiveness: result.effectiveness,
        notes: result.notes,
      },
    });
  }
);

// DELETE /risks/:id/controls/:controlId - Unlink risk from control
router.delete(
  '/:id/controls/:controlId',
  validate({
    params: z.object({
      id: z.string().uuid(),
      controlId: z.string().uuid(),
    }),
  }),
  async (req, res) => {
    const riskId = req.params.id!;
    const controlId = req.params.controlId!;
    const organizationId = req.organizationId!;

    // Verify risk exists with control links
    const risk = await prisma.risk.findFirst({
      where: { id: riskId, organizationId, deletedAt: null },
      include: {
        controlLinks: {
          include: {
            control: { select: { id: true, implementationStatus: true } },
          },
        },
      },
    });

    if (!risk) {
      throw new NotFoundError('Risk not found');
    }

    // Verify link exists
    const link = await prisma.riskControlLink.findUnique({
      where: {
        riskId_controlId: {
          riskId,
          controlId,
        },
      },
    });

    if (!link) {
      throw new NotFoundError('Link not found');
    }

    // Delete link and recalculate residual score
    await prisma.$transaction(async (tx) => {
      await tx.riskControlLink.delete({
        where: { id: link.id },
      });

      // Phase 0: Recalculate residual score without the removed link
      const remainingLinks = risk.controlLinks
        .filter((l) => l.controlId !== controlId)
        .map((l) => ({
          effectiveness: l.effectiveness,
          control: { implementationStatus: l.control.implementationStatus },
        }));

      const residualScore = calculateResidualScore(risk.inherentScore || 9, remainingLinks);

      await tx.risk.update({
        where: { id: riskId },
        data: { residualScore },
      });
    });

    res.json({ success: true, message: 'Control unlinked from risk' });
  }
);

export const risksRouter: IRouter = router;
