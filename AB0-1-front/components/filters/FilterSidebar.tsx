'use client';

import React, { useEffect, useState, useCallback } from 'react';
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
import { StateFilter } from './StateFilter';
import { RatingFilter } from './RatingFilter';
import { VerifiedToggle } from './VerifiedToggle';
import { CompanyFilters, DEFAULT_FILTERS } from './types';
import { parseQueryParams, stringifyQueryParams, isFilterActive } from './query';

export const FilterSidebar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [filters, setFilters] = useState<CompanyFilters>(DEFAULT_FILTERS);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Hydrate filters from URL on mount and searchParams change
  useEffect(() => {
    setFilters(parseQueryParams(searchParams));
  }, [searchParams]);

  const updateFilters = useCallback((newFilters: Partial<CompanyFilters>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    
    const queryString = stringifyQueryParams(updated);
    router.replace(`${pathname}${queryString ? `?${queryString}` : ''}`, { scroll: false });
  }, [filters, pathname, router]);

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    router.replace(pathname, { scroll: false });
    if (isMobileOpen) setIsMobileOpen(false);
  };

  const FilterContent = () => (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="bg-slate-900 text-white p-2 rounded-xl shadow-sm">
            <SlidersHorizontal size={18} strokeWidth={2} />
          </div>
          <h2 className="font-bold text-slate-900 tracking-tight">Filtros</h2>
        </div>
        
        {isFilterActive(filters) && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters}
            className="text-xs text-slate-500 hover:text-red-600 hover:bg-red-50 h-8 px-2 transition-colors gap-1.5"
          >
            <RotateCcw size={14} />
            Limpar
          </Button>
        )}
      </div>

      {/* Filters List */}
      <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-100">
        <Accordion type="multiple" defaultValue={['categories']} className="space-y-2">
          <CategoryFilter 
            selectedIds={filters.category_ids} 
            onChange={(ids) => updateFilters({ category_ids: ids })} 
          />
          
          <div className="h-px bg-slate-100 my-2 mx-3" />
          
          <StateFilter 
            selectedStates={filters.states} 
            onChange={(states) => updateFilters({ states })} 
          />
          
          <div className="h-px bg-slate-100 my-2 mx-3" />
          
          <RatingFilter 
            selectedRating={filters.min_rating} 
            onChange={(rating) => updateFilters({ min_rating: rating })} 
          />
        </Accordion>

        <div className="mt-6">
          <VerifiedToggle 
            verified={filters.verified} 
            onChange={(verified) => updateFilters({ verified })} 
          />
        </div>
      </div>

      {/* Footer (SaaS styling) */}
      <div className="mt-auto pt-6 border-t border-slate-100">
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mb-1">
            Status da Busca
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">
              {isFilterActive(filters) ? 'Filtros ativos' : 'Mostrando tudo'}
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
      <aside className="hidden lg:block w-[280px] sticky top-[88px] h-[calc(100vh-120px)] bg-white border-r border-slate-200 p-4 overflow-hidden flex flex-col">
        <FilterContent />
      </aside>

      {/* Mobile Trigger & Sheet */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button className="rounded-full shadow-xl bg-slate-900 hover:bg-slate-800 text-white px-6 h-12 gap-2 border-none">
              <SlidersHorizontal size={18} />
              <span>Filtrar</span>
              {isFilterActive(filters) && (
                <span className="bg-blue-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold border-2 border-slate-900">
                  !
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[90vh] rounded-t-[32px] p-6 border-none">
            <SheetHeader className="mb-6 flex flex-row items-center justify-between space-y-0">
              <SheetTitle className="text-xl font-bold">Filtros Avançados</SheetTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(false)} className="rounded-full">
                <X size={20} />
              </Button>
            </SheetHeader>
            <div className="h-full pb-20 overflow-y-auto">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};
