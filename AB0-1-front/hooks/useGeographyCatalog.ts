import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { companiesApiSafe } from '@/lib/api-client';
import { BRAZIL_STATES_OPTIONS } from '@/lib/company-options';
import {
  GEO_CATALOG_GC_TIME_MS,
  GEO_CATALOG_SCHEMA_VERSION,
  GEO_CATALOG_TTL_MS,
  geographyCitiesQueryKey,
  normalizeUf,
  persistCityCatalog,
  readPersistedCityCatalog,
  type CityCatalog,
} from '@/lib/geography/catalog';

const STATE_OPTIONS: string[] = BRAZIL_STATES_OPTIONS.map(({ state }) => state);
const CITY_QUERY_PREFIX = ['geo', 'official-cities'] as const;

function normalizeCities(cities: unknown): string[] {
  if (!Array.isArray(cities)) return [];

  return Array.from(
    new Set(
      cities
        .filter((city): city is string => typeof city === 'string')
        .map((city) => city.trim())
        .filter(Boolean)
    )
  ).sort();
}

function createCityQuery(
  uf: string,
  revision: string,
  enabled: boolean,
  persisted: CityCatalog | undefined
) {
  const initialData =
    persisted && (revision === 'latest' || persisted.revision === revision) ? persisted : undefined;

  return {
    queryKey: geographyCitiesQueryKey(uf, revision),
    queryFn: async ({ signal }: { signal: AbortSignal }): Promise<CityCatalog> => {
      const response = await companiesApiSafe.getGeographicCities(uf, signal);
      const catalog: CityCatalog = {
        uf,
        cities: normalizeCities(response.cities),
        revision: response.revision,
        updatedAt: Date.now(),
      };

      persistCityCatalog(catalog);
      return catalog;
    },
    initialData,
    initialDataUpdatedAt: initialData?.updatedAt,
    staleTime: GEO_CATALOG_TTL_MS,
    gcTime: GEO_CATALOG_GC_TIME_MS,
    retry: false,
    enabled,
  };
}

export function useGeographyCatalog(selectedStates: readonly string[] = []) {
  const queryClient = useQueryClient();
  const [hydratedSelectionKey, setHydratedSelectionKey] = useState('');
  const [persistedCatalogs, setPersistedCatalogs] = useState<Record<string, CityCatalog>>({});
  const persistedCatalogsRef = useRef(persistedCatalogs);
  persistedCatalogsRef.current = persistedCatalogs;
  const [revisions, setRevisions] = useState<Record<string, string>>({});
  const revisionsRef = useRef(revisions);
  revisionsRef.current = revisions;

  const selectedStatesKey = selectedStates.join('|');
  const normalizedStates = useMemo(() => {
    const normalized = selectedStatesKey
      .split('|')
      .map(normalizeUf)
      .filter((state): state is string => state !== null);
    return Array.from(new Set(normalized));
  }, [selectedStatesKey]);
  const selectionKey = normalizedStates.join('|');
  const selectionHydrated = hydratedSelectionKey === selectionKey;

  useEffect(() => {
    const storedRevisions: Record<string, string> = {};
    const storedCatalogs: Record<string, CityCatalog> = {};
    normalizedStates.forEach((uf) => {
      const persisted = readPersistedCityCatalog(uf);
      if (persisted) {
        storedRevisions[uf] = persisted.revision;
        storedCatalogs[uf] = persisted;
      }
    });

    persistedCatalogsRef.current = storedCatalogs;
    setPersistedCatalogs(storedCatalogs);
    setRevisions((current) => ({ ...storedRevisions, ...current }));
    setHydratedSelectionKey(selectionKey);
  }, [normalizedStates, selectionKey]);

  const queryResults = useQueries({
    queries: normalizedStates.map((uf) =>
      createCityQuery(uf, revisions[uf] || 'latest', selectionHydrated, persistedCatalogs[uf])
    ),
  });

  useEffect(() => {
    queryResults.forEach((query, index) => {
      const catalog = query.data;
      const uf = normalizedStates[index];
      if (!catalog || !uf || revisionsRef.current[uf] === catalog.revision) return;

      queryClient.setQueryData(geographyCitiesQueryKey(uf, catalog.revision), catalog, {
        updatedAt: catalog.updatedAt,
      });
      setRevisions((current) => ({ ...current, [uf]: catalog.revision }));
      queryClient.invalidateQueries({
        queryKey: [...CITY_QUERY_PREFIX, uf, GEO_CATALOG_SCHEMA_VERSION],
        predicate: (candidate) => candidate.queryKey[4] !== catalog.revision,
        refetchType: 'none',
      });
    });
  }, [queryClient, normalizedStates, queryResults]);

  const requestCities = useCallback(
    async (stateValue: string, forceRefresh = false): Promise<string[]> => {
      const uf = normalizeUf(stateValue);
      if (!uf) return [];

      const persisted = persistedCatalogsRef.current[uf] || readPersistedCityCatalog(uf);
      const revision = revisionsRef.current[uf] || persisted?.revision || 'latest';
      const options = createCityQuery(uf, revision, true, persisted);
      const queryKey = geographyCitiesQueryKey(uf, revision);

      if (forceRefresh) {
        await queryClient.invalidateQueries({ queryKey, exact: true, refetchType: 'none' });
      }

      const catalog = await queryClient.fetchQuery(options);
      persistedCatalogsRef.current = { ...persistedCatalogsRef.current, [uf]: catalog };
      if (catalog.revision !== revision) {
        queryClient.setQueryData(geographyCitiesQueryKey(uf, catalog.revision), catalog, {
          updatedAt: catalog.updatedAt,
        });
        setRevisions((current) => ({ ...current, [uf]: catalog.revision }));
      }
      return catalog.cities;
    },
    [queryClient]
  );

  const citiesByState = useMemo(() => {
    const entries = normalizedStates.flatMap((uf, index) => {
      const cities = queryResults[index]?.data?.cities;
      return cities ? [[uf, cities] as const] : [];
    });
    return Object.fromEntries(entries) as Record<string, string[]>;
  }, [normalizedStates, queryResults]);

  const loadingByState = useMemo(() => {
    const entries = normalizedStates.map((uf, index) => [
      uf,
      Boolean(queryResults[index]?.isLoading),
    ]);
    return Object.fromEntries(entries) as Record<string, boolean>;
  }, [normalizedStates, queryResults]);

  const errorByState = useMemo(() => {
    const entries = normalizedStates.map((uf, index) => [
      uf,
      queryResults[index]?.error instanceof Error ? queryResults[index].error : null,
    ]);
    return Object.fromEntries(entries) as Record<string, Error | null>;
  }, [normalizedStates, queryResults]);

  const cities = useMemo(
    () =>
      normalizedStates.flatMap((state) =>
        (citiesByState[state] || []).map((city) => ({ city, state, count: 0 }))
      ),
    [normalizedStates, citiesByState]
  );
  const refreshStates = useCallback(async () => undefined, []);

  return {
    states: STATE_OPTIONS,
    cities,
    citiesByState,
    loadingByState,
    errorByState,
    isStaleByState: Object.fromEntries(
      normalizedStates.map((state, index) => [
        state,
        Boolean(queryResults[index]?.data && queryResults[index]?.isStale),
      ])
    ) as Record<string, boolean>,
    requestCities,
    refreshStates,
  };
}
