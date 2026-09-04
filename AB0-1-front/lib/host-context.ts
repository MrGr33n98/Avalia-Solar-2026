export type ProductSurface = 'public' | 'company_app' | 'crm';

export interface SurfaceInfo {
  surface: ProductSurface;
  isPublic: boolean;
  isCompanyApp: boolean;
  isCrm: boolean;
  displayName: string;
  loginTitle: string;
  defaultAuthenticatedRoute: string;
}

export function resolveSurfaceFromHost(hostHeader: string | null | undefined): ProductSurface {
  if (!hostHeader) return 'public';

  const cleanHost = hostHeader.split(':')[0].toLowerCase().trim();

  // Explicit Surface Override via environment variable (useful ONLY in local dev/testing)
  if (
    typeof process !== 'undefined' &&
    process.env.NODE_ENV !== 'production' &&
    process.env.NEXT_PUBLIC_SURFACE_OVERRIDE
  ) {
    const override = process.env.NEXT_PUBLIC_SURFACE_OVERRIDE as ProductSurface;
    if (['public', 'company_app', 'crm'].includes(override)) {
      return override;
    }
  }

  if (cleanHost === 'crm.avaliasolar.com.br' || cleanHost.startsWith('crm.')) {
    return 'crm';
  }

  if (cleanHost === 'app.avaliasolar.com.br' || cleanHost.startsWith('app.')) {
    return 'company_app';
  }

  return 'public';
}

export function getSurfaceInfo(surface: ProductSurface): SurfaceInfo {
  switch (surface) {
    case 'crm':
      return {
        surface: 'crm',
        isPublic: false,
        isCompanyApp: false,
        isCrm: true,
        displayName: 'Avalia Solar CRM',
        loginTitle: 'Avalia Solar CRM — Acesso Interno',
        defaultAuthenticatedRoute: '/dashboard/sales/leads',
      };
    case 'company_app':
      return {
        surface: 'company_app',
        isPublic: false,
        isCompanyApp: true,
        isCrm: false,
        displayName: 'Portal da Empresa',
        loginTitle: 'Avalia Solar — Portal da Empresa',
        defaultAuthenticatedRoute: '/dashboard',
      };
    case 'public':
    default:
      return {
        surface: 'public',
        isPublic: true,
        isCompanyApp: false,
        isCrm: false,
        displayName: 'Avalia Solar',
        loginTitle: 'Avalia Solar — Entrar',
        defaultAuthenticatedRoute: '/',
      };
  }
}
