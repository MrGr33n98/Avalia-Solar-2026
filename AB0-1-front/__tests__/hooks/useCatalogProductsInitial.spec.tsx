import { renderHook, waitFor } from '@testing-library/react';
import { useProducts } from '@/hooks/useProducts';
import { productsApiSafe } from '@/lib/api-client';
import type { InitialProductsPayload } from '@/lib/server/performance/types';

jest.mock('@/lib/api-client', () => ({
  productsApiSafe: { getAllPaginated: jest.fn(), getFilters: jest.fn() },
}));

const paginated = productsApiSafe.getAllPaginated as jest.Mock;
const facets = productsApiSafe.getFilters as jest.Mock;

describe('Spec 014 initial product hydration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    facets.mockResolvedValue({ filters: [] });
  });

  it('starts with real server products and does not immediately refetch that query', async () => {
    const query = { page: 1, per_page: 12 };
    const initial: InitialProductsPayload = {
      key: JSON.stringify(query),
      response: {
        data: [{ id: 1, name: 'Produto' } as any],
        meta: { total: 1, total_pages: 1, page: 1, per_page: 12 },
      },
      filters: { filters: [], categories: [], companies: [], brands: [], price_range: { min: 0, max: 0 } },
    };
    const { result } = renderHook(() => useProducts(query, initial));
    expect(result.current.products).toHaveLength(1);
    expect(result.current.loading).toBe(false);
    expect(paginated).not.toHaveBeenCalled();
  });

  it('refetches changed filters with AbortSignal and keeps the previous dataset until resolved', async () => {
    const first = { page: 1, per_page: 12 };
    const initial: InitialProductsPayload = {
      key: JSON.stringify(first),
      response: { data: [{ id: 1, name: 'Produto' } as any], meta: { total: 1, total_pages: 1, page: 1, per_page: 12 } },
      filters: {},
    };
    paginated.mockResolvedValue({
      data: [{ id: 2, name: 'Novo' }],
      meta: { total: 1, total_pages: 1 },
    });
    const { result, rerender } = renderHook(({ query }) => useProducts(query, initial), {
      initialProps: { query: first },
    });
    expect(result.current.products).toHaveLength(1);
    rerender({ query: { page: 2, per_page: 12 } });
    await waitFor(() => expect(result.current.products[0].id).toBe(2));
    expect(paginated).toHaveBeenCalledWith(expect.objectContaining({
      page: 2,
      signal: expect.any(AbortSignal),
    }));
  });
});
