'use client';

import { cn } from '@/lib/utils';

export type SearchTab = 'all' | 'products' | 'companies' | 'reviews';

interface SearchTabsProps {
  value: SearchTab;
  counts: Record<SearchTab, number>;
  onChange: (tab: SearchTab) => void;
}

const tabs: Array<{ value: SearchTab; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'companies', label: 'Empresas' },
  { value: 'products', label: 'Produtos' },
  { value: 'reviews', label: 'Avaliações' },
];

export function SearchTabs({ value, counts, onChange }: SearchTabsProps) {
  return (
    <div className="overflow-x-auto border-b border-slate-200 [scrollbar-width:none]">
      <div className="flex min-w-max gap-7" role="tablist" aria-label="Tipos de resultado">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={value === tab.value}
            onClick={() => onChange(tab.value)}
            className={cn(
              'relative flex h-14 items-center gap-2 px-1 text-sm font-semibold transition-colors',
              value === tab.value ? 'text-blue-700' : 'text-slate-600 hover:text-slate-950'
            )}
          >
            {tab.label}
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[11px] tabular-nums',
                value === tab.value ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'
              )}
            >
              {counts[tab.value]}
            </span>
            {value === tab.value ? (
              <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-blue-600" />
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}
