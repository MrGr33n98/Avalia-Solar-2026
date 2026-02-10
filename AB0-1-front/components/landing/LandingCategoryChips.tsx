'use client';

import { useMemo, useRef } from 'react';
import Link from 'next/link';
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
        <div className="relative rounded-2xl bg-white/70 border border-gray-200 shadow-sm">
          <div
            ref={scrollerRef}
            className="flex items-center gap-3 overflow-x-auto px-3 py-3 no-scrollbar min-h-[56px]"
            role="list"
            aria-label="Categorias em destaque"
          >
            {includeAllChip ? (
              <Link
                href="/categories"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all whitespace-nowrap"
                role="listitem"
              >
                <LayoutGrid className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-slate-900">Categorias</span>
              </Link>
            ) : null}

            {items.map((category) => {
              const href = buildCategoryPath(category?.seo_url, category?.id);
              const Icon = getIconForCategory(category);
              return (
                <Link
                  key={category.id}
                  href={href}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all whitespace-nowrap"
                  role="listitem"
                  aria-label={category.name}
                >
                  <Icon className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-slate-900">{category.name}</span>
                </Link>
              );
            })}
          </div>

          <div className="absolute inset-y-0 right-0 flex items-center pr-2 bg-gradient-to-l from-white via-white/70 to-transparent rounded-r-2xl">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => scrollBy(320)}
              className="h-9 w-9 rounded-full border border-gray-200 bg-white/90 shadow-sm hover:bg-white"
              aria-label="Ver mais categorias"
            >
              <ChevronRight className="h-5 w-5 text-slate-700" />
            </Button>
          </div>
        </div>

        {usingFallbackCategories ? (
          <p className="mt-2 text-xs text-amber-700 px-1">
            Categorias exibidas em modo de contingencia.
          </p>
        ) : null}
      </div>
    </section>
  );
}
