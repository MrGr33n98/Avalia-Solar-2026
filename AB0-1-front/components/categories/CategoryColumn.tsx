'use client';

import React from 'react';
import Link from 'next/link';
import { CategoryTreeNode } from '@/hooks/useCategoriesTree';
import { cn } from '@/lib/utils';

interface CategoryColumnProps {
  category: CategoryTreeNode;
  isPopular?: boolean;
}

export const CategoryColumn: React.FC<CategoryColumnProps> = ({ category, isPopular }) => {
  const children = category.children || [];
  const slug = category.slug || '';

  return (
    <div className="flex flex-col min-w-0">
      {/* Título da Categoria Raiz */}
      <Link
        href={`/categories/${slug}`}
        className={cn(
          "group flex items-center justify-between gap-2 text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors leading-tight mb-2",
          isPopular && "text-blue-700"
        )}
      >
        <span className="truncate group-hover:whitespace-normal">{category.name}</span>
        {category.companies_count > 0 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
            {category.companies_count}
          </span>
        )}
      </Link>

      {/* Subcategorias */}
      <ul className="flex flex-col gap-0.5">
        {children.slice(0, 12).map((child) => (
          <li key={child.id}>
            <Link
              href={`/categories/${child.slug || ''}`}
              className="flex items-center justify-between group py-1 text-xs text-slate-500 hover:text-blue-600 transition-colors leading-tight"
            >
              <span className="truncate pr-2">{child.name}</span>
              {child.companies_count > 0 && (
                <span className="text-[9px] opacity-0 group-hover:opacity-100 text-slate-400 transition-opacity">
                  {child.companies_count}
                </span>
              )}
            </Link>
          </li>
        ))}
        {children.length > 12 && (
          <li>
            <Link
              href={`/categories/${slug}`}
              className="text-[10px] font-medium text-blue-500 hover:text-blue-700 pt-1 block"
            >
              Ver mais ({children.length - 12})
            </Link>
          </li>
        )}
      </ul>
    </div>
  );
};
