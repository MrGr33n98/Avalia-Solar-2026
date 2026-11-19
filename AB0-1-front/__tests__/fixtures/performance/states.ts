/** Canonical *public* loading states for Spec 014 tests (non-production). */
export type LoadState = 'initial' | 'pending' | 'success' | 'empty' | 'error' | 'secondary-loading';

export const publicCompanyFixtures = {
  success: {
    data: [{ id: 1, slug: 'solar-fixture', name: 'Empresa Solar Fixture', verified: false }],
    meta: { pagination: { page: 1, per_page: 12, total: 1, total_pages: 1 } },
  },
  empty: { data: [], meta: { pagination: { page: 1, per_page: 12, total: 0, total_pages: 0 } } },
  error: { code: 'PUBLIC_COMPANIES_UNAVAILABLE', status: 503 },
  pending: { previousResultVisible: true },
} as const;

export const publicSearchFixtures = {
  success: { companies: publicCompanyFixtures.success.data, products: [], categories: [], articles: [] },
  empty: { companies: [], products: [], categories: [], articles: [] },
  error: { code: 'PUBLIC_SEARCH_UNAVAILABLE', status: 503 },
  pending: { previousResultVisible: true },
} as const;

export const publicProductFixtures = {
  success: { data: [{ id: 1, name: 'Módulo Fixture' }], meta: { total: 1, page: 1, per_page: 12, total_pages: 1 } },
  empty: { data: [], meta: { total: 0, page: 1, per_page: 12, total_pages: 0 } },
  error: { code: 'PUBLIC_PRODUCTS_UNAVAILABLE', status: 503 },
  pending: { previousResultVisible: true },
} as const;
