import { fetchApiPublic, publicCompaniesApi } from '@/lib/api-public';

jest.mock('@/lib/api-config', () => ({
  buildApiUrl: (endpoint: string) => `https://api.example.test/api/v1/${endpoint.replace(/^\/+/, '')}`,
  getApiRequestHeaders: () => ({ Accept: 'application/json' }),
}));

let fetchMock: jest.Mock;

const jsonResponse = (payload: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  statusText: status >= 200 && status < 300 ? 'OK' : 'Error',
  json: jest.fn(async () => payload),
});

describe('api-public', () => {
  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });

  it('fetches public GET requests without credentials and with revalidate', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));

    await expect(
      fetchApiPublic<{ ok: boolean }>('companies', {
        params: { status: 'active', category_ids: [1, 2] },
        revalidate: 900,
        tags: ['companies'],
      })
    ).resolves.toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/v1/companies?status=active&category_ids%5B%5D=1&category_ids%5B%5D=2',
      expect.objectContaining({
        method: 'GET',
        credentials: 'omit',
        next: { revalidate: 900, tags: ['companies'] },
      })
    );
  });

  it('normalizes company arrays from paginated public payloads', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: [{ id: 1, name: 'WEG' }], meta: { total: 1 } }));

    await expect(publicCompaniesApi.getAll({ status: 'active' })).resolves.toEqual([
      { id: 1, name: 'WEG' },
    ]);
  });
});
