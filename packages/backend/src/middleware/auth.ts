import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { clerkMiddleware, getAuth, requireAuth as clerkRequireAuth } from '@clerk/express';
import { ForbiddenError, UnauthorizedError } from '../utils/errors.js';
import type { MemberRole } from '@lightsail/shared';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      organizationId?: string;
      userRole?: MemberRole;
    }
  }
}

// Base Clerk middleware - attaches auth to all requests
export const authMiddleware: RequestHandler = clerkMiddleware() as RequestHandler;

// Require authentication
export const requireAuth: RequestHandler = clerkRequireAuth() as RequestHandler;

// Extract and validate organization context
export function requireOrganization() {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const auth = getAuth(req);

    if (!auth.userId) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!auth.orgId) {
      throw new ForbiddenError('Organization context required. Please select an organization.');
    }

    // Attach organization ID to request for easy access
    req.organizationId = auth.orgId;

    // TODO: Look up user's role in this organization from database
    // For now, we'll rely on Clerk's org membership
    req.userRole = 'member'; // Default, should be looked up

    next();
  };
}

// Role-based authorization
export function requireRole(...allowedRoles: MemberRole[]) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.userRole) {
      throw new ForbiddenError('Role not determined');
    }

    // Owner can do everything
    if (req.userRole === 'owner') {
      return next();
    }

    // Check if user's role is allowed
    if (!allowedRoles.includes(req.userRole)) {
      throw new ForbiddenError('Insufficient permissions');
    }

    next();
  };
}

// Helper to get current auth from request
export { getAuth };
