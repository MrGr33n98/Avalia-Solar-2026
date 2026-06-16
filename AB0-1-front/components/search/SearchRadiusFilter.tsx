'use client';

import { useState, useEffect } from 'react';
import { MapPin, Navigation, ChevronDown } from 'lucide-react';
import { useGeoLocation } from '@/hooks/useGeoLocation';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface SearchRadiusFilterProps {
  radiusKm: number | null;
  onRadiusChange: (radius: number | null) => void;
  onCoordsChange: (coords: { lat: number; lng: number } | null) => void;
  cityName?: string;
  cityCenterCoords?: { lat: number; lng: number } | null;
  className?: string;
}

const RADIUS_OPTIONS = [
  { label: 'Até 10 km', value: 10 },
  { label: 'Até 30 km', value: 30 },
  { label: 'Até 50 km', value: 50 },
  { label: 'Até 100 km', value: 100 },
  { label: 'Todo o estado', value: null },
];

export default function SearchRadiusFilter({
  radiusKm,
  onRadiusChange,
  onCoordsChange,
  cityName,
  cityCenterCoords,
  className = '',
}: SearchRadiusFilterProps) {
  const [locationMode, setLocationMode] = useState<'city' | 'gps' | null>(null);
  const { coords, loading, error, permissionDenied, requestLocation, clearLocation } = useGeoLocation();

  const handleUseGPS = () => {
    requestLocation();
    setLocationMode('gps');
  };

  const handleUseCity = () => {
    clearLocation();
    setLocationMode('city');
    if (cityCenterCoords) {
      onCoordsChange(cityCenterCoords);
    }
    if (!radiusKm) {
      onRadiusChange(50);
    }
  };

  const handleClearLocation = () => {
    clearLocation();
    setLocationMode(null);
    onCoordsChange(null);
    onRadiusChange(null);
  };

  useEffect(() => {
    if (coords && locationMode === 'gps') {
      onCoordsChange(coords);
    }
  }, [coords, locationMode, onCoordsChange]);

  const activeCoords = locationMode === 'gps' ? coords : (locationMode === 'city' ? cityCenterCoords : null);
  const hasLocation = !!activeCoords;

  const currentLabel = radiusKm ? `Até ${radiusKm} km` : 'Raio de busca';

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all duration-150',
            hasLocation || radiusKm
              ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600',
            className
          )}
        >
          <MapPin className="w-3.5 h-3.5" />
          {currentLabel}
          <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4 rounded-2xl shadow-xl border-slate-200 dark:border-slate-800" align="start">
        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Localização e Raio
          </p>

          <div className="flex flex-col gap-2">
            <button
              onClick={handleUseGPS}
              disabled={loading || permissionDenied}
              className={cn(
                'flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all border',
                locationMode === 'gps' && !error
                  ? 'bg-blue-600 text-white border-blue-600'
                  : permissionDenied
                    ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
              )}
            >
              <div className="flex items-center gap-2">
                {loading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Navigation className="w-4 h-4" />
                )}
                Usar meu GPS local
              </div>
            </button>

            {cityName && (
              <button
                onClick={handleUseCity}
                className={cn(
                  'flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all border',
                  locationMode === 'city'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                )}
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Centro de {cityName}
                </div>
              </button>
            )}
          </div>

          {(error || permissionDenied) && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
              {permissionDenied ? 'Permissão de localização negada no navegador.' : error}
            </p>
          )}

          {hasLocation && !error && (
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Distância máxima:</span>
                <button onClick={handleClearLocation} className="text-xs text-red-500 font-semibold hover:underline">
                  Limpar local
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {RADIUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => onRadiusChange(opt.value)}
                    className={cn(
                      'px-2 py-2 rounded-lg text-xs font-semibold transition-all border',
                      radiusKm === opt.value
                        ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
