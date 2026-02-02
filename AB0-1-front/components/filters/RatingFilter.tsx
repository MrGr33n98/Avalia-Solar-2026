'use client';

import React from 'react';
import { Star } from 'lucide-react';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface RatingFilterProps {
  selectedRating: number | null;
  onChange: (rating: number | null) => void;
}

export const RatingFilter: React.FC<RatingFilterProps> = ({
  selectedRating,
  onChange,
}) => {
  const ratings = [5, 4, 3];

  return (
    <AccordionItem value="rating" className="border-none">
      <AccordionTrigger className="hover:no-underline py-2 px-3 rounded-lg hover:bg-slate-50 transition-all group">
        <div className="flex items-center gap-3">
          <div className="bg-slate-100 p-2 rounded-xl group-data-[state=open]:bg-blue-100 group-data-[state=open]:text-blue-700 transition-colors">
            <Star size={20} strokeWidth={1.75} />
          </div>
          <span className="text-sm font-semibold text-slate-700">Avaliação</span>
          {selectedRating && (
            <span className="ml-1 text-xs font-bold text-blue-700">{selectedRating}+</span>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent className="pt-2 pb-1 px-3">
        <ToggleGroup
          type="single"
          value={selectedRating?.toString() || ''}
          onValueChange={(val) => onChange(val ? Number(val) : null)}
          className="justify-start gap-2"
        >
          {ratings.map((rating) => (
            <ToggleGroupItem
              key={rating}
              value={rating.toString()}
              className="flex-1 h-10 border border-slate-200 data-[state=on]:bg-blue-50 data-[state=on]:text-blue-700 data-[state=on]:border-blue-200 hover:bg-slate-50 transition-all gap-1.5"
            >
              <span className="text-sm font-bold">{rating}+</span>
              <Star size={14} className={selectedRating === rating ? 'fill-blue-700' : 'fill-slate-400 text-slate-400'} />
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <p className="text-[10px] text-slate-400 mt-3 text-center">
          Mínimo de estrelas baseado na média geral
        </p>
      </AccordionContent>
    </AccordionItem>
  );
};
