'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { SlidersHorizontal, RotateCcw, X } from 'lucide-react';
import { Accordion } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { CategoryFilter } from './CategoryFilter';
import { LocationFilter } from './LocationFilter';
import { RatingFilter } from './RatingFilter';
import { QualityFilters } from './QualityFilters';
import { SortFilter } from './SortFilter';
import { ActiveFiltersSummary } from './ActiveFiltersSummary';
import { CompanyFilters, DEFAULT_FILTERS } from './types';
import { parseQueryParams, stringifyQueryParams, isFilterActive } from './query';
import {
  buildCompaniesCategoriesPath,
  COMPANIES_PATH,
  extractCategoryIdsFromPath,
  extractCategorySlugByIdFromPath,
  isCompaniesCategoriesPath,
} from '@/lib/seo/companies-category-url';

export const FilterSidebar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pathCategoryIds = useMemo(() => extractCategoryIdsFromPath(pathname), [pathname]);
  const slugByIdFromPath = useMemo(() => extractCategorySlugByIdFromPath(pathname), [pathname]);
  
  const [filters, setFilters] = useState<CompanyFilters>(DEFAULT_FILTERS);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Hydrate filters from URL on mount and searchParams change
  useEffect(() => {
    setFilters(parseQueryParams(searchParams, { pathCategoryIds }));
  }, [searchParams, pathCategoryIds]);

  const buildTargetUrl = useCallback((nextFilters: CompanyFilters) => {
    const hasPathCategories = isCompaniesCategoriesPath(pathname);
    const sortedCategoryIds = [...nextFilters.category_ids].sort((a, b) => a - b);

    if (sortedCategoryIds.length > 0 && hasPathCategories) {
      const nextPath = buildCompaniesCategoriesPath(sortedCategoryIds, {}, slugByIdFromPath);
      const queryString = stringifyQueryParams(nextFilters, { omitCategoryIds: true });
      return `${nextPath}${queryString ? `?${queryString}` : ''}`;
    }

    const queryString = stringifyQueryParams(nextFilters);
    return `${COMPANIES_PATH}${queryString ? `?${queryString}` : ''}`;
  }, [pathname, slugByIdFromPath]);

  const updateFilters = useCallback((newFilters: Partial<CompanyFilters>) => {
    const updated = { ...filters, ...newFilters, page: 1 }; // Reset page on filter change
    setFilters(updated);

    router.replace(buildTargetUrl(updated), { scroll: false });
  }, [filters, buildTargetUrl, router]);

  const removeFilter = (key: keyof CompanyFilters, value?: any) => {
    if (Array.isArray(filters[key])) {
      const currentArray = filters[key] as any[];
      updateFilters({ [key]: currentArray.filter(v => v !== value) });
    } else if (typeof filters[key] === 'boolean') {
      updateFilters({ [key]: false });
    } else {
      updateFilters({ [key]: DEFAULT_FILTERS[key] });
    }
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    router.replace(COMPANIES_PATH, { scroll: false });
    if (isMobileOpen) setIsMobileOpen(false);
  };

  const FilterContent = () => (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-3">
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-2 rounded-xl text-slate-900">
            <SlidersHorizontal size={20} strokeWidth={1.75} />
          </div>
          <h2 className="font-bold text-slate-900 tracking-tight text-lg">Filtros</h2>
        </div>
        
        {isFilterActive(filters) && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters}
            className="text-xs font-bold text-slate-400 hover:text-red-600 hover:bg-red-50 h-8 px-2 transition-colors gap-1.5 uppercase tracking-wider"
          >
            <RotateCcw size={14} />
            Limpar
          </Button>
        )}
      </div>

      {/* Active Filters Summary */}
      <ActiveFiltersSummary filters={filters} onRemove={removeFilter} />

      {/* Filters List */}
      <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-100">
        <Accordion type="multiple" defaultValue={['categories', 'location', 'sort']} className="space-y-1">
          <SortFilter 
            selectedSort={filters.sort}
            onChange={(sort) => updateFilters({ sort })}
          />

          <div className="h-px bg-slate-100 my-1 mx-3" />

          <LocationFilter 
            selectedStates={filters.state} 
            selectedCities={filters.city}
            onStatesChange={(state) => updateFilters({ state })} 
            onCitiesChange={(city) => updateFilters({ city })}
          />
          
          <div className="h-px bg-slate-100 my-1 mx-3" />

          <CategoryFilter 
            selectedIds={filters.category_ids} 
            onChange={(ids) => updateFilters({ category_ids: ids })} 
          />
          
          <div className="h-px bg-slate-100 my-1 mx-3" />
          
          <RatingFilter 
            selectedRating={filters.min_rating} 
            onChange={(rating) => updateFilters({ min_rating: rating })} 
          />
        </Accordion>

        <div className="mt-4 pb-6">
          <QualityFilters 
            verified={filters.verified}
            featured={filters.featured}
            financing={filters.financing_enabled}
            whatsapp={filters.whatsapp_enabled}
            onChange={(key, val) => {
              const filterKey = key === 'financing' ? 'financing_enabled' : 
                               key === 'whatsapp' ? 'whatsapp_enabled' : key;
              updateFilters({ [filterKey]: val });
            }}
          />
        </div>
      </div>

      {/* Footer (SaaS styling) */}
      <div className="mt-auto pt-4 border-t border-slate-100 px-3">
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
            Status da Busca
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">
              {isFilterActive(filters) ? 'Filtros aplicados' : 'Busca sem restrições'}
            </span>
            <div className={`h-2 w-2 rounded-full ${isFilterActive(filters) ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-slate-300'}`} />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-[300px] sticky top-[88px] h-[calc(100vh-120px)] bg-white border border-slate-200 rounded-xl p-3 overflow-hidden flex-col shadow-sm">
        <FilterContent />
      </aside>

      {/* Mobile Trigger & Sheet */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button className="rounded-full shadow-2xl bg-slate-900 hover:bg-slate-800 text-white px-8 h-14 gap-3 border-none text-base font-bold">
              <SlidersHorizontal size={20} />
              <span>Filtrar</span>
              {isFilterActive(filters) && (
                <span className="bg-blue-500 text-white text-[10px] w-6 h-6 rounded-full flex items-center justify-center font-bold border-2 border-slate-900 ml-1">
                  !
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[92vh] rounded-t-[32px] p-6 border-none shadow-2xl">
            <SheetHeader className="mb-6 flex flex-row items-center justify-between space-y-0">
              <SheetTitle className="text-2xl font-black tracking-tight">Filtros Avançados</SheetTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(false)} className="rounded-full bg-slate-100">
                <X size={20} />
              </Button>
            </SheetHeader>
            <div className="h-full pb-32 overflow-y-auto">
              <FilterContent />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent pt-12">
              <Button 
                className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-xl"
                onClick={() => setIsMobileOpen(false)}
              >
                Ver resultados
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};
