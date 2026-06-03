import { COMPANY_BANNER_FALLBACK_SRC, resolveCompanyBannerSrc } from '@/utils/company-banner';

describe('resolveCompanyBannerSrc', () => {
  it('preserves a registered company banner', () => {
    const bannerUrl = 'https://example.com/company-banner.jpg';

    expect(resolveCompanyBannerSrc(bannerUrl)).toBe(bannerUrl);
  });

  it('uses the same fallback as the company detail page when the banner is missing', () => {
    expect(resolveCompanyBannerSrc(null)).toBe(COMPANY_BANNER_FALLBACK_SRC);
  });

  it('uses the same fallback as the company detail page when the registered banner fails', () => {
    expect(resolveCompanyBannerSrc('https://example.com/broken.jpg', true)).toBe(COMPANY_BANNER_FALLBACK_SRC);
  });

  it('replaces the old public placeholder with the company detail page fallback', () => {
    expect(resolveCompanyBannerSrc('/images/banner-avalia-solar.png')).toBe(COMPANY_BANNER_FALLBACK_SRC);
  });
});
