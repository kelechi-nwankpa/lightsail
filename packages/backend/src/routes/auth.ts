import { Router, type IRouter } from 'express';
import { requireAuth, getAuth } from '../middleware/index.js';
import { prisma } from '../config/db.js';

const router: IRouter = Router();

// Get current authenticated user
router.get('/me', requireAuth, async (req, res) => {
  const auth = getAuth(req);

  // Try to find user in our database
  let user = await prisma.user.findUnique({
    where: { clerkId: auth.userId! },
  });

  // If user doesn't exist, create them (first-time sync from Clerk)
  if (!user) {
    // In production, you'd fetch user details from Clerk API
    // For now, we create a minimal record
    user = await prisma.user.create({
      data: {
        clerkId: auth.userId!,
        email: 'pending@sync.com', // Will be updated by Clerk webhook
      },
    });
  }

  // Get organization membership if org is selected
  let organizationMember = null;
  if (auth.orgId) {
    organizationMember = await prisma.organizationMember.findFirst({
      where: {
        organization: { id: auth.orgId },
        userId: user.id,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            plan: true,
          },
        },
      },
    });
  }

  res.json({
    success: true,
    data: {
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      organization: organizationMember?.organization ?? null,
      organizationRole: organizationMember?.role ?? null,
    },
  });
});

export const authRouter: IRouter = router;
