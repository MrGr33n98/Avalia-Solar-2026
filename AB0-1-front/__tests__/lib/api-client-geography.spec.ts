import { companiesApiSafe } from '@/lib/api-client';

describe('companiesApiSafe.getGeographicCities', () => {
  const originalFetch = global.fetch;
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

  afterAll(() => {
    global.fetch = originalFetch;
    consoleError.mockRestore();
  });

  it('makes one anonymous request and returns the server revision', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: (name: string) => (name === 'x-locations-version' ? 'catalog-r2' : null) },
      json: async () => ({ cities: ['Florianópolis'] }),
    });
    global.fetch = fetchMock;

    await expect(companiesApiSafe.getGeographicCities('sc')).resolves.toEqual({
      uf: 'SC',
      cities: ['Florianópolis'],
      revision: 'catalog-r2',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain('companies/cities?state=SC');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      cache: 'no-cache',
      credentials: 'omit',
    });
  });

  it('does not retry an HTTP 404', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      headers: { get: () => null },
      json: async () => ({ error: 'Not Found' }),
    });
    global.fetch = fetchMock;

    await expect(companiesApiSafe.getGeographicCities('SP')).rejects.toMatchObject({ status: 404 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('keeps the optional company count request uncached and does not retry a missing route', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      headers: { get: () => null },
      json: async () => ({ error: 'Not Found' }),
    });
    global.fetch = fetchMock;

    await expect(companiesApiSafe.getTotalCount({ state: ['SC'] })).resolves.toBeNull();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain('companies/count?state%5B%5D=SC');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      cache: 'no-store',
      cacheTtlMs: 0,
      credentials: 'include',
    });
  });
});
