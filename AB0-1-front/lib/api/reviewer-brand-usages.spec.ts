import {
  fetchReviewerBrandUsages,
  fetchReviewerBrandUsageDetails,
  createReviewerBrandUsage,
  updateReviewerBrandUsage,
  deleteReviewerBrandUsage,
  fetchReviewerBrandSummary,
} from './reviewer-brand-usages';
import { fetchApi } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  fetchApi: jest.fn(),
}));

describe('reviewer-brand-usages API client (Fase F3)', () => {
  const mockFetchApi = fetchApi as jest.MockedFunction<typeof fetchApi>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchReviewerBrandUsages', () => {
    it('faz requisição GET com parâmetros padrão', async () => {
      const mockResponse = {
        data: [],
        meta: { limit: 20, total: 0, next_cursor: null },
      };
      mockFetchApi.mockResolvedValueOnce(mockResponse);

      const result = await fetchReviewerBrandUsages();

      expect(mockFetchApi).toHaveBeenCalledWith('/reviewer/brand_usages', {
        method: 'GET',
        params: { status: 'active', limit: 20 },
        signal: undefined,
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('createReviewerBrandUsage', () => {
    it('faz requisição POST encapsulando no objeto brand_usage', async () => {
      const payload = {
        brand_id: 10,
        usage_context: 'integrator_install' as const,
        description: 'Instalação de inversores',
      };
      mockFetchApi.mockResolvedValueOnce({ data: { id: '1' } });

      await createReviewerBrandUsage(payload);

      expect(mockFetchApi).toHaveBeenCalledWith('/reviewer/brand_usages', {
        method: 'POST',
        body: { brand_usage: payload },
      });
    });
  });

  describe('updateReviewerBrandUsage', () => {
    it('faz requisição PATCH para atualizar visibilidade com consentimento', async () => {
      const payload = {
        visibility: 'public' as const,
        consent_confirmed: true,
        consent_version: 'v1.0',
        lock_version: 0,
      };
      mockFetchApi.mockResolvedValueOnce({ data: { id: '1', visibility: 'public' } });

      await updateReviewerBrandUsage('1', payload);

      expect(mockFetchApi).toHaveBeenCalledWith('/reviewer/brand_usages/1', {
        method: 'PATCH',
        body: { brand_usage: payload },
      });
    });
  });

  describe('deleteReviewerBrandUsage', () => {
    it('faz requisição DELETE', async () => {
      mockFetchApi.mockResolvedValueOnce(undefined);

      await deleteReviewerBrandUsage('1');

      expect(mockFetchApi).toHaveBeenCalledWith('/reviewer/brand_usages/1', {
        method: 'DELETE',
      });
    });
  });

  describe('fetchReviewerBrandSummary', () => {
    it('faz requisição GET para o endpoint de resumo consolidado', async () => {
      const summary = {
        data: {
          total_brands: 3,
          total_usages: 4,
          verified_usages: 1,
          public_usages: 2,
          by_context: { integrator_install: 3, personal_owner: 1 },
        },
      };
      mockFetchApi.mockResolvedValueOnce(summary);

      const result = await fetchReviewerBrandSummary();

      expect(mockFetchApi).toHaveBeenCalledWith('/reviewer/brand_experience_summary', {
        method: 'GET',
        signal: undefined,
      });
      expect(result).toEqual(summary);
    });
  });
});
