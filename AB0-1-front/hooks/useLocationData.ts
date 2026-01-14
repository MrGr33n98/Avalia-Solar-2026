import { useState, useEffect, useCallback } from 'react';
import { companiesApiSafe } from '@/lib/api-client';
import { statesApi, citiesApi } from '@/lib/api';

const CACHE_KEY_STATES = 'avalia_solar_states_cache';
const CACHE_KEY_CITIES_PREFIX = 'avalia_solar_cities_cache_';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

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
      let index: Record<string, number> = {};

      try {
        const resp: any = await withTimeout(statesApi.getAll(), 'states');
        const list: any[] = Array.isArray(resp) ? resp : Array.isArray(resp?.states) ? resp.states : Array.isArray(resp?.data) ? resp.data : [];
        const cleaned = list
          .map((s: any) => {
            if (typeof s === 'string') {
              return { id: null, name: s };
            }
            if (s && typeof s === 'object') {
              const name = s.name ?? s.state_name ?? s.abbreviation ?? s.acronym ?? s.uf;
              const id = s.id ?? s.state_id ?? s.id;
              return name ? { id: id ?? null, name } : null;
            }
            return null;
          })
          .filter((s: any) => s && s.name && String(s.name).trim() !== '');
        names = cleaned.map(s => String(s.name).trim());
        cleaned.forEach(s => {
          if (s && s.name && s.id) {
            index[String(s.name)] = Number(s.id) || 0;
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

    setLoadingCities(true);
    setCitiesError(null);
    const cacheKey = `${CACHE_KEY_CITIES_PREFIX}${state}`;

    if (!forceRefresh) {
      const cached = getCachedData<string[]>(cacheKey);
      if (cached) {
        setCities(cached);
        setLoadingCities(false);
        return;
      }
    }

    try {
      let list: string[] = [];
      const stateId = stateIndex[state];

      try {
        if (stateId && stateId > 0) {
          const resp: any = await withTimeout(citiesApi.getByState(stateId), `cities-${state}`);
          const arr: any[] = Array.isArray(resp) ? resp : Array.isArray(resp?.cities) ? resp.cities : Array.isArray(resp?.data) ? resp.data : [];
          list = arr
            .map((c: any) => c.name ?? c.city_name ?? c)
            .filter((c: any) => c && String(c).trim() !== '')
            .map((c: any) => String(c));
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
          setCitiesError('Falha ao carregar cidades. Verifique sua conexão e tente novamente.');
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
      setCitiesError('Falha ao carregar cidades. Verifique sua conexão e tente novamente.');
    } finally {
      setLoadingCities(false);
    }
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
