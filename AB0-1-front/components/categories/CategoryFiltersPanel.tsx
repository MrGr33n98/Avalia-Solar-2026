'use client';

import { useEffect, useRef } from 'react';
import { Building2, MapPin, ShieldCheck, SlidersHorizontal, Star } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { BRAZIL_STATES_OPTIONS } from '@/lib/company-options';
import { cn } from '@/lib/utils';

export interface CategoryFilters {
  verified: boolean;
  minRating: number;
  state: string;
  projectType?: string;
}

export type CategoryFilterValue = string | number | boolean | undefined;

interface CategoryFiltersPanelProps {
  open: boolean;
  filters: CategoryFilters;
  resultCount?: number;
  onChange: (key: keyof CategoryFilters, value: CategoryFilterValue) => void;
  onApply?: () => void;
  onClear: () => void;
  onClose: () => void;
}

const PROJECT_TYPES = ['Residencial', 'Comercial', 'Industrial', 'Agronegócio'];
const RATINGS = [0, 4, 4.5, 5];

function formatRating(rating: number) {
  if (rating === 0) return 'Qualquer';
  return rating === 5 ? '5' : `${rating}+`;
}

export default function CategoryFiltersPanel({
  open,
  filters,
  resultCount,
  onChange,
  onApply,
  onClear,
  onClose,
}: CategoryFiltersPanelProps) {
  const wasOpen = useRef(open);

  useEffect(() => {
    if (!open && wasOpen.current) {
      document.getElementById('category-more-filters')?.focus();
    }
    wasOpen.current = open;
    if (!open) return undefined;

  }, [open]);

  const activeFiltersCount = [
    filters.verified,
    filters.minRating > 0,
    Boolean(filters.state),
    Boolean(filters.projectType),
  ].filter(Boolean).length;

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <SheetContent
        id="category-filters-panel"
        aria-label="Filtros da categoria"
        side="right"
        overlayClassName="bg-slate-950/40"
        className={cn(
          'top-auto bottom-0 left-0 right-0 flex h-auto max-h-[92dvh] w-full max-w-none flex-col gap-0 overflow-hidden rounded-t-3xl border-x-0 border-b-0 border-t border-slate-200 bg-white p-0 shadow-2xl',
          'data-[state=open]:duration-250 data-[state=closed]:duration-200',
          'data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom',
          'lg:inset-y-0 lg:right-0 lg:h-full lg:max-h-none lg:w-[min(440px,100vw)] lg:max-w-[440px] lg:rounded-none lg:border-b-0 lg:border-l lg:border-t-0',
          'lg:data-[state=open]:slide-in-from-right lg:data-[state=closed]:slide-out-to-right'
        )}
      >
        <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-slate-200 lg:hidden" aria-hidden="true" />

        <SheetHeader className="sticky top-0 z-10 border-b border-slate-100 bg-white px-5 pb-4 pt-4 text-left lg:px-6 lg:pb-5 lg:pt-6">
          <div className="flex items-start gap-3 pr-8">
            <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 lg:flex">
              <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <SheetTitle className="text-xl font-black tracking-tight text-slate-950">
                Filtrar empresas
              </SheetTitle>
              <SheetDescription className="mt-1 text-sm leading-5 text-slate-500">
                Encontre as melhores opções para seu projeto.
              </SheetDescription>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-slate-600">
              {activeFiltersCount === 0
                ? 'Nenhum filtro ativo'
                : `${activeFiltersCount} ${activeFiltersCount === 1 ? 'filtro ativo' : 'filtros ativos'}`}
            </span>
            <button
              type="button"
              onClick={onClear}
              disabled={activeFiltersCount === 0}
              className="min-h-11 rounded-lg px-2 text-sm font-bold text-blue-700 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              Limpar tudo
            </button>
          </div>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-7 px-5 py-6 lg:px-6">
            <section aria-labelledby="filters-location-title" className="space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-slate-400" aria-hidden="true" />
                <h3 id="filters-location-title" className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  Localização
                </h3>
              </div>
              <label className="block space-y-2 text-sm font-semibold text-slate-800" htmlFor="category-filter-state">
                Estado
                <select
                  id="category-filter-state"
                  aria-label="Selecionar estado"
                  value={filters.state}
                  onChange={(event) => onChange('state', event.target.value)}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Qualquer estado</option>
                  {BRAZIL_STATES_OPTIONS.map(({ state, label }) => (
                    <option key={state} value={state}>
                      {label} ({state})
                    </option>
                  ))}
                </select>
              </label>
            </section>

            <Separator />

            <section aria-labelledby="filters-rating-title" className="space-y-4">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
                <h3 id="filters-rating-title" className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  Avaliação
                </h3>
              </div>
              <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Avaliação mínima">
                {RATINGS.map((rating) => {
                  const selected = filters.minRating === rating;
                  return (
                    <button
                      key={rating}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => onChange('minRating', rating)}
                      className={cn(
                        'min-h-11 rounded-xl border px-2 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2',
                        selected
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50/60'
                      )}
                    >
                      {formatRating(rating)}{rating > 0 && <span aria-hidden="true">★</span>}
                    </button>
                  );
                })}
              </div>
            </section>

            <Separator />

            <section aria-labelledby="filters-project-title" className="space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-slate-400" aria-hidden="true" />
                <h3 id="filters-project-title" className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  Tipo de projeto
                </h3>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {PROJECT_TYPES.map((type) => {
                  const selected = filters.projectType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => onChange('projectType', selected ? undefined : type)}
                      className={cn(
                        'min-h-11 rounded-xl border px-3 text-left text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2',
                        selected
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50/60'
                      )}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </section>

            <Separator />

            <section aria-labelledby="filters-trust-title" className="space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-slate-400" aria-hidden="true" />
                <h3 id="filters-trust-title" className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  Confiança
                </h3>
              </div>
              <label
                htmlFor="category-filter-verified"
                className="flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-800 transition hover:border-blue-200 hover:bg-blue-50/40"
              >
                <span>Somente empresas verificadas</span>
                <Checkbox
                  id="category-filter-verified"
                  checked={filters.verified}
                  onCheckedChange={(checked) => onChange('verified', checked === true)}
                  className="h-5 w-5 border-slate-300 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
                />
              </label>
            </section>
          </div>
        </ScrollArea>

        <SheetFooter className="sticky bottom-0 border-t border-slate-200 bg-white px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] lg:px-6">
          <button
            type="button"
            onClick={onApply || onClose}
            className="min-h-12 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            Ver {resultCount ?? 0} {resultCount === 1 ? 'empresa' : 'empresas'}
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
