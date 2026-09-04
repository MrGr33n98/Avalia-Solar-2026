import { ProductSurface } from '@/lib/host-context';

export const SURFACE_ORIGINS = {
  public: process.env.NEXT_PUBLIC_PUBLIC_ORIGIN || 'https://www.avaliasolar.com.br',
  company: process.env.NEXT_PUBLIC_APP_ORIGIN || 'https://app.avaliasolar.com.br',
  crm: process.env.NEXT_PUBLIC_CRM_ORIGIN || 'https://crm.avaliasolar.com.br',
  api: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.avaliasolar.com.br',
} as const;

export function getSurfaceOrigin(surface: ProductSurface): string {
  switch (surface) {
    case 'company_app':
      return SURFACE_ORIGINS.company;
    case 'crm':
      return SURFACE_ORIGINS.crm;
    case 'public':
    default:
      return SURFACE_ORIGINS.public;
  }
}

export function buildCanonicalUrl(surface: ProductSurface, pathWithQuery: string): string {
  const origin = getSurfaceOrigin(surface);
  const cleanPath = pathWithQuery.startsWith('/') ? pathWithQuery : `/${pathWithQuery}`;
  return `${origin}${cleanPath}`;
}

export function isSameOrigin(url1: string, url2: string): boolean {
  try {
    const origin1 = new URL(url1, 'https://www.avaliasolar.com.br').origin;
    const origin2 = new URL(url2, 'https://www.avaliasolar.com.br').origin;
    return origin1 === origin2;
  } catch {
    return false;
  }
}
