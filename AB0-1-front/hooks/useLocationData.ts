import { useState, useEffect, useCallback, useRef } from 'react';
import { companiesApiSafe } from '@/lib/api-client';
import { statesApi, citiesApi } from '@/lib/api';

const CACHE_KEY_STATES = 'avalia_solar_states_cache';
const CACHE_KEY_CITIES_PREFIX = 'avalia_solar_cities_cache_';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const MIN_REQUEST_INTERVAL = 500; // 500ms rate limit

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

type NormalizedState = {
  id: number | string | null;
  name: string;
};

function extractArray(resp: unknown): unknown[] {
  if (Array.isArray(resp)) return resp;
  if (isRecord(resp)) {
    if (Array.isArray(resp.states)) return resp.states;
    if (Array.isArray(resp.cities)) return resp.cities;
    if (Array.isArray(resp.data)) return resp.data;
  }
  return [];
}

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

export interface UseLocationDataResult {
  states: string[];
  cities: string[];
  loadingStates: boolean;
  loadingCities: boolean;
  error: string | null;
  citiesError?: string | null;
  fetchStates: (forceRefresh?: boolean) => Promise<void>;
  fetchCities: (state: string, forceRefresh?: boolean) => Promise<void>;
  refreshStates: () => Promise<void>;
}

export function useLocationData() {
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [citiesError, setCitiesError] = useState<string | null>(null);
  const [stateIndex, setStateIndex] = useState<Record<string, number>>({});
  
  const lastRequestTime = useRef<number>(0);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const withTimeout = useCallback(async <T,>(promise: Promise<T>, label: string, timeoutMs = 8000): Promise<T> => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(`${label} timeout after ${timeoutMs}ms`)), timeoutMs);
      }),
    ]).finally(() => clearTimeout(timeoutId));
  }, []);

  const getCachedData = <T>(key: string): T | null => {
    if (typeof window === 'undefined') return null;
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached) as CacheItem<T>;
      if (Date.now() - timestamp > CACHE_TTL) {
        localStorage.removeItem(key);
        return null;
      }
      return data;
    } catch (e) {
      console.error('Error reading cache:', e);
      return null;
    }
  };

  const setCachedData = <T>(key: string, data: T) => {
    if (typeof window === 'undefined') return;
    try {
      const item: CacheItem<T> = { data, timestamp: Date.now() };
      localStorage.setItem(key, JSON.stringify(item));
    } catch (e) {
      console.error('Error writing cache:', e);
    }
  };

  const fetchStates = useCallback(async (forceRefresh = false) => {
    setLoadingStates(true);
    setError(null);

    if (!forceRefresh) {
      const cached = getCachedData<string[]>(CACHE_KEY_STATES);
      if (cached) {
        setStates(cached);
        setLoadingStates(false);
        return;
      }
    }

    try {
      let names: string[] = [];
      const index: Record<string, number> = {};

      try {
        const resp: unknown = await withTimeout(statesApi.getAll(), 'states');
        const list = extractArray(resp);
        const cleaned: NormalizedState[] = list
          .map((s: unknown): NormalizedState | null => {
            if (typeof s === 'string') {
              return { id: null, name: s };
            }
            if (isRecord(s)) {
              const nameVal = s.name ?? s.state_name ?? s.abbreviation ?? s.acronym ?? s.uf;
              const idVal = s.id ?? s.state_id;
              const name = nameVal != null ? String(nameVal).trim() : '';
              const id = idVal != null ? (idVal as number | string) : null;
              return name ? { id, name } : null;
            }
            return null;
          })
          .filter((s): s is NormalizedState => s !== null && s.name.trim() !== '');
        names = cleaned.map(s => s.name.trim()).filter(Boolean);
        cleaned.forEach(s => {
          if (s.name && s.id != null) {
            index[s.name] = Number(s.id) || 0;
          }
        });
      } catch {}

      if (!names || names.length === 0) {
        const data = await withTimeout(companiesApiSafe.getStates(), 'companies/states');
        const fallback = Array.isArray(data) ? data : [];
        names = fallback.filter(s => s && String(s).trim() !== '');
      }

      if (!names || names.length === 0) {
        setError('Nenhum estado retornado pela API. Tente novamente mais tarde.');
        setStates([]);
        setStateIndex({});
        return;
      }

      const unique = Array.from(new Set(names)).sort();
      setStates(unique);
      setStateIndex(index);
      setCachedData(CACHE_KEY_STATES, unique);
    } catch (err) {
      console.error('Failed to fetch states:', err);
      setError('Falha ao carregar estados. Tente novamente.');
      setStates([]);
      setStateIndex({});
    } finally {
      setLoadingStates(false);
    }
  }, [withTimeout]);

  const fetchCities = useCallback(async (state: string, forceRefresh = false) => {
    if (!state || state === 'all') {
      setCities([]);
      setCitiesError(null);
      return;
    }

    // Debounce implementation (300ms)
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    return new Promise<void>((resolve) => {
      debounceTimer.current = setTimeout(async () => {
        // Rate limiting
        const now = Date.now();
        if (now - lastRequestTime.current < MIN_REQUEST_INTERVAL && !forceRefresh) {
          console.warn(`[useLocationData] Rate limit hit for ${state}. Skipping request.`);
          resolve();
          return;
        }
        lastRequestTime.current = now;

        setLoadingCities(true);
        setCitiesError(null);
        const cacheKey = `${CACHE_KEY_CITIES_PREFIX}${state}`;

        if (!forceRefresh) {
          const cached = getCachedData<string[]>(cacheKey);
          if (cached) {
            setCities(cached);
            setLoadingCities(false);
            resolve();
            return;
          }
        }

        try {
          let list: string[] = [];
          const stateId = stateIndex[state];

          try {
            if (stateId && stateId > 0) {
              const resp: unknown = await withTimeout(citiesApi.getByState(stateId), `cities-${state}`);
              const arr = extractArray(resp);
              list = arr
                .map((c: unknown): string => {
                  if (typeof c === 'string') return c;
                  if (isRecord(c)) {
                    const nameVal = c.name ?? c.city_name;
                    return nameVal != null ? String(nameVal) : '';
                  }
                  return '';
                })
                .filter((c: string) => c.trim() !== '')
                .map((c: string) => c.trim());
            }
          } catch (err) {
            console.error(`Failed to fetch cities by state id for ${state}:`, err);
          }

          if (!list || list.length === 0) {
            try {
              const data = await withTimeout(companiesApiSafe.getCities(state), `cities-${state}`);
              list = (Array.isArray(data) ? data : []).filter(c => c && String(c).trim() !== '');
            } catch (err) {
              console.error(`Failed to fetch cities for ${state}:`, err);
              setCitiesError('Não foi possível carregar as cidades deste estado. Verifique sua conexão.');
            }
          }

          const unique = Array.from(new Set(list)).sort();
          setCities(unique);
          if (unique.length > 0) {
            setCachedData(cacheKey, unique);
          } else if (typeof window !== 'undefined') {
            localStorage.removeItem(cacheKey);
          }
          if (!unique.length) {
            setCitiesError(prev => prev || 'Nenhuma cidade encontrada para este estado.');
          }
        } catch (err) {
          console.error(`Failed to fetch cities for ${state}:`, err);
          setCitiesError('Ocorreu um erro ao carregar as cidades. Tente novamente mais tarde.');
        } finally {
          setLoadingCities(false);
          resolve();
        }
      }, 300); // 300ms debounce
    });
  }, [stateIndex, withTimeout]);

  // Initial load
  useEffect(() => {
    fetchStates();
  }, [fetchStates]);

  const result: UseLocationDataResult = {
    states,
    cities,
    loadingStates,
    loadingCities,
    error,
    citiesError,
    fetchCities,
    // expose for components that want manual control of the initial load
    fetchStates,
    refreshStates: () => fetchStates(true),
  };

  return result;
}
