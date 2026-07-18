'use client';

import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface Aggregate {
  category_id: number | null;
  category_name: string | null;
  average_rating: number;
  total_reviews: number;
}

interface CompanyReputationSwitcherProps {
  aggregates: {
    global: Aggregate | null;
    by_category: Aggregate[];
  };
  activeCategoryId: number | null;
  onSwitch: (id: number | null) => void;
}

export function CompanyReputationSwitcher({
  aggregates,
  activeCategoryId,
  onSwitch,
}: CompanyReputationSwitcherProps) {
  const hasCategories = aggregates.by_category.length > 0;

  if (!hasCategories && !aggregates.global) return null;

  return (
    <div className="inline-block max-w-full border border-slate-300 bg-white">
      <ScrollArea className="w-full">
        <div
          className="flex items-center"
          role="tablist"
          aria-label="Filtrar avaliações por categoria"
        >
          {/* Global Tab */}
          <button
            onClick={() => onSwitch(null)}
            role="tab"
            aria-selected={activeCategoryId === null}
            className={cn(
              'min-h-11 whitespace-nowrap border-r border-slate-300 px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0B1F4B]',
              activeCategoryId === null
                ? 'bg-[#0B1F4B] text-white'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            )}
          >
            Geral {aggregates.global && `(${aggregates.global.average_rating.toFixed(1)})`}
          </button>

          {/* Category Tabs */}
          {aggregates.by_category.map((agg) => (
            <button
              key={agg.category_id}
              onClick={() => onSwitch(agg.category_id)}
              role="tab"
              aria-selected={activeCategoryId === agg.category_id}
              className={cn(
                'min-h-11 whitespace-nowrap border-r border-slate-300 px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors last:border-r-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0B1F4B]',
                activeCategoryId === agg.category_id
                  ? 'bg-[#0B1F4B] text-white'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              )}
            >
              {agg.category_name} ({agg.average_rating.toFixed(1)})
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="hidden" />
      </ScrollArea>
    </div>
  );
}
