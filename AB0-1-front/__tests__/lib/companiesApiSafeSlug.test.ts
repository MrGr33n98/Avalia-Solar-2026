import { companiesApiSafe } from '@/lib/api-client';

describe('companiesApiSafe.getById slug fallback', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = 'http://api.test';
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch as any;
    jest.resetAllMocks();
  });

  it('falls back to by_slug when primary lookup returns 404', async () => {
    const fetchMock = global.fetch as jest.Mock;

    fetchMock
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          company: { id: 10, slug: 'ezvolt-brasil', name: 'Ezvolt Brasil' },
        }),
      });

    const company = await companiesApiSafe.getById('ezvolt-brasil');

    expect(company?.slug).toBe('ezvolt-brasil');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toContain('/api/v1/companies/ezvolt-brasil');
    expect(fetchMock.mock.calls[1][0]).toContain('/api/v1/companies/by_slug/ezvolt-brasil');
  });
});
