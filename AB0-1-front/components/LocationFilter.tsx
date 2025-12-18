'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, MapPin, Loader2, RefreshCw } from 'lucide-react';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLocationData } from '@/hooks/useLocationData';

interface LocationFilterProps {
  onStateChange: (state: string) => void;
  onCityChange: (city: string) => void;
  onClear: () => void;
  initialState?: string;
  initialCity?: string;
  className?: string;
}

export function LocationFilter({
  onStateChange,
  onCityChange,
  onClear,
  initialState = 'all',
  initialCity = '',
  className,
}: LocationFilterProps) {
  const { 
    states, 
    cities, 
    loadingStates, 
    loadingCities, 
    error, 
    fetchCities,
    refreshStates
  } = useLocationData();

  const [selectedState, setSelectedState] = React.useState(initialState);
  const [selectedCity, setSelectedCity] = React.useState(initialCity);
  const [openCity, setOpenCity] = React.useState(false);

  // Sync cities when state changes
  React.useEffect(() => {
    fetchCities(selectedState);
  }, [selectedState, fetchCities]);

  // Sync internal state with props if they change externally
  React.useEffect(() => {
    setSelectedState(initialState);
  }, [initialState]);

  React.useEffect(() => {
    setSelectedCity(initialCity);
  }, [initialCity]);

  const handleStateChange = (value: string) => {
    setSelectedState(value);
    setSelectedCity('');
    onStateChange(value);
    onCityChange('');
  };

  const handleCitySelect = (currentValue: string) => {
    const originalCity = cities.find(c => c.toLowerCase() === currentValue.toLowerCase()) || currentValue;
    const newValue = originalCity === selectedCity ? '' : originalCity;
    
    setSelectedCity(newValue);
    onCityChange(newValue);
    setOpenCity(false);
  };

  const handleClear = () => {
    setSelectedState('all');
    setSelectedCity('');
    onClear();
  };

  return (
    <div className={cn("flex flex-col sm:flex-row gap-3 items-start sm:items-center", className)}>
      {/* State Select */}
      <div className="relative">
        <Select value={selectedState} onValueChange={handleStateChange} disabled={loadingStates}>
          <SelectTrigger className="w-full sm:w-[180px] bg-background">
            {loadingStates ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin text-muted-foreground" />
            ) : (
              <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
            )}
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os estados</SelectItem>
            {states.map((state) => (
              <SelectItem key={state} value={state}>
                {state}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {error && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute -right-8 top-0 h-10 w-8 text-destructive hover:text-destructive/80"
            onClick={() => refreshStates()}
            title="Tentar novamente"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* City Combobox */}
      <Popover open={openCity} onOpenChange={setOpenCity}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={openCity}
            className="w-full sm:w-[240px] justify-between bg-background"
            disabled={!selectedState || selectedState === 'all' || loadingStates}
          >
            {loadingCities ? (
              <span className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Carregando...
              </span>
            ) : selectedCity ? (
              cities.find((city) => city === selectedCity) || selectedCity
            ) : (
              "Selecione a cidade..."
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[240px] p-0">
          <Command>
            <CommandInput placeholder="Buscar cidade..." />
            <CommandList>
              <CommandEmpty>Cidade não encontrada.</CommandEmpty>
              <CommandGroup>
                {cities.map((city) => (
                  <CommandItem
                    key={city}
                    value={city}
                    onSelect={handleCitySelect}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedCity === city ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {city}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Clear Button */}
      {(selectedState !== 'all' || selectedCity) && (
        <Button 
          variant="ghost" 
          onClick={handleClear}
          className="text-sm text-muted-foreground hover:text-foreground px-2"
        >
          Limpar filtros
        </Button>
      )}
    </div>
  );
}
