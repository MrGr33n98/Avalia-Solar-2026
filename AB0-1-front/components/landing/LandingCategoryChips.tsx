'use client';

import { type FocusEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  BatteryCharging,
  ChevronRight,
  Cpu,
  LayoutGrid,
  LayoutPanelTop,
  PlugZap,
  Wrench,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { Category } from '@/lib/api';
import { getFallbackCategories } from '@/lib/constants/fallback-categories';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { buildCategoryPath } from '@/lib/slug';
import { cn } from '@/lib/utils';

const AUTOPLAY_DELAY_MS = 2000;
const AUTOPLAY_SCROLL_DISTANCE = 320;
const SCROLL_END_TOLERANCE_PX = 4;

type LandingCategoryChipsProps = {
  categories: Category[];
  className?: string;
  includeAllChip?: boolean;
  limit?: number;
};

function getIconForCategory(category: Category) {
  const name = (category?.name || '').toLowerCase();
  const slug = (category?.seo_url || '').toLowerCase();
  const key = `${name} ${slug}`;

  if (key.includes('pain') || key.includes('panel')) return LayoutPanelTop;
  if (key.includes('invers') || key.includes('converter')) return Cpu;
  if (key.includes('bater') || key.includes('battery')) return BatteryCharging;
  if (key.includes('instal') || key.includes('install')) return Wrench;
  if (key.includes('off') || key.includes('grid')) return PlugZap;
  return LayoutGrid;
}

function getCustomIconSrc(category: Category) {
  const name = (category?.name || '').toLowerCase();
  const slug = (category?.seo_url || '').toLowerCase();
  const key = `${name} ${slug}`;

  if ((key.includes('carreg') && key.includes('resid')) || key.includes('wallbox')) {
    return '/carregadores-residenciais-e-wallbox.jpeg';
  }

  if (key.includes('carport')) {
    return '/carport-avalia-solar.png';
  }

  if (key.includes('energia solar') || key.includes('energia-solar')) {
    return '/energia-solar-avalia-solar.png';
  }

  if (key.includes('rural')) {
    return '/rural-avaliasolar.png';
  }

  if ((key.includes('resid') && key.includes('condom')) || key.includes('condominio')) {
    return '/residencial-e-condominio-avalia-solar.png';
  }

  if (key.includes('instal') && (key.includes('ev') || key.includes('veic') || key.includes('carreg'))) {
    return '/instaladores-ev-avalia-solar.png';
  }

  if (key.includes('instal')) {
    return '/instaladores-solar-avalia-solar.png';
  }

  if (key.includes('invers') || key.includes('converter')) {
    return '/icon-inversor-avalia-solar.jpeg';
  }

  return null;
}

export default function LandingCategoryChips({
  categories,
  className,
  includeAllChip = true,
  limit = 10,
}: LandingCategoryChipsProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const fallbackCategories = useMemo(() => getFallbackCategories(limit), [limit]);
  const usingFallbackCategories = !Array.isArray(categories) || categories.length === 0;

  const items = useMemo(() => {
    const safe = Array.isArray(categories) && categories.length > 0 ? categories : fallbackCategories;
    return safe.slice(0, Math.max(0, limit));
  }, [categories, fallbackCategories, limit]);

  const scrollBy = useCallback((delta: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  }, []);

  const advanceCarousel = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;

    const isAtEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - SCROLL_END_TOLERANCE_PX;
    if (isAtEnd) {
      el.scrollTo({ left: 0, behavior: 'smooth' });
      return;
    }

    scrollBy(AUTOPLAY_SCROLL_DISTANCE);
  }, [scrollBy]);

  const handleBlur = useCallback((event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsPaused(false);
    }
  }, []);

  useEffect(() => {
    if (prefersReducedMotion || isPaused || items.length <= 1) return;

    const intervalId = window.setInterval(advanceCarousel, AUTOPLAY_DELAY_MS);
    return () => window.clearInterval(intervalId);
  }, [advanceCarousel, isPaused, items.length, prefersReducedMotion]);

  return (
    <section className={cn('px-4 md:px-6', className)}>
      <div className="container mx-auto">
        <div
          className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]"
          role="region"
          aria-roledescription="carousel"
          aria-label="Categorias em destaque"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocusCapture={() => setIsPaused(true)}
          onBlurCapture={handleBlur}
          onPointerDown={() => setIsPaused(true)}
          onPointerUp={() => setIsPaused(false)}
          onPointerCancel={() => setIsPaused(false)}
        >
          <div
            id="landing-category-chips-track"
            ref={scrollerRef}
            className="flex items-center gap-2.5 overflow-x-auto px-3 py-3 no-scrollbar min-h-[72px]"
            role="list"
            aria-label="Categorias em destaque"
          >
            {includeAllChip ? (
              <Link
                href="/categories"
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800/50 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:border-blue-200 smooth-transition whitespace-nowrap"
                role="listitem"
              >
                <LayoutGrid className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-[13px] font-semibold text-blue-700 dark:text-blue-300">Categorias</span>
              </Link>
            ) : null}

            {items.map((category) => {
              const href = buildCategoryPath(category?.seo_url, category?.id);
              const Icon = getIconForCategory(category);
              const customIconSrc = getCustomIconSrc(category);
              return (
                <Link
                  key={category.id}
                  href={href}
                  className={cn(
                    'group/chip relative flex items-center gap-3 rounded-[18px] whitespace-nowrap flex-shrink-0',
                    'px-4 py-3',
                    'bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/60 dark:to-slate-900/40',
                    'border border-slate-200/80 dark:border-slate-700/50',
                    'shadow-[0_4px_14px_-6px_rgba(0,0,0,0.10),inset_0_1px_1px_rgba(255,255,255,0.8)]',
                    'dark:shadow-[0_4px_14px_-6px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.04)]',
                    'hover:-translate-y-0.5 hover:scale-[1.02] hover:border-slate-300 dark:hover:border-slate-600',
                    'hover:shadow-[0_10px_28px_-8px_rgba(0,0,0,0.14),0_0_0_1px_rgba(59,130,246,0.12)]',
                    'dark:hover:shadow-[0_10px_28px_-8px_rgba(0,0,0,0.5),0_0_0_1px_rgba(59,130,246,0.2)]',
                    'transition-all duration-300 ease-out cursor-pointer',
                  )}
                  role="listitem"
                  aria-label={`Ver empresas na categoria ${category.name}`}
                >
                  {/* Thumbnail */}
                  <div className="relative w-11 h-11 rounded-xl flex-shrink-0 overflow-hidden border border-slate-200/70 dark:border-slate-600/40 shadow-[0_2px_8px_rgba(0,0,0,0.12)]">
                    {customIconSrc ? (
                      <>
                        <Image
                          src={customIconSrc}
                          alt=""
                          width={44}
                          height={44}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover/chip:scale-110"
                        />
                        {/* Glossy overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-white/5 pointer-events-none" />
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800">
                        <Icon className="h-5 w-5 text-slate-500 dark:text-slate-400 group-hover/chip:text-blue-600 dark:group-hover/chip:text-blue-400 transition-colors duration-200" />
                      </div>
                    )}
                  </div>

                  {/* Labels */}
                  <div className="flex flex-col leading-none">
                    <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-slate-400 dark:text-slate-500 mb-0.5">
                      Categoria
                    </span>
                    <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 group-hover/chip:text-slate-950 dark:group-hover/chip:text-white transition-colors duration-200 tracking-[-0.01em]">
                      {category.name}
                    </span>
                  </div>

                  {/* Chevron */}
                  <svg
                    className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover/chip:text-slate-500 dark:group-hover/chip:text-slate-400 transition-colors duration-200 ml-1 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              );
            })}
          </div>

          <div className="absolute inset-y-0 right-0 flex items-center pr-1.5 pl-8 bg-gradient-to-l from-white via-white/90 to-transparent dark:from-slate-900 dark:via-slate-900/90 rounded-r-2xl pointer-events-none">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={advanceCarousel}
                className="pointer-events-auto h-11 w-11 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:bg-slate-50 dark:hover:bg-slate-700 smooth-transition"
                aria-label="Ver mais categorias"
                aria-controls="landing-category-chips-track"
              >
              <ChevronRight className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </Button>
          </div>
        </div>

        {usingFallbackCategories ? (
          <p className="mt-2 text-xs text-amber-700 dark:text-amber-400 px-1">
            Categorias exibidas em modo de contingencia.
          </p>
        ) : null}
      </div>
    </section>
  );
}
