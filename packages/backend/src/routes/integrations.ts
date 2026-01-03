import { Router, type IRouter } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db.js';
import { requireAuth, requireOrganization, validate, getAuth } from '../middleware/index.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { credentialVault } from '../services/credential-vault.js';
import { syncRunner } from '../integrations/engine/sync-runner.js';
import { syncScheduler } from '../integrations/engine/sync-scheduler.js';
import { connectIntegrationSchema, updateIntegrationSchema } from '@lightsail/shared';

const router: IRouter = Router();

// All routes require auth and organization
router.use(requireAuth, requireOrganization());

// GET /integrations - List all integrations for the organization
router.get('/', async (req, res) => {
  const organizationId = req.organizationId!;

  const integrations = await prisma.integration.findMany({
    where: { organizationId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      type: true,
      name: true,
      status: true,
      errorMessage: true,
      config: true,
      lastSyncAt: true,
      nextSyncAt: true,
      syncFrequencyMinutes: true,
      createdAt: true,
      updatedAt: true,
      connectedBy: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      _count: {
        select: { evidence: true, logs: true },
      },
    },
  });

  const data = integrations.map((i) => ({
    id: i.id,
    type: i.type,
    name: i.name,
    status: i.status,
    errorMessage: i.errorMessage,
    config: i.config,
    lastSyncAt: i.lastSyncAt,
    nextSyncAt: i.nextSyncAt,
    syncFrequencyMinutes: i.syncFrequencyMinutes,
    connectedBy: i.connectedBy
      ? {
          id: i.connectedBy.id,
          name:
            [i.connectedBy.firstName, i.connectedBy.lastName].filter(Boolean).join(' ') ||
            i.connectedBy.email,
        }
      : null,
    evidenceCount: i._count.evidence,
    syncCount: i._count.logs,
    createdAt: i.createdAt,
    updatedAt: i.updatedAt,
  }));

  res.json({
    success: true,
    data,
  });
});

// GET /integrations/:id - Get integration detail
router.get(
  '/:id',
  validate({ params: z.object({ id: z.string().uuid() }) }),
  async (req, res) => {
    const { id } = req.params;
    const organizationId = req.organizationId!;

    const integration = await prisma.integration.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        connectedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        logs: {
          orderBy: { startedAt: 'desc' },
          take: 10,
        },
        _count: {
          select: { evidence: true },
        },
      },
    });

    if (!integration) {
      throw new NotFoundError('Integration not found');
    }

    res.json({
      success: true,
      data: {
        id: integration.id,
        type: integration.type,
        name: integration.name,
        status: integration.status,
        errorMessage: integration.errorMessage,
        config: integration.config,
        lastSyncAt: integration.lastSyncAt,
        nextSyncAt: integration.nextSyncAt,
        syncFrequencyMinutes: integration.syncFrequencyMinutes,
        connectedBy: integration.connectedBy
          ? {
              id: integration.connectedBy.id,
              name:
                [integration.connectedBy.firstName, integration.connectedBy.lastName]
                  .filter(Boolean)
                  .join(' ') || integration.connectedBy.email,
            }
          : null,
        evidenceCount: integration._count.evidence,
        recentLogs: integration.logs.map((log) => ({
          id: log.id,
          operation: log.operation,
          status: log.status,
          itemsProcessed: log.itemsProcessed,
          itemsFailed: log.itemsFailed,
          errorMessage: log.errorMessage,
          startedAt: log.startedAt,
          completedAt: log.completedAt,
          durationMs: log.durationMs,
        })),
        createdAt: integration.createdAt,
        updatedAt: integration.updatedAt,
      },
    });
  }
);

// POST /integrations - Connect a new integration
router.post('/', validate({ body: connectIntegrationSchema }), async (req, res) => {
  const organizationId = req.organizationId!;
  const auth = getAuth(req);
  const { type, name, credentials, config } = req.body as z.infer<typeof connectIntegrationSchema>;

  // Check if integration of this type already exists
  const existing = await prisma.integration.findFirst({
    where: { organizationId, type, deletedAt: null },
  });

  if (existing) {
    throw new ValidationError(`An integration of type "${type}" already exists`);
  }

  // Encrypt credentials
  const credentialsEncrypted = await credentialVault.encrypt(credentials);

  // Find user
  const user = await prisma.user.findFirst({
    where: { clerkId: auth.userId! },
  });

  // Create integration in pending state
  const integration = await prisma.integration.create({
    data: {
      organizationId,
      type,
      name,
      status: 'pending',
      credentialsEncrypted,
      config: config ? JSON.parse(JSON.stringify(config)) : {},
      connectedById: user?.id,
    },
  });

  // Test connection and run initial sync
  try {
    const result = await syncRunner.runSync(integration.id);

    res.status(201).json({
      success: true,
      data: {
        id: integration.id,
        type: integration.type,
        name: integration.name,
        status: 'active',
        evidenceGenerated: result.evidenceGenerated,
        controlsVerified: result.controlsVerified,
        message: `Connected successfully. Generated ${result.evidenceGenerated} evidence items and verified ${result.controlsVerified} controls.`,
      },
    });
  } catch (error) {
    // Integration was created but sync failed
    // Status already updated to 'error' by syncRunner
    throw new ValidationError(
      error instanceof Error ? error.message : 'Failed to connect integration'
    );
  }
});

// PATCH /integrations/:id - Update integration
router.patch(
  '/:id',
  validate({
    params: z.object({ id: z.string().uuid() }),
    body: updateIntegrationSchema,
  }),
  async (req, res) => {
    const { id } = req.params;
    const organizationId = req.organizationId!;
    const updates = req.body as z.infer<typeof updateIntegrationSchema>;

    const integration = await prisma.integration.findFirst({
      where: { id, organizationId, deletedAt: null },
    });

    if (!integration) {
      throw new NotFoundError('Integration not found');
    }

    const updated = await prisma.integration.update({
      where: { id },
      data: {
        ...updates,
        config: updates.config ? JSON.parse(JSON.stringify(updates.config)) : undefined,
      },
    });

    res.json({
      success: true,
      data: {
        id: updated.id,
        type: updated.type,
        name: updated.name,
        status: updated.status,
        config: updated.config,
        syncFrequencyMinutes: updated.syncFrequencyMinutes,
        updatedAt: updated.updatedAt,
      },
    });
  }
);

// POST /integrations/:id/sync - Trigger manual sync
router.post(
  '/:id/sync',
  validate({ params: z.object({ id: z.string().uuid() }) }),
  async (req, res) => {
    const { id } = req.params;
    const organizationId = req.organizationId!;

    const integration = await prisma.integration.findFirst({
      where: { id, organizationId, deletedAt: null },
    });

    if (!integration) {
      throw new NotFoundError('Integration not found');
    }

    if (!integration.credentialsEncrypted) {
      throw new ValidationError('Integration is not properly configured');
    }

    // Run sync
    const result = await syncRunner.runSync(id!);

    res.json({
      success: true,
      data: {
        message: 'Sync completed successfully',
        evidenceGenerated: result.evidenceGenerated,
        controlsVerified: result.controlsVerified,
        controlsFailed: result.controlsFailed,
        errors: result.errors,
        durationMs: result.durationMs,
      },
    });
  }
);

// POST /integrations/:id/test - Test connection
router.post(
  '/:id/test',
  validate({ params: z.object({ id: z.string().uuid() }) }),
  async (req, res) => {
    const { id } = req.params;
    const organizationId = req.organizationId!;

    const integration = await prisma.integration.findFirst({
      where: { id, organizationId, deletedAt: null },
    });

    if (!integration) {
      throw new NotFoundError('Integration not found');
    }

    if (!integration.credentialsEncrypted) {
      throw new ValidationError('Integration is not properly configured');
    }

    const result = await syncRunner.testConnection(id!);

    res.json({
      success: true,
      data: {
        connected: result.success,
        latencyMs: result.latencyMs,
        error: result.error,
      },
    });
  }
);

// DELETE /integrations/:id - Disconnect integration
router.delete(
  '/:id',
  validate({ params: z.object({ id: z.string().uuid() }) }),
  async (req, res) => {
    const { id } = req.params;
    const organizationId = req.organizationId!;

    const integration = await prisma.integration.findFirst({
      where: { id, organizationId, deletedAt: null },
    });

    if (!integration) {
      throw new NotFoundError('Integration not found');
    }

    // Soft delete and clear credentials
    await prisma.integration.update({
      where: { id },
      data: {
        status: 'disconnected',
        credentialsEncrypted: null,
        deletedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Integration disconnected successfully',
    });
  }
);

// GET /integrations/:id/logs - Get sync logs
router.get(
  '/:id/logs',
  validate({
    params: z.object({ id: z.string().uuid() }),
    query: z.object({
      page: z.coerce.number().int().positive().default(1),
      pageSize: z.coerce.number().int().positive().max(100).default(20),
    }),
  }),
  async (req, res) => {
    const { id } = req.params;
    const { page, pageSize } = req.query as unknown as { page: number; pageSize: number };
    const organizationId = req.organizationId!;

    // Verify integration exists
    const integration = await prisma.integration.findFirst({
      where: { id, organizationId },
    });

    if (!integration) {
      throw new NotFoundError('Integration not found');
    }

    const [logs, total] = await Promise.all([
      prisma.integrationLog.findMany({
        where: { integrationId: id },
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.integrationLog.count({ where: { integrationId: id } }),
    ]);

    res.json({
      success: true,
      data: logs.map((log) => ({
        id: log.id,
        operation: log.operation,
        status: log.status,
        itemsProcessed: log.itemsProcessed,
        itemsFailed: log.itemsFailed,
        errorMessage: log.errorMessage,
        details: log.details,
        startedAt: log.startedAt,
        completedAt: log.completedAt,
        durationMs: log.durationMs,
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  }
);

// GET /integrations/scheduler/status - Get scheduler status
router.get('/scheduler/status', async (_req, res) => {
  const status = await syncScheduler.getStatus();

  res.json({
    success: true,
    data: status,
  });
});

// GET /integrations/types - Get available integration types
router.get('/types', (_req, res) => {
  // Return static list of supported integration types with metadata
  res.json({
    success: true,
    data: [
      {
        type: 'github',
        displayName: 'GitHub',
        description: 'Repository security, branch protection, and vulnerability alerts',
        icon: 'github',
        available: true,
      },
      {
        type: 'aws',
        displayName: 'Amazon Web Services',
        description: 'IAM, CloudTrail, S3 encryption, and security configuration',
        icon: 'aws',
        available: true,
      },
      {
        type: 'gsuite',
        displayName: 'Google Workspace',
        description: 'User directory, MFA status, and security settings',
        icon: 'google',
        available: true,
      },
      {
        type: 'azure_ad',
        displayName: 'Azure Active Directory',
        description: 'User directory, MFA, and conditional access',
        icon: 'microsoft',
        available: false, // Coming soon
      },
      {
        type: 'jira',
        displayName: 'Jira',
        description: 'Issue tracking and task management',
        icon: 'jira',
        available: false, // Coming soon
      },
      {
        type: 'slack',
        displayName: 'Slack',
        description: 'Communication and security notifications',
        icon: 'slack',
        available: false, // Coming soon
      },
    ],
  });
});

export const integrationsRouter: IRouter = router;
