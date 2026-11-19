import 'server-only';
import { cache } from 'react';
import type { Company } from '@/lib/api';
import { publicCompaniesApi } from '@/lib/api-public';
import { parseQueryParams } from '@/components/filters/query';

/**
 * Initial PUBLIC company listing. The public API's `fields=card` mode is
 * intentional: never pass authenticated/internal company records into RSC.
 * A filtered URL unsupported by the public endpoint is left to the existing
 * client query instead of rendering incorrect results.
 */
export type InitialCompaniesPage = {
  data: Company[];
  meta?: { pagination?: unknown };
};

export const getInitialCompaniesPage = cache(async (
  queryString: string,
  pathCategoryIds: number[] = []
): Promise<InitialCompaniesPage | null> => {
  const filters = parseQueryParams(new URLSearchParams(queryString), { pathCategoryIds });
  if (
    filters.has_reviews ||
    filters.financing_enabled ||
    filters.whatsapp_enabled ||
    filters.lat !== null ||
    filters.lng !== null
  ) return null;

  const page = Number.isFinite(filters.page) && filters.page > 0 ? Math.floor(filters.page) : 1;
  try {
    return await publicCompaniesApi.getAllPaginated(
      {
        status: 'active',
        fields: 'card',
        page,
        per_page: 12,
        q: filters.search || undefined,
        state: filters.state.length ? filters.state : undefined,
        city: filters.city.length ? filters.city : undefined,
        category_ids: filters.category_ids.length ? filters.category_ids : undefined,
        min_rating: filters.min_rating || undefined,
        verified: filters.verified || undefined,
        featured: filters.featured || undefined,
        sort: filters.sort || undefined,
      },
      { revalidate: 60, tags: ['companies'], timeoutMs: 5000, silent: true }
    );
  } catch {
    // An API outage must not turn the entire public route into an error.
    return null;
  }
});
