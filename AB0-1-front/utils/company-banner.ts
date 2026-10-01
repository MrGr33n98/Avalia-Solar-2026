import type { Company } from '@/lib/api';
import { isFeatureEnabled } from '@/lib/feature-access';
import { getFullImageUrl } from '@/utils/image';

export const COMPANY_BANNER_FALLBACK_SRC = '/images/avalia-solar-banner-placeholder-v1.png';
const LEGACY_COMPANY_BANNER_PLACEHOLDERS = [
  '/images/banner-avalia-solar.png',
  'banner-avalia-solar.png',
] as const;

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
