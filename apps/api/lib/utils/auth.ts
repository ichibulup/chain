import { Request } from 'express';

/**
 * Get user ID from request (from auth middleware)
 * Returns null if user is not authenticated
 */
export function getUserIdFromRequest(req: Request): string | null {
  const auth = (req as any).auth;
  const dbUser = (req as any).dbUser;
  if (!dbUser?.id && !auth?.user?.id && !auth?.dbUser?.id) {
    return null;
  }
  // Prefer dbUser.id if available, otherwise use auth.user.id
  return dbUser?.id || auth.dbUser?.id || auth.user?.id || null;
}

/**
 * Get user ID from request, throw error if not authenticated
 */
export function requireUserIdFromRequest(req: Request): string {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    throw new Error('User not authenticated');
  }
  return userId;
}
