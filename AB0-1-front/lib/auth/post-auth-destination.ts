import { SOCIAL_FEED_ENABLED } from '@/lib/mvp-reviews';
import type { User } from '@/lib/api';
import { ProductSurface } from '@/lib/host-context';
import { buildCanonicalUrl, isCanonicalSurfaceHost } from '@/lib/routing/surface-origins';

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
    // Prevent protocol-relative redirects disguised with backslashes.
    if (parsed.origin !== 'https://www.avaliasolar.com.br') return false;
    return !AUTH_PATHS.some(
      (path) => parsed.pathname === path || parsed.pathname.startsWith(`${path}/`)
    );
  } catch {
    return false;
  }
}

/**
 * Determina se um usuário tem capability de acesso ao CRM interno.
 * A API retorna crm_access conforme Sales::AuthorizationService (SalesRole/RBAC).
 */
export function hasCrmWorkspaceAccess(user: Pick<User, 'role' | 'crm_access'>): boolean {
  return user.role === 'admin' || user.crm_access === true;
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
  user: Pick<User, 'role' | 'crm_access'>,
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

function resolveDestinationUrl(
  targetSurface: ProductSurface,
  pathWithQuery: string,
  currentHost?: string | null
): string {
  const cleanPath = pathWithQuery.startsWith('/') ? pathWithQuery : `/${pathWithQuery}`;
  const effectiveHost =
    currentHost !== undefined
      ? currentHost
      : typeof window !== 'undefined'
        ? window.location.host
        : null;

  // Só redireciona para URL absoluta cross-subdomain quando o navegador já está
  // em um host canônico das superfícies (www/app/crm). Em localhost, CI E2E ou
  // ambientes efêmeros, mantém caminho relativo no mesmo origin para preservar
  // os cookies httpOnly da sessão atual e não redirecionar para produção.
  if (!effectiveHost || !isCanonicalSurfaceHost(effectiveHost)) {
    return cleanPath;
  }

  return buildCanonicalUrl(targetSurface, cleanPath);
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
  currentHost,
}: {
  user: User;
  surface?: ProductSurface;
  returnTo?: string | null;
  activeCompanyId?: number | null;
  /** Número de CompanyMember.status=active para este usuário */
  activeMembershipsCount?: number;
  creatorEnabled?: boolean;
  creatorSlug?: string | null;
  currentHost?: string | null;
}): string {
  // 1. Respeitar returnTo se for seguro e compatível com a role, mapeando para o domínio da superfície correta
  if (
    isSafeReturnTo(returnTo) &&
    isReturnToCompatibleWithRole(returnTo, user, activeMembershipsCount)
  ) {
    const destination = new URL(returnTo, 'https://www.avaliasolar.com.br');
    const pathname = destination.pathname;
    const search = destination.search + (pathname === '/invite' ? destination.hash : '');
    if (pathname.startsWith('/dashboard/sales')) {
      return resolveDestinationUrl('crm', pathname + search, currentHost);
    }
    if (
      pathname.startsWith('/dashboard') ||
      pathname.startsWith('/company-dashboard') ||
      pathname === '/select-company'
    ) {
      return resolveDestinationUrl('company_app', pathname + search, currentHost);
    }
    return resolveDestinationUrl('public', pathname + search, currentHost);
  }

  // 2. Destino específico por Superfície ativa (quando na superfície CRM ou Company App)
  if (surface === 'crm') {
    if (hasCrmWorkspaceAccess(user)) {
      return resolveDestinationUrl('crm', '/dashboard/sales/leads', currentHost);
    }
    return resolveDestinationUrl('crm', '/forbidden', currentHost);
  }

  if (surface === 'company_app') {
    if (hasCompanyWorkspaceAccess({ user, activeMembershipsCount })) {
      return resolveDestinationUrl(
        'company_app',
        activeCompanyId ? `/dashboard?company_id=${activeCompanyId}` : '/select-company',
        currentHost
      );
    }
    return resolveDestinationUrl('company_app', '/select-company', currentHost);
  }

  // 3. Destino padrão quando autenticado a partir da Superfície Pública (www)
  if (hasCrmWorkspaceAccess(user)) {
    return resolveDestinationUrl('crm', '/dashboard/sales/leads', currentHost);
  }

  if (hasCompanyWorkspaceAccess({ user, activeMembershipsCount })) {
    return resolveDestinationUrl(
      'company_app',
      activeCompanyId ? `/dashboard?company_id=${activeCompanyId}` : '/select-company',
      currentHost
    );
  }

  if (user.role === 'review') {
    if (SOCIAL_FEED_ENABLED && creatorEnabled && creatorSlug) {
      return resolveDestinationUrl('public', '/feed', currentHost);
    }
    return resolveDestinationUrl('public', '/review-dashboard', currentHost);
  }

  return resolveDestinationUrl('public', '/', currentHost);
}
