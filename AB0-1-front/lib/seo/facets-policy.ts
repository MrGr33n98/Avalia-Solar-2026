import {
  activeSearchParamKeys,
  SEO_NOINDEX_PARAM_KEYS,
  SEO_TRACKING_PARAM_KEYS,
  type SeoSearchParams,
} from '@/lib/seo/search-params';

export const MAX_PAGINATION_PAGE = 500;

export const CATEGORY_FACET_FILTER_KEYS = SEO_NOINDEX_PARAM_KEYS.filter(
  (key) => key !== 'page'
);

export interface CategoryFacetsPolicyDecision {
  validPage: boolean;
  pageNumber: number;
  hasFacetFilters: boolean;
  hasUnknownParams: boolean;
  noindex: boolean;
  selfCanonicalPageNumber: number | null;
}

/**
 * CDSI-068 (E14): Valida o parâmetro `page`.
 * Aceita ausência como página 1; rejeita strings não numéricas, <= 0 ou > MAX_PAGINATION_PAGE.
 */
export function parsePositivePageParam(
  rawPage: string | string[] | undefined
): { valid: boolean; page: number } {
  const value = Array.isArray(rawPage) ? rawPage[0] : rawPage;
  if (value === undefined || value === '') {
    return { valid: true, page: 1 };
  }

  const trimmed = String(value).trim();
  if (!/^-?\d+$/.test(trimmed)) {
    return { valid: false, page: Number.NaN };
  }

  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_PAGINATION_PAGE) {
    return { valid: false, page: parsed };
  }

  return { valid: true, page: parsed };
}

/**
 * CDSI-064 / CDSI-065 / CDSI-071:
 * Avalia a política de paginação e facetas de `/categories/[slug]`:
 * - `?page=N` (N >= 2) SEM filtros de faceta nem parâmetros desconhecidos -> indexável (`index,follow`) e canonical self (`/categories/:slug?page=N`).
 * - Filtros de faceta (`state`, `city`, `min_rating`, `verified`, `sort`, `search`, etc.) -> `noindex,follow` e canonical base (`/categories/:slug`).
 * - Parâmetros desconhecidos -> `noindex,follow` (anti-crawl-trap) e canonical base.
 * - Parâmetros de tracking (`utm_*`, `gclid`, `fbclid`, `msclkid`) -> ignorados para noindex e removidos da canonical.
 */
export function evaluateCategoryFacetsPolicy(
  searchParams?: SeoSearchParams
): CategoryFacetsPolicyDecision {
  const parsedPage = parsePositivePageParam(searchParams?.page);
  const activeKeys = activeSearchParamKeys(searchParams);

  const trackingSet = new Set<string>(SEO_TRACKING_PARAM_KEYS);
  const facetSet = new Set<string>(CATEGORY_FACET_FILTER_KEYS);

  let hasFacetFilters = false;
  let hasUnknownParams = false;

  for (const key of activeKeys) {
    if (key === 'page' || trackingSet.has(key)) continue;
    if (facetSet.has(key)) {
      hasFacetFilters = true;
    } else {
      hasUnknownParams = true;
    }
  }

  const noindex = !parsedPage.valid || hasFacetFilters || hasUnknownParams;
  const selfCanonicalPageNumber =
    parsedPage.valid && parsedPage.page > 1 && !hasFacetFilters && !hasUnknownParams
      ? parsedPage.page
      : null;

  return {
    validPage: parsedPage.valid,
    pageNumber: parsedPage.valid ? parsedPage.page : 1,
    hasFacetFilters,
    hasUnknownParams,
    noindex,
    selfCanonicalPageNumber,
  };
}

