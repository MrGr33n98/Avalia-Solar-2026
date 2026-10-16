'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { HomeFeaturedChip } from './HomeFeaturedChip';
import type { Category } from '@/lib/api';
import { getFallbackCategories } from '@/lib/constants/fallback-categories';

export interface HomeCategoryRailProps {
  categories?: Category[];
  className?: string;
}

export function HomeCategoryRail({ categories = [], className }: HomeCategoryRailProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  const items = React.useMemo(() => {
    const list = categories.length > 0 ? categories : getFallbackCategories(9);
    return list.slice(0, 9);
  }, [categories]);

  const checkScroll = React.useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  React.useEffect(() => {
    checkScroll();
    const el = scrollContainerRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll, items]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distance = direction === 'left' ? -320 : 320;
    el.scrollBy({ left: distance, behavior: 'smooth' });
  };

  if (!items.length) {
    return null;
  }

  return (
    <section aria-labelledby="home-categories-title" className={className}>
      <div className="mb-2 flex items-center justify-between">
        <h2 id="home-categories-title" className="text-base font-bold text-slate-900 sm:text-lg">
          Categorias em destaque
        </h2>
      </div>

      <div className="relative">
        {canScrollLeft ? (
          <button
            type="button"
            onClick={() => scroll('left')}
            aria-label="Ver categorias anteriores"
            className="absolute -left-2 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-md hover:bg-slate-50 md:flex"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        ) : null}

        <div
          ref={scrollContainerRef}
          role="region"
          aria-label="Categorias principais"
          tabIndex={0}
          className="flex w-full min-w-0 snap-x snap-proximity items-center gap-2 overflow-x-auto pb-1 no-scrollbar focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.map((category, index) => (
            <HomeFeaturedChip
              key={category.id}
              href={`/categories/${category.slug || category.seo_url}`}
              name={category.name}
              slug={category.slug || category.seo_url}
              visualKey={category.visual_key}
              iconUrl={category.icon_url}
              priority={index < 4}
            />
          ))}
        </div>

        {canScrollRight ? (
          <button
            type="button"
            onClick={() => scroll('right')}
            aria-label="Ver mais categorias"
            className="absolute -right-2 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-md hover:bg-slate-50 md:flex"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </section>
  );
}

export default HomeCategoryRail;
