'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { CategoryIcon } from '@/components/categories/CategoryIcon';
import { CATEGORY_ICON_MANIFEST } from '@/lib/categories/category-icon-manifest';
import { cn } from '@/lib/utils';

const SOLUTION_CODES = ['A11', 'A09', 'B02', 'A06', 'A01', 'A10', 'G01', 'A08'] as const;

const SOLUTIONS = SOLUTION_CODES.map((code) => CATEGORY_ICON_MANIFEST[code]).filter(Boolean);

interface HomeSolutionsRailProps {
  className?: string;
}

export function HomeSolutionsRail({ className }: HomeSolutionsRailProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

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
      aria-labelledby="home-solutions-title"
    >
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2
          id="home-solutions-title"
          className="text-lg font-bold tracking-tight text-slate-950 sm:text-xl"
        >
          Produtos em destaque
        </h2>
        <Link
          href="/categories"
          className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-blue-600 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          Ver todos
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="relative">
        {canScrollLeft ? (
          <button
            type="button"
            onClick={() => scroll('left')}
            aria-label="Ver soluções anteriores"
            className="absolute -left-2 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-md hover:bg-slate-50 md:flex"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        ) : null}

        <div
          ref={scrollContainerRef}
          role="region"
          aria-label="Tipos de solução"
          tabIndex={0}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 no-scrollbar focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {SOLUTIONS.map((solution) => (
            <Link
              key={solution.id}
              href={`/categories/${solution.canonicalSlug}`}
              className="group flex min-h-[122px] w-[108px] shrink-0 snap-start flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 py-3 text-center shadow-xs transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <CategoryIcon
                slug={solution.canonicalSlug}
                name={solution.name}
                iconUrl={solution.src}
                size={58}
                className="mb-2 rounded-xl bg-slate-50 p-2 transition group-hover:bg-blue-50"
              />
              <span className="line-clamp-2 text-xs font-semibold leading-tight text-slate-800">
                {solution.name}
              </span>
            </Link>
          ))}
        </div>

        {canScrollRight ? (
          <button
            type="button"
            onClick={() => scroll('right')}
            aria-label="Ver mais soluções"
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

export default HomeSolutionsRail;
