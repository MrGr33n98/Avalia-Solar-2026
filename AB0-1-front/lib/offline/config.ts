export const OFFLINE_DB_NAME = 'avalia-mobile-offline';
export const OFFLINE_MUTATION_STORE = 'mutationQueue';
export const OFFLINE_SYNC_TAG = 'avalia-offline-sync';
export const OFFLINE_FALLBACK_ROUTE = '/offline';
export const OFFLINE_QUEUE_CHANGED_EVENT = 'offline-queue:changed';
export const OFFLINE_QUEUE_SYNC_EVENT = 'offline-queue:sync';
export const OFFLINE_MAX_RETRIES = 5;
export const OFFLINE_RETRY_BASE_DELAY_MS = 1500;
export const OFFLINE_MAX_RETRY_DELAY_MS = 30000;

export const OFFLINE_SUPPORTED_ROUTES = [
  '/',
  '/categories',
  '/companies',
  '/compare',
  '/blog',
] as const;

const TRUE_VALUES = new Set(['1', 'true', 'yes', 'on']);
const FALSE_VALUES = new Set(['0', 'false', 'no', 'off']);

export const normalizeOfflinePath = (value: string) => {
  try {
    const url = value.startsWith('http')
      ? new URL(value)
      : new URL(value || '/', 'https://avaliasolar.local');
    const pathname = url.pathname || '/';
    if (pathname === '/') return '/';
    return pathname.replace(/\/+$/, '') || '/';
  } catch {
    if (!value) return '/';
    return value === '/' ? value : value.replace(/\/+$/, '') || '/';
  }
};

export const isOfflineSupportedRoute = (pathname: string) => {
  const normalizedPath = normalizeOfflinePath(pathname);
  return OFFLINE_SUPPORTED_ROUTES.includes(
    normalizedPath as (typeof OFFLINE_SUPPORTED_ROUTES)[number]
  );
};

export const isOfflineCacheableApiPath = (pathname: string) =>
  /^\/api\/v1\/(categories|banners|products|companies|states|cities)\b/i.test(
    normalizeOfflinePath(pathname)
  );

export const isStaticAssetPath = (pathname: string) =>
  pathname.startsWith('/_next/static/') ||
  pathname.startsWith('/images/') ||
  /\.(?:css|js|mjs|woff2?|png|jpe?g|webp|svg|ico)$/i.test(pathname);

export const isRetryableOfflineStatus = (status: number) =>
  status === 408 || status === 425 || status === 429 || status >= 500;

export const getOfflineRetryDelayMs = (retryCount: number) =>
  Math.min(
    OFFLINE_MAX_RETRY_DELAY_MS,
    OFFLINE_RETRY_BASE_DELAY_MS * Math.pow(2, retryCount)
  );

export const buildOfflineConflictKey = ({
  url,
  method,
  conflictKey,
}: {
  url: string;
  method: string;
  conflictKey?: string;
}) => {
  if (conflictKey?.trim()) return conflictKey.trim();
  return `${method.toUpperCase()}:${normalizeOfflinePath(url)}`;
};

export const isMobileOfflineEnabled = () => {
  const rawValue = (process.env.NEXT_PUBLIC_ENABLE_MOBILE_OFFLINE || '')
    .trim()
    .toLowerCase();

  if (TRUE_VALUES.has(rawValue)) return true;
  if (FALSE_VALUES.has(rawValue)) return false;

  return false;
};
