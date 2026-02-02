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
    <AccordionItem value="location" className="border-none">
      <AccordionTrigger className="hover:no-underline py-2 px-3 rounded-lg hover:bg-slate-50 transition-all group">
        <div className="flex items-center gap-3">
          <div className="bg-slate-100 p-2 rounded-xl group-data-[state=open]:bg-blue-100 group-data-[state=open]:text-blue-700 transition-colors">
            <MapPin size={20} strokeWidth={1.75} />
          </div>
          <span className="text-sm font-semibold text-slate-700">Localização</span>
          {totalSelected > 0 && (
            <Badge variant="secondary" className="ml-1 bg-blue-50 text-blue-700 hover:bg-blue-50 rounded-full px-2 py-0.5 text-xs">
              {totalSelected}
            </Badge>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent className="pt-2 pb-1 px-3 space-y-4">
        {/* Estados */}
        <div className="space-y-3">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Estados</h4>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar estado..."
              className="pl-9 h-9 text-xs border-slate-200 focus-visible:ring-blue-500 bg-slate-50/50 rounded-lg"
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
                  className="flex items-center justify-between group cursor-pointer px-1 py-1 rounded-md hover:bg-slate-50"
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
                    <span className="text-[10px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
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
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cidades</h4>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar cidade..."
                className="pl-9 h-9 text-xs border-slate-200 focus-visible:ring-blue-500 bg-slate-50/50 rounded-lg"
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
                      className="flex items-center justify-between group cursor-pointer px-1 py-1 rounded-md hover:bg-slate-50"
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
