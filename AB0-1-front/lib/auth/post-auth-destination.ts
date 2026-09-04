import type { User } from '@/lib/api';
import { ProductSurface } from '@/lib/host-context';
import { buildCanonicalUrl } from '@/lib/routing/surface-origins';

const AUTH_PATHS = [
  '/login',
  '/signup',
  '/register',
  '/register-user',
  '/forgot-password',
  '/reset-password',
];

export function isSafeReturnTo(returnTo: string | null | undefined): returnTo is string {
  if (!returnTo || typeof returnTo !== 'string') return false;
  if (!returnTo.startsWith('/') || returnTo.startsWith('//')) return false;
  try {
    const parsed = new URL(returnTo, 'https://www.avaliasolar.com.br');
    return !AUTH_PATHS.some(
      (path) => parsed.pathname === path || parsed.pathname.startsWith(`${path}/`)
    );
  } catch {
    return false;
  }
}

/**
 * Determina se um usuário tem capability de acesso ao CRM interno.
 * Regra: role = admin ou e-mail corporativo interno (@avaliasolar.com.br).
 */
export function hasCrmWorkspaceAccess(user: Pick<User, 'role' | 'email'>): boolean {
  if (user.role === 'admin') return true;
  if (user.email?.toLowerCase().endsWith('@avaliasolar.com.br')) return true;
  return false;
}

/**
 * Determina se um usuário tem capability de acesso ao workspace empresarial (Portal da Empresa).
 * Regra: `role=company` OU `role=review` com ao menos 1 CompanyMember ativo.
 */
export function hasCompanyWorkspaceAccess({
  user,
  activeMembershipsCount = 0,
}: {
  user: Pick<User, 'role'>;
  activeMembershipsCount?: number;
}): boolean {
  if (user.role === 'company') return true;
  if (user.role === 'review' && activeMembershipsCount > 0) return true;
  return false;
}

export function resolveCompanyId({
  userCompanyId,
  membershipCompanyIds,
}: {
  userCompanyId?: number | null;
  membershipCompanyIds: number[];
}): number | null {
  const persistedCompanyId = Number(userCompanyId);
  if (membershipCompanyIds.includes(persistedCompanyId)) return persistedCompanyId;
  return membershipCompanyIds[0] ?? null;
}

export function isReturnToCompatibleWithRole(
  returnTo: string,
  user: Pick<User, 'role' | 'email'>,
  activeMembershipsCount = 0
): boolean {
  const pathname = new URL(returnTo, 'https://www.avaliasolar.com.br').pathname;
  if (pathname.startsWith('/dashboard/sales')) return hasCrmWorkspaceAccess(user);
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
 * Resolve o destino canônico pós-autenticação considerando a superfície de produto ativa.
 */
export function resolvePostAuthDestination({
  user,
  surface = 'public',
  returnTo,
  activeCompanyId,
  activeMembershipsCount = 0,
  creatorEnabled,
  creatorSlug,
}: {
  user: User;
  surface?: ProductSurface;
  returnTo?: string | null;
  activeCompanyId?: number | null;
  /** Número de CompanyMember.status=active para este usuário */
  activeMembershipsCount?: number;
  creatorEnabled?: boolean;
  creatorSlug?: string | null;
}): string {
  // 1. Respeitar returnTo se for seguro e compatível com a role, mapeando para o domínio da superfície correta
  if (
    isSafeReturnTo(returnTo) &&
    isReturnToCompatibleWithRole(returnTo, user, activeMembershipsCount)
  ) {
    const pathname = new URL(returnTo, 'https://www.avaliasolar.com.br').pathname;
    const search = new URL(returnTo, 'https://www.avaliasolar.com.br').search;
    if (pathname.startsWith('/dashboard/sales')) {
      return buildCanonicalUrl('crm', pathname + search);
    }
    if (
      pathname.startsWith('/dashboard') ||
      pathname.startsWith('/company-dashboard') ||
      pathname === '/select-company'
    ) {
      return buildCanonicalUrl('company_app', pathname + search);
    }
    return buildCanonicalUrl('public', pathname + search);
  }

  // 2. Destino específico por Superfície ativa (quando na superfície CRM ou Company App)
  if (surface === 'crm') {
    if (hasCrmWorkspaceAccess(user)) {
      return buildCanonicalUrl('crm', '/dashboard/sales/leads');
    }
    return buildCanonicalUrl('crm', '/forbidden');
  }

  if (surface === 'company_app') {
    if (hasCompanyWorkspaceAccess({ user, activeMembershipsCount })) {
      return buildCanonicalUrl(
        'company_app',
        activeCompanyId ? `/dashboard?company_id=${activeCompanyId}` : '/select-company'
      );
    }
    return buildCanonicalUrl('company_app', '/select-company');
  }

  // 3. Destino padrão quando autenticado a partir da Superfície Pública (www)
  if (hasCrmWorkspaceAccess(user)) {
    return buildCanonicalUrl('crm', '/dashboard/sales/leads');
  }

  if (hasCompanyWorkspaceAccess({ user, activeMembershipsCount })) {
    return buildCanonicalUrl(
      'company_app',
      activeCompanyId ? `/dashboard?company_id=${activeCompanyId}` : '/select-company'
    );
  }

  if (user.role === 'review') {
    if (creatorEnabled && creatorSlug) return buildCanonicalUrl('public', '/feed');
    return buildCanonicalUrl('public', '/review-dashboard');
  }

  return buildCanonicalUrl('public', '/');
}
