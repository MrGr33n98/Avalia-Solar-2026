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

export function normalizeChannel(channel?: string | null): CollectionChannel {
  if (!channel) return 'link';
  const clean = channel.trim().toLowerCase();
  return (CANONICAL_CHANNELS as readonly string[]).includes(clean)
    ? (clean as CollectionChannel)
    : 'link';
}

export function getPublicSiteOrigin(): string {
  if (typeof process !== 'undefined') {
    const configuredSite = process.env.NEXT_PUBLIC_PUBLIC_URL || process.env.NEXT_PUBLIC_SITE_URL;
    if (configuredSite) {
      return configuredSite.replace(/\/+$/, '');
    }
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    const origin = window.location.origin;
    // Em ambiente local, mantém a origem do localhost
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return origin;
    }
    // Em subdomínios B2B/App (ex: app.avaliasolar.com.br ou crm.avaliasolar.com.br),
    // redireciona a origem pública para o domínio principal www
    if (origin.includes('app.avaliasolar.com.br') || origin.includes('crm.avaliasolar.com.br')) {
      return 'https://www.avaliasolar.com.br';
    }
    return origin;
  }

  return 'https://www.avaliasolar.com.br';
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

  const origin = overrideOrigin ? overrideOrigin.replace(/\/+$/, '') : getPublicSiteOrigin();
  const normalizedChan = normalizeChannel(channel);

  return `${origin}${cleanPath}?source=${encodeURIComponent(normalizedChan)}`;
}

export function formatShortDisplayUrl(fullUrl: string): string {
  if (!fullUrl) return '';
  return fullUrl
    .replace(/^https?:\/\//, '')
    .replace('avaliasolar.com.br/f/', 'avali.as/f/');
}

