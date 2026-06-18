'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CategoryTreeNode } from '@/hooks/useCategoriesTree';
import { cn } from '@/lib/utils';
import { getPreferredCategoryIcon } from '@/lib/categoryIcons';

interface CategoryColumnProps {
  category: CategoryTreeNode;
  isPopular?: boolean;
}

export const CategoryColumn: React.FC<CategoryColumnProps> = ({ category, isPopular }) => {
  const children = category.children || [];
  const slug = category.slug || '';
  const iconSrc = getPreferredCategoryIcon(
    slug || category.seo_url,
    category.icon_url,
    category.name
  );

  return (
    <div className="flex flex-col min-w-0">
      {/* Título da Categoria Raiz */}
      <Link
        href={`/categories/${slug}`}
        className={cn(
          'group flex items-center justify-between gap-2 text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors leading-tight mb-2',
          isPopular && 'text-blue-700'
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          {iconSrc ? (
            <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm">
              <Image
                src={iconSrc}
                alt={`Ícone de ${category.name}`}
                fill
                sizes="32px"
                className="object-contain p-1"
              />
            </span>
          ) : null}
          <span className="truncate group-hover:whitespace-normal">{category.name}</span>
        </span>
        {category.companies_count > 0 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
            {category.companies_count}
          </span>
        )}
      </Link>

      {/* Subcategorias */}
      <ul className="flex flex-col gap-0.5">
        {children.slice(0, 12).map((child) => {
          const childIconSrc = getPreferredCategoryIcon(
            child.slug || child.seo_url,
            child.icon_url,
            child.name
          );

          return (
            <li key={child.id}>
              <Link
                href={`/categories/${child.slug || ''}`}
                className="flex items-center justify-between group py-1 text-xs text-slate-500 hover:text-blue-600 transition-colors leading-tight"
              >
                <span className="flex min-w-0 items-center gap-1.5 pr-2">
                  {childIconSrc ? (
                    <span className="relative h-5 w-5 shrink-0 overflow-hidden rounded-full border border-slate-100 bg-white shadow-sm">
                      <Image
                        src={childIconSrc}
                        alt=""
                        fill
                        sizes="20px"
                        className="object-contain p-0.5"
                      />
                    </span>
                  ) : null}
                  <span className="truncate">{child.name}</span>
                </span>
                {child.companies_count > 0 && (
                  <span className="text-[9px] opacity-0 group-hover:opacity-100 text-slate-400 transition-opacity">
                    {child.companies_count}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
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
