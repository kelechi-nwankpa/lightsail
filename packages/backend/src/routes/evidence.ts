import { Router, type IRouter } from 'express';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '../config/db.js';
import { requireAuth, requireOrganization, validate, getAuth } from '../middleware/index.js';
import { NotFoundError } from '../utils/errors.js';
import {
  createEvidenceSchema,
  updateEvidenceSchema,
  reviewEvidenceSchema,
  evidenceFiltersSchema,
} from '@lightsail/shared';
import { getDownloadPresignedUrl } from '../services/s3.service.js';
import { isS3Configured } from '../config/s3.js';

const router: IRouter = Router();

// All routes require auth and organization
router.use(requireAuth, requireOrganization());

// GET /evidence - List evidence with filters & pagination
router.get(
  '/',
  validate({ query: evidenceFiltersSchema }),
  async (req, res) => {
    const organizationId = req.organizationId!;
    const filters = req.query as unknown as z.infer<typeof evidenceFiltersSchema>;
    const { page, pageSize, controlId, type, source, reviewStatus, validOnly } = filters;

    const where: Prisma.EvidenceWhereInput = {
      organizationId,
      deletedAt: null,
    };

    if (type) {
      where.type = type;
    }

    if (source) {
      where.source = source;
    }

    if (reviewStatus) {
      where.reviewStatus = reviewStatus;
    }

    // Filter by validity dates
    if (validOnly) {
      const now = new Date();
      where.AND = [
        { OR: [{ validFrom: null }, { validFrom: { lte: now } }] },
        { OR: [{ validUntil: null }, { validUntil: { gte: now } }] },
      ];
    }

    // If filtering by control, get evidence IDs linked to that control
    if (controlId) {
      const evidenceLinks = await prisma.evidenceControlLink.findMany({
        where: {
          controlId,
          evidence: { organizationId, deletedAt: null },
        },
        select: { evidenceId: true },
      });
      where.id = { in: evidenceLinks.map((l) => l.evidenceId) };
    }

    const [evidenceItems, total] = await Promise.all([
      prisma.evidence.findMany({
        where,
        orderBy: [{ collectedAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          collectedBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          controlLinks: {
            include: {
              control: {
                select: { id: true, code: true, name: true },
              },
            },
          },
        },
      }),
      prisma.evidence.count({ where }),
    ]);

    const data = evidenceItems.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      type: e.type,
      source: e.source,
      fileName: e.fileName,
      fileSize: e.fileSize,
      fileType: e.fileType,
      collectedAt: e.collectedAt,
      collectedBy: e.collectedBy
        ? {
            id: e.collectedBy.id,
            name: [e.collectedBy.firstName, e.collectedBy.lastName].filter(Boolean).join(' ') || e.collectedBy.email,
          }
        : null,
      validFrom: e.validFrom,
      validUntil: e.validUntil,
      reviewStatus: e.reviewStatus,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
      controlCount: e.controlLinks.length,
      linkedControls: e.controlLinks.map((link) => ({
        id: link.control.id,
        code: link.control.code,
        name: link.control.name,
        relevance: link.relevance,
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

// GET /evidence/:id - Get evidence detail
router.get(
  '/:id',
  validate({ params: z.object({ id: z.string().uuid() }) }),
  async (req, res) => {
    const { id } = req.params;
    const organizationId = req.organizationId!;

    const evidence = await prisma.evidence.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        collectedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        reviewedBy: {
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

    if (!evidence) {
      throw new NotFoundError('Evidence not found');
    }

    res.json({
      success: true,
      data: {
        id: evidence.id,
        title: evidence.title,
        description: evidence.description,
        type: evidence.type,
        source: evidence.source,
        fileKey: evidence.fileKey,
        fileName: evidence.fileName,
        fileSize: evidence.fileSize,
        fileType: evidence.fileType,
        collectedAt: evidence.collectedAt,
        collectedBy: evidence.collectedBy
          ? {
              id: evidence.collectedBy.id,
              name: [evidence.collectedBy.firstName, evidence.collectedBy.lastName].filter(Boolean).join(' ') || evidence.collectedBy.email,
            }
          : null,
        validFrom: evidence.validFrom,
        validUntil: evidence.validUntil,
        reviewStatus: evidence.reviewStatus,
        reviewedAt: evidence.reviewedAt,
        reviewedBy: evidence.reviewedBy
          ? {
              id: evidence.reviewedBy.id,
              name: [evidence.reviewedBy.firstName, evidence.reviewedBy.lastName].filter(Boolean).join(' ') || evidence.reviewedBy.email,
            }
          : null,
        reviewNotes: evidence.reviewNotes,
        metadata: evidence.metadata,
        createdAt: evidence.createdAt,
        updatedAt: evidence.updatedAt,
        linkedControls: evidence.controlLinks.map((link) => ({
          id: link.control.id,
          code: link.control.code,
          name: link.control.name,
          implementationStatus: link.control.implementationStatus,
          relevance: link.relevance,
          notes: link.notes,
          linkedAt: link.createdAt,
        })),
      },
    });
  }
);

// POST /evidence - Create evidence
router.post(
  '/',
  validate({ body: createEvidenceSchema }),
  async (req, res) => {
    const organizationId = req.organizationId!;
    const auth = getAuth(req);
    const { controlIds, ...data } = req.body as z.infer<typeof createEvidenceSchema>;

    // Find the user record for this Clerk user to get their internal ID
    const user = await prisma.user.findFirst({
      where: { clerkId: auth.userId! },
    });

    const evidence = await prisma.evidence.create({
      data: {
        ...data,
        organizationId,
        collectedById: user?.id,
        controlLinks: controlIds?.length
          ? {
              create: controlIds.map((controlId) => ({
                controlId,
                relevance: 'primary',
              })),
            }
          : undefined,
      },
      include: {
        collectedBy: {
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
        id: evidence.id,
        title: evidence.title,
        description: evidence.description,
        type: evidence.type,
        source: evidence.source,
        fileName: evidence.fileName,
        fileSize: evidence.fileSize,
        fileType: evidence.fileType,
        collectedAt: evidence.collectedAt,
        validFrom: evidence.validFrom,
        validUntil: evidence.validUntil,
        reviewStatus: evidence.reviewStatus,
        createdAt: evidence.createdAt,
        linkedControls: evidence.controlLinks.map((link) => ({
          id: link.control.id,
          code: link.control.code,
          name: link.control.name,
          relevance: link.relevance,
        })),
      },
    });
  }
);

// PATCH /evidence/:id - Update evidence
router.patch(
  '/:id',
  validate({
    params: z.object({ id: z.string().uuid() }),
    body: updateEvidenceSchema,
  }),
  async (req, res) => {
    const id = req.params.id!;
    const organizationId = req.organizationId!;
    const { controlIds, ...data } = req.body as z.infer<typeof updateEvidenceSchema>;

    // Check evidence exists
    const existing = await prisma.evidence.findFirst({
      where: { id, organizationId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundError('Evidence not found');
    }

    // Update evidence and optionally replace control links
    const evidence = await prisma.$transaction(async (tx) => {
      // If controlIds provided, replace all links
      if (controlIds !== undefined) {
        await tx.evidenceControlLink.deleteMany({
          where: { evidenceId: id },
        });

        if (controlIds.length > 0) {
          await tx.evidenceControlLink.createMany({
            data: controlIds.map((controlId) => ({
              evidenceId: id,
              controlId,
              relevance: 'primary',
            })),
          });
        }
      }

      return tx.evidence.update({
        where: { id },
        data,
        include: {
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
        id: evidence.id,
        title: evidence.title,
        description: evidence.description,
        type: evidence.type,
        source: evidence.source,
        fileName: evidence.fileName,
        validFrom: evidence.validFrom,
        validUntil: evidence.validUntil,
        reviewStatus: evidence.reviewStatus,
        updatedAt: evidence.updatedAt,
        linkedControls: evidence.controlLinks.map((link) => ({
          id: link.control.id,
          code: link.control.code,
          name: link.control.name,
          relevance: link.relevance,
        })),
      },
    });
  }
);

// DELETE /evidence/:id - Soft delete evidence
router.delete(
  '/:id',
  validate({ params: z.object({ id: z.string().uuid() }) }),
  async (req, res) => {
    const { id } = req.params;
    const organizationId = req.organizationId!;

    const evidence = await prisma.evidence.findFirst({
      where: { id, organizationId, deletedAt: null },
    });

    if (!evidence) {
      throw new NotFoundError('Evidence not found');
    }

    await prisma.evidence.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    res.json({ success: true, message: 'Evidence deleted' });
  }
);

// POST /evidence/:id/review - Review evidence (approve/reject)
router.post(
  '/:id/review',
  validate({
    params: z.object({ id: z.string().uuid() }),
    body: reviewEvidenceSchema,
  }),
  async (req, res) => {
    const { id } = req.params;
    const organizationId = req.organizationId!;
    const auth = getAuth(req);
    const { status, notes } = req.body as z.infer<typeof reviewEvidenceSchema>;

    const existing = await prisma.evidence.findFirst({
      where: { id, organizationId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundError('Evidence not found');
    }

    // Find the user record for this Clerk user to get their internal ID
    const user = await prisma.user.findFirst({
      where: { clerkId: auth.userId! },
    });

    const evidence = await prisma.evidence.update({
      where: { id },
      data: {
        reviewStatus: status,
        reviewedById: user?.id,
        reviewedAt: new Date(),
        reviewNotes: notes,
      },
    });

    res.json({
      success: true,
      data: {
        id: evidence.id,
        reviewStatus: evidence.reviewStatus,
        reviewedAt: evidence.reviewedAt,
        reviewNotes: evidence.reviewNotes,
      },
    });
  }
);

// POST /evidence/:id/controls - Link evidence to control
router.post(
  '/:id/controls',
  validate({
    params: z.object({ id: z.string().uuid() }),
    body: z.object({
      controlId: z.string().uuid(),
      relevance: z.enum(['primary', 'supporting', 'related']).default('primary'),
      notes: z.string().optional(),
    }),
  }),
  async (req, res) => {
    const evidenceId = req.params.id!;
    const { controlId, relevance, notes } = req.body as {
      controlId: string;
      relevance: string;
      notes?: string;
    };
    const organizationId = req.organizationId!;

    // Verify evidence exists
    const evidence = await prisma.evidence.findFirst({
      where: { id: evidenceId, organizationId, deletedAt: null },
    });

    if (!evidence) {
      throw new NotFoundError('Evidence not found');
    }

    // Verify control exists
    const control = await prisma.control.findFirst({
      where: { id: controlId, organizationId, deletedAt: null },
    });

    if (!control) {
      throw new NotFoundError('Control not found');
    }

    // Create link (upsert to handle duplicates)
    const link = await prisma.evidenceControlLink.upsert({
      where: {
        evidenceId_controlId: {
          evidenceId,
          controlId,
        },
      },
      update: { relevance, notes },
      create: {
        evidenceId,
        controlId,
        relevance,
        notes,
      },
      include: {
        control: { select: { id: true, code: true, name: true } },
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: link.id,
        evidenceId: link.evidenceId,
        controlId: link.controlId,
        controlCode: link.control.code,
        controlName: link.control.name,
        relevance: link.relevance,
        notes: link.notes,
      },
    });
  }
);

// DELETE /evidence/:id/controls/:controlId - Unlink evidence from control
router.delete(
  '/:id/controls/:controlId',
  validate({
    params: z.object({
      id: z.string().uuid(),
      controlId: z.string().uuid(),
    }),
  }),
  async (req, res) => {
    const evidenceId = req.params.id!;
    const controlId = req.params.controlId!;
    const organizationId = req.organizationId!;

    // Verify evidence exists
    const evidence = await prisma.evidence.findFirst({
      where: { id: evidenceId, organizationId, deletedAt: null },
    });

    if (!evidence) {
      throw new NotFoundError('Evidence not found');
    }

    // Verify link exists
    const link = await prisma.evidenceControlLink.findUnique({
      where: {
        evidenceId_controlId: {
          evidenceId,
          controlId,
        },
      },
    });

    if (!link) {
      throw new NotFoundError('Link not found');
    }

    await prisma.evidenceControlLink.delete({
      where: { id: link.id },
    });

    res.json({ success: true, message: 'Control unlinked from evidence' });
  }
);

// GET /evidence/:id/download - Get presigned download URL for evidence file
router.get(
  '/:id/download',
  validate({ params: z.object({ id: z.string().uuid() }) }),
  async (req, res) => {
    const { id } = req.params;
    const organizationId = req.organizationId!;

    // Verify evidence exists and belongs to org
    const evidence = await prisma.evidence.findFirst({
      where: { id, organizationId, deletedAt: null },
      select: { id: true, fileKey: true, fileName: true },
    });

    if (!evidence) {
      throw new NotFoundError('Evidence not found');
    }

    if (!evidence.fileKey) {
      res.status(400).json({
        success: false,
        error: 'This evidence does not have an attached file.',
      });
      return;
    }

    if (!isS3Configured()) {
      res.status(503).json({
        success: false,
        error: 'File downloads are not configured.',
      });
      return;
    }

    const downloadUrl = await getDownloadPresignedUrl(evidence.fileKey);

    res.json({
      success: true,
      data: {
        downloadUrl,
        fileName: evidence.fileName,
      },
    });
  }
);

export const evidenceRouter: IRouter = router;
