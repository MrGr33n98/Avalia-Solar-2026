import { absoluteUrl, SITE } from '@/lib/site-core';

export const SEO_IMAGE_PROXY_PATH = '/seo-image';

const LOCAL_PUBLIC_IMAGE_PREFIXES = ['/images/', '/assets/', '/opengraph-image'];
const API_IMAGE_PREFIXES = ['/rails/active_storage/', '/uploads/'];
const PROXYABLE_HOSTS = new Set([
  'api.avaliasolar.com.br',
  'localhost',
  '127.0.0.1',
]);
const CANONICAL_SITE_HOSTS = new Set([
  'www.avaliasolar.com.br',
  'avaliasolar.com.br',
]);

const cleanString = (value: unknown) => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const getPublicApiOrigin = () => {
  const rawBase =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'https://api.avaliasolar.com.br';

  try {
    const url = new URL(rawBase);
    return `${url.protocol}//${url.host}`;
  } catch {
    return 'https://api.avaliasolar.com.br';
  }
};

const hasAnyPrefix = (pathname: string, prefixes: string[]) =>
  prefixes.some((prefix) => pathname === prefix || pathname.startsWith(prefix));

const proxyImageUrl = (url: string) =>
  absoluteUrl(`${SEO_IMAGE_PROXY_PATH}?src=${encodeURIComponent(url)}`);

export const isProxyableSeoImageUrl = (value: unknown) => {
  const rawUrl = cleanString(value);
  if (!rawUrl) return false;

  try {
    const url = new URL(rawUrl);
    return (
      ['http:', 'https:'].includes(url.protocol) &&
      PROXYABLE_HOSTS.has(url.hostname) &&
      hasAnyPrefix(url.pathname, API_IMAGE_PREFIXES)
    );
  } catch {
    return false;
  }
};

export const isDirectCrawlableImageUrl = (value: unknown) => {
  const rawUrl = cleanString(value);
  if (!rawUrl) return false;

  try {
    const url = new URL(rawUrl);
    if (CANONICAL_SITE_HOSTS.has(url.hostname)) {
      return (
        ['http:', 'https:'].includes(url.protocol) &&
        hasAnyPrefix(url.pathname, LOCAL_PUBLIC_IMAGE_PREFIXES)
      );
    }

    return (
      ['http:', 'https:'].includes(url.protocol) &&
      (url.hostname === 'nyc3.digitaloceanspaces.com' ||
        url.hostname.endsWith('.digitaloceanspaces.com'))
    );
  } catch {
    return false;
  }
};

export function toCrawlableImageUrl(value: unknown) {
  const rawUrl = cleanString(value);
  if (!rawUrl) return undefined;

  if (rawUrl.startsWith('/')) {
    if (hasAnyPrefix(rawUrl, LOCAL_PUBLIC_IMAGE_PREFIXES)) {
      return absoluteUrl(rawUrl);
    }

    if (hasAnyPrefix(rawUrl, API_IMAGE_PREFIXES)) {
      return proxyImageUrl(`${getPublicApiOrigin()}${rawUrl}`);
    }

    return undefined;
  }

  if (isProxyableSeoImageUrl(rawUrl)) {
    return proxyImageUrl(rawUrl);
  }

  if (isDirectCrawlableImageUrl(rawUrl)) {
    const url = new URL(rawUrl);
    if (CANONICAL_SITE_HOSTS.has(url.hostname)) {
      return `${SITE.url}${url.pathname}${url.search}`;
    }

    return rawUrl;
  }

  return undefined;
}
