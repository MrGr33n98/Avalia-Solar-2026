import { useCallback, useMemo } from 'react';
import { StateOption } from './types';
import { BRAZIL_STATES_OPTIONS } from '@/lib/company-options';
import { useGeographyCatalog } from '@/hooks/useGeographyCatalog';
import { normalizeUf } from '@/lib/geography/catalog';

const STATIC_STATES_OPTIONS: StateOption[] = BRAZIL_STATES_OPTIONS.map((state) => ({
  state: state.state,
  count: 0,
})).sort((a, b) => a.state.localeCompare(b.state));

export function useStatesOptions() {
  return { states: STATIC_STATES_OPTIONS, loading: false, error: null };
}

export function useCitiesOptions(selectedStates: string[]) {
  const catalog = useGeographyCatalog(selectedStates);
  const selectedStatesKey = selectedStates.join('|');
  const normalizedStates = useMemo(
    () =>
      selectedStatesKey
        .split('|')
        .map(normalizeUf)
        .filter((state): state is string => Boolean(state)),
    [selectedStatesKey]
  );
  const cities = useMemo(
    () =>
      [...catalog.cities].sort(
        (left, right) => left.city.localeCompare(right.city) || left.state.localeCompare(right.state)
      ),
    [catalog.cities]
  );
  const failedStates = useMemo(
    () => normalizedStates.filter((state) => catalog.errorByState[state] instanceof Error),
    [catalog.errorByState, normalizedStates]
  );
  const error = failedStates.length > 0 ? catalog.errorByState[failedStates[0]] : null;
  const requestCities = catalog.requestCities;
  const retry = useCallback(
    () => Promise.all(failedStates.map((state) => requestCities(state, true))),
    [failedStates, requestCities]
  );

  return {
    cities,
    loading: Object.values(catalog.loadingByState).some(Boolean),
    stale: Object.values(catalog.isStaleByState).some(Boolean),
    error,
    retry,
  };
}
