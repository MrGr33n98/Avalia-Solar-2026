'use client';

import * as React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { MapPin, ChevronDown, Grid2X2, Heart, SlidersHorizontal } from 'lucide-react';
import { useLocation } from '@/contexts/LocationContext';
import { BRAZIL_STATES_OPTIONS } from '@/lib/company-options';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { DEFAULT_FILTERS } from '@/components/filters/types';
import { stringifyQueryParams } from '@/components/filters/query';

const MobileCompanyFiltersSheet = dynamic(
  () => import('@/components/companies/filters/MobileCompanyFiltersSheet'),
  { ssr: false }
);

interface HomeLocationBarProps {
  className?: string;
  defaultState?: string;
}

export function HomeLocationBar({ className }: HomeLocationBarProps) {
  const router = useRouter();
  const { selectedState, stateLabel, setState } = useLocation();
  const [isFiltersOpen, setIsFiltersOpen] = React.useState(false);

  const handleSelectState = (stateCode: string) => {
    setState(stateCode);
  };

  return (
    <>
      <div
        className={cn(
          'flex items-center justify-between gap-2 border-y border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 select-none sm:px-4',
          className
        )}
      >
        <div className="flex min-w-0 items-center gap-1">
          <MapPin className="h-5 w-5 shrink-0 text-slate-700" aria-hidden="true" />
          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex min-h-11 min-w-0 items-center gap-1 rounded px-1 font-semibold text-slate-900 outline-none hover:text-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label={`Região selecionada: ${stateLabel}. Clique para alterar estado`}
            >
              <span className="max-w-[112px] truncate sm:max-w-none">{stateLabel}</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="max-h-72 w-56 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
            >
              {BRAZIL_STATES_OPTIONS.map((item) => (
                <DropdownMenuItem
                  key={item.state}
                  onSelect={() => handleSelectState(item.state)}
                  onClick={() => handleSelectState(item.state)}
                  className={cn(
                    'flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 focus:bg-slate-100',
                    item.state.toUpperCase() === selectedState.toUpperCase() &&
                      'bg-blue-50 font-bold text-blue-700'
                  )}
                >
                  <span>{item.label}</span>
                  <span className="text-[10px] font-bold uppercase text-slate-400">{item.state}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <nav aria-label="Atalhos de descoberta" className="flex shrink-0 items-center">
          <Link
            href="/categories"
            className="hidden min-h-11 items-center gap-1.5 rounded-lg px-2 font-semibold text-slate-800 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:inline-flex"
          >
            <Grid2X2 className="h-4 w-4" aria-hidden="true" />
            Categorias
          </Link>
          <span className="mx-1 h-6 w-px bg-slate-200" aria-hidden="true" />
          <Link
            href="/favorites"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 font-semibold text-slate-800 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Heart className="h-5 w-5 text-rose-500" aria-hidden="true" />
            <span>Favoritos</span>
          </Link>
          <span className="mx-1 h-6 w-px bg-slate-200" aria-hidden="true" />
          <button
            type="button"
            onClick={() => setIsFiltersOpen(true)}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 font-semibold text-slate-800 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
            aria-label="Abrir filtros de empresas"
          >
            <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
            <span>Filtros</span>
          </button>
        </nav>
      </div>

      {isFiltersOpen && (
        <MobileCompanyFiltersSheet
          open={isFiltersOpen}
          onClose={() => setIsFiltersOpen(false)}
          filters={{
            ...DEFAULT_FILTERS,
            state: selectedState ? [selectedState] : [],
          }}
          onApply={(applied) => {
            setIsFiltersOpen(false);
            const query = stringifyQueryParams(applied);
            router.push(`/companies${query ? `?${query}` : ''}`);
          }}
        />
      )}
    </>
  );
}

export default HomeLocationBar;
