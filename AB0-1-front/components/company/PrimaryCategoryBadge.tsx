'use client';

import Link from 'next/link';
import { Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PrimaryCategoryBadgeProps {
  category?: {
    id?: number | string;
    name?: string;
    slug?: string;
  } | null;
  className?: string;
}

export default function PrimaryCategoryBadge({ category, className }: PrimaryCategoryBadgeProps) {
  if (!category?.name) return null;

  const categoryName = category.name;
  const categorySlug = category.slug;

  const badgeContent = (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80',
        'hover:bg-slate-200/80 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 transition-colors',
        className
      )}
      aria-label={`Categoria principal: ${categoryName}`}
    >
      <Tag className="h-3 w-3 shrink-0 opacity-70" aria-hidden="true" />
      <span className="truncate max-w-[160px] sm:max-w-[200px]">{categoryName}</span>
    </span>
  );

  if (categorySlug) {
    return (
      <Link href={`/categories/${categorySlug}`} className="inline-flex focus:outline-none">
        {badgeContent}
      </Link>
    );
  }

  return badgeContent;
}
