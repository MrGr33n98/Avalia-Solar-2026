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
            className="absolute -left-2 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-md hover:bg-slate-50 md:flex lg:hidden"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        ) : null}

        <div
          ref={scrollContainerRef}
          role="region"
          aria-label="Tipos de solução"
          tabIndex={0}
          className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-1 no-scrollbar lg:grid lg:grid-cols-8 lg:gap-2.5 lg:overflow-visible focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {SOLUTIONS.map((solution) => (
            <Link
              key={solution.id}
              href={`/categories/${solution.canonicalSlug}`}
              className="group flex h-[96px] w-[94px] shrink-0 snap-start flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-center shadow-2xs transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 lg:h-[102px] lg:w-full"
            >
              <div className="mb-1.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50 transition group-hover:bg-blue-50/60 sm:h-11 sm:w-11">
                <CategoryIcon
                  slug={solution.canonicalSlug}
                  name={solution.name}
                  iconUrl={solution.src}
                  size={42}
                />
              </div>
              <span className="line-clamp-2 text-[11px] font-semibold leading-tight text-slate-800 transition group-hover:text-blue-600 sm:text-xs">
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
            className="absolute -right-2 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-md hover:bg-slate-50 md:flex lg:hidden"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="mt-2.5 flex items-center justify-center gap-1.5 lg:hidden" aria-hidden="true">
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
