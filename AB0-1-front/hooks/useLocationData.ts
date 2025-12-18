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

export function useLocationData() {
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stateIndex, setStateIndex] = useState<Record<string, number>>({});

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
        const resp: any = await statesApi.getAll();
        const list: any[] = Array.isArray(resp) ? resp : Array.isArray(resp?.states) ? resp.states : Array.isArray(resp?.data) ? resp.data : [];
        const cleaned = list
          .map((s: any) => ({ id: s.id ?? s.state_id ?? s.id, name: s.name ?? s.state_name ?? s.abbreviation }))
          .filter((s: any) => s && s.name && String(s.name).trim() !== '');
        names = cleaned.map(s => String(s.name));
        cleaned.forEach(s => { index[String(s.name)] = Number(s.id) || 0; });
      } catch {}

      if (!names || names.length === 0) {
        const data = await companiesApiSafe.getStates();
        const fallback = Array.isArray(data) ? data : [];
        names = fallback.filter(s => s && String(s).trim() !== '');
      }

      const unique = Array.from(new Set(names)).sort();
      setStates(unique);
      setStateIndex(index);
      setCachedData(CACHE_KEY_STATES, unique);
    } catch (err) {
      console.error('Failed to fetch states:', err);
      setError('Falha ao carregar estados. Tente novamente.');
    } finally {
      setLoadingStates(false);
    }
  }, []);

  const fetchCities = useCallback(async (state: string, forceRefresh = false) => {
    if (!state || state === 'all') {
      setCities([]);
      return;
    }

    setLoadingCities(true);
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
          const resp: any = await citiesApi.getByState(stateId);
          const arr: any[] = Array.isArray(resp) ? resp : Array.isArray(resp?.cities) ? resp.cities : Array.isArray(resp?.data) ? resp.data : [];
          list = arr
            .map((c: any) => c.name ?? c.city_name ?? c)
            .filter((c: any) => c && String(c).trim() !== '')
            .map((c: any) => String(c));
        }
      } catch {}

      if (!list || list.length === 0) {
        const data = await companiesApiSafe.getCities(state);
        list = (Array.isArray(data) ? data : []).filter(c => c && String(c).trim() !== '');
      }

      const unique = Array.from(new Set(list)).sort();
      setCities(unique);
      setCachedData(cacheKey, unique);
    } catch (err) {
      console.error(`Failed to fetch cities for ${state}:`, err);
    } finally {
      setLoadingCities(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchStates();
  }, [fetchStates]);

  return {
    states,
    cities,
    loadingStates,
    loadingCities,
    error,
    fetchCities,
    refreshStates: () => fetchStates(true),
  };
}
