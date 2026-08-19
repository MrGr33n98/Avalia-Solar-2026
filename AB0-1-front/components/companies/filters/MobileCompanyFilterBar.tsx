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
  className?: string;
}

export default function MobileCompanyFilterBar({
  filters,
  onOpenFilters,
  onOpenLocation,
  onOpenCategory,
  onToggleVerified,
  categoryLabel,
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

  const hasLocationActive = filters.lat !== null || filters.state.length > 0 || filters.city.length > 0;
  const hasCategoryActive = filters.category_ids.length > 0;

  return (
    <div
      className={cn(
        'w-full bg-white border-b border-slate-100 flex items-center justify-start gap-2 px-4 py-2 overflow-x-auto select-none no-scrollbar snap-x snap-mandatory',
        className
      )}
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {/* Botão Principal: Filtros com Contador */}
      <button
        type="button"
        onClick={onOpenFilters}
        className={cn(
          'flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full px-4 text-xs font-bold transition-all border snap-start',
          activeGroupsCount > 0
            ? 'bg-blue-600 border-blue-600 text-white'
            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
        )}
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
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
          'flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition-all border snap-start',
          hasLocationActive
            ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold'
            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
        )}
      >
        <MapPin className="h-3.5 w-3.5 text-blue-600" />
        <span>Perto de mim</span>
        <ChevronDown className="h-3 w-3 opacity-60" />
      </button>

      {/* Botão: Categoria */}
      <button
        type="button"
        onClick={onOpenCategory}
        className={cn(
          'flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition-all border snap-start',
          hasCategoryActive
            ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold'
            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
        )}
      >
        <span className="max-w-[130px] truncate">{categoryLabel || 'Categoria'}</span>
        <ChevronDown className="h-3 w-3 opacity-60" />
      </button>

      {/* Botão: Verificadas (Toggle Direto) */}
      <button
        type="button"
        onClick={onToggleVerified}
        className={cn(
          'flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition-all border snap-start',
          filters.verified
            ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold'
            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
        )}
      >
        <ShieldCheck className={cn('h-3.5 w-3.5', filters.verified ? 'text-blue-700' : 'text-slate-400')} />
        <span>Verificadas</span>
      </button>
    </div>
  );
}
