import { fetchBrandCatalog, fetchBrandDetails } from './brands';
import { fetchApi } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  fetchApi: jest.fn(),
}));

describe('brands API client (Fase F1)', () => {
  const mockFetchApi = fetchApi as jest.MockedFunction<typeof fetchApi>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchBrandCatalog', () => {
    it('executa busca padrão com limite 20', async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            name: 'Fronius',
            slug: 'fronius',
            logo_url: 'https://storage.avaliasolar.com.br/fronius.png',
            logo_alt: 'Fronius',
            initials: 'FR',
            status: 'active' as const,
          },
        ],
        meta: {
          limit: 20,
          total: 1,
          next_cursor: null,
        },
      };

      mockFetchApi.mockResolvedValueOnce(mockResponse);

      const result = await fetchBrandCatalog();

      expect(mockFetchApi).toHaveBeenCalledWith('/brands', {
        method: 'GET',
        params: { limit: 20 },
        signal: undefined,
      });
      expect(result).toEqual(mockResponse);
    });

    it('passa termo de busca limpo e limita a 50 itens no máximo', async () => {
      mockFetchApi.mockResolvedValueOnce({ data: [], meta: { limit: 50, total: 0, next_cursor: null } });

      await fetchBrandCatalog({ q: '  WEG Solar  ', limit: 100 });

      expect(mockFetchApi).toHaveBeenCalledWith('/brands', {
        method: 'GET',
        params: { q: 'WEG Solar', limit: 50 },
        signal: undefined,
      });
    });

    it('inclui cursor para paginação quando fornecido', async () => {
      mockFetchApi.mockResolvedValueOnce({ data: [], meta: { limit: 10, total: 0, next_cursor: null } });

      await fetchBrandCatalog({ cursor: 42, limit: 10 });

      expect(mockFetchApi).toHaveBeenCalledWith('/brands', {
        method: 'GET',
        params: { cursor: 42, limit: 10 },
        signal: undefined,
      });
    });
  });

  describe('fetchBrandDetails', () => {
    it('busca fabricante por slug', async () => {
      const mockItem = {
        data: {
          id: 2,
          name: 'Solis Inverters',
          slug: 'solis-inverters',
          logo_url: null,
          logo_alt: 'Solis Inverters',
          initials: 'SI',
          status: 'active' as const,
        },
      };

      mockFetchApi.mockResolvedValueOnce(mockItem);

      const result = await fetchBrandDetails('solis-inverters');

      expect(mockFetchApi).toHaveBeenCalledWith('/brands/solis-inverters', {
        method: 'GET',
        signal: undefined,
      });
      expect(result).toEqual(mockItem);
    });
  });
});
