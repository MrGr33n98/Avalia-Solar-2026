import { getFullImageUrl } from '@/utils/image';

export const COMPANY_BANNER_FALLBACK_SRC = '/images/avalia-solar-banner-placeholder-v1.png';

export function resolveCompanyBannerSrc(bannerUrl?: string | null, hasError = false): string {
  if (!bannerUrl || hasError) return COMPANY_BANNER_FALLBACK_SRC;

  return getFullImageUrl(bannerUrl);
}
