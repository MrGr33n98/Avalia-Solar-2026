'use client';

import React from 'react';
import { ArrowUpDown, Check } from 'lucide-react';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface SortFilterProps {
  selectedSort: string;
  onChange: (sort: string) => void;
}

export const SortFilter: React.FC<SortFilterProps> = ({
  selectedSort,
  onChange,
}) => {
  const sortOptions = [
    { id: 'recommended', label: 'Recomendadas' },
    { id: 'rating_desc', label: 'Melhor avaliadas' },
    { id: 'reviews_desc', label: 'Mais avaliadas' },
    { id: 'newest', label: 'Mais recentes' },
    { id: 'name_asc', label: 'Nome (A-Z)' },
    { id: 'name_desc', label: 'Nome (Z-A)' },
  ];

  const currentLabel = sortOptions.find(opt => opt.id === selectedSort)?.label || 'Recomendadas';

  return (
    <AccordionItem value="sort" className="border-b border-slate-200">
      <AccordionTrigger className="group rounded-none px-5 py-4 hover:bg-slate-50 hover:no-underline">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border border-slate-200 bg-slate-50 text-slate-900 rounded-none group-data-[state=open]:border-blue-200 group-data-[state=open]:text-blue-700">
            <ArrowUpDown size={20} strokeWidth={1.75} />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium text-slate-950">Ordenar por</span>
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-600">{currentLabel}</span>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-5 pb-4 pt-0">
        <div className="space-y-1">
          {sortOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => onChange(option.id)}
              className={`flex w-full items-center justify-between border px-3 py-2 text-left rounded-none transition-colors ${
                selectedSort === option.id
                  ? 'bg-blue-50 text-blue-700 border border-blue-100'
                  : 'text-slate-600 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <span className="text-sm font-medium">{option.label}</span>
              {selectedSort === option.id && <Check size={16} strokeWidth={2.5} />}
            </button>
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};
