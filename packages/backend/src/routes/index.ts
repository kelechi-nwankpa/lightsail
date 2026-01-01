import { Router, type IRouter } from 'express';
import { healthRouter } from './health.js';
import { authRouter } from './auth.js';
import { frameworksRouter } from './frameworks.js';
import { controlsRouter } from './controls.js';
import { policiesRouter } from './policies.js';
import { evidenceRouter } from './evidence.js';
import { uploadRouter } from './upload.js';

const router: IRouter = Router();

// Public routes
router.use('/health', healthRouter);

// Auth routes
router.use('/auth', authRouter);

// Framework routes (partially public)
router.use('/frameworks', frameworksRouter);

// Controls routes (protected)
router.use('/controls', controlsRouter);

// Policies routes (protected)
router.use('/policies', policiesRouter);

// Evidence routes (protected)
router.use('/evidence', evidenceRouter);

// Upload routes (protected)
router.use('/upload', uploadRouter);

// TODO: Add more route modules as features are built
// router.use('/organizations', organizationsRouter);
// router.use('/tasks', tasksRouter);
// router.use('/integrations', integrationsRouter);
// router.use('/dashboard', dashboardRouter);

export { router as apiRouter };
