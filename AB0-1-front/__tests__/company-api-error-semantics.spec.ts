import { publicCompaniesApi } from '@/lib/api-public';

const apiResponse = (status: number, payload: unknown): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 404 ? 'Not Found' : 'Internal Server Error',
    json: async () => payload,
  }) as Response;

describe('semântica de erro da API pública de empresas', () => {
  beforeEach(() => {
    Object.defineProperty(global, 'fetch', {
      configurable: true,
      value: jest.fn(),
      writable: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('trata apenas 404 confirmado como empresa inexistente', async () => {
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(apiResponse(404, { error: 'Empresa não encontrada' }))
      .mockResolvedValueOnce(apiResponse(404, { error: 'Empresa não encontrada' }));

    await expect(publicCompaniesApi.getById('empresa-inexistente')).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('propaga HTTP 5xx em vez de converter indisponibilidade em 404', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(apiResponse(503, { error: 'Serviço temporariamente indisponível' }));

    await expect(publicCompaniesApi.getBySlug('empresa-indisponivel')).rejects.toMatchObject({
      name: 'ApiError',
      status: 503,
    });
  });

  it('propaga timeout como erro controlado', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockImplementation(
        () =>
          new Promise((_, reject) => setTimeout(() => reject(new Error('upstream timeout')), 10))
      );

    await expect(
      publicCompaniesApi.getBySlug('empresa-timeout', { timeoutMs: 1 })
    ).rejects.toMatchObject({ name: 'ApiError', isTimeout: true });
  });
});
