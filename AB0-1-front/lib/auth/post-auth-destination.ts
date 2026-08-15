import type { User } from '@/lib/api';

const AUTH_PATHS = [
  '/login',
  '/signup',
  '/register',
  '/register-user',
  '/forgot-password',
  '/reset-password',
];

export function isSafeReturnTo(returnTo: string | null | undefined): returnTo is string {
  if (!returnTo || !returnTo.startsWith('/') || returnTo.startsWith('//')) return false;
  try {
    const parsed = new URL(returnTo, 'https://www.avaliasolar.com.br');
    if (parsed.origin !== 'https://www.avaliasolar.com.br') return false;
    return !AUTH_PATHS.some(
      (path) => parsed.pathname === path || parsed.pathname.startsWith(`${path}/`)
    );
  } catch {
    return false;
  }
}

export function isReturnToCompatibleWithRole(returnTo: string, role: User['role']): boolean {
  const pathname = new URL(returnTo, 'https://www.avaliasolar.com.br').pathname;
  if (pathname.startsWith('/review-dashboard')) return role === 'review' || role === 'admin';
  if (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/company-dashboard') ||
    pathname.startsWith('/select-company')
  ) {
    return role === 'company' || role === 'admin';
  }
  return true;
}

export function resolvePostAuthDestination({
  user,
  returnTo,
  activeCompanyId,
  creatorEnabled,
  creatorSlug,
}: {
  user: User;
  returnTo?: string | null;
  activeCompanyId?: number | null;
  creatorEnabled?: boolean;
  creatorSlug?: string | null;
}): string {
  if (isSafeReturnTo(returnTo) && isReturnToCompatibleWithRole(returnTo, user.role))
    return returnTo;
  if (user.role === 'review' && creatorEnabled && creatorSlug)
    return '/creators/' + encodeURIComponent(creatorSlug);
  if (user.role === 'review') return '/review-dashboard';
  if (user.role === 'company')
    return activeCompanyId ? `/dashboard?company_id=${activeCompanyId}` : '/select-company';
  return '/';
}
