import { useState, useEffect } from 'react';
import { StateOption, CityOption } from './types';
import { companiesApiSafe } from '@/lib/api-client';
import { BRAZIL_STATES_OPTIONS } from '@/lib/company-options';

const STATIC_STATES_OPTIONS: StateOption[] = BRAZIL_STATES_OPTIONS.map((s) => ({
  state: s.state,
  count: 0,
})).sort((a, b) => a.state.localeCompare(b.state));

export function useStatesOptions() {
  return { states: STATIC_STATES_OPTIONS, loading: false, error: null };
}

export function useCitiesOptions(selectedStates: string[]) {
  const [cities, setCities] = useState<CityOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (selectedStates.length === 0) {
      setCities([]);
      return;
    }

    async function fetchCities() {
      setLoading(true);
      try {
        const allCities = await Promise.all(
          selectedStates.map(async (state) => {
            const cities = await companiesApiSafe.getCities(state);
            return cities.map((city) => ({ city, state, count: 0 }));
          })
        );
        const normalizedData: CityOption[] = allCities.flat();
          
        setCities(normalizedData.sort((a, b) => a.city.localeCompare(b.city)));
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Erro desconhecido'));
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(fetchCities, 300); // Debounce
    return () => clearTimeout(timer);
  }, [selectedStates]);

  return { cities, loading, error };
}
