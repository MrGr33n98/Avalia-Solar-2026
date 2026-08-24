'use client';

import { Building2, MapPin, RotateCcw, ShieldCheck, SlidersHorizontal, Star } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { BRAZIL_STATES_OPTIONS } from '@/lib/company-options';

interface DecisionChipsProps {
  filters: {
    verified: boolean;
    minRating: number;
    state: string;
    projectType?: string;
  };
  onFilterChange: (key: string, value: string | number | boolean | undefined) => void;
  onClearFilters?: () => void;
  hasActiveFilters?: boolean;
  onOpenMoreFilters?: () => void;
  activeFiltersCount?: number;
  moreFiltersOpen?: boolean;
}

export default function DecisionChips({
  filters,
  onFilterChange,
  onClearFilters,
  hasActiveFilters = false,
  onOpenMoreFilters,
  activeFiltersCount = 0,
  moreFiltersOpen = false,
}: DecisionChipsProps) {
  return (
    <section className="bg-white py-3">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="text-[11px] font-black uppercase tracking-wide text-slate-600 sm:text-xs">
            Filtros rápidos
          </h2>
          <button
            type="button"
            onClick={onClearFilters}
            disabled={!hasActiveFilters}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 transition-colors enabled:hover:text-blue-700 disabled:opacity-60 sm:text-xs"
          >
            Limpar filtros
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {/* Verificadas */}
          <Select 
            value={filters.verified ? 'true' : 'false'} 
            onValueChange={(val) => onFilterChange('verified', val === 'true')}
          >
            <SelectTrigger 
              className={`h-9 sm:h-11 rounded-lg px-2 sm:px-3 text-[10px] sm:text-xs font-bold w-auto shadow-sm border ${
                filters.verified ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50/60'
              }`}
            >
              <div className="flex items-center gap-1 sm:gap-1.5 mr-1">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                <span>Verificadas</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="false">Todas as empresas</SelectItem>
              <SelectItem value="true">Apenas Verificadas</SelectItem>
            </SelectContent>
          </Select>

          {/* Nota */}
          <Select 
            value={filters.minRating > 0 ? String(filters.minRating) : '0'} 
            onValueChange={(val) => onFilterChange('minRating', Number(val))}
          >
            <SelectTrigger 
              className={`h-9 sm:h-11 rounded-lg px-2 sm:px-3 text-[10px] sm:text-xs font-bold w-auto shadow-sm border ${
                filters.minRating > 0 ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50/60'
              }`}
            >
              <div className="flex items-center gap-1 sm:gap-1.5 mr-1">
                <Star className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4 fill-amber-400 text-amber-400" />
                <span>{filters.minRating > 0 ? `Nota: ${filters.minRating}+` : 'Qualquer Nota'}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Qualquer Nota</SelectItem>
              <SelectItem value="3">Nota: 3.0+</SelectItem>
              <SelectItem value="4">Nota: 4.0+</SelectItem>
              <SelectItem value="4.5">Nota: 4.5+</SelectItem>
              <SelectItem value="5">Nota: 5.0</SelectItem>
            </SelectContent>
          </Select>

          {/* Estado */}
          <Select 
            value={filters.state || 'all'} 
            onValueChange={(val) => onFilterChange('state', val === 'all' ? '' : val)}
          >
            <SelectTrigger 
              className={`h-9 sm:h-11 rounded-lg px-2 sm:px-3 text-[10px] sm:text-xs font-bold w-auto shadow-sm border ${
                filters.state ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50/60'
              }`}
            >
              <div className="flex items-center gap-1 sm:gap-1.5 mr-1">
                <MapPin className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                <span>{filters.state || 'Meu Estado'}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Qualquer Estado</SelectItem>
              {BRAZIL_STATES_OPTIONS.map(({ state, label }) => (
                <SelectItem key={state} value={state}>{label} ({state})</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Tipo de Projeto (Industrial/Residencial/etc) */}
          <Select 
            value={filters.projectType || 'all'} 
            onValueChange={(val) => onFilterChange('projectType', val === 'all' ? undefined : val)}
          >
            <SelectTrigger 
              className={`h-9 sm:h-11 rounded-lg px-2 sm:px-3 text-[10px] sm:text-xs font-bold w-auto shadow-sm border ${
                filters.projectType ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50/60'
              }`}
            >
              <div className="flex items-center gap-1 sm:gap-1.5 mr-1">
                <Building2 className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                <span>{filters.projectType || 'Especialidade'}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="Residencial">Residencial</SelectItem>
              <SelectItem value="Comercial">Comercial</SelectItem>
              <SelectItem value="Industrial">Industrial</SelectItem>
              <SelectItem value="Agronegócio">Agronegócio</SelectItem>
            </SelectContent>
          </Select>

          {/* Mais filtros Button */}
          <button
            type="button"
            onClick={onOpenMoreFilters}
            aria-haspopup="dialog"
            aria-expanded={moreFiltersOpen}
            aria-controls="category-filters-panel"
            id="category-more-filters"
            className="flex h-9 min-w-0 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2 text-[10px] font-bold text-slate-700 shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 sm:h-11 sm:gap-1.5 sm:px-3 sm:text-xs"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-blue-600 sm:h-4 sm:w-4" />
            <span>Mais filtros</span>
            {activeFiltersCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-300 text-[9px] text-blue-900 sm:h-5 sm:w-5 sm:text-[10px]">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
