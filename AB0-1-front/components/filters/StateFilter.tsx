'use client';

import React, { useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useStatesOptions } from './hooks';
import { Skeleton } from '@/components/ui/skeleton';

interface StateFilterProps {
  selectedStates: string[];
  onChange: (states: string[]) => void;
}

export const StateFilter: React.FC<StateFilterProps> = ({
  selectedStates,
  onChange,
}) => {
  const { states, loading, error } = useStatesOptions();
  const [searchTerm, setSearchTerm] = useState('');

  if (error) return null;

  const handleToggle = (state: string) => {
    const newStates = selectedStates.includes(state)
      ? selectedStates.filter((s) => s !== state)
      : [...selectedStates, state];
    onChange(newStates);
  };

  const filteredStates = states.filter((s) =>
    s.state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AccordionItem value="states" className="border-none">
      <AccordionTrigger className="hover:no-underline py-2 px-3 rounded-lg hover:bg-slate-50 transition-all group">
        <div className="flex items-center gap-3">
          <div className="bg-slate-100 p-2 rounded-xl group-data-[state=open]:bg-blue-100 group-data-[state=open]:text-blue-700 transition-colors">
            <MapPin size={20} strokeWidth={1.75} />
          </div>
          <span className="text-sm font-semibold text-slate-700">Localização</span>
          {selectedStates.length > 0 && (
            <Badge variant="secondary" className="ml-1 bg-blue-50 text-blue-700 hover:bg-blue-50">
              {selectedStates.length}
            </Badge>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent className="pt-2 pb-1 px-3">
        <div className="relative mb-4 mt-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar estado..."
            className="pl-9 h-9 text-xs border-slate-200 focus-visible:ring-blue-500 bg-slate-50/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
            {filteredStates.length > 0 ? (
              filteredStates.map((item) => (
                <div
                  key={item.state}
                  className="flex items-center justify-between group cursor-pointer"
                  onClick={() => handleToggle(item.state)}
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`state-${item.state}`}
                      checked={selectedStates.includes(item.state)}
                      onCheckedChange={() => handleToggle(item.state)}
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <label
                      htmlFor={`state-${item.state}`}
                      className="text-sm text-slate-600 group-hover:text-blue-700 cursor-pointer transition-colors"
                    >
                      {item.state}
                    </label>
                  </div>
                  {item.count > 0 && (
                    <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                      {item.count}
                    </span>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-2">Nenhum estado encontrado</p>
            )}
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
};
