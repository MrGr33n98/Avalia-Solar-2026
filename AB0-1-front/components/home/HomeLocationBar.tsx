'use client';

import * as React from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  const searchParams = useSearchParams();
  const [selectedState, setSelectedState] = React.useState<string>(() => {
    if (typeof window !== 'undefined') {
      const fromUrl = searchParams.get('state');
      if (fromUrl) return fromUrl.toUpperCase();
      const stored = localStorage.getItem('user_state');
      if (stored) return stored;
    }
    return defaultState;
  });

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
        'flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-700 select-none',
        className
      )}
    >
      <MapPin className="h-4 w-4 text-slate-500 shrink-0" aria-hidden="true" />
      <DropdownMenu>
        <DropdownMenuTrigger
          className="inline-flex items-center gap-1 font-semibold text-slate-900 outline-none hover:text-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          aria-label={`Região selecionada: ${currentStateObj.label}. Clique para alterar estado`}
        >
          <span>{currentStateObj.label}</span>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
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
              <span className="text-[10px] text-slate-400 font-bold uppercase">{item.state}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default HomeLocationBar;
