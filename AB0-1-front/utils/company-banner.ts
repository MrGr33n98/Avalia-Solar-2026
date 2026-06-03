import { getFullImageUrl } from '@/utils/image';

export const COMPANY_BANNER_FALLBACK_SRC = '/images/avalia-solar-banner-placeholder-v1.png';
const LEGACY_COMPANY_BANNER_PLACEHOLDERS = [
  '/images/banner-avalia-solar.png',
  'banner-avalia-solar.png',
] as const;

export function resolveCompanyBannerSrc(bannerUrl?: string | null, hasError = false): string {
  if (!bannerUrl || hasError) return COMPANY_BANNER_FALLBACK_SRC;

  if (LEGACY_COMPANY_BANNER_PLACEHOLDERS.some((placeholder) => bannerUrl.includes(placeholder))) {
    return COMPANY_BANNER_FALLBACK_SRC;
  }

  return getFullImageUrl(bannerUrl);
}
