import 'server-only';
import { cache } from 'react';
import type { SearchAllResponse } from '@/lib/api';
import { fetchApiPublic, publicCompaniesApi } from '@/lib/api-public';
import { normalizeSearchPage, normalizeSearchPageSize } from '@/components/search/searchPagination';

/**
 * Explicit first-render DTO: omit the duplicate legacy `results` object and
 * other response decorations. Public result cards and SEO metadata are kept.
 * All fields originate from anonymous endpoints; no auth headers are forwarded.
 */
const toInitialSearchDto = (source: SearchAllResponse): SearchAllResponse => ({
  companies: source.companies,
  products: source.products,
  categories: source.categories,
  articles: source.articles,
  reviews: source.reviews,
  facets: source.facets,
  counts: source.counts,
  meta: source.meta,
  pagination: source.pagination,
});

export const getInitialSearch = cache(async (queryString: string): Promise<SearchAllResponse | null> => {
  const url = new URLSearchParams(queryString);

  const sort = url.get('sort') || 'relevance';
  const params: Record<string, string | number | boolean> = {
    q: (url.get('q') || '').slice(0, 160),
    sort: sort === 'rating' ? 'rating_desc' : sort === 'relevance' ? 'recommended' : sort.slice(0, 40),
    page: normalizeSearchPage(url.get('page')),
    per_page: normalizeSearchPageSize(url.get('per_page')),
  };
  for (const key of ['city', 'state', 'category'] as const) {
    const value = url.get(key);
    if (value) params[key] = value.slice(0, 100);
  }
  if (url.get('verified') === 'true') params.verified = true;

  try {
    const response = await fetchApiPublic<SearchAllResponse>('search/all', {
      params, revalidate: 60, tags: ['search'], timeoutMs: 5000, silent: true,
    });
    if (!response || !Array.isArray(response.companies) || !Array.isArray(response.products)) return null;
    // Preserve the legacy search → companies fallback on the server too.
    // It is conditional on the initial search response, not an avoidable
    // waterfall; only the public `fields=card` endpoint is allowed here.
    if (params.q && response.companies.length === 0 && !params.verified && !params.category) {
      try {
        const fallback = await publicCompaniesApi.getAll(
          {
            q: String(params.q),
            status: 'active',
            city: params.city ? String(params.city) : undefined,
            state: params.state ? String(params.state) : undefined,
            sort: String(params.sort),
            page: Number(params.page),
            limit: Number(params.per_page),
            fields: 'card',
          },
          { revalidate: 60, tags: ['companies'], timeoutMs: 5000, silent: true }
        );
        if (fallback.length) {
          return toInitialSearchDto({
            ...response,
            companies: fallback,
            counts: { ...response.counts, companies: fallback.length },
          });
        }
      } catch {
        // Leave the existing client fallback as the last recovery path.
      }
    }
    const hasResults = Boolean(
      response.companies.length || response.products.length ||
      response.categories?.length || response.articles?.length
    );
    if (!hasResults && params.q) return null;
    return toInitialSearchDto(response);
  } catch {
    return null;
  }
});
