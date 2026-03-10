import {
  buildOfflineConflictKey,
  getOfflineRetryDelayMs,
  isMobileOfflineEnabled,
  isOfflineCacheableApiPath,
  isOfflineSupportedRoute,
  isRetryableOfflineStatus,
  isStaticAssetPath,
  normalizeOfflinePath,
} from '@/lib/offline/config';

describe('offline config helpers', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalOfflineFlag = process.env.NEXT_PUBLIC_ENABLE_MOBILE_OFFLINE;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.NEXT_PUBLIC_ENABLE_MOBILE_OFFLINE = originalOfflineFlag;
  });

  it('normalizes empty paths to root', () => {
    expect(normalizeOfflinePath('')).toBe('/');
  });

  it('removes trailing slashes from routes', () => {
    expect(normalizeOfflinePath('/categories/')).toBe('/categories');
  });

  it('normalizes full urls into pathnames', () => {
    expect(normalizeOfflinePath('https://example.com/blog/?page=2')).toBe('/blog');
  });

  it('accepts supported offline routes', () => {
    expect(isOfflineSupportedRoute('/companies')).toBe(true);
  });

  it('rejects unsupported offline routes', () => {
    expect(isOfflineSupportedRoute('/dashboard')).toBe(false);
  });

  it('detects cacheable api paths', () => {
    expect(isOfflineCacheableApiPath('/api/v1/companies?page=2')).toBe(true);
  });

  it('ignores non-cacheable api paths', () => {
    expect(isOfflineCacheableApiPath('/api/v1/auth/me')).toBe(false);
  });

  it('detects static assets', () => {
    expect(isStaticAssetPath('/_next/static/chunks/main.js')).toBe(true);
    expect(isStaticAssetPath('/images/logo.webp')).toBe(true);
  });

  it('ignores non-static application routes', () => {
    expect(isStaticAssetPath('/compare')).toBe(false);
  });

  it('treats 429 and 5xx as retryable statuses', () => {
    expect(isRetryableOfflineStatus(429)).toBe(true);
    expect(isRetryableOfflineStatus(503)).toBe(true);
  });

  it('does not retry non-transient 4xx statuses', () => {
    expect(isRetryableOfflineStatus(400)).toBe(false);
  });

  it('grows retry delay with exponential backoff and caps it', () => {
    expect(getOfflineRetryDelayMs(0)).toBeLessThan(getOfflineRetryDelayMs(1));
    expect(getOfflineRetryDelayMs(10)).toBe(30000);
  });

  it('prefers explicit conflict keys', () => {
    expect(
      buildOfflineConflictKey({
        url: '/api/v1/analytics/track',
        method: 'POST',
        conflictKey: 'analytics:custom',
      })
    ).toBe('analytics:custom');
  });

  it('builds conflict keys from method and normalized path by default', () => {
    expect(
      buildOfflineConflictKey({
        url: '/api/v1/banner_events/',
        method: 'post',
      })
    ).toBe('POST:/api/v1/banner_events');
  });

  it('enables mobile offline only with explicit true flag', () => {
    process.env.NODE_ENV = 'development';
    process.env.NEXT_PUBLIC_ENABLE_MOBILE_OFFLINE = 'true';
    expect(isMobileOfflineEnabled()).toBe(true);
  });

  it('keeps mobile offline disabled when the flag is missing', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.NEXT_PUBLIC_ENABLE_MOBILE_OFFLINE;
    expect(isMobileOfflineEnabled()).toBe(false);
  });

  it('keeps mobile offline disabled in production when explicitly false', () => {
    process.env.NODE_ENV = 'production';
    process.env.NEXT_PUBLIC_ENABLE_MOBILE_OFFLINE = 'false';
    expect(isMobileOfflineEnabled()).toBe(false);
  });
});
