'use client';

import { cn } from '@/lib/utils';
import { Search, SlidersHorizontal } from 'lucide-react';

interface FilterBarProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filters?: Array<{
    label: string;
    value: string;
    options: Array<{ label: string; value: string }>;
    onChange: (value: string) => void;
  }>;
  className?: string;
}

export function FilterBar({
  searchPlaceholder = 'Buscar...',
  searchValue = '',
  onSearchChange,
  filters = [],
  className,
}: FilterBarProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3',
        className
      )}
    >
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
        />
      </div>

      {/* Filters */}
      {filters.map((filter) => (
        <select
          key={filter.label}
          value={filter.value}
          onChange={(e) => filter.onChange(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
        >
          {filter.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}

      {/* Advanced filters button */}
      <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
        <SlidersHorizontal className="h-4 w-4" />
        Filtros
      </button>
    </div>
  );
}
