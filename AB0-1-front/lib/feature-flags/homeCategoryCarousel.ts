const HOME_CATEGORY_CAROUSEL_FLAG = 'home_category_carousel_enabled';
const LEGACY_PUBLIC_HOME_CATEGORY_CAROUSEL_FLAG = 'NEXT_PUBLIC_HOME_CATEGORY_CAROUSEL_ENABLED';

type FeatureFlagEnvironment = Record<string, string | undefined>;

export function isHomeCategoryCarouselEnabled(
  environment: FeatureFlagEnvironment = process.env
) {
  const configuredValue =
    environment[HOME_CATEGORY_CAROUSEL_FLAG] ??
    environment[LEGACY_PUBLIC_HOME_CATEGORY_CAROUSEL_FLAG];

  return configuredValue === 'true';
}
