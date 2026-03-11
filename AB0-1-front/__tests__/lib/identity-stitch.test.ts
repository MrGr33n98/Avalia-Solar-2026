import {
  getAnonymousId,
  stitchIdentity,
  trackSession,
} from '@/lib/analytics/identity-stitch';

const identifyMock = jest.fn();
const aliasMock = jest.fn();

jest.mock('@/lib/analytics/index', () => ({
  identify: (...args: unknown[]) => identifyMock(...args),
  alias: (...args: unknown[]) => aliasMock(...args),
}));

describe('identity stitching analytics', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    global.fetch = fetchMock as typeof fetch;
  });

  it('identifies and aliases through the analytics core before notifying the backend', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'stitching_scheduled' }),
    } as Response);

    localStorage.setItem('ajs_anonymous_id', 'anon-123');

    await stitchIdentity({
      user_id: 'user-1',
      email: 'lead@example.com',
      name: 'Lead User',
    });

    expect(identifyMock).toHaveBeenCalledWith('user-1', {
      email: 'lead@example.com',
      name: 'Lead User',
    });
    expect(aliasMock).toHaveBeenCalledWith('user-1');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/identity/stitch',
      expect.objectContaining({
        method: 'POST',
        keepalive: true,
      })
    );
  });

  it('persists the anonymous id returned by session tracking', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ anonymous_id: 'anon-456', session_id: 'session-1', status: 'anonymous' }),
    } as Response);

    await trackSession({ company_id: '1', page_url: '/companies/test' });

    expect(localStorage.getItem('as_anonymous_id')).toBe('anon-456');
    expect(localStorage.getItem('ajs_anonymous_id')).toBe('anon-456');
  });

  it('reuses an existing anonymous id before generating a new one', () => {
    localStorage.setItem('ajs_anonymous_id', 'anon-existing');

    expect(getAnonymousId()).toBe('anon-existing');
  });
});
