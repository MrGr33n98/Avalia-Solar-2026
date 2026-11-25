'use client';

import React, { useEffect, useMemo } from 'react';
import {
  MapPin,
  Building2,
  SlidersHorizontal,
  Navigation,
  X,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { BRAZIL_STATES_OPTIONS } from '@/lib/company-options';
import { useCompanyLocationData } from '@/hooks/useCompanyLocationData';
import { cn } from '@/lib/utils';
import type { CompanyFilters } from '@/components/filters/types';

interface TabletCompanyLocationFiltersProps {
  filters: CompanyFilters;
  onStateChange: (state: string) => void;
  onCityChange: (city: string) => void;
  onClearLocation: () => void;
  onOpenNearMe: () => void;
  onOpenFullFilters: () => void;
  activeFiltersCount?: number;
  detectingLocation?: boolean;
  className?: string;
}

export default function TabletCompanyLocationFilters({
  filters,
  onStateChange,
  onCityChange,
  onClearLocation,
  onOpenNearMe,
  onOpenFullFilters,
  activeFiltersCount = 0,
  detectingLocation = false,
  className,
}: TabletCompanyLocationFiltersProps) {
  const activeState = filters.state[0] || '';
  const activeCity = filters.city[0] || '';
  const isGpsActive = filters.lat !== null && filters.lng !== null;
  const { cities, fetchCities, loadingCities, citiesStale, citiesError } =
    useCompanyLocationData(activeState);

  useEffect(() => {
    if (activeState) {
      fetchCities(activeState);
    }
  }, [activeState, fetchCities]);

  const stateOptions = useMemo(() => {
    return BRAZIL_STATES_OPTIONS.map((opt) => ({
      value: opt.state,
      label: `${opt.state} - ${opt.label}`,
    })).sort((a, b) => a.label.localeCompare(b.label));
  }, []);

  const cityOptions = useMemo(() => {
    if (!activeState || cities.length === 0) return [];
    return [...cities].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [activeState, cities]);

  const hasLocationActive = Boolean(activeState || activeCity || isGpsActive);

  const locationSubtitle = useMemo(() => {
    if (isGpsActive) {
      return 'Empresas no raio de 50km da sua localização GPS';
    }
    if (activeState && activeCity) {
      return `Empresas em ${activeCity}, ${activeState}`;
    }
    if (activeState) {
      const stateName =
        BRAZIL_STATES_OPTIONS.find((s) => s.state === activeState)?.label || activeState;
      return `Empresas no estado de ${stateName}`;
    }
    return 'Filtre empresas por estado e cidade em todo o Brasil';
  }, [activeState, activeCity, isGpsActive]);

  return (
    <div
      className={cn(
        'w-full bg-white rounded-2xl border border-slate-200/90 shadow-sm p-3.5 md:p-4 my-2 transition-all',
        hasLocationActive && 'border-blue-200 bg-blue-50/20',
        className
      )}
      data-testid="tablet-company-location-filters"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100/70 text-blue-700">
            <MapPin className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs md:text-sm font-bold text-slate-900 tracking-tight">
              Localização (Estado e Cidade)
            </h3>
            <p className="text-[11px] text-slate-500">{locationSubtitle}</p>
          </div>
        </div>

        {hasLocationActive && (
          <button
            type="button"
            onClick={onClearLocation}
            className="inline-flex items-center gap-1 text-[11px] md:text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline px-2 py-1 rounded-md transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            <span>Limpar local</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-2.5 items-center">
        {/* Seletor de Estado */}
        <div className="relative md:col-span-4 min-w-0">
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <MapPin className="h-4 w-4 text-blue-600" />
          </div>
          <select
            id="tablet-filter-state"
            aria-label="Filtrar por estado"
            value={activeState}
            onChange={(e) => onStateChange(e.target.value)}
            className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-8 text-xs md:text-sm font-semibold text-slate-700 hover:border-slate-300 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
          >
            <option value="">Todos os Estados</option>
            {stateOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        </div>

        {/* Seletor de Cidade */}
        <div className="relative md:col-span-4 min-w-0">
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Building2 className="h-4 w-4 text-slate-500" />
          </div>
          <select
            id="tablet-filter-city"
            aria-label="Filtrar por cidade"
            value={activeCity}
            onChange={(e) => onCityChange(e.target.value)}
            disabled={!activeState || loadingCities}
            className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-8 text-xs md:text-sm font-semibold text-slate-700 hover:border-slate-300 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {!activeState ? (
              <option value="">Selecione o estado...</option>
            ) : loadingCities ? (
              <option value="">Carregando cidades...</option>
            ) : citiesError ? (
              <option value="">Cidades indisponíveis</option>
            ) : cities.length === 0 ? (
              <option value="">Nenhuma cidade encontrada</option>
            ) : (
              <>
                <option value="">Todas as Cidades</option>
                {cityOptions.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </>
            )}
          </select>
          {loadingCities ? (
            <Loader2 className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-blue-500" />
          ) : (
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          )}
          {citiesError && activeState && (
            <div className="mt-1 flex items-center justify-between gap-2 text-xs text-red-700" role="alert">
              <span>Não foi possível carregar as cidades.</span>
              <button
                type="button"
                className="shrink-0 underline underline-offset-2"
                onClick={() => void fetchCities(activeState, true)}
              >
                Tentar novamente
              </button>
            </div>
          )}
          {citiesStale && !citiesError && (
            <p className="mt-1 text-[11px] text-amber-700" role="status">
              Lista salva localmente; pode estar desatualizada.
            </p>
          )}
        </div>

        {/* Botão Perto de mim (GPS) */}
        <div className="md:col-span-2">
          <button
            type="button"
            onClick={onOpenNearMe}
            disabled={detectingLocation}
            className={cn(
              'h-10 w-full px-3 rounded-xl border text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm shrink-0 whitespace-nowrap',
              isGpsActive
                ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700'
            )}
          >
            <Navigation
              className={cn(
                'h-3.5 w-3.5 text-blue-600',
                isGpsActive && 'text-white',
                detectingLocation && 'animate-spin'
              )}
            />
            <span>{detectingLocation ? 'Buscando...' : 'Perto de mim'}</span>
          </button>
        </div>

        {/* Botão Mais Filtros */}
        <div className="md:col-span-2">
          <button
            type="button"
            onClick={onOpenFullFilters}
            className={cn(
              'h-10 w-full px-3 rounded-xl border text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm shrink-0 whitespace-nowrap',
              activeFiltersCount > 0
                ? 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Filtros</span>
            {activeFiltersCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white px-1">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
