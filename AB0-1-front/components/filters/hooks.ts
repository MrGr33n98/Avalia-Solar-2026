import { useState, useEffect } from 'react';
import { StateOption, CityOption } from './types';
import { fetchApiSafe } from '@/lib/api-client';

export function useStatesOptions() {
  const [states, setStates] = useState<StateOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchStates() {
      try {
        const data = await fetchApiSafe<any[]>('/filters/states');
        
        const normalizedData: StateOption[] = Array.isArray(data) 
          ? data.map((item: any) => typeof item === 'string' ? { state: item, count: 0 } : { state: item.state, count: item.count || 0 })
          : [];
          
        setStates(normalizedData.sort((a, b) => a.state.localeCompare(b.state)));
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Erro desconhecido'));
      } finally {
        setLoading(false);
      }
    }

    fetchStates();
  }, []);

  return { states, loading, error };
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
        const statesParam = selectedStates.join(',');
        const data = await fetchApiSafe<any[]>(`/filters/cities?states=${statesParam}`);
        
        const normalizedData: CityOption[] = Array.isArray(data) 
          ? data.map((item: any) => ({ city: item.city, state: item.state, count: item.count || 0 }))
          : [];
          
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
