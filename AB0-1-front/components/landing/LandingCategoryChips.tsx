'use client';

import { useMemo, useRef } from 'react';
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
import { buildCategoryPath } from '@/lib/slug';
import { cn } from '@/lib/utils';

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
  const fallbackCategories = useMemo(() => getFallbackCategories(limit), [limit]);
  const usingFallbackCategories = !Array.isArray(categories) || categories.length === 0;

  const items = useMemo(() => {
    const safe = Array.isArray(categories) && categories.length > 0 ? categories : fallbackCategories;
    return safe.slice(0, Math.max(0, limit));
  }, [categories, fallbackCategories, limit]);

  const scrollBy = (delta: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <section className={cn('px-4 md:px-6', className)}>
      <div className="container mx-auto">
        <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]">
          <div
            ref={scrollerRef}
            className="flex items-center gap-2 overflow-x-auto px-3 py-2.5 no-scrollbar min-h-[52px]"
            role="list"
            aria-label="Categorias em destaque"
          >
            {includeAllChip ? (
              <Link
                href="/categories"
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800/50 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:border-blue-200 smooth-transition whitespace-nowrap"
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
                  className="group/chip flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] smooth-transition whitespace-nowrap min-h-[40px]"
                  role="listitem"
                  aria-label={`Ver empresas na categoria ${category.name}`}
                >
                  {customIconSrc ? (
                    <div className="relative w-5 h-5 rounded overflow-hidden flex-shrink-0 ring-1 ring-slate-200/60 dark:ring-slate-600/40">
                      <Image
                        src={customIconSrc}
                        alt=""
                        width={20}
                        height={20}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <Icon className="h-4 w-4 text-slate-500 dark:text-slate-400 group-hover/chip:text-blue-600 dark:group-hover/chip:text-blue-400 smooth-transition flex-shrink-0" />
                  )}
                  <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300 group-hover/chip:text-slate-900 dark:group-hover/chip:text-white smooth-transition">{category.name}</span>
                </Link>
              );
            })}
          </div>

          <div className="absolute inset-y-0 right-0 flex items-center pr-1.5 pl-8 bg-gradient-to-l from-white via-white/90 to-transparent dark:from-slate-900 dark:via-slate-900/90 rounded-r-2xl pointer-events-none">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => scrollBy(320)}
              className="pointer-events-auto h-9 w-9 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:bg-slate-50 dark:hover:bg-slate-700 smooth-transition"
              aria-label="Ver mais categorias"
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
