import { useCallback, useState } from 'react';
import { useGeographyCatalog } from '@/hooks/useGeographyCatalog';
import { normalizeUf } from '@/lib/geography/catalog';

export interface UseLocationDataResult {
  states: string[];
  cities: string[];
  loadingStates: boolean;
  loadingCities: boolean;
  citiesStale: boolean;
  error: string | null;
  citiesError?: string | null;
  fetchStates: (forceRefresh?: boolean) => Promise<void>;
  fetchCities: (state: string, forceRefresh?: boolean) => Promise<void>;
  refreshStates: () => Promise<void>;
}

export function useLocationData(selectedStateValue?: string | null): UseLocationDataResult {
  const [requestedState, setRequestedState] = useState('');
  const activeState =
    selectedStateValue === undefined ? requestedState : normalizeUf(selectedStateValue) || '';
  const catalog = useGeographyCatalog(activeState ? [activeState] : []);
  const requestCities = catalog.requestCities;
  const fetchStates = useCallback(async (_forceRefresh = false) => undefined, []);

  const fetchCities = useCallback(
    async (state: string, forceRefresh = false): Promise<void> => {
      const uf = normalizeUf(state);
      if (selectedStateValue === undefined) setRequestedState(uf || '');
      if (!uf) return;

      try {
        await requestCities(uf, forceRefresh);
      } catch {
        // O estado de erro fica disponível no adaptador para retry acessível.
      }
    },
    [requestCities, selectedStateValue]
  );

  const refreshStates = useCallback(() => fetchStates(true), [fetchStates]);
  const citiesError = activeState ? catalog.errorByState[activeState]?.message || null : null;

  return {
    states: catalog.states,
    cities: activeState ? catalog.citiesByState[activeState] || [] : [],
    loadingStates: false,
    loadingCities: activeState ? catalog.loadingByState[activeState] || false : false,
    citiesStale: activeState ? catalog.isStaleByState[activeState] || false : false,
    error: null,
    citiesError,
    fetchStates,
    fetchCities,
    refreshStates,
  };
}
