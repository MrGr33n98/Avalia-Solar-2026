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
  const { states, cities, fetchStates, fetchCities } = useLocationData();

  React.useEffect(() => {
    fetchStates();
  }, [fetchStates]);

  const [selectedState, setSelectedState] = React.useState<string | null>(null);

  const handleStateSelect = (state: string) => {
    setSelectedState(state);
    fetchCities(state);
    setValue(''); // Reset command input value if needed
    // Keep open to select city? Or just select state?
    // Let's assume selecting state allows selecting city next, or "All cities in State"
  };

  const handleSelect = (currentValue: string, type: 'state' | 'city') => {
    if (type === 'state') {
      handleStateSelect(currentValue);
      setSelectedLabel(currentValue);
      // Don't close yet if we want city selection
      // But for simple UX, maybe just selecting state is enough initially
      // Or we can have a nested structure. 
      // Let's implement a simple 2-step or flattened list if possible.
      // Given the hook structure, it fetches cities AFTER state is known.
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
          className={cn("w-[200px] justify-between", className)}
        >
          <div className="flex items-center truncate">
            <MapPin className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <span className="truncate">{selectedLabel}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder={view === 'states' ? "Buscar estado..." : "Buscar cidade..."} />
          <CommandList>
            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
            
            {view === 'states' && (
              <CommandGroup heading="Estados">
                 {/* Option to clear/select all */}
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
                    onSelect={(currentValue) => {
                      // Uppercase match usually, but value passed from CommandItem matches the loop key if not specified otherwise? 
                      // Actually value is usually lowercased by cmdk. Let's use the original state name.
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
                    onSelect={(currentValue) => {
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
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
