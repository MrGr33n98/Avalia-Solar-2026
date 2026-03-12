'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useLocationData } from '@/hooks/useLocationData';
import { track } from '@/lib/analytics/lazy';

interface LocationSearchProps {
  className?: string;
  onLocationSelect?: (location: { state: string; city?: string }) => void;
}

export default function LocationSearch({ className, onLocationSelect }: LocationSearchProps) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState('');
  const [selectedLabel, setSelectedLabel] = React.useState('Localização');
  
  // Use existing hook for data
  const { states, cities, fetchStates, fetchCities, loadingStates, loadingCities, error, citiesError } = useLocationData();

  React.useEffect(() => {
    fetchStates();
  }, [fetchStates]);

  const [selectedState, setSelectedState] = React.useState<string | null>(null);

  const handleStateSelect = (state: string) => {
    setSelectedState(state);
    fetchCities(state);
    setValue(''); // Reset command input value if needed
  };

  const handleSelect = (currentValue: string, type: 'state' | 'city') => {
    if (type === 'state') {
      handleStateSelect(currentValue);
      setSelectedLabel(currentValue);
    } else {
      // City selected
      setValue(currentValue);
      setSelectedLabel(`${currentValue} - ${selectedState}`);
      setOpen(false);

      // Track location selection
      track('location_selected', {
        state: selectedState,
        city: currentValue,
        location_label: `${currentValue} - ${selectedState}`
      });

      if (onLocationSelect && selectedState) {
        onLocationSelect({ state: selectedState, city: currentValue });
      }
    }
  };

  // Simplified approach: List States. When State clicked, show Cities. Back button to states.
  const [view, setView] = React.useState<'states' | 'cities'>('states');

  return (
    <Popover open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (isOpen) {
        setView('states');
        setSelectedState(null);
      }
    }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Selecionar localização"
          className={cn(
            "h-11 w-full justify-between rounded-[1.1rem] border-black/10 bg-white/82 px-3 text-left text-sm text-foreground shadow-none transition-colors",
            "hover:bg-white hover:text-foreground focus-visible:border-brand-blue/30 focus-visible:ring-brand-blue/20",
            "dark:border-white/10 dark:bg-[#081a2e]/78 dark:text-white dark:hover:bg-[#0b2037]",
            className
          )}
        >
          <div className="flex min-w-0 items-center truncate">
            <MapPin className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <span className="truncate">{selectedLabel}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] rounded-[1.25rem] border-black/10 bg-white/95 p-0 shadow-2xl shadow-slate-900/10 dark:border-white/10 dark:bg-[#0b1d31]/96 dark:text-white">
        <Command>
          <CommandInput 
            placeholder={view === 'states' ? "Buscar estado..." : "Buscar cidade..."} 
            aria-label={view === 'states' ? "Buscar estado" : "Buscar cidade"}
          />
          <CommandList className="max-h-[300px] overflow-y-auto">
            {loadingStates && view === 'states' && (
              <div className="p-4 text-sm text-center text-muted-foreground animate-pulse">
                Carregando estados...
              </div>
            )}
            
            {error && view === 'states' && (
              <div className="p-4 text-sm text-center text-destructive">
                {error}
              </div>
            )}

            <CommandEmpty>
              {!loadingStates && !loadingCities && "Nenhum resultado encontrado."}
            </CommandEmpty>
            
            {view === 'states' && !loadingStates && (
              <CommandGroup heading="Estados">
                 <CommandItem
                  onSelect={() => {
                    setSelectedLabel("Todo Brasil");
                    setOpen(false);
                    if (onLocationSelect) onLocationSelect({ state: '' });
                  }}
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  Todo Brasil
                </CommandItem>
                {states.map((state) => (
                  <CommandItem
                    key={state}
                    value={state}
                    onSelect={() => {
                      handleStateSelect(state); 
                      setView('cities');
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedState === state ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {state}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {view === 'cities' && (
              <CommandGroup heading={`Cidades de ${selectedState}`}>
                <CommandItem
                  onSelect={() => {
                    setView('states');
                    setSelectedState(null);
                  }}
                  className="font-medium text-muted-foreground"
                >
                  ← Voltar para Estados
                </CommandItem>
                
                {loadingCities ? (
                  <div className="p-4 text-sm text-center text-muted-foreground animate-pulse">
                    Carregando cidades...
                  </div>
                ) : citiesError ? (
                  <div className="p-4 text-sm text-center text-destructive">
                    {citiesError}
                  </div>
                ) : (
                  <>
                    <CommandItem
                      onSelect={() => {
                        setSelectedLabel(`Todo ${selectedState}`);
                        setOpen(false);
                        if (onLocationSelect && selectedState) onLocationSelect({ state: selectedState });
                      }}
                    >
                      <Check className="mr-2 h-4 w-4 opacity-0" />
                      Todas em {selectedState}
                    </CommandItem>
                    {cities.map((city) => (
                      <CommandItem
                        key={city}
                        value={city}
                        onSelect={() => {
                          handleSelect(city, 'city');
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === city ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {city}
                      </CommandItem>
                    ))}
                  </>
                )}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
