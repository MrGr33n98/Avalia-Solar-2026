const OPERATIONAL_ROUTE_PREFIXES = [
  '/admin',
  '/auth',
  '/banner-studio',
  '/chat',
  '/company-dashboard',
  '/confirm-email',
  '/control',
  '/dashboard',
  '/debug-design',
  '/f',
  '/favorites',
  '/forgot-password',
  '/login',
  '/logout',
  '/offline',
  '/painel',
  '/profile',
  '/quote-wizard',
  '/register',
  '/register-user',
  '/reset-password',
  '/review',
  '/review-dashboard',
  '/reviews/my',
  '/select-company',
  '/signup',
  '/status',
  '/test-images',
] as const;

const OPERATIONAL_ROUTE_PATTERNS = [
  /^\/companies\/[^/]+\/(?:claim|quote|review)(?:\/|$)/,
] as const;

function matchesRoutePrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * Public discovery, editorial and SEO pages show the strategic footer by default.
 * Only explicit application, authentication and transactional flows are excluded.
 */
export function shouldShowStrategicFooter(pathname: string | null) {
  if (!pathname) return false;

  const isOperational =
    OPERATIONAL_ROUTE_PREFIXES.some((prefix) => matchesRoutePrefix(pathname, prefix)) ||
    OPERATIONAL_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname));

  return !isOperational;
}
