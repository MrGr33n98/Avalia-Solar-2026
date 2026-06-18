'use client';

import React from 'react';
import Image from 'next/image';
import { Tag } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { useCategoriesTree } from '@/hooks/useCategoriesTree';
import { Skeleton } from '@/components/ui/skeleton';
import { getPreferredCategoryIcon } from '@/lib/categoryIcons';

interface CategoryFilterProps {
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({ selectedIds, onChange }) => {
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
            <Badge
              variant="secondary"
              className="ml-1 bg-blue-50 text-blue-700 hover:bg-blue-50 rounded-full px-2 py-0.5 text-xs"
            >
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
            {categories.map((root) => {
              const rootIconSrc = getPreferredCategoryIcon(
                root.slug || root.seo_url,
                root.icon_url,
                root.name
              );

              return (
                <div key={root.id} className="space-y-2">
                  <div className="flex items-center justify-between py-1">
                    <span className="flex min-w-0 items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {rootIconSrc ? (
                        <span className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm">
                          <Image
                            src={rootIconSrc}
                            alt={`Ícone de ${root.name}`}
                            fill
                            sizes="24px"
                            className="object-contain p-0.5"
                          />
                        </span>
                      ) : null}
                      <span className="truncate">{root.name}</span>
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
              );
            })}
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
};
