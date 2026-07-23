import type { User } from '@/lib/api';

type UserRole = User['role'] | null | undefined;

/**
 * The personal profile editor currently lives inside the review dashboard shell.
 * Administrators must be able to manage their own profile without being treated
 * as an unauthenticated or unsupported account.
 */
export function canAccessReviewDashboard(role: UserRole): boolean {
  return role === 'review' || role === 'admin';
}
