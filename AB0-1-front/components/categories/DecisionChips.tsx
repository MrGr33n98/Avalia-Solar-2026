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

// Chips keep their intrinsic width: scrolling belongs only to the filters rail.
const triggerClass =
  'inline-flex h-11 min-h-11 w-max shrink-0 items-center whitespace-nowrap rounded-[10px] border px-3 text-[13px] font-semibold shadow-sm ' +
  'md:text-sm';
const triggerLabelClass = 'flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap';

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
    <section className="bg-white py-1.5 md:py-3">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
        <div className="mb-1.5 flex min-h-11 items-center justify-between gap-2 md:mb-2 md:min-h-0 md:gap-3">
          <h2 className="whitespace-nowrap text-[15px] font-bold tracking-tight text-slate-900 md:text-base">
            Filtros rápidos
          </h2>
          <button
            type="button"
            onClick={onClearFilters}
            disabled={!hasActiveFilters}
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap text-[11px] font-semibold text-slate-500 transition-colors enabled:hover:text-blue-700 disabled:opacity-60 md:min-h-0 md:text-xs"
          >
            Limpar filtros
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>

        {/* Single horizontal rail at every breakpoint; the page itself never scrolls sideways. */}
        <div
          role="region"
          aria-label="Filtros rápidos"
          tabIndex={0}
          data-testid="category-quick-filters"
          className="flex w-full min-w-0 flex-nowrap items-center gap-2 overflow-x-auto overscroll-x-contain px-0.5 pb-2 pt-1 touch-pan-x [scrollbar-width:thin] md:gap-2.5"
        >
          <Select
            value={filters.verified ? 'true' : 'false'}
            onValueChange={(val) => onFilterChange('verified', val === 'true')}
          >
            <SelectTrigger
              aria-label="Verificadas"
              className={`${triggerClass} ${
                filters.verified
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50/60'
              }`}
            >
              <div className={triggerLabelClass}>
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 md:h-4 md:w-4" aria-hidden="true" />
                <span className="whitespace-nowrap">Verificadas</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="false">Todas as empresas</SelectItem>
              <SelectItem value="true">Apenas Verificadas</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.minRating > 0 ? String(filters.minRating) : '0'}
            onValueChange={(val) => onFilterChange('minRating', Number(val))}
          >
            <SelectTrigger
              aria-label="Nota mínima"
              className={`${triggerClass} ${
                filters.minRating > 0
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50/60'
              }`}
            >
              <div className={triggerLabelClass}>
                <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400 md:h-4 md:w-4" aria-hidden="true" />
                <span className="whitespace-nowrap">
                  {filters.minRating > 0 ? `Nota: ${filters.minRating}+` : 'Nota'}
                </span>
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

          <Select
            value={filters.state || 'all'}
            onValueChange={(val) => onFilterChange('state', val === 'all' ? '' : val)}
          >
            <SelectTrigger
              aria-label="Meu Estado"
              className={`${triggerClass} ${
                filters.state
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50/60'
              }`}
            >
              <div className={triggerLabelClass}>
                <MapPin className="h-3.5 w-3.5 shrink-0 md:h-4 md:w-4" aria-hidden="true" />
                <span className="whitespace-nowrap">
                  {filters.state ? `Estado: ${filters.state}` : 'Estado'}
                </span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Qualquer Estado</SelectItem>
              {BRAZIL_STATES_OPTIONS.map(({ state, label }) => (
                <SelectItem key={state} value={state}>{label} ({state})</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.projectType || 'all'}
            onValueChange={(val) => onFilterChange('projectType', val === 'all' ? undefined : val)}
          >
            <SelectTrigger
              aria-label="Especialidade"
              title={filters.projectType || 'Especialidade'}
              className={`${triggerClass} ${
                filters.projectType
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50/60'
              }`}
            >
              <div className={triggerLabelClass}>
                <Building2 className="h-3.5 w-3.5 shrink-0 md:h-4 md:w-4" aria-hidden="true" />
                <span className="whitespace-nowrap">
                  {filters.projectType ? `Projeto: ${filters.projectType}` : 'Projeto'}
                </span>
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

          <button
            type="button"
            onClick={onOpenMoreFilters}
            aria-label={`Mais filtros${activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}`}
            aria-haspopup="dialog"
            aria-expanded={moreFiltersOpen}
            aria-controls="category-filters-panel"
            id="category-more-filters"
            className="relative inline-flex h-11 min-h-11 w-max shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-[10px] border border-slate-200 bg-white px-3 text-[13px] font-semibold text-slate-700 shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 md:text-sm"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-blue-600 md:h-4 md:w-4" aria-hidden="true" />
            <span className="whitespace-nowrap">Filtros</span>
            {activeFiltersCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-300 text-[9px] text-blue-900 md:static md:h-5 md:w-5 md:text-[10px]">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
