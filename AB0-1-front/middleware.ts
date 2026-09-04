import { NextRequest, NextResponse } from 'next/server';
import { resolveSurfaceFromHost } from '@/lib/host-context';
import { SURFACE_ORIGINS } from '@/lib/routing/surface-origins';
import {
  HOME_HERO_EXPERIMENT_COOKIE,
  HOME_HERO_EXPERIMENT_TTL_DAYS,
  isHomeHeroExperimentEnabled,
  resolveHomeHeroVariant,
  shouldAssignHomeHeroExperimentCookie,
} from '@/lib/experiments/homeHeroExperiment';

const LEGACY_COMPANIES_PATH = '/companies';
const COMPANIES_CATEGORIES_PATH = '/companies/categorias';
const FALLBACK_CATEGORY_SLUG = 'categoria';

interface CategoryTreeLike {
  id?: number;
  name?: string;
  seo_url?: string;
  slug?: string;
  children?: CategoryTreeLike[];
  subcategories?: CategoryTreeLike[];
}

function normalizeCategoryIds(value: string | null): number[] {
  if (!value) return [];

  const parsed = value
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isInteger(item) && item > 0);

  return Array.from(new Set(parsed)).sort((a, b) => a - b);
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function extractCollection(payload: unknown): CategoryTreeLike[] {
  if (Array.isArray(payload)) return payload as CategoryTreeLike[];
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as CategoryTreeLike[];
    if (Array.isArray(obj.categories)) return obj.categories as CategoryTreeLike[];
  }
  return [];
}

function flattenCategoryIndex(categories: CategoryTreeLike[]): Record<number, string> {
  const queue = [...categories];
  const index: Record<number, string> = {};

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || typeof current.id !== 'number') continue;

    const candidate = slugify(String(current.seo_url || current.slug || current.name || ''));
    if (candidate) {
      index[current.id] = candidate;
    }

    if (Array.isArray(current.children)) queue.push(...current.children);
    if (Array.isArray(current.subcategories)) queue.push(...current.subcategories);
  }

  return index;
}

async function resolveCategorySlugIndex(request: NextRequest): Promise<Record<number, string>> {
  try {
    const response = await fetch(`${request.nextUrl.origin}/api/v1/categories/tree`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) return {};
    const payload = await response.json();
    return flattenCategoryIndex(extractCollection(payload));
  } catch {
    return {};
  }
}

function buildCompaniesCategoriesPath(
  categoryIds: number[],
  slugById: Record<number, string>
): string {
  if (categoryIds.length === 0) return LEGACY_COMPANIES_PATH;

  const segments = categoryIds.map((id) => {
    const slug = slugById[id] || `${FALLBACK_CATEGORY_SLUG}-${id}`;
    return `${slug}--${id}`;
  });

  return `${COMPANIES_CATEGORIES_PATH}/${segments.join('/')}`;
}

// This middleware runs on the edge
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const experimentEnabled = isHomeHeroExperimentEnabled();
  const experimentCookieValue = request.cookies.get(HOME_HERO_EXPERIMENT_COOKIE)?.value;
  const resolvedExperimentVariant = resolveHomeHeroVariant({
    enabled: experimentEnabled,
    cookieValue: experimentCookieValue,
  });
  // Get the token from httpOnly cookie
  const token = request.cookies.get('jwt_token')?.value;
  const isRscRequest =
    request.headers.get('rsc') === '1' || request.nextUrl.searchParams.has('_rsc');
  const isServerActionRequest = request.headers.has('next-action');
  const shouldDisableCache = isRscRequest || isServerActionRequest;

  if (process.env.NODE_ENV === 'development') {
    console.log(`[Middleware] Request to: ${pathname}`, {
      hasToken: !!token,
      cookieCount: request.cookies.getAll().length,
      isRscRequest,
      isServerActionRequest,
    });
  }

  // Define protected routes
  const protectedPaths = ['/dashboard', '/profile', '/company-dashboard', '/review-dashboard', '/creator-studio'];

  // Check if the current path is protected
  const isProtectedRoute = protectedPaths.some((path) =>
    pathname.startsWith(path.replace('[id]', ''))
  );

  const applyNoStoreHeaders = (response: NextResponse) => {
    if (!shouldDisableCache) return response;
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  };

  const maybeAttachHomeHeroExperimentCookie = (response: NextResponse) => {
    if (
      !shouldAssignHomeHeroExperimentCookie({
        pathname,
        enabled: experimentEnabled,
        cookieValue: experimentCookieValue,
      })
    ) {
      return response;
    }

    response.cookies.set({
      name: HOME_HERO_EXPERIMENT_COOKIE,
      value: resolvedExperimentVariant,
      maxAge: HOME_HERO_EXPERIMENT_TTL_DAYS * 24 * 60 * 60,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  };

  // Resolve Product Surface (CRM vs Company App vs Public Platform)
  const host = request.headers.get('host') || '';
  const surface = resolveSurfaceFromHost(host);
  const search = request.nextUrl.search;

  // CANONICAL SURFACE HOST FIREWALL (308 Permanent Redirects for misrouted paths)
  if (surface === 'public') {
    // 1a. Sales CRM paths on www -> redirect to crm.avaliasolar.com.br
    if (pathname.startsWith('/dashboard/sales')) {
      const canonicalTarget = `${SURFACE_ORIGINS.crm}${pathname}${search}`;
      return maybeAttachHomeHeroExperimentCookie(
        applyNoStoreHeaders(NextResponse.redirect(canonicalTarget, 308))
      );
    }

    // 1b. Company Portal paths on www -> redirect to app.avaliasolar.com.br
    if (
      pathname === '/dashboard' ||
      pathname.startsWith('/dashboard/') ||
      pathname.startsWith('/company-dashboard') ||
      pathname === '/select-company'
    ) {
      const canonicalTarget = `${SURFACE_ORIGINS.company}${pathname}${search}`;
      return maybeAttachHomeHeroExperimentCookie(
        applyNoStoreHeaders(NextResponse.redirect(canonicalTarget, 308))
      );
    }
  }

  // 2. CRM Surface Routing (crm.avaliasolar.com.br)
  if (surface === 'crm') {
    if (!token && (pathname === '/' || pathname.startsWith('/dashboard'))) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname + search);
      return maybeAttachHomeHeroExperimentCookie(
        applyNoStoreHeaders(NextResponse.redirect(loginUrl))
      );
    }

    if (pathname === '/' || pathname === '/dashboard' || pathname === '/dashboard/sales') {
      return maybeAttachHomeHeroExperimentCookie(
        applyNoStoreHeaders(NextResponse.redirect(new URL('/dashboard/sales/leads', request.url)))
      );
    }
    if (pathname === '/dashboard/companies' || pathname === '/dashboard/clients') {
      return maybeAttachHomeHeroExperimentCookie(
        applyNoStoreHeaders(NextResponse.redirect(new URL('/dashboard/sales/accounts', request.url)))
      );
    }
    if (pathname === '/dashboard/reports') {
      return maybeAttachHomeHeroExperimentCookie(
        applyNoStoreHeaders(NextResponse.redirect(new URL('/dashboard/sales/reports', request.url)))
      );
    }
    if (pathname === '/dashboard/import') {
      return maybeAttachHomeHeroExperimentCookie(
        applyNoStoreHeaders(NextResponse.redirect(new URL('/dashboard/sales/import', request.url)))
      );
    }
    if (pathname === '/dashboard/proposals') {
      return maybeAttachHomeHeroExperimentCookie(
        applyNoStoreHeaders(NextResponse.redirect(new URL('/dashboard/sales/pipeline', request.url)))
      );
    }
    if (pathname === '/today' || pathname === '/dashboard/today') {
      return maybeAttachHomeHeroExperimentCookie(
        applyNoStoreHeaders(NextResponse.redirect(new URL('/dashboard/sales/today', request.url)))
      );
    }
  }

  // 3. Company Application Surface Routing (app.avaliasolar.com.br)
  if (surface === 'company_app') {
    // 3a. CRM routes hit on app -> redirect 308 to crm
    if (pathname.startsWith('/dashboard/sales')) {
      const canonicalTarget = `${SURFACE_ORIGINS.crm}${pathname}${search}`;
      return maybeAttachHomeHeroExperimentCookie(
        applyNoStoreHeaders(NextResponse.redirect(canonicalTarget, 308))
      );
    }

    if (!token && (pathname === '/' || pathname.startsWith('/dashboard'))) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname + search);
      return maybeAttachHomeHeroExperimentCookie(
        applyNoStoreHeaders(NextResponse.redirect(loginUrl))
      );
    }

    if (pathname === '/') {
      return maybeAttachHomeHeroExperimentCookie(
        applyNoStoreHeaders(NextResponse.redirect(new URL('/dashboard', request.url)))
      );
    }
  }

  if (pathname === LEGACY_COMPANIES_PATH) {
    const categoryIds = normalizeCategoryIds(request.nextUrl.searchParams.get('category_ids'));

    if (categoryIds.length > 0) {
      const slugById = await resolveCategorySlugIndex(request);
      const destinationPath = buildCompaniesCategoriesPath(categoryIds, slugById);

      const redirectUrl = new URL(destinationPath, request.url);
      request.nextUrl.searchParams.forEach((value, key) => {
        if (key === 'category_ids') return;
        redirectUrl.searchParams.append(key, value);
      });

      return maybeAttachHomeHeroExperimentCookie(
        applyNoStoreHeaders(NextResponse.redirect(redirectUrl, 301))
      );
    }
  }

  if (isProtectedRoute) {
    if (!token) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `[Middleware] Unauthorized access to protected route: ${pathname}. Redirecting to /login`
        );
      }
      const loginUrl = new URL('/login', request.url);
      const redirectTo = pathname + request.nextUrl.search;
      loginUrl.searchParams.set('redirect', redirectTo);
      return maybeAttachHomeHeroExperimentCookie(
        applyNoStoreHeaders(NextResponse.redirect(loginUrl))
      );
    }
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Middleware] Authorized access to: ${pathname}`);
    }
  }

  // Continue with the request
  return maybeAttachHomeHeroExperimentCookie(applyNoStoreHeaders(NextResponse.next()));
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
