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
const FETCH_REVALIDATE_SECONDS = Math.max(60, Math.floor(CACHE_TTL_MS / 1000));
const IS_DEV = process.env.NODE_ENV !== 'production';

let cacheReady: Promise<LayeredSWRCache> | null = null;
let persistQueue: Promise<void> = Promise.resolve();

const extractCollection = <T>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === 'object') {
    const data = payload as { data?: unknown; categories?: unknown; items?: unknown; banners?: unknown };
    if (Array.isArray(data.data)) return data.data as T[];
    if (Array.isArray(data.categories)) return data.categories as T[];
    if (Array.isArray(data.items)) return data.items as T[];
    if (Array.isArray(data.banners)) return data.banners as T[];
  }
  return [];
};
const extractCategories = (payload: unknown): Category[] => extractCollection<Category>(payload);

const normalizeCategory = (item: any): Category | null => {
  if (!item || typeof item !== 'object') return null;

  const id = Number(item.id);
  const name = String(item.name || '').trim();
  if (!Number.isFinite(id) || !name) return null;

  return {
    id,
    name,
    seo_url: String(item.seo_url || item.slug || id),
    seo_title: String(item.seo_title || name),
    short_description: typeof item.short_description === 'string' ? item.short_description : undefined,
    description: typeof item.description === 'string' ? item.description : undefined,
    parent_id: typeof item.parent_id === 'number' ? item.parent_id : null,
    kind: typeof item.kind === 'string' ? item.kind : 'service',
    status: typeof item.status === 'string' ? item.status : 'active',
    featured: Boolean(item.featured),
    banner_url: typeof item.banner_url === 'string' ? item.banner_url : null,
    icon_url: typeof item.icon_url === 'string' ? item.icon_url : null,
    average_rating: typeof item.average_rating === 'number' ? item.average_rating : 0,
    average_price: typeof item.average_price === 'number' ? item.average_price : 0,
    views_count: typeof item.views_count === 'number' ? item.views_count : 0,
    reviews_count: typeof item.reviews_count === 'number' ? item.reviews_count : 0,
    companies_count: typeof item.companies_count === 'number' ? item.companies_count : 0,
    products_count: typeof item.products_count === 'number' ? item.products_count : 0,
    tags: Array.isArray(item.tags) ? item.tags : [],
    badges: Array.isArray(item.badges) ? item.badges : [],
    logo: item.logo ?? null,
    created_at: typeof item.created_at === 'string' ? item.created_at : '',
    updated_at: typeof item.updated_at === 'string' ? item.updated_at : '',
  } as Category;
};

const flattenCategoryTree = (payload: unknown): Category[] => {
  const queue = extractCollection<any>(payload);
  const seen = new Set<number>();
  const categories: Category[] = [];

  while (queue.length > 0) {
    const current = queue.shift();
    const normalized = normalizeCategory(current);
    if (normalized && !seen.has(normalized.id)) {
      seen.add(normalized.id);
      categories.push(normalized);
    }

    if (Array.isArray(current?.children)) {
      queue.push(...current.children);
    }
  }

  return categories;
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
        next: { revalidate: FETCH_REVALIDATE_SECONDS },
        signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No error body');
        if (IS_DEV) {
          console.warn(
            `[HomeFallbackCache] Fetch failed (Attempt ${i + 1}/${retries + 1}): ${url} [${response.status}] - ${errorText.substring(0, 100)}`
          );
        }
        
        if (i === retries) {
          throw new Error(`[${response.status}] Failed to fetch ${endpoint} after ${retries + 1} attempts. Response: ${errorText.substring(0, 100)}`);
        }
        
        // Wait a bit before retry (exponential backoff)
        const delay = 500 * (i + 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      return (await response.json()) as T;
    } catch (error: any) {
      if (error.name === 'AbortError') throw error;
      
      if (IS_DEV) {
        console.warn(`[HomeFallbackCache] Error (Attempt ${i + 1}/${retries + 1}): ${error.message}`);
      }
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
      try {
        const payload = await fetchJSON<unknown>('categories?status=active', signal);
        const categories = extractCategories(payload);
        if (categories.length > 0) return categories;
      } catch (error) {
        if (IS_DEV) {
          console.warn('[HomeFallbackCache] Active categories endpoint failed, trying tree fallback', error);
        }
      }

      try {
        const treePayload = await fetchJSON<unknown>('categories/tree', signal);
        return flattenCategoryTree(treePayload);
      } catch (error) {
        if (IS_DEV) {
          console.warn('[HomeFallbackCache] Categories tree fallback failed', error);
        }
        return [];
      }
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
      const tryFetchCategories = async (endpoint: string, extractor: (payload: unknown) => Category[]) => {
        try {
          const payload = await fetchJSON<unknown>(endpoint, signal);
          return extractor(payload);
        } catch (error) {
          if (IS_DEV) {
            console.warn(`[HomeFallbackCache] Endpoint failed (${endpoint})`, error);
          }
          return [];
        }
      };

      const featuredCards = await tryFetchCategories(
        'categories?view=cards&featured=true&limit=8&sort_by=featured_desc',
        extractCategories
      );
      if (featuredCards.length > 0) return featuredCards;

      const cardsFallback = await tryFetchCategories(
        'categories?view=cards&page=1&per_page=8&sort_by=featured_desc',
        extractCategories
      );
      if (cardsFallback.length > 0) return cardsFallback;

      const activeFallback = await tryFetchCategories('categories?status=active&limit=8', extractCategories);
      if (activeFallback.length > 0) return activeFallback;

      const treeFallback = await tryFetchCategories('categories/tree', flattenCategoryTree);
      return treeFallback.slice(0, 8);
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
      const payload = await fetchJSON<Banner[] | { banners?: Banner[]; data?: Banner[] }>(`banners?position=${position}`, signal);
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.banners)) return payload.banners;
      if (Array.isArray(payload?.data)) return payload.data;
      return [];
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
