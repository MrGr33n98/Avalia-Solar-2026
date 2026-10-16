'use client';

import * as React from 'react';
import Link from 'next/link';
import { MapPin, ChevronDown, Grid2X2, Heart, SlidersHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { BRAZIL_STATES_OPTIONS } from '@/lib/company-options';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface HomeLocationBarProps {
  className?: string;
  defaultState?: string;
}

export function HomeLocationBar({ className, defaultState = 'SC' }: HomeLocationBarProps) {
  const router = useRouter();
  const [selectedState, setSelectedState] = React.useState<string>(defaultState);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const fromUrl = params.get('state');
      if (fromUrl) {
        setSelectedState(fromUrl.toUpperCase());
        return;
      }
      const stored = localStorage.getItem('user_state');
      if (stored) setSelectedState(stored.toUpperCase());
    }
  }, []);

  const currentStateObj = React.useMemo(() => {
    return (
      BRAZIL_STATES_OPTIONS.find((s) => s.state.toUpperCase() === selectedState.toUpperCase()) || {
        state: 'SC',
        label: 'Santa Catarina',
      }
    );
  }, [selectedState]);

  const handleSelectState = (stateCode: string) => {
    setSelectedState(stateCode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_state', stateCode);
    }
    router.push(`/companies?state=${encodeURIComponent(stateCode)}`);
  };

  return (
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
            aria-label={`Região selecionada: ${currentStateObj.label}. Clique para alterar estado`}
          >
            <span className="max-w-[112px] truncate sm:max-w-none">{currentStateObj.label}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="max-h-72 w-56 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
          >
            {BRAZIL_STATES_OPTIONS.map((item) => (
              <DropdownMenuItem
                key={item.state}
                onClick={() => handleSelectState(item.state)}
                className={cn(
                  'flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 focus:bg-slate-100',
                  item.state.toUpperCase() === currentStateObj.state.toUpperCase() &&
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
        <Link
          href="/companies?filters=open"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 font-semibold text-slate-800 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
          <span>Filtros</span>
        </Link>
      </nav>
    </div>
  );
}

export default HomeLocationBar;
