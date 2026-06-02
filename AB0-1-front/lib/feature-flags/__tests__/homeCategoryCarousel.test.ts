import { isHomeCategoryCarouselEnabled } from '@/lib/feature-flags/homeCategoryCarousel';

describe('isHomeCategoryCarouselEnabled', () => {
  it('is disabled by default', () => {
    expect(isHomeCategoryCarouselEnabled({})).toBe(false);
  });

  it('enables the carousel with the required feature flag', () => {
    expect(isHomeCategoryCarouselEnabled({ home_category_carousel_enabled: 'true' })).toBe(true);
  });

  it('keeps the required flag authoritative when the legacy alias is also present', () => {
    expect(
      isHomeCategoryCarouselEnabled({
        home_category_carousel_enabled: 'false',
        NEXT_PUBLIC_HOME_CATEGORY_CAROUSEL_ENABLED: 'true',
      })
    ).toBe(false);
  });

  it('supports the existing public environment alias during rollout', () => {
    expect(isHomeCategoryCarouselEnabled({ NEXT_PUBLIC_HOME_CATEGORY_CAROUSEL_ENABLED: 'true' })).toBe(true);
  });
});
