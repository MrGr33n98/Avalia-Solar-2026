// React's client Jest resolver does not expose React.cache (server-only).
// Use an identity memoizer in JSDOM; request-scoped cache is tested in Next RSC.
jest.mock('react', () => {
  const actual = jest.requireActual('react');
  return { ...actual, cache: (fn: unknown) => fn };
});
jest.mock('server-only', () => ({}), { virtual: true });
jest.mock('@/lib/api-public', () => ({
  fetchApiPublic: jest.fn(),
  publicCompaniesApi: {
    getAll: jest.fn(),
    getById: jest.fn(),
  },
}));

import { fetchApiPublic, publicCompaniesApi } from '@/lib/api-public';
import { loadCompaniesInitial, loadProductsInitial, loadSearchInitial } from './loaders';

const fetchMock = fetchApiPublic as jest.Mock;
const companiesMock = publicCompaniesApi.getAll as jest.Mock;

describe('Spec 014 public server loaders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the first companies card dataset from the public cached API', async () => {
    fetchMock.mockResolvedValue({
      data: [{ id: 17, name: 'Empresa Solar Teste' }],
      meta: { pagination: { total: 1, page: 1 } },
    });
    const result = await loadCompaniesInitial('state=SC&search=solar');

    expect(fetchMock).toHaveBeenCalledWith('companies', expect.objectContaining({
      revalidate: 300,
      tags: ['companies'],
      params: expect.objectContaining({
        status: 'active', fields: 'card', q: 'solar', state: ['SC'], per_page: 12,
      }),
    }));
    expect(result.response.data).toHaveLength(1);
    expect(result.key).toContain('solar');
  });

  it('loads first products and filter facets concurrently with public revalidation tags', async () => {
    fetchMock.mockImplementation(async (endpoint: string) => endpoint === 'products'
      ? { data: [{ id: 10, name: 'Módulo' }], meta: { total: 1, page: 1, per_page: 12, total_pages: 1 } }
      : { filters: [], categories: [{ id: 2, name: 'Módulos' }], price_range: { min: 0, max: 5000 } });
    const result = await loadProductsInitial('search=modulo&page=1');

    expect(fetchMock).toHaveBeenCalledWith('products', expect.objectContaining({
      revalidate: 300, params: expect.objectContaining({ q: 'modulo' }),
    }));
    expect(fetchMock).toHaveBeenCalledWith('products/filters', expect.objectContaining({
      revalidate: 900,
    }));
    expect(result.response.data).toHaveLength(1);
    expect(result.filters.categories).toHaveLength(1);
  });

  it('reuses the fallback catalog only for genuinely empty unverified search matches', async () => {
    fetchMock.mockResolvedValue({
      companies: [], products: [], categories: [], articles: [],
      meta: { total_count: 0, page: 1, per_page: 12, total_pages: 0 },
    });
    companiesMock.mockResolvedValue([{ id: 11, name: 'Instaladora SC' }]);
    const result = await loadSearchInitial('q=solar');
    expect(companiesMock).toHaveBeenCalledTimes(1);
    expect(result.response.companies).toHaveLength(1);
    expect(result.pagination.total_count).toBe(1);
  });

  it('does not use a fabricated empty success response when the public API fails', async () => {
    fetchMock.mockRejectedValueOnce(new Error('backend unavailable'));
    await expect(loadCompaniesInitial('search=error')).rejects.toThrow('backend unavailable');
  });
});
