import 'dotenv/config';
import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { logger } from './utils/logger.js';
import { authMiddleware, errorHandler } from './middleware/index.js';
import { apiRouter } from './routes/index.js';
import { syncScheduler } from './integrations/index.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Clerk authentication middleware
app.use(authMiddleware);

// API routes
app.use('/api/v1', apiRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
    },
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
async function start() {
  try {
    // Connect to database
    await connectDatabase();

    // Start integration sync scheduler
    syncScheduler.start();

    // Start listening
    app.listen(env.PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${env.PORT}`);
      logger.info(`📚 API available at http://localhost:${env.PORT}/api/v1`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown() {
  logger.info('Shutting down...');
  syncScheduler.stop();
  await disconnectDatabase();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start();
