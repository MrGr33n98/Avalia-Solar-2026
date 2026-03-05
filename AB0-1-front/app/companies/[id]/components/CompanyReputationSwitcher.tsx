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

export function CompanyReputationSwitcher({ aggregates, activeCategoryId, onSwitch }: CompanyReputationSwitcherProps) {
  const hasCategories = aggregates.by_category.length > 0;

  if (!hasCategories && !aggregates.global) return null;

  return (
    <div className="bg-white p-1 rounded-2xl border border-slate-100 shadow-sm inline-block max-w-full">
      <ScrollArea className="w-full">
        <div className="flex items-center gap-1">
          {/* Global Tab */}
          <button
            onClick={() => onSwitch(null)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap",
              activeCategoryId === null 
                ? "bg-slate-900 text-white shadow-md" 
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            )}
          >
            Geral {aggregates.global && `(${aggregates.global.average_rating.toFixed(1)})`}
          </button>

          {/* Category Tabs */}
          {aggregates.by_category.map((agg) => (
            <button
              key={agg.category_id}
              onClick={() => onSwitch(agg.category_id)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                activeCategoryId === agg.category_id 
                  ? "bg-blue-600 text-white shadow-md" 
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
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
