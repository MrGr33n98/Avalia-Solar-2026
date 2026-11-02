/**
 * Helper canônico para construção e higienização de URLs públicas de formulários de avaliação.
 * Garante domínio canônico seguro, suporte a canais atribuíveis e fallback gracioso.
 */

export type CollectionChannel = 'link' | 'qr' | 'whatsapp' | 'email' | 'widget';

export const CANONICAL_CHANNELS: readonly CollectionChannel[] = [
  'link',
  'qr',
  'whatsapp',
  'email',
  'widget',
] as const;

export const CANONICAL_PUBLIC_ORIGIN = 'https://www.avaliasolar.com.br';

export function normalizeChannel(channel?: string | null): CollectionChannel {
  if (!channel) return 'link';
  const clean = channel.trim().toLowerCase();
  return (CANONICAL_CHANNELS as readonly string[]).includes(clean)
    ? (clean as CollectionChannel)
    : 'link';
}

export function getPublicSiteOrigin(customOrigin?: string): string {
  if (customOrigin) {
    const trimmed = customOrigin.trim().replace(/\/+$/, '');
    if (
      trimmed === 'https://avaliasolar.com.br' ||
      trimmed === 'http://avaliasolar.com.br' ||
      trimmed.endsWith('//avaliasolar.com.br') ||
      trimmed === 'avaliasolar.com.br' ||
      trimmed.includes('app.avaliasolar.com.br') ||
      trimmed.includes('crm.avaliasolar.com.br') ||
      trimmed.endsWith('.avaliasolar.com.br')
    ) {
      return CANONICAL_PUBLIC_ORIGIN;
    }
    return trimmed;
  }

  if (typeof process !== 'undefined') {
    const configuredSite =
      process.env.NEXT_PUBLIC_PUBLIC_ORIGIN ||
      process.env.NEXT_PUBLIC_PUBLIC_URL ||
      process.env.NEXT_PUBLIC_SITE_URL;
    if (configuredSite) {
      const trimmed = configuredSite.trim().replace(/\/+$/, '');
      if (
        trimmed === 'https://avaliasolar.com.br' ||
        trimmed === 'http://avaliasolar.com.br' ||
        trimmed.endsWith('//avaliasolar.com.br') ||
        trimmed === 'avaliasolar.com.br'
      ) {
        return CANONICAL_PUBLIC_ORIGIN;
      }
      return trimmed;
    }
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    const origin = window.location.origin.trim();
    // Em ambiente local, mantém a origem do localhost
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return origin;
    }
    // Em subdomínios B2B/App, crm ou apex domain, normaliza para www.avaliasolar.com.br
    if (
      origin.includes('app.avaliasolar.com.br') ||
      origin.includes('crm.avaliasolar.com.br') ||
      origin === 'https://avaliasolar.com.br' ||
      origin === 'http://avaliasolar.com.br' ||
      origin.endsWith('.avaliasolar.com.br')
    ) {
      return CANONICAL_PUBLIC_ORIGIN;
    }
    return origin;
  }

  return CANONICAL_PUBLIC_ORIGIN;
}

export function buildPublicReviewUrl(
  tokenOrPath: string,
  channel: CollectionChannel = 'link',
  overrideOrigin?: string
): string {
  if (!tokenOrPath) return '';

  const cleanPath = tokenOrPath.startsWith('/')
    ? tokenOrPath
    : tokenOrPath.startsWith('f/')
    ? `/${tokenOrPath}`
    : `/f/${tokenOrPath}`;

  const origin = overrideOrigin ? getPublicSiteOrigin(overrideOrigin) : getPublicSiteOrigin();
  const normalizedChan = normalizeChannel(channel);

  return `${origin}${cleanPath}?source=${encodeURIComponent(normalizedChan)}`;
}

export function formatShortDisplayUrl(fullUrl: string): string {
  if (!fullUrl) return '';
  return fullUrl.replace(/^https?:\/\//, '');
}
