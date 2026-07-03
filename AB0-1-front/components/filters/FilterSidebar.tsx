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
import SearchRadiusFilter from '@/components/search/SearchRadiusFilter';
import { RatingFilter } from './RatingFilter';
import { QualityFilters } from './QualityFilters';
import { SortFilter } from './SortFilter';
import { ActiveFiltersSummary } from './ActiveFiltersSummary';
import { FilterIconBox, SearchStatusCard } from './FilterPrimitives';
import { CompanyFilters, DEFAULT_FILTERS } from './types';
import { areFiltersEqual, parseQueryParams, stringifyQueryParams, isFilterActive } from './query';
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
  const searchParamsKey = searchParams.toString();
  const pathCategoryIds = useMemo(() => extractCategoryIdsFromPath(pathname), [pathname]);
  const slugByIdFromPath = useMemo(() => extractCategorySlugByIdFromPath(pathname), [pathname]);
  
  const [filters, setFilters] = useState<CompanyFilters>(DEFAULT_FILTERS);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const parsedFilters = useMemo(
    () => parseQueryParams(new URLSearchParams(searchParamsKey), { pathCategoryIds }),
    [searchParamsKey, pathCategoryIds]
  );

  // Hydrate filters from URL on mount and searchParams change
  useEffect(() => {
    setFilters((current) => (areFiltersEqual(current, parsedFilters) ? current : parsedFilters));
  }, [parsedFilters]);

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
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5">
        <div className="flex items-center gap-2">
          <FilterIconBox icon={SlidersHorizontal} />
          <h2 className="text-lg font-semibold tracking-tight text-slate-950">Filtros</h2>
        </div>
        
        {isFilterActive(filters) && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters}
            className="h-9 gap-1.5 rounded-none border border-transparent px-2 text-xs font-medium text-slate-500 hover:border-slate-200 hover:bg-slate-50 hover:text-red-600"
          >
            <RotateCcw size={14} />
            Limpar
          </Button>
        )}
      </div>

      {/* Active Filters Summary */}
      <ActiveFiltersSummary filters={filters} onRemove={removeFilter} />

      {/* Filters List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
        <Accordion type="multiple" defaultValue={['categories', 'location', 'sort']}>
          <SortFilter 
            selectedSort={filters.sort}
            onChange={(sort) => updateFilters({ sort })}
          />

          <LocationFilter 
            selectedStates={filters.state} 
            selectedCities={filters.city}
            onStatesChange={(state) => updateFilters({ state })} 
            onCitiesChange={(city) => updateFilters({ city })}
          />
          
          <div className="border-b border-slate-200 px-5 py-4">
            <SearchRadiusFilter 
              radiusKm={filters.radius_km}
              onRadiusChange={(radius) => updateFilters({ radius_km: radius })}
              onCoordsChange={(coords) => updateFilters({ lat: coords?.lat || null, lng: coords?.lng || null })}
              cityName={filters.city.length === 1 ? filters.city[0] : undefined}
            />
          </div>

          <CategoryFilter 
            selectedIds={filters.category_ids} 
            onChange={(ids) => updateFilters({ category_ids: ids })} 
          />
          
          <RatingFilter 
            selectedRating={filters.min_rating} 
            onChange={(rating) => updateFilters({ min_rating: rating })} 
          />
        </Accordion>

        <div>
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
      <div className="mt-auto border-t border-slate-200 p-5">
        <SearchStatusCard active={isFilterActive(filters)} />
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="sticky top-[calc(88px+var(--safe-area-inset-top))] hidden h-[calc(100vh-120px-var(--safe-area-inset-top)-var(--safe-area-inset-bottom))] w-[300px] flex-col overflow-hidden border border-slate-200 bg-white pb-[var(--safe-area-inset-bottom)] shadow-none rounded-none lg:flex">
        <FilterContent />
      </aside>

      {/* Mobile Trigger & Sheet */}
      <div className="lg:hidden fixed bottom-[max(1.5rem,var(--safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-50">
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button
              data-testid="mobile-filters-trigger"
              className="h-12 gap-3 rounded-none border border-blue-700 bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              <SlidersHorizontal size={20} />
              <span>Filtrar</span>
              {isFilterActive(filters) && (
                <span className="ml-1 flex h-5 w-5 items-center justify-center bg-white text-[10px] font-semibold text-blue-700 rounded-none">
                  !
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[92vh] rounded-none border-x-0 border-b-0 border-t border-slate-200 bg-white p-0 pb-[max(1.5rem,var(--safe-area-inset-bottom))] shadow-xl">
            <SheetHeader className="flex flex-row items-center justify-between space-y-0 border-b border-slate-200 px-5 py-4">
              <SheetTitle className="text-xl font-semibold tracking-tight">Filtros avançados</SheetTitle>
              <Button variant="ghost" size="icon" aria-label="Fechar filtros" onClick={() => setIsMobileOpen(false)} className="rounded-none border border-slate-200 bg-white hover:bg-slate-50">
                <X size={20} />
              </Button>
            </SheetHeader>
            <div className="h-full overflow-y-auto pb-28">
              <FilterContent />
            </div>
            <div
              data-testid="mobile-filters-sheet-footer"
              className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white px-5 py-4 pb-[max(1rem,var(--safe-area-inset-bottom))]"
            >
              <Button 
                className="h-12 w-full rounded-none bg-blue-600 text-sm font-semibold text-white shadow-none hover:bg-blue-700"
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
