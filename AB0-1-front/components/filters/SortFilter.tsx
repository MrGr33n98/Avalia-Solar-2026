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
    <AccordionItem value="sort" className="border-none">
      <AccordionTrigger className="hover:no-underline py-2 px-3 rounded-lg hover:bg-slate-50 transition-all group">
        <div className="flex items-center gap-3">
          <div className="bg-slate-100 p-2 rounded-xl group-data-[state=open]:bg-blue-100 group-data-[state=open]:text-blue-700 transition-colors">
            <ArrowUpDown size={20} strokeWidth={1.75} />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-sm font-semibold text-slate-700">Ordenar por</span>
            <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">{currentLabel}</span>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pt-2 pb-1 px-3">
        <div className="space-y-1">
          {sortOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => onChange(option.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
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
