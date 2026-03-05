export const HOME_HERO_EXPERIMENT_ID = 'home_hero_v1';
export const HOME_HERO_EXPERIMENT_COOKIE = 'as_exp_home_hero_v1';
export const HOME_HERO_EXPERIMENT_TTL_DAYS = 30;

export type HomeHeroVariant = 'control' | 'variant';

export interface HomeHeroTrustMetrics {
  totalActiveCompanies: number | null;
  totalVerifiedCompanies: number | null;
}

interface ResolveHomeHeroVariantArgs {
  enabled: boolean;
  cookieValue?: string | null;
  random?: () => number;
}

interface ShouldAssignHomeHeroExperimentCookieArgs {
  pathname: string;
  enabled: boolean;
  cookieValue?: string | null;
}

export const isHomeHeroExperimentEnabled = (): boolean =>
  process.env.NEXT_PUBLIC_EXP_HOME_HERO_ENABLED === 'true';

export const normalizeHomeHeroVariant = (
  value?: string | null
): HomeHeroVariant | null => {
  if (!value) return null;
  if (value === 'control' || value === 'variant') return value;
  return null;
};

export const pickHomeHeroVariant = (random: () => number = Math.random): HomeHeroVariant =>
  random() < 0.5 ? 'control' : 'variant';

export const resolveHomeHeroVariant = ({
  enabled,
  cookieValue,
  random = Math.random,
}: ResolveHomeHeroVariantArgs): HomeHeroVariant => {
  if (!enabled) return 'control';

  const normalizedCookie = normalizeHomeHeroVariant(cookieValue);
  if (normalizedCookie) return normalizedCookie;

  return pickHomeHeroVariant(random);
};

export const shouldAssignHomeHeroExperimentCookie = ({
  pathname,
  enabled,
  cookieValue,
}: ShouldAssignHomeHeroExperimentCookieArgs): boolean => {
  if (pathname !== '/') return false;
  if (!enabled) return false;

  return normalizeHomeHeroVariant(cookieValue) === null;
};
