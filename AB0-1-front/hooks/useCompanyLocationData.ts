import { useState, useCallback, useRef } from 'react';
import { companiesApiSafe } from '@/lib/api-client';

const CACHE_KEY_STATES = 'avalia_solar_company_states_v2';
const CACHE_KEY_CITIES_PREFIX = 'avalia_solar_company_cities_v2_';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const MIN_REQUEST_INTERVAL = 500; // 500ms rate limit

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

export function useCompanyLocationData() {
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [citiesError, setCitiesError] = useState<string | null>(null);

  const lastRequestTime = useRef<number>(0);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      const data = await companiesApiSafe.getStates();
      const names = (Array.isArray(data) ? data : []).filter((s) => s && String(s).trim() !== '');

      if (names.length === 0) {
        setError('Nenhum estado retornado pela API. Tente novamente mais tarde.');
        setStates([]);
        return;
      }

      const unique = Array.from(new Set(names)).sort();
      setStates(unique);
      setCachedData(CACHE_KEY_STATES, unique);
    } catch (err) {
      console.error('Failed to fetch states:', err);
      setError('Falha ao carregar estados. Tente novamente.');
      setStates([]);
    } finally {
      setLoadingStates(false);
    }
  }, []);

  const fetchCities = useCallback(async (state: string, forceRefresh = false) => {
    if (!state || state === 'all') {
      setCities([]);
      setCitiesError(null);
      return;
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    return new Promise<void>((resolve) => {
      debounceTimer.current = setTimeout(async () => {
        const now = Date.now();
        if (now - lastRequestTime.current < MIN_REQUEST_INTERVAL && !forceRefresh) {
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
          const data = await companiesApiSafe.getCities(state);
          const list = (Array.isArray(data) ? data : [])
            .filter((c) => c && String(c).trim() !== '')
            .map((c) => String(c));

          const unique = Array.from(new Set(list)).sort();
          setCities(unique);

          if (unique.length > 0) {
            setCachedData(cacheKey, unique);
          } else if (typeof window !== 'undefined') {
            localStorage.removeItem(cacheKey);
          }

          if (!unique.length) {
            setCitiesError('Nenhuma cidade encontrada para este estado.');
          }
        } catch (err) {
          console.error(`Failed to fetch cities for ${state}:`, err);
          setCitiesError('Não foi possível carregar as cidades deste estado. Verifique sua conexão.');
        } finally {
          setLoadingCities(false);
          resolve();
        }
      }, 300);
    });
  }, []);

  return {
    states,
    cities,
    loadingStates,
    loadingCities,
    error,
    citiesError,
    fetchStates,
    fetchCities,
    refreshStates: () => fetchStates(true),
  };
}
