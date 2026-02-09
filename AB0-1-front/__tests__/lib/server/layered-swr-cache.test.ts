import { LayeredSWRCache } from '@/lib/server/layered-swr-cache';

describe('LayeredSWRCache', () => {
  it('serves stale data immediately and refreshes in background', async () => {
    const now = Date.now();
    const cache = new LayeredSWRCache({
      ttlMs: 100,
      staleMs: 10_000,
      timeoutMs: 200,
      initialEntries: {
        categories: {
          data: [{ id: 1, name: 'stale' }],
          updatedAt: now - 500,
        },
      },
    });

    const result = await cache.get('categories', async () => [{ id: 2, name: 'fresh' }]);
    expect(result.source).toBe('stale_cache');
    expect((result.data as any[])[0].name).toBe('stale');

    await new Promise((resolve) => setTimeout(resolve, 10));
    const refreshed = await cache.get('categories', async () => [{ id: 3, name: 'newer' }]);
    expect((refreshed.data as any[])[0].name).toBe('fresh');
  });

  it('falls back when fetch times out', async () => {
    const cache = new LayeredSWRCache({
      ttlMs: 100,
      staleMs: 10_000,
      timeoutMs: 20,
    });

    const result = await cache.get(
      'banners',
      async (signal) =>
        await new Promise<any[]>((resolve, reject) => {
          const timeout = setTimeout(() => resolve([{ id: 1 }]), 200);
          signal.addEventListener('abort', () => {
            clearTimeout(timeout);
            reject(new DOMException('aborted', 'AbortError'));
          });
        }),
      { fallback: [] }
    );

    expect(result.source).toBe('fallback');
    expect(result.data).toEqual([]);
    expect(cache.getMetrics().timeouts).toBeGreaterThan(0);
  });
});
