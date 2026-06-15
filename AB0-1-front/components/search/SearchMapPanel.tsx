'use client';

import dynamic from 'next/dynamic';
import { useState, useCallback } from 'react';
import { X, Map as MapIcon, RefreshCw } from 'lucide-react';
import type { MapCompany, MapBounds } from './MapProvider';

// Importação dinâmica do MapProvider (SSR incompatível com Leaflet)
const MapProvider = dynamic(() => import('./MapProvider'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Carregando mapa...</p>
      </div>
    </div>
  ),
});

interface SearchMapPanelProps {
  companies: MapCompany[];
  center?: { lat: number; lng: number };
  selectedCompanyId?: string;
  onCompanySelect?: (company: MapCompany) => void;
  onSearchInArea?: (bounds: MapBounds) => void;
  onClose?: () => void;
  isVisible?: boolean;
  className?: string;
}

export default function SearchMapPanel({
  companies,
  center,
  selectedCompanyId,
  onCompanySelect,
  onSearchInArea,
  onClose,
  isVisible = true,
  className = '',
}: SearchMapPanelProps) {
  const [currentBounds, setCurrentBounds] = useState<MapBounds | null>(null);
  const [searchOnMove, setSearchOnMove] = useState(false);
  const [boundsChanged, setBoundsChanged] = useState(false);

  const handleBoundsChanged = useCallback((bounds: MapBounds) => {
    setCurrentBounds(bounds);
    setBoundsChanged(true);
    if (searchOnMove) {
      onSearchInArea?.(bounds);
      setBoundsChanged(false);
    }
  }, [searchOnMove, onSearchInArea]);

  const handleSearchInArea = useCallback(() => {
    if (currentBounds) {
      onSearchInArea?.(currentBounds);
      setBoundsChanged(false);
    }
  }, [currentBounds, onSearchInArea]);

  const handleMarkerClick = useCallback((company: MapCompany) => {
    onCompanySelect?.(company);
  }, [onCompanySelect]);

  if (!isVisible) return null;

  const mapCompanies = companies.filter((c) => c.latitude != null && c.longitude != null);

  return (
    <div className={`relative flex flex-col bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-700/60 shadow-md ${className}`}>
      {/* Header do painel */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <MapIcon className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Mapa
          </span>
          {mapCompanies.length > 0 && (
            <span className="text-xs text-slate-400 font-medium">
              {mapCompanies.length} empresa{mapCompanies.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Checkbox: buscar enquanto move */}
          <label className="flex items-center gap-1.5 cursor-pointer" htmlFor="search-on-move-checkbox">
            <input
              id="search-on-move-checkbox"
              type="checkbox"
              checked={searchOnMove}
              onChange={(e) => setSearchOnMove(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-[11px] text-slate-500 dark:text-slate-400 select-none">
              Buscar ao mover
            </span>
          </label>
          {onClose && (
            <button
              id="map-panel-close-btn"
              onClick={onClose}
              aria-label="Fechar mapa"
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* Mapa */}
      <div className="flex-1 relative min-h-0">
        {mapCompanies.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-800/50">
            <div className="text-center px-6">
              <MapIcon className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Nenhuma empresa com localização nesta busca.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Busque por cidade ou use o filtro de raio.
              </p>
            </div>
          </div>
        ) : (
          <MapProvider
            companies={mapCompanies}
            center={center}
            zoom={center ? 11 : 6}
            onBoundsChanged={handleBoundsChanged}
            onMarkerClick={handleMarkerClick}
            selectedCompanyId={selectedCompanyId}
            className="w-full h-full"
          />
        )}

        {/* Botão "Buscar nesta área" — aparece quando mapa foi movido */}
        {boundsChanged && !searchOnMove && mapCompanies.length > 0 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000]">
            <button
              id="search-in-area-btn"
              onClick={handleSearchInArea}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700 hover:border-blue-300 hover:text-blue-700 transition-all duration-150"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Buscar nesta área
            </button>
          </div>
        )}
      </div>

      {/* Rodapé com créditos OSM */}
      <div className="px-3 py-1 border-t border-slate-100 dark:border-slate-800 flex-shrink-0">
        <p className="text-[10px] text-slate-400 dark:text-slate-600">
          Mapa © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="hover:underline">OpenStreetMap</a> contributors
        </p>
      </div>
    </div>
  );
}
