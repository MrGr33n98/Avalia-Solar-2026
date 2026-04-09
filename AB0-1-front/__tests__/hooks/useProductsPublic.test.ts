import { renderHook, act, waitFor } from '@testing-library/react';
import { useProducts } from '@/hooks/useProducts';
import * as apiClient from '@/lib/api-client';

// Mock the api-client module
jest.mock('@/lib/api-client', () => ({
  productsApiSafe: {
    getAllPaginated: jest.fn(),
    getFilters: jest.fn(),
  },
}));

const mockProductsApiSafe = apiClient.productsApiSafe as jest.Mocked<typeof apiClient.productsApiSafe>;

const mockProduct = (overrides = {}) => ({
  id: 1,
  name: 'Painel Solar 400W',
  price: 1200,
  sku: 'PS-400W',
  status: 'active',
  company: { id: 1, name: 'SolarTech' },
  category: { id: 2, name: 'Painéis Solares' },
  ...overrides,
});

const mockPaginatedResponse = (products: any[], total = products.length) => ({
  data: products,
  meta: {
    total,
    page: 1,
    per_page: 12,
    total_pages: Math.ceil(total / 12),
  },
});

describe('useProducts (public hook)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockProductsApiSafe.getFilters.mockResolvedValue({ filters: [] });
  });

  it('fetches products on mount and sets loading correctly', async () => {
    const products = [mockProduct(), mockProduct({ id: 2, name: 'Inversor 5kW' })];
    mockProductsApiSafe.getAllPaginated.mockResolvedValue(mockPaginatedResponse(products));

    const { result } = renderHook(() => useProducts());

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.products).toHaveLength(2);
    expect(result.current.total).toBe(2);
    expect(result.current.totalPages).toBe(1);
    expect(result.current.error).toBeNull();
  });

  it('passes params to getAllPaginated', async () => {
    mockProductsApiSafe.getAllPaginated.mockResolvedValue(mockPaginatedResponse([]));

    renderHook(() =>
      useProducts({ q: 'painel', sort: 'price_asc', page: 2, per_page: 6 })
    );

    await waitFor(() =>
      expect(mockProductsApiSafe.getAllPaginated).toHaveBeenCalledWith(
        expect.objectContaining({ q: 'painel', sort: 'price_asc', page: 2, per_page: 6 })
      )
    );
  });

  it('strips null and undefined params before calling API', async () => {
    mockProductsApiSafe.getAllPaginated.mockResolvedValue(mockPaginatedResponse([]));

    renderHook(() =>
      useProducts({ q: undefined, category_id: null, sort: 'name_asc' })
    );

    await waitFor(() =>
      expect(mockProductsApiSafe.getAllPaginated).toHaveBeenCalledWith(
        expect.not.objectContaining({ q: undefined, category_id: null })
      )
    );

    expect(mockProductsApiSafe.getAllPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ sort: 'name_asc' })
    );
  });

  it('sets error state when API call fails', async () => {
    mockProductsApiSafe.getAllPaginated.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useProducts());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Network error');
    expect(result.current.products).toHaveLength(0);
  });

  it('returns pagination metadata correctly', async () => {
    const products = Array.from({ length: 12 }, (_, i) => mockProduct({ id: i + 1 }));
    mockProductsApiSafe.getAllPaginated.mockResolvedValue({
      data: products,
      meta: { total: 36, page: 1, per_page: 12, total_pages: 3 },
    });

    const { result } = renderHook(() => useProducts({ per_page: 12 }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.total).toBe(36);
    expect(result.current.totalPages).toBe(3);
    expect(result.current.products).toHaveLength(12);
  });

  it('refetches when params change', async () => {
    mockProductsApiSafe.getAllPaginated.mockResolvedValue(mockPaginatedResponse([]));

    const { rerender } = renderHook(
      ({ params }) => useProducts(params),
      { initialProps: { params: { q: 'painel' } } }
    );

    await waitFor(() =>
      expect(mockProductsApiSafe.getAllPaginated).toHaveBeenCalledTimes(1)
    );

    rerender({ params: { q: 'inversor' } });

    await waitFor(() =>
      expect(mockProductsApiSafe.getAllPaginated).toHaveBeenCalledTimes(2)
    );

    expect(mockProductsApiSafe.getAllPaginated).toHaveBeenLastCalledWith(
      expect.objectContaining({ q: 'inversor' })
    );
  });

  it('only fetches filtersMeta once across multiple param changes', async () => {
    mockProductsApiSafe.getAllPaginated.mockResolvedValue(mockPaginatedResponse([]));
    mockProductsApiSafe.getFilters.mockResolvedValue({
      filters: [{ key: 'power', label: 'Potência', type: 'decimal' }],
    });

    const { rerender } = renderHook(
      ({ params }) => useProducts(params),
      { initialProps: { params: { q: 'painel' } } }
    );

    await waitFor(() =>
      expect(mockProductsApiSafe.getAllPaginated).toHaveBeenCalledTimes(1)
    );

    rerender({ params: { q: 'inversor' } });

    await waitFor(() =>
      expect(mockProductsApiSafe.getAllPaginated).toHaveBeenCalledTimes(2)
    );

    // getFilters should only have been called once
    expect(mockProductsApiSafe.getFilters).toHaveBeenCalledTimes(1);
  });
});
