import fs from 'fs/promises';
import path from 'path';

const CACHE_DIR = path.join(process.cwd(), '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'home-fallback-cache.json');
const CACHE_VERSION = 1;
const TIMEOUT_MS = 3000;

const apiOrigin =
  process.env.API_URL_INTERNAL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3001';

const trimSlash = (value) => String(value).replace(/\/+$/, '');
const baseApi = `${trimSlash(apiOrigin)}/api/v1`;

const endpoints = [
  { key: 'home.categories.active', path: 'categories?status=active' },
  {
    key: 'home.categories.featured',
    path: 'categories?featured=true&status=active&limit=8&include=average_rating,reviews_count',
  },
  { key: 'home.banners.categories_top', path: 'banners?position=categories_top' },
  { key: 'home.banners.companies_top', path: 'banners?position=companies_top' },
];

const readExistingEntries = async () => {
  try {
    const raw = await fs.readFile(CACHE_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return parsed?.entries && typeof parsed.entries === 'object' ? parsed.entries : {};
  } catch {
    return {};
  }
};

const withTimeout = async (url) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`[${response.status}] ${url}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
};

async function main() {
  const existingEntries = await readExistingEntries();
  const entries = { ...existingEntries };
  let fetchedCount = 0;
  const now = Date.now();

  await Promise.all(
    endpoints.map(async (endpoint) => {
      const url = `${baseApi}/${endpoint.path}`;
      try {
        const data = await withTimeout(url);
        entries[endpoint.key] = { data, updatedAt: now };
        fetchedCount += 1;
      } catch (error) {
        console.warn(`[warm-home-cache] failed for ${endpoint.key}:`, error.message);
      }
    })
  );

  await fs.mkdir(CACHE_DIR, { recursive: true });
  await fs.writeFile(
    CACHE_FILE,
    JSON.stringify({
      version: CACHE_VERSION,
      updatedAt: now,
      entries,
    }),
    'utf-8'
  );

  console.log(
    `[warm-home-cache] cache written to ${CACHE_FILE} with ${Object.keys(entries).length} entries (${fetchedCount} refreshed)`
  );
}

main().catch((error) => {
  console.error('[warm-home-cache] fatal error:', error);
  process.exitCode = 1;
});
