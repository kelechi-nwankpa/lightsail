import { Router, type IRouter } from 'express';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '../config/db.js';
import { requireAuth, requireOrganization, validate, getAuth } from '../middleware/index.js';
import { NotFoundError } from '../utils/errors.js';
import {
  createPolicySchema,
  updatePolicySchema,
  policyFiltersSchema,
} from '@lightsail/shared';

const router: IRouter = Router();

// All routes require auth and organization
router.use(requireAuth, requireOrganization());

// GET /policies - List policies with filters & pagination
router.get(
  '/',
  validate({ query: policyFiltersSchema }),
  async (req, res) => {
    const organizationId = req.organizationId!;
    const filters = req.query as unknown as z.infer<typeof policyFiltersSchema>;
    const { page, pageSize, status, category, search } = filters;

    const where: Prisma.PolicyWhereInput = {
      organizationId,
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [policies, total] = await Promise.all([
      prisma.policy.findMany({
        where,
        orderBy: [{ updatedAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          owner: {
            select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
          },
          approvedBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          versions: {
            orderBy: { version: 'desc' },
            take: 1,
            select: { id: true, version: true, createdAt: true },
          },
          _count: {
            select: { controlLinks: true },
          },
        },
      }),
      prisma.policy.count({ where }),
    ]);

    const data = policies.map((p) => ({
      id: p.id,
      code: p.code,
      title: p.title,
      description: p.description,
      category: p.category,
      status: p.status,
      owner: p.owner
        ? {
            id: p.owner.id,
            name: [p.owner.firstName, p.owner.lastName].filter(Boolean).join(' ') || p.owner.email,
            email: p.owner.email,
            avatarUrl: p.owner.avatarUrl,
          }
        : null,
      approvedBy: p.approvedBy
        ? {
            id: p.approvedBy.id,
            name: [p.approvedBy.firstName, p.approvedBy.lastName].filter(Boolean).join(' ') || p.approvedBy.email,
          }
        : null,
      approvedAt: p.approvedAt,
      lastReviewedAt: p.lastReviewedAt,
      nextReviewAt: p.nextReviewAt,
      reviewFrequencyDays: p.reviewFrequencyDays,
      currentVersion: p.versions[0]?.version || 0,
      controlCount: p._count.controlLinks,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
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

// GET /policies/categories - Get unique categories
router.get('/categories', async (req, res) => {
  const organizationId = req.organizationId!;

  const categories = await prisma.policy.findMany({
    where: { organizationId, deletedAt: null, category: { not: null } },
    select: { category: true },
    distinct: ['category'],
  });

  res.json({
    success: true,
    data: categories.map((c) => c.category).filter(Boolean),
  });
});

// GET /policies/:id - Get policy with versions and control mappings
router.get(
  '/:id',
  validate({ params: z.object({ id: z.string().uuid() }) }),
  async (req, res) => {
    const { id } = req.params;
    const organizationId = req.organizationId!;

    const policy = await prisma.policy.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
        },
        approvedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        versions: {
          orderBy: { version: 'desc' },
          include: {
            createdBy: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
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

    if (!policy) {
      throw new NotFoundError('Policy not found');
    }

    res.json({
      success: true,
      data: {
        id: policy.id,
        code: policy.code,
        title: policy.title,
        description: policy.description,
        category: policy.category,
        status: policy.status,
        owner: policy.owner
          ? {
              id: policy.owner.id,
              name: [policy.owner.firstName, policy.owner.lastName].filter(Boolean).join(' ') || policy.owner.email,
              email: policy.owner.email,
              avatarUrl: policy.owner.avatarUrl,
            }
          : null,
        approvedBy: policy.approvedBy
          ? {
              id: policy.approvedBy.id,
              name: [policy.approvedBy.firstName, policy.approvedBy.lastName].filter(Boolean).join(' ') || policy.approvedBy.email,
            }
          : null,
        approvedAt: policy.approvedAt,
        lastReviewedAt: policy.lastReviewedAt,
        nextReviewAt: policy.nextReviewAt,
        reviewFrequencyDays: policy.reviewFrequencyDays,
        isAiGenerated: policy.isAiGenerated,
        createdAt: policy.createdAt,
        updatedAt: policy.updatedAt,
        versions: policy.versions.map((v) => ({
          id: v.id,
          version: v.version,
          content: v.content,
          changeSummary: v.changeSummary,
          createdBy: v.createdBy
            ? {
                id: v.createdBy.id,
                name: [v.createdBy.firstName, v.createdBy.lastName].filter(Boolean).join(' ') || v.createdBy.email,
              }
            : null,
          createdAt: v.createdAt,
        })),
        linkedControls: policy.controlLinks.map((link) => ({
          id: link.control.id,
          code: link.control.code,
          name: link.control.name,
          implementationStatus: link.control.implementationStatus,
        })),
      },
    });
  }
);

// POST /policies - Create policy
router.post(
  '/',
  validate({ body: createPolicySchema }),
  async (req, res) => {
    const organizationId = req.organizationId!;
    const auth = getAuth(req);
    const { content, ...data } = req.body as z.infer<typeof createPolicySchema>;

    // Find the user record for this Clerk user to get their internal ID
    const user = await prisma.user.findFirst({
      where: { clerkId: auth.userId! },
    });

    const policy = await prisma.policy.create({
      data: {
        ...data,
        organizationId,
        versions: {
          create: {
            version: 1,
            content,
            createdById: user?.id,
          },
        },
      },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: policy.id,
        code: policy.code,
        title: policy.title,
        description: policy.description,
        category: policy.category,
        status: policy.status,
        currentVersion: policy.versions[0]?.version || 1,
        createdAt: policy.createdAt,
      },
    });
  }
);

// PATCH /policies/:id - Update policy (creates new version if content changed)
router.patch(
  '/:id',
  validate({
    params: z.object({ id: z.string().uuid() }),
    body: updatePolicySchema,
  }),
  async (req, res) => {
    const { id } = req.params as { id: string };
    const organizationId = req.organizationId!;
    const auth = getAuth(req);
    const { content, changeSummary, ...data } = req.body as z.infer<typeof updatePolicySchema>;

    // Check policy exists
    const existing = await prisma.policy.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });

    if (!existing) {
      throw new NotFoundError('Policy not found');
    }

    // If content is provided, create a new version
    let newVersion;
    if (content) {
      // Find the user record for this Clerk user to get their internal ID
      const user = await prisma.user.findFirst({
        where: { clerkId: auth.userId! },
      });

      const latestVersion = existing.versions[0]?.version || 0;
      newVersion = await prisma.policyVersion.create({
        data: {
          policyId: id,
          version: latestVersion + 1,
          content,
          changeSummary,
          createdById: user?.id,
        },
      });
    }

    const policy = await prisma.policy.update({
      where: { id },
      data,
      include: {
        versions: {
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });

    res.json({
      success: true,
      data: {
        id: policy.id,
        code: policy.code,
        title: policy.title,
        description: policy.description,
        category: policy.category,
        status: policy.status,
        currentVersion: policy.versions[0]?.version || 1,
        updatedAt: policy.updatedAt,
        newVersionCreated: !!newVersion,
      },
    });
  }
);

// POST /policies/:id/submit - Submit policy for review
router.post(
  '/:id/submit',
  validate({ params: z.object({ id: z.string().uuid() }) }),
  async (req, res) => {
    const { id } = req.params;
    const organizationId = req.organizationId!;

    const policy = await prisma.policy.findFirst({
      where: { id, organizationId, deletedAt: null },
    });

    if (!policy) {
      throw new NotFoundError('Policy not found');
    }

    if (policy.status !== 'draft') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: 'Only draft policies can be submitted for review' },
      });
    }

    const updated = await prisma.policy.update({
      where: { id },
      data: { status: 'review' },
    });

    res.json({
      success: true,
      data: { id: updated.id, status: updated.status },
    });
  }
);

// POST /policies/:id/approve - Approve policy
router.post(
  '/:id/approve',
  validate({ params: z.object({ id: z.string().uuid() }) }),
  async (req, res) => {
    const { id } = req.params as { id: string };
    const organizationId = req.organizationId!;
    const auth = getAuth(req);

    const policy = await prisma.policy.findFirst({
      where: { id, organizationId, deletedAt: null },
    });

    if (!policy) {
      throw new NotFoundError('Policy not found');
    }

    if (policy.status !== 'review') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: 'Only policies in review can be approved' },
      });
    }

    // Find the user record for this Clerk user
    const user = await prisma.user.findFirst({
      where: { clerkId: auth.userId! },
    });

    const updated = await prisma.policy.update({
      where: { id },
      data: {
        status: 'approved',
        approvedById: user?.id,
        approvedAt: new Date(),
        lastReviewedAt: new Date(),
        nextReviewAt: new Date(Date.now() + policy.reviewFrequencyDays * 24 * 60 * 60 * 1000),
      },
    });

    res.json({
      success: true,
      data: {
        id: updated.id,
        status: updated.status,
        approvedAt: updated.approvedAt,
        nextReviewAt: updated.nextReviewAt,
      },
    });
  }
);

// POST /policies/:id/archive - Archive policy
router.post(
  '/:id/archive',
  validate({ params: z.object({ id: z.string().uuid() }) }),
  async (req, res) => {
    const { id } = req.params;
    const organizationId = req.organizationId!;

    const policy = await prisma.policy.findFirst({
      where: { id, organizationId, deletedAt: null },
    });

    if (!policy) {
      throw new NotFoundError('Policy not found');
    }

    const updated = await prisma.policy.update({
      where: { id },
      data: { status: 'archived' },
    });

    res.json({
      success: true,
      data: { id: updated.id, status: updated.status },
    });
  }
);

// DELETE /policies/:id - Soft delete policy
router.delete(
  '/:id',
  validate({ params: z.object({ id: z.string().uuid() }) }),
  async (req, res) => {
    const { id } = req.params;
    const organizationId = req.organizationId!;

    const policy = await prisma.policy.findFirst({
      where: { id, organizationId, deletedAt: null },
    });

    if (!policy) {
      throw new NotFoundError('Policy not found');
    }

    await prisma.policy.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    res.json({ success: true, message: 'Policy deleted' });
  }
);

// POST /policies/:id/controls - Link control to policy
router.post(
  '/:id/controls',
  validate({
    params: z.object({ id: z.string().uuid() }),
    body: z.object({ controlId: z.string().uuid() }),
  }),
  async (req, res) => {
    const { id } = req.params as { id: string };
    const { controlId } = req.body as { controlId: string };
    const organizationId = req.organizationId!;

    // Verify policy exists
    const policy = await prisma.policy.findFirst({
      where: { id, organizationId, deletedAt: null },
    });

    if (!policy) {
      throw new NotFoundError('Policy not found');
    }

    // Verify control exists in same org
    const control = await prisma.control.findFirst({
      where: { id: controlId, organizationId, deletedAt: null },
    });

    if (!control) {
      throw new NotFoundError('Control not found');
    }

    // Create link (upsert to handle duplicates)
    const link = await prisma.policyControlLink.upsert({
      where: {
        policyId_controlId: { policyId: id, controlId },
      },
      update: {},
      create: { policyId: id, controlId },
    });

    res.status(201).json({
      success: true,
      data: {
        id: link.id,
        policyId: link.policyId,
        controlId: link.controlId,
        control: {
          id: control.id,
          code: control.code,
          name: control.name,
        },
      },
    });
  }
);

// DELETE /policies/:id/controls/:controlId - Unlink control from policy
router.delete(
  '/:id/controls/:controlId',
  validate({
    params: z.object({
      id: z.string().uuid(),
      controlId: z.string().uuid(),
    }),
  }),
  async (req, res) => {
    const { id, controlId } = req.params;
    const organizationId = req.organizationId!;

    // Verify policy exists
    const policy = await prisma.policy.findFirst({
      where: { id, organizationId, deletedAt: null },
    });

    if (!policy) {
      throw new NotFoundError('Policy not found');
    }

    // Delete link if exists
    await prisma.policyControlLink.deleteMany({
      where: { policyId: id, controlId },
    });

    res.json({ success: true, message: 'Control unlinked' });
  }
);

export const policiesRouter: IRouter = router;
