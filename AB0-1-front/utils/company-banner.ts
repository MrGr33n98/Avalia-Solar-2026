import type { Company } from '@/lib/api';
import { isFeatureEnabled } from '@/lib/feature-access';
import { getFullImageUrl } from '@/utils/image';

export const COMPANY_BANNER_FALLBACK_SRC = '/assets/avalia-solar-banner-v3.webp';
export const COMPANY_BANNER_EV_FALLBACK_SRC = '/assets/avalia-solar-ev-banner-categories.webp';

export const EV_BANNER_DIMENSIONS = { width: 1024, height: 235 } as const;
export const DEFAULT_BANNER_DIMENSIONS = { width: 1024, height: 191 } as const;

const LEGACY_COMPANY_BANNER_PLACEHOLDERS = [
  '/images/banner-avalia-solar.png',
  'banner-avalia-solar.png',
] as const;

export const EV_CATEGORY_SLUGS: ReadonlySet<string> = new Set([
  // B: Mobilidade Elétrica
  'carregadores-comerciais',
  'carregadores-comerciais-e-condominios',
  'commercial_ev_charger',
  'carregadores-residenciais',
  'carregadores-residenciais-wallbox',
  'carregador-residencial',
  'wallbox',
  'wallbox-residencial',
  'home_wallbox',
  'estacoes-publicas',
  'estacoes-publicas-e-postos-rapidos',
  'public_charging_station',
  'instaladores-carregadores',
  'instaladores-ev',
  'instaladores-de-carregadores-ev',
  'ev_installer',
  'integracao-solar-ev',
  'integracao-solar-mobilidade',
  'integracao-solar-mobilidade-eletrica',
  'integracao-solar-e-mobilidade-eletrica',
  'solar_mobility_integration',
  'veiculos-eletricos',
  'carros-eletricos',
  'electric_vehicle',
  'mobilidade-eletrica',

  // D: Hubs de Eletromobilidade e Recarga
  'hubs-de-eletromobilidade-e-recarga',
  'hubs-eletromobilidade',
  'electromobility_hub',

  // E: Frotas Elétricas
  'frotas-eletricas',
  'frotas-eletricas-corporativas',
  'frotas-corporativas',
  'frotas-eletricas-empresas',
  'fleet_electric',
  'frotas-eletricas-para-logistica-e-entregas',
  'frotas-logistica',
  'frotas-eletricas-logistica',
  'frotas-eletricas-para-mobilidade-urbana',
  'mobilidade-urbana',
  'gestao-de-frotas-eletricas',
  'gestao-frotas',
  'gestao-de-frotas',
  'fleet_management',
  'infraestrutura-de-recarga-para-frotas',
  'recarga-frotas',
  'fleet_charging',
]);

const EV_KEYWORDS = [
  'mobilidade eletrica',
  'mobilidade elétrica',
  'carregador',
  'carregadores',
  'wallbox',
  'eletroposto',
  'eletromobilidade',
  'veiculo eletrico',
  'veículo elétrico',
  'veiculos eletricos',
  'veículos elétricos',
  'frota eletrica',
  'frota elétrica',
  'frotas eletricas',
  'frotas elétricas',
  'recarga ve',
  'recarga ev',
];

export function isEVCompanyCategory(
  company?: Partial<Company> | null
): boolean {
  if (!company) return false;

  const checkSlugOrName = (val?: string | null): boolean => {
    if (!val || typeof val !== 'string') return false;
    const normalized = val.trim().toLowerCase();
    if (EV_CATEGORY_SLUGS.has(normalized)) return true;
    return EV_KEYWORDS.some((kw) => normalized.includes(kw));
  };

  // 1. Verificar category direta / primary_category
  if (checkSlugOrName(company.category)) return true;
  if (checkSlugOrName(company.category_name)) return true;
  if (checkSlugOrName(company.primary_category)) return true;

  // 2. Verificar identity?.primary_category
  if (company.identity?.primary_category) {
    if (checkSlugOrName(company.identity.primary_category.slug)) return true;
    if (checkSlugOrName(company.identity.primary_category.name)) return true;
  }

  // 3. Verificar category_info
  const catInfo = (company as { category_info?: { seo_url?: string; name?: string; slug?: string } })?.category_info;
  if (catInfo) {
    if (checkSlugOrName(catInfo.seo_url)) return true;
    if (checkSlugOrName(catInfo.slug)) return true;
    if (checkSlugOrName(catInfo.name)) return true;
  }

  // 4. Verificar lista de categories
  if (Array.isArray(company.categories) && company.categories.length > 0) {
    for (const cat of company.categories) {
      if (checkSlugOrName(cat.seo_url)) return true;
      if (checkSlugOrName(cat.slug)) return true;
      if (checkSlugOrName(cat.name)) return true;
    }
  }

  return false;
}

export function resolveCompanyFallbackBanner(company?: Partial<Company> | null): {
  src: string;
  width: number;
  height: number;
} {
  if (isEVCompanyCategory(company)) {
    return {
      src: COMPANY_BANNER_EV_FALLBACK_SRC,
      width: EV_BANNER_DIMENSIONS.width,
      height: EV_BANNER_DIMENSIONS.height,
    };
  }

  return {
    src: COMPANY_BANNER_FALLBACK_SRC,
    width: DEFAULT_BANNER_DIMENSIONS.width,
    height: DEFAULT_BANNER_DIMENSIONS.height,
  };
}

export type CompanyHeroBannerState =
  | { kind: 'free-plan-placeholder' }
  | { kind: 'company-banner'; src: string }
  | { kind: 'paid-empty' }
  | { kind: 'paid-load-error' };

export function resolveCompanyHeroBannerState(
  company: Pick<Company, 'feature_access'>,
  bannerUrl?: string | null,
  hasError = false
): CompanyHeroBannerState {
  if (!isFeatureEnabled(company.feature_access, 'promo_banner')) {
    return { kind: 'free-plan-placeholder' };
  }

  if (hasError) return { kind: 'paid-load-error' };
  if (bannerUrl) return { kind: 'company-banner', src: bannerUrl };

  return { kind: 'paid-empty' };
}

export function resolveCompanyBannerSrc(bannerUrl?: string | null, hasError = false): string {
  if (!bannerUrl || hasError) return COMPANY_BANNER_FALLBACK_SRC;

  if (LEGACY_COMPANY_BANNER_PLACEHOLDERS.some((placeholder) => bannerUrl.includes(placeholder))) {
    return COMPANY_BANNER_FALLBACK_SRC;
  }

  return getFullImageUrl(bannerUrl);
}
