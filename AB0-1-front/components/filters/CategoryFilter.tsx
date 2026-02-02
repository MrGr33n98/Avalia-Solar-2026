'use client';

import React from 'react';
import { Tag } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { useCategoriesTree } from './hooks';
import { Skeleton } from '@/components/ui/skeleton';

interface CategoryFilterProps {
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedIds,
  onChange,
}) => {
  const { categories, loading, error } = useCategoriesTree();

  if (error) return null;

  const handleToggle = (id: number) => {
    const newIds = selectedIds.includes(id)
      ? selectedIds.filter((i) => i !== id)
      : [...selectedIds, id];
    onChange(newIds);
  };

  return (
    <AccordionItem value="categories" className="border-none">
      <AccordionTrigger className="hover:no-underline py-2 px-3 rounded-lg hover:bg-slate-50 transition-all group">
        <div className="flex items-center gap-3">
          <div className="bg-slate-100 p-2 rounded-xl group-data-[state=open]:bg-blue-100 group-data-[state=open]:text-blue-700 transition-colors">
            <Tag size={20} strokeWidth={1.75} />
          </div>
          <span className="text-sm font-semibold text-slate-700">Categorias</span>
          {selectedIds.length > 0 && (
            <Badge variant="secondary" className="ml-1 bg-blue-50 text-blue-700 hover:bg-blue-50 rounded-full px-2 py-0.5 text-xs">
              {selectedIds.length}
            </Badge>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent className="pt-2 pb-1 px-3">
        {loading ? (
          <div className="space-y-3 mt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map((root) => (
              <div key={root.id} className="space-y-2">
                <div className="flex items-center justify-between py-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {root.name}
                  </span>
                  {root.companies_count > 0 && (
                    <span className="text-[10px] text-slate-400 font-medium">
                      {root.companies_count}
                    </span>
                  )}
                </div>
                <div className="grid gap-1.5 pl-1">
                  {root.children.map((child) => (
                    <div
                      key={child.id}
                      className="flex items-center justify-between group cursor-pointer px-1 py-1 rounded-md hover:bg-slate-50"
                      onClick={() => handleToggle(child.id)}
                    >
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`cat-${child.id}`}
                          checked={selectedIds.includes(child.id)}
                          onCheckedChange={() => handleToggle(child.id)}
                          className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                        <label
                          htmlFor={`cat-${child.id}`}
                          className="text-sm text-slate-600 group-hover:text-blue-700 cursor-pointer transition-colors"
                        >
                          {child.name}
                        </label>
                      </div>
                      {child.companies_count > 0 && (
                        <span className="text-[10px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                          {child.companies_count}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
};
