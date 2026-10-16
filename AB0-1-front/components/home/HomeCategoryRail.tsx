'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { CategoryIcon } from '@/components/categories/CategoryIcon';
import {
  CATEGORY_ICON_MANIFEST,
  type CategoryIconDefinition,
} from '@/lib/categories/category-icon-manifest';
import type { Category } from '@/lib/api';
import { cn } from '@/lib/utils';

interface HomeCategoryRailProps {
  categories?: Category[];
  className?: string;
}

interface HomeCategoryItem {
  id: string | number;
  name: string;
  slug: string;
  iconUrl?: string | null;
  visualKey?: string | null;
}

const PRIMARY_CATEGORIES = Object.values(CATEGORY_ICON_MANIFEST).filter(
  (item): item is CategoryIconDefinition => item.type === 'principal'
);

function normalize(value?: string | null) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');
}

function buildCategoryItems(categories: Category[]): HomeCategoryItem[] {
  return PRIMARY_CATEGORIES.map((definition) => {
    const match = categories.find((category) => {
      if (category.parent_id != null) return false;
      const categorySlug = normalize(category.slug || category.seo_url || category.name);
      return (
        categorySlug === normalize(definition.canonicalSlug) ||
        categorySlug === normalize(definition.name) ||
        definition.aliases.some((alias) => categorySlug === normalize(alias))
      );
    });

    return {
      id: match?.id ?? definition.id,
      name: match?.name || definition.name,
      slug: match?.slug || match?.seo_url || definition.canonicalSlug,
      iconUrl: match?.icon_url || definition.src,
      visualKey: match?.visual_key,
    };
  });
}

export function HomeCategoryRail({ categories = [], className }: HomeCategoryRailProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);
  const items = React.useMemo(() => buildCategoryItems(categories), [categories]);

  const checkScroll = React.useCallback(() => {
    const element = scrollContainerRef.current;
    if (!element) return;
    setCanScrollLeft(element.scrollLeft > 8);
    setCanScrollRight(element.scrollLeft + element.clientWidth < element.scrollWidth - 8);
  }, []);

  React.useEffect(() => {
    const element = scrollContainerRef.current;
    if (!element) return;
    checkScroll();
    element.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll, { passive: true });
    return () => {
      element.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll]);

  const scroll = (direction: 'left' | 'right') => {
    scrollContainerRef.current?.scrollBy({
      left: direction === 'left' ? -360 : 360,
      behavior: 'smooth',
    });
  };

  return (
    <section
      className={cn('relative w-full px-4 py-4', className)}
      aria-labelledby="home-categories-title"
    >
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2
          id="home-categories-title"
          className="text-lg font-bold tracking-tight text-slate-950 sm:text-xl"
        >
          Categorias em destaque
        </h2>
        <Link
          href="/categories"
          className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-blue-600 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          Ver todas
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="relative">
        {canScrollLeft ? (
          <button
            type="button"
            onClick={() => scroll('left')}
            aria-label="Ver categorias anteriores"
            className="absolute -left-2 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-md hover:bg-slate-50 md:flex"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        ) : null}

        <div
          ref={scrollContainerRef}
          role="region"
          aria-label="Categorias principais"
          tabIndex={0}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 no-scrollbar focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.map((category, index) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="group flex min-h-[132px] w-[112px] shrink-0 snap-start flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 py-3 text-center shadow-xs transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <CategoryIcon
                slug={category.slug}
                name={category.name}
                visualKey={category.visualKey}
                iconUrl={category.iconUrl}
                size={64}
                priority={index < 4}
                className="mb-2 rounded-xl bg-slate-50 p-2 transition group-hover:bg-blue-50"
              />
              <span className="line-clamp-2 text-xs font-semibold leading-tight text-slate-800">
                {category.name}
              </span>
            </Link>
          ))}
        </div>

        {canScrollRight ? (
          <button
            type="button"
            onClick={() => scroll('right')}
            aria-label="Ver mais categorias"
            className="absolute -right-2 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-md hover:bg-slate-50 md:flex"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      <div className="mt-2.5 flex items-center justify-center gap-1.5" aria-hidden="true">
        <span
          className={cn(
            'h-1.5 rounded-full transition-all',
            canScrollLeft ? 'w-1.5 bg-slate-300' : 'w-6 bg-blue-600'
          )}
        />
        <span
          className={cn(
            'h-1.5 rounded-full transition-all',
            canScrollLeft ? 'w-6 bg-blue-600' : 'w-1.5 bg-slate-300'
          )}
        />
      </div>
    </section>
  );
}

export default HomeCategoryRail;
