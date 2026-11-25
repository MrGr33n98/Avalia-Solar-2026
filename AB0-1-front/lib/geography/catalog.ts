import { BRAZIL_STATES_OPTIONS } from '@/lib/company-options';

export const GEO_CATALOG_SCHEMA_VERSION = 3;
export const GEO_CATALOG_TTL_MS = 24 * 60 * 60 * 1000;
export const GEO_CATALOG_GC_TIME_MS = 7 * GEO_CATALOG_TTL_MS;
export const GEO_CATALOG_STALE_RETENTION_MS = 7 * GEO_CATALOG_TTL_MS;

const GEO_CITIES_QUERY_PREFIX = ['geo', 'official-cities'] as const;
const STORAGE_KEY_PREFIX = `avalia_solar_geo_v${GEO_CATALOG_SCHEMA_VERSION}:`;
const MAX_PERSISTED_GEO_CATALOGS = 27;
const KNOWN_UFS: ReadonlySet<string> = new Set(BRAZIL_STATES_OPTIONS.map(({ state }) => state));

export interface CityCatalog {
  uf: string;
  cities: string[];
  revision: string;
  updatedAt: number;
}

interface PersistedCityCatalog {
  schemaVersion: number;
  uf: string;
  revision: string;
  fetchedAt: number;
  expiresAt: number;
  data: { cities: string[] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function normalizeUf(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const uf = value.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(uf) && KNOWN_UFS.has(uf) ? uf : null;
}

export function geographyCitiesQueryKey(uf: string, revision: string) {
  return [...GEO_CITIES_QUERY_PREFIX, uf, GEO_CATALOG_SCHEMA_VERSION, revision] as const;
}

export function persistCityCatalog(catalog: CityCatalog): boolean {
  const uf = normalizeUf(catalog.uf);
  if (!uf || uf !== catalog.uf || !isValidCityCatalog(catalog)) return false;

  const persisted: PersistedCityCatalog = {
    schemaVersion: GEO_CATALOG_SCHEMA_VERSION,
    uf,
    revision: catalog.revision,
    fetchedAt: catalog.updatedAt,
    expiresAt: catalog.updatedAt + GEO_CATALOG_TTL_MS,
    data: { cities: [...catalog.cities] },
  };

  try {
    if (typeof window === 'undefined') return false;
    pruneGeographyStorage(`${STORAGE_KEY_PREFIX}${uf}`);
    window.localStorage.setItem(`${STORAGE_KEY_PREFIX}${uf}`, JSON.stringify(persisted));
    return true;
  } catch {
    return false;
  }
}

export function readPersistedCityCatalog(ufValue: string, now = Date.now()): CityCatalog | null {
  const uf = normalizeUf(ufValue);
  if (!uf || typeof window === 'undefined') return null;

  const key = `${STORAGE_KEY_PREFIX}${uf}`;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (
      !isRecord(parsed) ||
      parsed.schemaVersion !== GEO_CATALOG_SCHEMA_VERSION ||
      parsed.uf !== uf ||
      !isValidPersistedCityCatalog(parsed) ||
      parsed.fetchedAt > now + 60_000 ||
      now - parsed.fetchedAt > GEO_CATALOG_STALE_RETENTION_MS
    ) {
      window.localStorage.removeItem(key);
      return null;
    }

    return {
      uf,
      cities: [...parsed.data.cities],
      revision: parsed.revision,
      updatedAt: parsed.fetchedAt,
    };
  } catch {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Storage may be unavailable; memory cache remains usable.
    }
    return null;
  }
}

function isValidCityCatalog(value: unknown): value is CityCatalog {
  if (!isRecord(value)) return false;
  if (typeof value.uf !== 'string' || !normalizeUf(value.uf)) return false;
  if (typeof value.revision !== 'string' || value.revision.trim().length === 0) return false;
  if (value.revision.length > 128) return false;
  if (!Number.isFinite(value.updatedAt) || Number(value.updatedAt) <= 0) return false;
  if (!Array.isArray(value.cities) || value.cities.length > 5_569) return false;

  return value.cities.every(
    (city) => typeof city === 'string' && city.trim().length > 0 && city.length <= 120
  );
}

function isValidPersistedCityCatalog(value: unknown): value is PersistedCityCatalog {
  if (!isRecord(value)) return false;
  if (typeof value.revision !== 'string' || value.revision.trim().length === 0) return false;
  if (value.revision.length > 128) return false;
  if (!Number.isFinite(value.fetchedAt) || Number(value.fetchedAt) <= 0) return false;
  if (!Number.isFinite(value.expiresAt) || Number(value.expiresAt) < Number(value.fetchedAt))
    return false;
  if (Number(value.expiresAt) !== Number(value.fetchedAt) + GEO_CATALOG_TTL_MS) return false;
  if (
    !isRecord(value.data) ||
    !Array.isArray(value.data.cities) ||
    value.data.cities.length > 5_569
  ) {
    return false;
  }

  return value.data.cities.every(
    (city) => typeof city === 'string' && city.trim().length > 0 && city.length <= 120
  );
}

function pruneGeographyStorage(currentKey: string) {
  const storage = window.localStorage;
  const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter(
    (key): key is string => key !== null && /^avalia_solar_geo_v\d+:/.test(key)
  );

  keys.forEach((key) => {
    const version = Number(key.match(/^avalia_solar_geo_v(\d+):/)?.[1]);
    if (Number.isFinite(version) && version < GEO_CATALOG_SCHEMA_VERSION) storage.removeItem(key);
  });

  const currentKeys = keys.filter((key) => key.startsWith(STORAGE_KEY_PREFIX));
  if (currentKeys.length < MAX_PERSISTED_GEO_CATALOGS || currentKeys.includes(currentKey)) return;

  const oldestKey = currentKeys
    .map((key) => {
      try {
        const parsed: unknown = JSON.parse(storage.getItem(key) || 'null');
        return {
          key,
          fetchedAt:
            isRecord(parsed) && Number.isFinite(parsed.fetchedAt) ? Number(parsed.fetchedAt) : 0,
        };
      } catch {
        return { key, fetchedAt: 0 };
      }
    })
    .sort((left, right) => left.fetchedAt - right.fetchedAt)[0]?.key;

  if (oldestKey) storage.removeItem(oldestKey);
}
