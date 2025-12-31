import { Router, type IRouter } from 'express';
import { prisma } from '../config/db.js';

const router: IRouter = Router();

router.get('/', async (_req, res) => {
  const checks = {
    database: 'unknown' as 'ok' | 'error' | 'unknown',
  };

  // Check database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
  }

  const healthy = Object.values(checks).every((status) => status === 'ok');

  res.status(healthy ? 200 : 503).json({
    success: true,
    data: {
      status: healthy ? 'healthy' : 'unhealthy',
      checks,
      timestamp: new Date().toISOString(),
    },
  });
});

export const healthRouter: IRouter = router;
