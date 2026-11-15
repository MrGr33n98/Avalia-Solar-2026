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
  // Contagem de grupos de filtros ativos de acordo com a regra de negócios
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

  return (
    <div
      className={cn(
        'grid w-full grid-cols-[minmax(0,1.05fr)_minmax(0,0.8fr)_minmax(0,0.95fr)_minmax(0,1.1fr)] items-center gap-1 border-b border-slate-100 bg-white px-1.5 py-1.5 select-none sm:px-2',
        className
      )}
      data-testid="mobile-company-filter-bar"
    >
      {/* Botão Principal: Filtros com Contador */}
      <button
        type="button"
        onClick={onOpenFilters}
        className={cn(
          'relative flex h-9 w-full min-w-0 items-center justify-center gap-1 rounded-full border px-1 text-[9px] font-bold transition-all touch-manipulation min-[350px]:text-[10px] min-[375px]:gap-1.5 min-[375px]:px-2 min-[375px]:text-[11px] after:absolute after:-inset-y-1 after:inset-x-0 after:content-[""]',
          activeGroupsCount > 0
            ? 'bg-blue-600 border-blue-600 text-white'
            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
        )}
      >
        <SlidersHorizontal className="h-3 w-3 shrink-0" />
        <span>Filtros</span>
        {activeGroupsCount > 0 && (
          <span
            className={cn(
              'flex h-4 min-w-4 items-center justify-center rounded-full text-[9px] px-1 font-extrabold',
              activeGroupsCount > 0 ? 'bg-white text-blue-700' : 'bg-slate-200 text-slate-700'
            )}
          >
            {activeGroupsCount}
          </span>
        )}
      </button>

      {/* Botão: Perto de mim */}
      <button
        type="button"
        onClick={onOpenLocation}
        className={cn(
          'relative flex h-9 w-full min-w-0 items-center justify-center gap-1 rounded-full border px-1 text-[9px] font-semibold transition-all touch-manipulation min-[350px]:text-[10px] min-[375px]:gap-1.5 min-[375px]:px-2 min-[375px]:text-[11px] after:absolute after:-inset-y-1 after:inset-x-0 after:content-[""]',
          hasLocationActive
            ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold'
            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
        )}
      >
        <MapPin className="h-3 w-3 shrink-0 text-blue-600" />
        <span className="min-w-0 truncate" title={locationLabel || 'Perto de mim'}>{locationLabel || 'Perto de mim'}</span>
        <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
      </button>

      {/* Botão: Categoria */}
      <button
        type="button"
        onClick={onOpenCategory}
        className={cn(
          'relative flex h-9 w-full min-w-0 items-center justify-center gap-1 rounded-full border px-1 text-[9px] font-semibold transition-all touch-manipulation min-[350px]:text-[10px] min-[375px]:gap-1.5 min-[375px]:px-2 min-[375px]:text-[11px] after:absolute after:-inset-y-1 after:inset-x-0 after:content-[""]',
          hasCategoryActive
            ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold'
            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
        )}
      >
        <span className="min-w-0 truncate" title={categoryLabel || 'Categoria'}>{categoryLabel || 'Categoria'}</span>
        <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
      </button>

      {/* Botão: Verificadas (Toggle Direto) */}
      <button
        type="button"
        aria-pressed={filters.verified}
        onClick={onToggleVerified}
        className={cn(
          'relative flex h-9 w-full min-w-0 items-center justify-center gap-1 rounded-full border px-1 text-[9px] font-semibold transition-all touch-manipulation min-[350px]:text-[10px] min-[375px]:gap-1.5 min-[375px]:px-2 min-[375px]:text-[11px] after:absolute after:-inset-y-1 after:inset-x-0 after:content-[""]',
          filters.verified
            ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold'
            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
        )}
      >
        <ShieldCheck
          className={cn('h-3 w-3 shrink-0', filters.verified ? 'text-blue-700' : 'text-slate-400')}
        />
        <span className="min-w-0 truncate">Verificadas</span>
      </button>
    </div>
  );
}
