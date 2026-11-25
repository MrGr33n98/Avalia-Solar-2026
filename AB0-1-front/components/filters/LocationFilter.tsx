'use client';

import React, { useMemo, useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useStatesOptions, useCitiesOptions } from './hooks';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MAX_RENDERED_GEOGRAPHY_OPTIONS,
  normalizeGeographySearch,
} from '@/lib/geography/search';

interface LocationFilterProps {
  selectedStates: string[];
  selectedCities: string[];
  onStatesChange: (states: string[]) => void;
  onCitiesChange: (cities: string[]) => void;
}

export const LocationFilter: React.FC<LocationFilterProps> = ({
  selectedStates,
  selectedCities,
  onStatesChange,
  onCitiesChange,
}) => {
  const { states, loading: statesLoading, error: statesError } = useStatesOptions();
  const {
    cities,
    loading: citiesLoading,
    stale: citiesStale,
    error: citiesError,
    retry: retryCities,
  } = useCitiesOptions(selectedStates);
  
  const [stateSearch, setStateSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');

  const handleStateToggle = (state: string) => {
    const newStates = selectedStates.includes(state)
      ? selectedStates.filter((s) => s !== state)
      : [...selectedStates, state];
    setCitySearch('');
    onStatesChange(newStates);

    if (selectedStates.includes(state)) {
      onCitiesChange(
        selectedCities.filter((city) =>
          cities.some((option) => option.city === city && option.state !== state)
        )
      );
    }
  };

  const handleCityToggle = (city: string) => {
    const newCities = selectedCities.includes(city)
      ? selectedCities.filter((c) => c !== city)
      : [...selectedCities, city];
    onCitiesChange(newCities);
  };

  const normalizedStateSearch = normalizeGeographySearch(stateSearch);
  const filteredStates = useMemo(
    () =>
      states.filter((state) =>
        normalizeGeographySearch(state.state).includes(normalizedStateSearch)
      ),
    [normalizedStateSearch, states]
  );
  const normalizedCitySearch = normalizeGeographySearch(citySearch);
  const filteredCities = useMemo(
    () =>
      cities.filter((city) =>
        normalizeGeographySearch(city.city).includes(normalizedCitySearch)
      ),
    [cities, normalizedCitySearch]
  );
  const visibleCities = filteredCities.slice(0, MAX_RENDERED_GEOGRAPHY_OPTIONS);

  const totalSelected = selectedStates.length + selectedCities.length;
  if (statesError) return null;

  return (
    <AccordionItem value="location" className="border-b border-slate-200">
      <AccordionTrigger className="group rounded-none px-5 py-4 hover:bg-slate-50 hover:no-underline">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border border-slate-200 bg-slate-50 rounded-none group-data-[state=open]:border-blue-200 group-data-[state=open]:text-blue-700">
            <MapPin size={20} strokeWidth={1.75} />
          </div>
          <span className="text-sm font-medium text-slate-950">Localização</span>
          {totalSelected > 0 && (
            <Badge variant="secondary" className="ml-1 rounded-sm border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
              {totalSelected}
            </Badge>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-4 px-5 pb-4 pt-0">
        {/* Estados */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Estados</h4>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar estado..."
              className="h-10 rounded-none border-slate-300 bg-white pl-9 text-xs focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500/20"
              value={stateSearch}
              onChange={(e) => setStateSearch(e.target.value)}
            />
          </div>

          {statesLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-4 w-full rounded" />
              ))}
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
              {filteredStates.map((item) => (
                <div
                  key={item.state}
                  className="group flex cursor-pointer items-center justify-between rounded-none px-2 py-1.5 hover:bg-slate-50"
                  onClick={() => handleStateToggle(item.state)}
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`state-${item.state}`}
                      checked={selectedStates.includes(item.state)}
                      onCheckedChange={() => handleStateToggle(item.state)}
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <label
                      htmlFor={`state-${item.state}`}
                      className="text-sm text-slate-600 group-hover:text-blue-700 cursor-pointer transition-colors"
                    >
                      {item.state}
                    </label>
                  </div>
                  {item.count > 0 && (
                    <span className="rounded-sm border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                      {item.count}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cidades (Apenas se houver estados selecionados) */}
        {selectedStates.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Cidades</h4>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar cidade..."
                className="h-10 rounded-none border-slate-300 bg-white pl-9 text-xs focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500/20"
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
              />
            </div>

            {citiesLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-4 w-full rounded" />
                ))}
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                {filteredCities.length > 0 ? (
                  visibleCities.map((item) => (
                    <div
                      key={`${item.state}-${item.city}`}
                      className="group flex cursor-pointer items-center justify-between rounded-none px-2 py-1.5 hover:bg-slate-50"
                      onClick={() => handleCityToggle(item.city)}
                    >
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`city-${item.city}`}
                          checked={selectedCities.includes(item.city)}
                          onCheckedChange={() => handleCityToggle(item.city)}
                          className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                        <label
                          htmlFor={`city-${item.city}`}
                          className="text-sm text-slate-600 group-hover:text-blue-700 cursor-pointer transition-colors"
                        >
                          {item.city}
                        </label>
                      </div>
                      <span className="text-[10px] font-medium text-slate-400">
                        {item.state}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-slate-400 text-center py-2">
                    {citySearch ? 'Nenhuma cidade encontrada' : 'Busque uma cidade'}
                  </p>
                )}
                {filteredCities.length > visibleCities.length && (
                  <p className="text-[11px] text-slate-500" role="status">
                    Exibindo {visibleCities.length} de {filteredCities.length} cidades. Refine a busca para encontrar outras.
                  </p>
                )}
              </div>
            )}
            {citiesError && (
              <div className="flex items-center justify-between gap-2 text-[11px] text-red-700" role="alert">
                <span>Não foi possível atualizar as cidades.</span>
                <button type="button" className="underline underline-offset-2" onClick={() => void retryCities()}>
                  Tentar novamente
                </button>
              </div>
            )}
            {citiesStale && !citiesError && (
              <p className="text-[11px] text-amber-700" role="status">
                Lista salva localmente; pode estar desatualizada.
              </p>
            )}
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
};
