'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ChevronDown, ChevronUp, SlidersHorizontal, X } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useStatesOptions } from './hooks';
import { useCategoriesTree } from '@/hooks/useCategoriesTree';
import { CompanyFilters, DEFAULT_FILTERS } from './types';
import { areFiltersEqual, parseQueryParams, stringifyQueryParams, isFilterActive } from './query';
import {
  buildCompaniesCategoriesPath,
  COMPANIES_PATH,
  extractCategoryIdsFromPath,
  extractCategorySlugByIdFromPath,
  isCompaniesCategoriesPath,
} from '@/lib/seo/companies-category-url';

// ─── Seção colapsável ────────────────────────────────────────────────────────
function FilterSection({
  label,
  children,
  defaultOpen = false,
  badge,
}: {
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-slate-200">
      <button
        type="button"
        className="flex w-full items-center justify-between px-5 py-4 text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-800">{label}</span>
          {badge && badge > 0 ? (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">
              {badge}
            </span>
          ) : null}
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        )}
      </button>
      {open && <div className="pb-4 px-5">{children}</div>}
    </div>
  );
}

// ─── Localização: grid de siglas com dados reais ─────────────────────────────
function LocationSection({
  selectedStates,
  onStatesChange,
}: {
  selectedStates: string[];
  onStatesChange: (states: string[]) => void;
}) {
  const { states, loading } = useStatesOptions();

  const toggle = (s: string) => {
    onStatesChange(
      selectedStates.includes(s) ? selectedStates.filter((x) => x !== s) : [...selectedStates, s]
    );
  };

  return (
    <FilterSection label="Localização" defaultOpen={true} badge={selectedStates.length}>
      <div className="space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Estados</p>
        {loading ? (
          <div className="grid grid-cols-5 gap-1.5">
            {Array.from({ length: 15 }).map((_, i) => (
              <Skeleton key={i} className="h-8 rounded" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-1.5">
            {states.map((item) => {
              const active = selectedStates.includes(item.state);
              return (
                <button
                  key={item.state}
                  type="button"
                  onClick={() => toggle(item.state)}
                  className={`flex h-8 items-center justify-center rounded text-[11px] font-bold transition-colors border ${
                    active
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  {item.state}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </FilterSection>
  );
}

// ─── Categorias com checkboxes e contadores reais ────────────────────────────
function CategoriesSection({
  selectedIds,
  onChange,
}: {
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}) {
  const { categories, loading } = useCategoriesTree();

  const toggle = (id: number) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((i) => i !== id) : [...selectedIds, id]);
  };

  return (
    <FilterSection label="Categorias" defaultOpen={true} badge={selectedIds.length}>
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-full rounded" />
          ))}
        </div>
      ) : (
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
          {categories.map((root) => (
            <div key={root.id} className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 py-1">
                {root.name}
              </p>
              {root.children.map((child) => (
                <div
                  key={child.id}
                  className="flex cursor-pointer items-center justify-between py-1 group"
                  onClick={() => toggle(child.id)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Checkbox
                      id={`cat-${child.id}`}
                      checked={selectedIds.includes(child.id)}
                      onCheckedChange={() => toggle(child.id)}
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 shrink-0"
                    />
                    <label
                      htmlFor={`cat-${child.id}`}
                      className="text-[13px] text-slate-600 group-hover:text-blue-700 cursor-pointer transition-colors leading-tight"
                    >
                      {child.name}
                    </label>
                  </div>
                  {child.companies_count > 0 && (
                    <span className="ml-2 shrink-0 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                      {child.companies_count}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </FilterSection>
  );
}

// ─── Qualidade e facilidades com toggles ─────────────────────────────────────
function QualitySection({
  verified,
  featured,
  financing,
  whatsapp,
  onChange,
}: {
  verified: boolean;
  featured: boolean;
  financing: boolean;
  whatsapp: boolean;
  onChange: (key: 'verified' | 'featured' | 'financing_enabled' | 'whatsapp_enabled', val: boolean) => void;
}) {
  const items = [
    { key: 'verified' as const, label: 'Apenas verificadas', description: 'Empresas com selo de confiança', value: verified },
    { key: 'featured' as const, label: 'Destaques', description: 'Empresas em evidência', value: featured },
    { key: 'financing_enabled' as const, label: 'Financiamento', description: 'Oferecem opções de crédito', value: financing },
    { key: 'whatsapp_enabled' as const, label: 'WhatsApp', description: 'Atendimento via chat', value: whatsapp },
  ];

  return (
    <FilterSection label="Qualidade e facilidades" defaultOpen={true}>
      <div className="space-y-0 -mx-5 px-5">
        {items.map((item) => (
          <div
            key={item.key}
            className="flex cursor-pointer items-center justify-between py-3 border-b border-slate-100 last:border-0"
            onClick={() => onChange(item.key, !item.value)}
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-slate-800">{item.label}</span>
              <span className="text-xs text-slate-400">{item.description}</span>
            </div>
            <Switch
              checked={item.value}
              onCheckedChange={(val) => onChange(item.key, val)}
              className="data-[state=checked]:bg-blue-600"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ))}
      </div>
    </FilterSection>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────
export const FilterSidebar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();
  const pathCategoryIds = useMemo(() => extractCategoryIdsFromPath(pathname), [pathname]);
  const slugByIdFromPath = useMemo(() => extractCategorySlugByIdFromPath(pathname), [pathname]);

  const [filters, setFilters] = useState<CompanyFilters>(DEFAULT_FILTERS);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const parsedFilters = useMemo(
    () => parseQueryParams(new URLSearchParams(searchParamsKey), { pathCategoryIds }),
    [searchParamsKey, pathCategoryIds]
  );

  useEffect(() => {
    setFilters((current) => (areFiltersEqual(current, parsedFilters) ? current : parsedFilters));
  }, [parsedFilters]);

  const buildTargetUrl = useCallback(
    (nextFilters: CompanyFilters) => {
      const hasPathCategories = isCompaniesCategoriesPath(pathname);
      const sortedCategoryIds = [...nextFilters.category_ids].sort((a, b) => a - b);
      if (sortedCategoryIds.length > 0 && hasPathCategories) {
        const nextPath = buildCompaniesCategoriesPath(sortedCategoryIds, {}, slugByIdFromPath);
        const queryString = stringifyQueryParams(nextFilters, { omitCategoryIds: true });
        return `${nextPath}${queryString ? `?${queryString}` : ''}`;
      }
      const queryString = stringifyQueryParams(nextFilters);
      return `${COMPANIES_PATH}${queryString ? `?${queryString}` : ''}`;
    },
    [pathname, slugByIdFromPath]
  );

  const updateFilters = useCallback(
    (newFilters: Partial<CompanyFilters>) => {
      const updated = { ...filters, ...newFilters, page: 1 };
      setFilters(updated);
      router.replace(buildTargetUrl(updated), { scroll: false });
    },
    [filters, buildTargetUrl, router]
  );

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    router.replace(COMPANIES_PATH, { scroll: false });
    if (isMobileOpen) setIsMobileOpen(false);
  };

  const hasActiveFilters = isFilterActive(filters);
  const activeCount =
    filters.state.length +
    filters.city.length +
    filters.category_ids.length +
    (filters.verified ? 1 : 0) +
    (filters.featured ? 1 : 0) +
    (filters.financing_enabled ? 1 : 0) +
    (filters.whatsapp_enabled ? 1 : 0);

  const FilterContent = () => (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <h2 className="text-base font-bold text-slate-900">Filtros</h2>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
          >
            Limpar tudo
          </button>
        )}
      </div>

      {/* Seções */}
      <div className="flex-1 overflow-y-auto">
        <LocationSection
          selectedStates={filters.state}
          onStatesChange={(state) => updateFilters({ state })}
        />
        <CategoriesSection
          selectedIds={filters.category_ids}
          onChange={(ids) => updateFilters({ category_ids: ids })}
        />
        <QualitySection
          verified={filters.verified}
          featured={filters.featured}
          financing={filters.financing_enabled}
          whatsapp={filters.whatsapp_enabled}
          onChange={(key, val) => updateFilters({ [key]: val })}
        />
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 px-5 py-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-medium text-emerald-600">
            {hasActiveFilters
              ? `${activeCount} filtro${activeCount > 1 ? 's' : ''} ativo${activeCount > 1 ? 's' : ''}`
              : 'Busca sem restrições'}
          </span>
        </div>
        <Button
          className="h-11 w-full rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 shadow-none"
          onClick={() => { if (isMobileOpen) setIsMobileOpen(false); }}
        >
          Filtrar resultados
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="sticky top-[calc(88px+var(--safe-area-inset-top))] hidden h-[calc(100vh-120px-var(--safe-area-inset-top)-var(--safe-area-inset-bottom))] w-[300px] flex-col overflow-hidden border border-slate-200 bg-white rounded-xl shadow-sm lg:flex">
        <FilterContent />
      </aside>

      {/* Mobile Trigger & Sheet */}
      <div className="lg:hidden fixed bottom-[max(1.5rem,var(--safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-50">
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button
              data-testid="mobile-filters-trigger"
              className="h-12 gap-3 rounded-xl border border-blue-700 bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              <SlidersHorizontal size={18} />
              <span>Filtrar</span>
              {activeCount > 0 && (
                <span className="ml-1 flex h-5 w-5 items-center justify-center bg-white text-[10px] font-bold text-blue-700 rounded-full">
                  {activeCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="h-[92vh] rounded-t-2xl border-x-0 border-b-0 border-t border-slate-200 bg-white p-0 pb-[max(1.5rem,var(--safe-area-inset-bottom))] shadow-xl"
          >
            <SheetHeader className="flex flex-row items-center justify-between space-y-0 border-b border-slate-200 px-5 py-4">
              <SheetTitle className="text-base font-bold">Filtros</SheetTitle>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Fechar filtros"
                onClick={() => setIsMobileOpen(false)}
                className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50"
              >
                <X size={18} />
              </Button>
            </SheetHeader>
            <div className="h-full overflow-y-auto pb-32">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};
