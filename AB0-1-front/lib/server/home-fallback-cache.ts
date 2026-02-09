import 'server-only';

import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';

import type { Banner, Category } from '@/lib/api';
import { buildApiUrl, getApiRequestHeaders } from '@/lib/api-config';
import { LayeredSWRCache, type CacheEntry } from '@/lib/server/layered-swr-cache';

type PersistedStore = {
  version: number;
  entries: Record<string, CacheEntry<unknown>>;
  updatedAt: number;
};

const CACHE_VERSION = 1;
const CACHE_DIR = path.join(process.cwd(), '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'home-fallback-cache.json');
const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_STALE_MS = 24 * 60 * 60 * 1000;
const API_TIMEOUT_MS = 5000;

let cacheReady: Promise<LayeredSWRCache> | null = null;
let persistQueue: Promise<void> = Promise.resolve();

const safeArray = <T>(payload: unknown): T[] => (Array.isArray(payload) ? (payload as T[]) : []);
const extractCategories = (payload: unknown): Category[] => {
  if (Array.isArray(payload)) return payload as Category[];
  if (payload && typeof payload === 'object') {
    const data = payload as { data?: unknown; categories?: unknown };
    if (Array.isArray(data.data)) return data.data as Category[];
    if (Array.isArray(data.categories)) return data.categories as Category[];
  }
  return [];
};

const readPersistedEntries = async (): Promise<Record<string, CacheEntry<unknown>>> => {
  try {
    const raw = await readFile(CACHE_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as PersistedStore;
    if (parsed.version !== CACHE_VERSION || !parsed.entries || typeof parsed.entries !== 'object') {
      return {};
    }
    return parsed.entries;
  } catch {
    return {};
  }
};

const queuePersist = (entries: Record<string, CacheEntry<unknown>>) => {
  persistQueue = persistQueue
    .then(async () => {
      await mkdir(CACHE_DIR, { recursive: true });
      const payload: PersistedStore = {
        version: CACHE_VERSION,
        entries,
        updatedAt: Date.now(),
      };
      await writeFile(CACHE_FILE, JSON.stringify(payload), 'utf-8');
    })
    .catch(() => {
      // noop - fallback cache persist failure should not crash requests
    });
};

const getCache = async () => {
  if (!cacheReady) {
    cacheReady = (async () => {
      const initialEntries = await readPersistedEntries();
      return new LayeredSWRCache({
        ttlMs: CACHE_TTL_MS,
        staleMs: CACHE_STALE_MS,
        timeoutMs: API_TIMEOUT_MS,
        initialEntries,
        onUpdate: async (entries) => queuePersist(entries),
      });
    })();
  }
  return cacheReady;
};

const fetchJSON = async <T>(endpoint: string, signal: AbortSignal, retries = 2): Promise<T> => {
  const url = buildApiUrl(endpoint);
  
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: getApiRequestHeaders({ Accept: 'application/json' }),
        cache: 'no-store',
        signal,
      });

      if (!response.ok) {
        console.error(`[HomeFallbackCache] Fetch failed (Attempt ${i + 1}/${retries + 1}): ${url} [${response.status}]`);
        if (i === retries) {
          throw new Error(`[${response.status}] Failed to fetch ${endpoint} after ${retries + 1} attempts`);
        }
        // Wait a bit before retry
        await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
        continue;
      }

      return (await response.json()) as T;
    } catch (error: any) {
      if (error.name === 'AbortError') throw error;
      
      console.error(`[HomeFallbackCache] Error (Attempt ${i + 1}/${retries + 1}): ${error.message}`);
      if (i === retries) throw error;
      await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
    }
  }
  
  throw new Error(`Failed to fetch ${endpoint}`);
};

export async function getCachedActiveCategories(): Promise<Category[]> {
  const cache = await getCache();
  const result = await cache.get<Category[]>(
    'home.categories.active',
    async (signal) => {
      const payload = await fetchJSON<unknown>('categories?status=active', signal);
      return extractCategories(payload);
    },
    { fallback: [] }
  );
  return result.data;
}

export async function getCachedFeaturedCategories(): Promise<Category[]> {
  const cache = await getCache();
  const result = await cache.get<Category[]>(
    'home.categories.featured',
    async (signal) => {
      const payload = await fetchJSON<unknown>(
        'categories?featured=true&status=active&limit=8&include=average_rating,reviews_count',
        signal
      );
      return extractCategories(payload);
    },
    { fallback: [] }
  );
  return result.data;
}

export async function getCachedBanners(position: 'categories_top' | 'companies_top'): Promise<Banner[]> {
  const cache = await getCache();
  const result = await cache.get<Banner[]>(
    `home.banners.${position}`,
    async (signal) => {
      const payload = await fetchJSON<Banner[] | { banners?: Banner[] }>(`banners?position=${position}`, signal);
      if (Array.isArray(payload)) return payload;
      return safeArray<Banner>(payload?.banners);
    },
    { fallback: [] }
  );
  return result.data;
}

export async function warmHomeFallbackCache() {
  await Promise.all([
    getCachedActiveCategories(),
    getCachedFeaturedCategories(),
    getCachedBanners('categories_top'),
    getCachedBanners('companies_top'),
  ]);
}

export async function getHomeFallbackCacheMetrics() {
  const cache = await getCache();
  return {
    ...cache.getMetrics(),
    config: {
      ttlMs: CACHE_TTL_MS,
      staleMs: CACHE_STALE_MS,
      timeoutMs: API_TIMEOUT_MS,
      cacheFile: CACHE_FILE,
    },
  };
}
