import { renderHook, waitFor } from '@testing-library/react';
import { useProducts } from '@/hooks/useProducts';
import * as apiClient from '@/lib/api-client';
import type { Product } from '@/lib/api';

// Mock the api-client module
jest.mock('@/lib/api-client', () => ({
  productsApiSafe: {
    getAllPaginated: jest.fn(),
    getFilters: jest.fn(),
  },
}));

const mockProductsApiSafe = apiClient.productsApiSafe as jest.Mocked<
  typeof apiClient.productsApiSafe
>;

const mockProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 1,
  name: 'Painel Solar 400W',
  description: 'Produto real do catalogo',
  price: 1200,
  sku: 'PS-400W',
  status: 'active',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  company: { id: 1, name: 'SolarTech' },
  category: { id: 2, name: 'Painéis Solares' },
  ...overrides,
});

const mockPaginatedResponse = (products: Product[], total = products.length) => ({
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
      useProducts({
        q: 'painel',
        category_id: 10,
        company_id: 20,
        brand_id: 30,
        price_min: 1000,
        price_max: 5000,
        include_specs: true,
        sort: 'price_asc',
        page: 2,
        per_page: 6,
      })
    );

    await waitFor(() =>
      expect(mockProductsApiSafe.getAllPaginated).toHaveBeenCalledWith(
        expect.objectContaining({
          q: 'painel',
          category_id: 10,
          company_id: 20,
          brand_id: 30,
          price_min: 1000,
          price_max: 5000,
          include_specs: true,
          sort: 'price_asc',
          page: 2,
          per_page: 6,
        })
      )
    );
  });

  it('strips null and undefined params before calling API', async () => {
    mockProductsApiSafe.getAllPaginated.mockResolvedValue(mockPaginatedResponse([]));

    renderHook(() => useProducts({ q: undefined, category_id: null, sort: 'name_asc' }));

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

    const { rerender } = renderHook(({ params }) => useProducts(params), {
      initialProps: { params: { q: 'painel' } },
    });

    await waitFor(() => expect(mockProductsApiSafe.getAllPaginated).toHaveBeenCalledTimes(1));

    rerender({ params: { q: 'inversor' } });

    await waitFor(() => expect(mockProductsApiSafe.getAllPaginated).toHaveBeenCalledTimes(2));

    expect(mockProductsApiSafe.getAllPaginated).toHaveBeenLastCalledWith(
      expect.objectContaining({ q: 'inversor' })
    );
  });

  it('only fetches filtersMeta once across multiple param changes', async () => {
    mockProductsApiSafe.getAllPaginated.mockResolvedValue(mockPaginatedResponse([]));
    mockProductsApiSafe.getFilters.mockResolvedValue({
      filters: [{ key: 'power', label: 'Potência', type: 'decimal' }],
      categories: [{ id: 1, name: 'Inversores', seo_url: 'inversores', products_count: 2 }],
      companies: [{ id: 2, name: 'WEG', city: 'Jaraguá do Sul', state: 'SC', products_count: 3 }],
      brands: [{ id: 3, name: 'WEG', slug: 'weg', products_count: 4 }],
      price_range: { min: 100, max: 9000 },
    });

    const { rerender } = renderHook(({ params }) => useProducts(params), {
      initialProps: { params: { q: 'painel' } },
    });

    await waitFor(() => expect(mockProductsApiSafe.getAllPaginated).toHaveBeenCalledTimes(1));

    rerender({ params: { q: 'inversor' } });

    await waitFor(() => expect(mockProductsApiSafe.getAllPaginated).toHaveBeenCalledTimes(2));

    // getFilters should only have been called once
    expect(mockProductsApiSafe.getFilters).toHaveBeenCalledTimes(1);
  });

  it('exposes catalog filter metadata from the API', async () => {
    mockProductsApiSafe.getAllPaginated.mockResolvedValue(mockPaginatedResponse([]));
    mockProductsApiSafe.getFilters.mockResolvedValue({
      filters: [{ key: 'application', label: 'Aplicação', type: 'enum', options: ['Residencial'] }],
      categories: [{ id: 1, name: 'Inversores', seo_url: 'inversores', products_count: 2 }],
      companies: [{ id: 2, name: 'WEG', city: 'Jaraguá do Sul', state: 'SC', products_count: 3 }],
      brands: [{ id: 3, name: 'WEG', slug: 'weg', products_count: 4 }],
      price_range: { min: 100, max: 9000 },
    });

    const { result } = renderHook(() => useProducts());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.filtersMeta).toHaveLength(1);
    expect(result.current.categoriesMeta).toEqual([
      expect.objectContaining({ id: 1, name: 'Inversores', products_count: 2 }),
    ]);
    expect(result.current.companiesMeta).toEqual([
      expect.objectContaining({ id: 2, name: 'WEG', city: 'Jaraguá do Sul', state: 'SC' }),
    ]);
    expect(result.current.brandsMeta).toEqual([
      expect.objectContaining({ id: 3, name: 'WEG', slug: 'weg' }),
    ]);
    expect(result.current.priceRangeMeta).toEqual({ min: 100, max: 9000 });
  });
});
