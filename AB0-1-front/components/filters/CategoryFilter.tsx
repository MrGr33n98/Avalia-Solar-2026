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
    <AccordionItem value="categories" className="border-b border-slate-200">
      <AccordionTrigger className="group rounded-none px-5 py-4 hover:bg-slate-50 hover:no-underline">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border border-slate-200 bg-slate-50 rounded-none group-data-[state=open]:border-blue-200 group-data-[state=open]:text-blue-700">
            <Tag size={20} strokeWidth={1.75} />
          </div>
          <span className="text-sm font-medium text-slate-950">Categorias</span>
          {selectedIds.length > 0 && (
            <Badge
              variant="secondary"
              className="ml-1 rounded-sm border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
            >
              {selectedIds.length}
            </Badge>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-5 pb-4 pt-0">
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
                    <span className="flex min-w-0 items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {rootIconSrc ? (
                        <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-none border border-slate-200 bg-white">
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
                        className="group flex cursor-pointer items-center justify-between rounded-none px-2 py-1.5 hover:bg-slate-50"
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
                          <span className="rounded-sm border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
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
