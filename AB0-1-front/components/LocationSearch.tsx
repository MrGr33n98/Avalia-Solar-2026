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
  const [selectedCity, setSelectedCity] = React.useState('');
  const [searchValue, setSearchValue] = React.useState('');
  const [selectedLabel, setSelectedLabel] = React.useState('Localização');
  const popoverId = React.useId();
  
  // Use existing hook for data
  const { states, cities, fetchStates, fetchCities, loadingStates, loadingCities, error, citiesError } = useLocationData();

  React.useEffect(() => {
    fetchStates();
  }, [fetchStates]);

  const [selectedState, setSelectedState] = React.useState<string | null>(null);

  const handleStateSelect = (state: string) => {
    setSelectedState(state);
    setSelectedCity('');
    setSearchValue('');
    fetchCities(state);
  };

  const handleSelect = (currentValue: string, type: 'state' | 'city') => {
    if (type === 'state') {
      handleStateSelect(currentValue);
      setSelectedLabel(currentValue);
      setSearchValue('');
    } else {
      // City selected
      setSelectedCity(currentValue);
      setSearchValue('');
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
        setSelectedCity('');
        setSearchValue('');
      }
    }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-controls={open ? popoverId : undefined}
          aria-label={`${selectedLabel}: selecionar localização`}
          className={cn(
            "h-[40px] w-full justify-between rounded-lg border-slate-200 bg-white px-3 text-left text-sm text-foreground shadow-none transition-colors",
            "hover:border-slate-300 hover:bg-white hover:text-foreground focus-visible:border-brand-blue/30 focus-visible:ring-brand-blue/20",
            "dark:border-white/10 dark:bg-[#081a2e]/82 dark:text-white dark:hover:bg-[#0b2037]",
            className
          )}
        >
          <div className="flex min-w-0 items-center truncate">
            <MapPin className="mr-2 h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
            <span className="truncate">{selectedLabel}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent id={popoverId} className="w-[280px] rounded-[1.35rem] border border-slate-200/80 bg-white/96 p-0 shadow-[0_24px_48px_-28px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-[#0b1d31]/96 dark:text-white">
          <Command>
            <CommandInput
              placeholder={view === 'states' ? "Buscar estado..." : "Buscar cidade..."}
              aria-label={view === 'states' ? "Buscar estado" : "Buscar cidade"}
              value={searchValue}
              onValueChange={setSearchValue}
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
                  <MapPin className="mr-2 h-4 w-4" aria-hidden="true" />
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
                        aria-hidden="true"
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
                        setSearchValue('');
                        if (onLocationSelect && selectedState) onLocationSelect({ state: selectedState });
                      }}
                    >
                      <Check className="mr-2 h-4 w-4 opacity-0" aria-hidden="true" />
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
                            selectedCity === city ? "opacity-100" : "opacity-0"
                          )}
                          aria-hidden="true"
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
