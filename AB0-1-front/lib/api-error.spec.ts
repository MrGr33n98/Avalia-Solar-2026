import { ApiError, getApiErrorMessage } from './api-error';
import { fetchApi } from './api';

describe('erros estruturados da API', () => {
  it('não converte o payload de erro em [object Object]', () => {
    expect(
      getApiErrorMessage({
        error: { code: 'RANKING_UNAVAILABLE', message: 'Ranking indisponível', request_id: 'req-372' },
      })
    ).toBe('Ranking indisponível');
  });

  it('preserva código, request_id, status, endpoint e payload no fetchApi', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      headers: { get: () => null },
      json: async () => ({
        error: {
          code: 'RANKING_UNAVAILABLE',
          message: 'Ranking indisponível',
          request_id: 'req-372',
        },
      }),
    });
    global.fetch = fetchMock as typeof fetch;

    let thrown: unknown;
    try {
      await fetchApi('/company_dashboard/analytics/ranking');
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(ApiError);
    const apiError = thrown as ApiError;
    expect(apiError.message).toBe('[500] Ranking indisponível');
    expect(apiError.code).toBe('RANKING_UNAVAILABLE');
    expect(apiError.requestId).toBe('req-372');
    expect(apiError.status).toBe(500);
    expect(apiError.url).toContain('/company_dashboard/analytics/ranking');
    expect(JSON.stringify(apiError.details)).not.toContain('[object Object]');
  });
});
