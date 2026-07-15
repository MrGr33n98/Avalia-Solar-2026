export type SeoSearchParams = Record<string, string | string[] | undefined>;

export const LOCAL_PAGE_FILTER_KEYS = [
  'q',
  'category_ids',
  'project_types',
  'featured',
  'verified',
  'min_rating',
  'sort',
  'page',
] as const;

export const SEO_NOINDEX_PARAM_KEYS = [
  ...LOCAL_PAGE_FILTER_KEYS,
  'rating',
  'search',
  'searchTerm',
  'niche_tag',
  'project_type',
  'chips',
  'city',
  'state',
  'distance',
  'radius',
  'lat',
  'lng',
  'tab',
] as const;

export const SEO_TRACKING_PARAM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'gclid',
  'fbclid',
  'msclkid',
] as const;

type ShouldNoindexOptions = {
  allowlistedKeys?: readonly string[];
  ignoredKeys?: readonly string[];
  noindexKeys?: readonly string[];
};

function hasValue(value: string | string[] | undefined): boolean {
  if (Array.isArray(value)) {
    return value.some((item) => item.trim().length > 0);
  }

  return typeof value === 'string' && value.trim().length > 0;
}

export function activeSearchParamKeys(searchParams?: SeoSearchParams): string[] {
  if (!searchParams) return [];

  return Object.entries(searchParams)
    .filter(([, value]) => hasValue(value))
    .map(([key]) => key);
}

export function hasSeoSearchParams(searchParams?: SeoSearchParams): boolean {
  return activeSearchParamKeys(searchParams).length > 0;
}

export function shouldNoindexSearchParams(
  searchParams?: SeoSearchParams,
  options: ShouldNoindexOptions = {}
): boolean {
  const activeKeys = activeSearchParamKeys(searchParams);
  if (activeKeys.length === 0) return false;

  const noindexKeys = new Set(options.noindexKeys || SEO_NOINDEX_PARAM_KEYS);
  const ignoredKeys = new Set(options.ignoredKeys || SEO_TRACKING_PARAM_KEYS);
  const allowlistedKeys = new Set(options.allowlistedKeys || []);

  return activeKeys.some((key) => {
    if (ignoredKeys.has(key) || allowlistedKeys.has(key)) return false;
    if (noindexKeys.has(key)) return true;

    // Parametros desconhecidos tambem entram em noindex para evitar crawl traps.
    return true;
  });
}
