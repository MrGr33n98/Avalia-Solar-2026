import { useCallback, useState } from 'react';
import { useGeographyCatalog } from '@/hooks/useGeographyCatalog';
import { normalizeUf } from '@/lib/geography/catalog';

export function useCompanyLocationData(selectedStateValue?: string) {
  const [requestedState, setRequestedState] = useState('');
  const activeState =
    selectedStateValue === undefined ? requestedState : normalizeUf(selectedStateValue) || '';
  const catalog = useGeographyCatalog(activeState ? [activeState] : []);
  const requestCities = catalog.requestCities;

  const fetchStates = useCallback(async () => undefined, []);

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

  const refreshStates = useCallback(() => fetchStates(), [fetchStates]);
  const cities = activeState ? catalog.citiesByState[activeState] || [] : [];

  return {
    states: catalog.states,
    cities,
    loadingStates: false,
    loadingCities: activeState ? catalog.loadingByState[activeState] || false : false,
    citiesStale: activeState ? catalog.isStaleByState[activeState] || false : false,
    error: null,
    citiesError: activeState ? catalog.errorByState[activeState]?.message || null : null,
    fetchStates,
    fetchCities,
    refreshStates,
  };
}
