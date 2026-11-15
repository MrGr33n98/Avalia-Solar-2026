'use client';

import React from 'react';
import { SlidersHorizontal, MapPin, ShieldCheck, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CompanyFilters } from '@/components/filters/types';

interface MobileCompanyFilterBarProps {
  filters: CompanyFilters;
  onOpenFilters: () => void;
  onOpenLocation: () => void;
  onOpenCategory: () => void;
  onToggleVerified: () => void;
  categoryLabel?: string;
  locationLabel?: string;
  className?: string;
}

// Never truncate a location name in the chip. Use a meaningful state abbreviation
// whenever it is available; preserve the full selected location in its accessible name.
export function compactCompanyLocationLabel(label: string): string | null {
  const trimmed = label.trim();
  const state = trimmed.match(/(?:^|,\s*)([A-Z]{2})$/);
  return state ? state[1] : null;
}

const baseChipClass =
  'flex h-11 min-h-11 w-full min-w-0 items-center justify-center gap-1 rounded-full ' +
  'border px-0.5 text-[10px] font-semibold leading-none whitespace-nowrap touch-manipulation ' +
  'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ' +
  'focus-visible:ring-offset-1 min-[390px]:px-1 min-[390px]:text-[11px]';

export default function MobileCompanyFilterBar({
  filters,
  onOpenFilters,
  onOpenLocation,
  onOpenCategory,
  onToggleVerified,
  categoryLabel,
  locationLabel,
  className,
}: MobileCompanyFilterBarProps) {
  const activeGroupsCount = React.useMemo(() => {
    let count = 0;
    if (filters.lat !== null && filters.lng !== null) count += 1;
    else if (filters.state.length > 0 || filters.city.length > 0) count += 1;
    if (filters.category_ids.length > 0) count += 1;
    if (filters.verified) count += 1;
    if (filters.min_rating !== null) count += 1;
    if (filters.has_reviews) count += 1;
    if (filters.whatsapp_enabled || filters.financing_enabled) count += 1;
    return count;
  }, [filters]);

  const hasLocationActive =
    filters.lat !== null || filters.state.length > 0 || filters.city.length > 0;
  const hasCategoryActive = filters.category_ids.length > 0;

  const fullLocationLabel = locationLabel?.trim() || 'Perto de mim';
  const fullCategoryLabel = categoryLabel?.trim() || 'Categoria';
  const locationState = compactCompanyLocationLabel(fullLocationLabel);
  const isNearMe = fullLocationLabel === 'Perto de mim';
  const locationNarrowLabel = locationState || 'Local';
  const locationWideLabel = locationState || (isNearMe ? 'Perto' : 'Local');

  return (
    <div
      id="mobile-company-filter-bar"
      data-testid="mobile-company-filter-bar"
      className={cn(
        'grid w-full min-w-0 grid-cols-[minmax(0,1.25fr)_minmax(0,0.92fr)_minmax(0,1.04fr)_minmax(0,1.15fr)] ' +
        'items-center gap-1 border-b border-slate-100 bg-white px-1.5 py-1.5 select-none',
        className
      )}
    >
      <button
        type="button"
        onClick={onOpenFilters}
        className={cn(
          baseChipClass,
          activeGroupsCount > 0
            ? 'border-blue-600 bg-blue-600 font-bold text-white'
            : 'border-slate-200 bg-white font-bold text-slate-700 hover:border-slate-300'
        )}
      >
        <SlidersHorizontal className="h-3 w-3 shrink-0" aria-hidden="true" />
        <span>Filtros</span>
        {activeGroupsCount > 0 && (
          <span
            aria-label={String(activeGroupsCount) + ' filtros ativos'}
            className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-white px-0.5 text-[9px] font-extrabold text-blue-700"
          >
            {activeGroupsCount}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={onOpenLocation}
        aria-label={'Localização: ' + fullLocationLabel}
        title={fullLocationLabel}
        className={cn(
          baseChipClass,
          hasLocationActive
            ? 'border-blue-200 bg-blue-50 font-bold text-blue-700'
            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
        )}
      >
        <MapPin className="h-3 w-3 shrink-0 text-blue-600" aria-hidden="true" />
        <span data-testid="location-label-narrow" aria-hidden="true" className="min-[375px]:hidden">
          {locationNarrowLabel}
        </span>
        <span data-testid="location-label-wide" aria-hidden="true" className="hidden min-[375px]:inline">
          {locationWideLabel}
        </span>
        <ChevronDown className="h-2.5 w-2.5 shrink-0 opacity-60" aria-hidden="true" />
      </button>

      <button
        type="button"
        onClick={onOpenCategory}
        aria-label={'Categoria: ' + fullCategoryLabel}
        title={fullCategoryLabel}
        className={cn(
          baseChipClass,
          hasCategoryActive
            ? 'border-blue-200 bg-blue-50 font-bold text-blue-700'
            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
        )}
      >
        <span data-testid="category-label-narrow" aria-hidden="true" className="min-[390px]:hidden">Cat.</span>
        <span data-testid="category-label-wide" aria-hidden="true" className="hidden min-[390px]:inline">Categoria</span>
        <ChevronDown className="h-2.5 w-2.5 shrink-0 opacity-60" aria-hidden="true" />
      </button>

      <button
        type="button"
        aria-label="Verificadas"
        aria-pressed={filters.verified}
        onClick={onToggleVerified}
        className={cn(
          baseChipClass,
          filters.verified
            ? 'border-blue-200 bg-blue-50 font-bold text-blue-700'
            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
        )}
      >
        <ShieldCheck
          className={cn('h-3 w-3 shrink-0', filters.verified ? 'text-blue-700' : 'text-slate-400')}
          aria-hidden="true"
        />
        <span data-testid="verified-label-narrow" aria-hidden="true" className="min-[390px]:hidden">Verif.</span>
        <span data-testid="verified-label-wide" aria-hidden="true" className="hidden min-[390px]:inline">Verificadas</span>
      </button>
    </div>
  );
}
