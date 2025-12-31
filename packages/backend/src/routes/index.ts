import { Router, type IRouter } from 'express';
import { healthRouter } from './health.js';
import { authRouter } from './auth.js';

const router: IRouter = Router();

// Public routes
router.use('/health', healthRouter);

// Auth routes
router.use('/auth', authRouter);

// TODO: Add more route modules as features are built
// router.use('/organizations', organizationsRouter);
// router.use('/controls', controlsRouter);
// router.use('/evidence', evidenceRouter);
// router.use('/policies', policiesRouter);
// router.use('/tasks', tasksRouter);
// router.use('/integrations', integrationsRouter);
// router.use('/dashboard', dashboardRouter);

export { router as apiRouter };
