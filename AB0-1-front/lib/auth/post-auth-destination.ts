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

/**
 * Determina se um usuário tem capability de acesso ao workspace empresarial.
 *
 * A regra: `role=company` OU `role=review` com ao menos 1 CompanyMember ativo.
 * Isso suporta identidade multi-contexto (reviewer + manager de empresa).
 */
export function hasCompanyWorkspaceAccess({
  user,
  activeMembershipsCount,
}: {
  user: Pick<User, 'role'>;
  activeMembershipsCount: number;
}): boolean {
  if (user.role === 'company') return true;
  if (user.role === 'review' && activeMembershipsCount > 0) return true;
  return false;
}

export function isReturnToCompatibleWithRole(
  returnTo: string,
  user: Pick<User, 'role'>,
  activeMembershipsCount = 0
): boolean {
  const pathname = new URL(returnTo, 'https://www.avaliasolar.com.br').pathname;
  if (pathname.startsWith('/review-dashboard')) return user.role === 'review' || user.role === 'admin';
  if (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/company-dashboard') ||
    pathname.startsWith('/select-company')
  ) {
    return hasCompanyWorkspaceAccess({ user, activeMembershipsCount }) || user.role === 'admin';
  }
  return true;
}

/**
 * Resolve o destino canônico pós-autenticação.
 *
 * Ordem de precedência:
 * 1. returnTo válido e compatível com as capabilities reais do usuário
 * 2. Workspace empresarial (role=company OU review+memberships)
 * 3. Workspace reviewer/creator
 * 4. Home pública
 */
export function resolvePostAuthDestination({
  user,
  returnTo,
  activeCompanyId,
  activeMembershipsCount = 0,
  creatorEnabled,
  creatorSlug,
}: {
  user: User;
  returnTo?: string | null;
  activeCompanyId?: number | null;
  /** Número de CompanyMember.status=active para este usuário */
  activeMembershipsCount?: number;
  creatorEnabled?: boolean;
  creatorSlug?: string | null;
}): string {
  if (
    isSafeReturnTo(returnTo) &&
    isReturnToCompatibleWithRole(returnTo, user, activeMembershipsCount)
  ) {
    return returnTo;
  }

  // Workspace empresarial — suporta role=company E review+membership
  if (hasCompanyWorkspaceAccess({ user, activeMembershipsCount })) {
    return activeCompanyId ? `/dashboard?company_id=${activeCompanyId}` : '/select-company';
  }

  // Workspace reviewer / creator
  if (user.role === 'review') {
    if (creatorEnabled && creatorSlug) return '/feed';
    return '/review-dashboard';
  }

  return '/';
}
