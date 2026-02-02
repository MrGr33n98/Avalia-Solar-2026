import { CompanyFilters, DEFAULT_FILTERS } from './types';

export function parseQueryParams(searchParams: URLSearchParams): CompanyFilters {
  const categoryIdsStr = searchParams.get('category_ids');
  const stateStr = searchParams.get('state');
  const cityStr = searchParams.get('city');
  const minRatingStr = searchParams.get('min_rating');
  const verifiedStr = searchParams.get('verified');
  const featuredStr = searchParams.get('featured');
  const financingStr = searchParams.get('financing_enabled');
  const whatsappStr = searchParams.get('whatsapp_enabled');
  const sortStr = searchParams.get('sort');
  const pageStr = searchParams.get('page');

  return {
    category_ids: categoryIdsStr ? categoryIdsStr.split(',').map(Number).filter(n => !isNaN(n)).sort((a, b) => a - b) : [],
    state: stateStr ? stateStr.split(',').filter(Boolean).sort() : [],
    city: cityStr ? cityStr.split(',').filter(Boolean).sort() : [],
    min_rating: minRatingStr ? Number(minRatingStr) : null,
    verified: verifiedStr === 'true',
    featured: featuredStr === 'true',
    financing_enabled: financingStr === 'true',
    whatsapp_enabled: whatsappStr === 'true',
    sort: sortStr || DEFAULT_FILTERS.sort,
    page: pageStr ? Number(pageStr) : DEFAULT_FILTERS.page,
  };
}

export function stringifyQueryParams(filters: CompanyFilters): string {
  const params = new URLSearchParams();

  if (filters.category_ids.length > 0) {
    params.set('category_ids', [...filters.category_ids].sort((a, b) => a - b).join(','));
  }

  if (filters.state.length > 0) {
    params.set('state', [...filters.state].sort().join(','));
  }

  if (filters.city.length > 0) {
    params.set('city', [...filters.city].sort().join(','));
  }

  if (filters.min_rating) {
    params.set('min_rating', filters.min_rating.toString());
  }

  if (filters.verified) params.set('verified', 'true');
  if (filters.featured) params.set('featured', 'true');
  if (filters.financing_enabled) params.set('financing_enabled', 'true');
  if (filters.whatsapp_enabled) params.set('whatsapp_enabled', 'true');
  
  if (filters.sort && filters.sort !== DEFAULT_FILTERS.sort) {
    params.set('sort', filters.sort);
  }

  if (filters.page && filters.page !== DEFAULT_FILTERS.page) {
    params.set('page', filters.page.toString());
  }

  return params.toString();
}

export function isFilterActive(filters: CompanyFilters): boolean {
  return (
    filters.category_ids.length > 0 ||
    filters.state.length > 0 ||
    filters.city.length > 0 ||
    filters.min_rating !== null ||
    filters.verified ||
    filters.featured ||
    filters.financing_enabled ||
    filters.whatsapp_enabled
  );
}
