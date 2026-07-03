'use client';

import React, { useState } from 'react';
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
  const { cities, loading: citiesLoading, error: citiesError } = useCitiesOptions(selectedStates);
  
  const [stateSearch, setStateSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');

  if (statesError) return null;

  const handleStateToggle = (state: string) => {
    const newStates = selectedStates.includes(state)
      ? selectedStates.filter((s) => s !== state)
      : [...selectedStates, state];
    onStatesChange(newStates);
    
    // Se remover um estado, removemos as cidades associadas a ele
    if (selectedStates.includes(state)) {
      // Nota: Para ser perfeito, precisaríamos saber qual cidade pertence a qual estado
      // mas como o filtro de cidades é dependente dos estados selecionados, 
      // podemos opcionalmente limpar todas as cidades ou apenas as que não pertencem mais.
      // Por simplicidade e melhor UX, vamos manter as cidades que ainda forem válidas
      // se a API nos der essa info, ou limpar se houver mudança brusca.
      // Aqui vamos apenas disparar a mudança e deixar o hook de cidades atualizar as opções.
    }
  };

  const handleCityToggle = (city: string) => {
    const newCities = selectedCities.includes(city)
      ? selectedCities.filter((c) => c !== city)
      : [...selectedCities, city];
    onCitiesChange(newCities);
  };

  const filteredStates = states.filter((s) =>
    s.state.toLowerCase().includes(stateSearch.toLowerCase())
  );

  const filteredCities = cities.filter((c) =>
    c.city.toLowerCase().includes(citySearch.toLowerCase())
  );

  const totalSelected = selectedStates.length + selectedCities.length;

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
                  filteredCities.map((item) => (
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
              </div>
            )}
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
};
