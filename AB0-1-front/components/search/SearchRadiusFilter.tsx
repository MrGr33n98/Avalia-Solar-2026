'use client';

import { useState, useEffect } from 'react';
import { MapPin, Navigation, ChevronDown } from 'lucide-react';
import { useGeoLocation } from '@/hooks/useGeoLocation';

interface SearchRadiusFilterProps {
  radiusKm: number | null;
  onRadiusChange: (radius: number | null) => void;
  onCoordsChange: (coords: { lat: number; lng: number } | null) => void;
  cityName?: string;
  /** Coordenadas do centro da cidade selecionada (fallback de localização) */
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
      onRadiusChange(50); // Padrão ao usar cidade
    }
  };

  const handleClearLocation = () => {
    clearLocation();
    setLocationMode(null);
    onCoordsChange(null);
    onRadiusChange(null);
  };

  // Propaga coords GPS quando obtidas
  useEffect(() => {
    if (coords && locationMode === 'gps') {
      onCoordsChange(coords);
    }
  }, [coords, locationMode, onCoordsChange]);

  const activeCoords = locationMode === 'gps' ? coords : (locationMode === 'city' ? cityCenterCoords : null);
  const hasLocation = !!activeCoords;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Label da seção */}
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
        Raio
      </p>

      {/* Botões de origem */}
      <div className="flex gap-2">
        <button
          id="geo-use-gps-btn"
          onClick={handleUseGPS}
          disabled={loading || permissionDenied}
          title={permissionDenied ? 'Permissão de localização negada' : 'Usar minha localização GPS'}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 border
            ${locationMode === 'gps' && !error
              ? 'bg-blue-600 text-white border-blue-600'
              : permissionDenied
                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:text-blue-600'
            }`}
        >
          {loading ? (
            <div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Navigation className="w-3 h-3" />
          )}
          Minha localização
        </button>

        {cityName && (
          <button
            id="geo-use-city-btn"
            onClick={handleUseCity}
            title={`Usar centro de ${cityName}`}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 border
              ${locationMode === 'city'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400 hover:text-emerald-600'
              }`}
          >
            <MapPin className="w-3 h-3" />
            {cityName}
          </button>
        )}
      </div>

      {/* Mensagem de erro/permissão */}
      {(error || permissionDenied) && (
        <p className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1.5 rounded-lg">
          {permissionDenied
            ? 'Permissão negada. Use a cidade como referência.'
            : error}
        </p>
      )}

      {/* Status de localização ativa */}
      {hasLocation && !error && (
        <div className="flex items-center justify-between px-2.5 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <span className="text-[11px] text-blue-700 dark:text-blue-300 font-medium flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {locationMode === 'gps' ? 'Localização GPS ativa' : `Centro de ${cityName}`}
          </span>
          <button
            id="geo-clear-location-btn"
            onClick={handleClearLocation}
            className="text-[11px] text-blue-500 hover:text-red-500 font-semibold transition-colors"
          >
            Limpar
          </button>
        </div>
      )}

      {/* Seletor de raio — só aparece quando tem localização ativa */}
      {hasLocation && (
        <div className="relative">
          <select
            id="geo-radius-select"
            value={radiusKm ?? ''}
            onChange={(e) => onRadiusChange(e.target.value ? Number(e.target.value) : null)}
            className="w-full appearance-none pl-3 pr-8 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all outline-none"
          >
            {RADIUS_OPTIONS.map((opt) => (
              <option key={opt.label} value={opt.value ?? ''}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      )}
    </div>
  );
}
