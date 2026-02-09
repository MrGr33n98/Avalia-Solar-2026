export type CacheSource = 'fresh_cache' | 'stale_cache' | 'network' | 'fallback';

export type CacheEntry<T> = {
  data: T;
  updatedAt: number;
};

type Fetcher<T> = (signal: AbortSignal) => Promise<T>;

export type CacheMetrics = {
  totalRequests: number;
  cacheHits: number;
  staleHits: number;
  networkHits: number;
  fallbackHits: number;
  refreshErrors: number;
  timeouts: number;
};

type LayeredSWRCacheOptions = {
  ttlMs: number;
  staleMs: number;
  timeoutMs: number;
  initialEntries?: Record<string, CacheEntry<unknown>>;
  onUpdate?: (entries: Record<string, CacheEntry<unknown>>) => Promise<void> | void;
};

type GetOptions<T> = {
  fallback?: T;
};

export class LayeredSWRCache {
  private readonly ttlMs: number;
  private readonly staleMs: number;
  private readonly timeoutMs: number;
  private readonly onUpdate?: (entries: Record<string, CacheEntry<unknown>>) => Promise<void> | void;
  private readonly entries = new Map<string, CacheEntry<unknown>>();
  private readonly refreshInFlight = new Map<string, Promise<void>>();
  private readonly metrics: CacheMetrics = {
    totalRequests: 0,
    cacheHits: 0,
    staleHits: 0,
    networkHits: 0,
    fallbackHits: 0,
    refreshErrors: 0,
    timeouts: 0,
  };

  constructor(options: LayeredSWRCacheOptions) {
    this.ttlMs = options.ttlMs;
    this.staleMs = options.staleMs;
    this.timeoutMs = options.timeoutMs;
    this.onUpdate = options.onUpdate;

    if (options.initialEntries) {
      Object.entries(options.initialEntries).forEach(([key, value]) => {
        this.entries.set(key, value);
      });
    }
  }

  getSnapshot() {
    return Object.fromEntries(this.entries.entries());
  }

  getMetrics() {
    const hitRate =
      this.metrics.totalRequests > 0
        ? (this.metrics.cacheHits + this.metrics.staleHits + this.metrics.fallbackHits) / this.metrics.totalRequests
        : 0;
    return {
      ...this.metrics,
      entryCount: this.entries.size,
      hitRate,
    };
  }

  async get<T>(key: string, fetcher: Fetcher<T>, options: GetOptions<T> = {}): Promise<{ data: T; source: CacheSource }> {
    this.metrics.totalRequests += 1;
    const now = Date.now();
    const entry = this.entries.get(key) as CacheEntry<T> | undefined;

    if (entry) {
      const age = now - entry.updatedAt;
      if (age <= this.ttlMs) {
        this.metrics.cacheHits += 1;
        return { data: entry.data, source: 'fresh_cache' };
      }
      if (age <= this.ttlMs + this.staleMs) {
        this.metrics.staleHits += 1;
        this.triggerBackgroundRefresh(key, fetcher);
        return { data: entry.data, source: 'stale_cache' };
      }
    }

    try {
      const fresh = await this.fetchWithTimeout(fetcher);
      await this.set(key, fresh);
      this.metrics.networkHits += 1;
      return { data: fresh, source: 'network' };
    } catch (error) {
      if (entry) {
        this.metrics.fallbackHits += 1;
        return { data: entry.data, source: 'fallback' };
      }
      if (options.fallback !== undefined) {
        this.metrics.fallbackHits += 1;
        return { data: options.fallback, source: 'fallback' };
      }
      throw error;
    }
  }

  async set<T>(key: string, data: T) {
    this.entries.set(key, { data, updatedAt: Date.now() });
    await this.persist();
  }

  private async fetchWithTimeout<T>(fetcher: Fetcher<T>): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      return await fetcher(controller.signal);
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        this.metrics.timeouts += 1;
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private triggerBackgroundRefresh<T>(key: string, fetcher: Fetcher<T>) {
    if (this.refreshInFlight.has(key)) return;
    const refreshPromise = this.fetchWithTimeout(fetcher)
      .then(async (data) => {
        await this.set(key, data);
      })
      .catch(() => {
        this.metrics.refreshErrors += 1;
      })
      .finally(() => {
        this.refreshInFlight.delete(key);
      });
    this.refreshInFlight.set(key, refreshPromise);
  }

  private async persist() {
    if (!this.onUpdate) return;
    await this.onUpdate(this.getSnapshot());
  }
}
