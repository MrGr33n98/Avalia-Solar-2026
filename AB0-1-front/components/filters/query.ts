import { CompanyFilters, DEFAULT_FILTERS } from './types';

export function parseQueryParams(searchParams: URLSearchParams): CompanyFilters {
  const categoryIdsStr = searchParams.get('category_ids');
  const statesStr = searchParams.get('states');
  const minRatingStr = searchParams.get('min_rating');
  const verifiedStr = searchParams.get('verified');

  return {
    category_ids: categoryIdsStr ? categoryIdsStr.split(',').map(Number).filter(n => !isNaN(n)).sort((a, b) => a - b) : [],
    states: statesStr ? statesStr.split(',').filter(Boolean).sort() : [],
    min_rating: minRatingStr ? Number(minRatingStr) : null,
    verified: verifiedStr === 'true',
  };
}

export function stringifyQueryParams(filters: CompanyFilters): string {
  const params = new URLSearchParams();

  if (filters.category_ids.length > 0) {
    params.set('category_ids', [...filters.category_ids].sort((a, b) => a - b).join(','));
  }

  if (filters.states.length > 0) {
    params.set('states', [...filters.states].sort().join(','));
  }

  if (filters.min_rating) {
    params.set('min_rating', filters.min_rating.toString());
  }

  if (filters.verified) {
    params.set('verified', 'true');
  }

  return params.toString();
}

export function isFilterActive(filters: CompanyFilters): boolean {
  return (
    filters.category_ids.length > 0 ||
    filters.states.length > 0 ||
    filters.min_rating !== null ||
    filters.verified
  );
}
