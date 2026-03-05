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
        <div className="relative clay-panel rounded-clay-lg border border-clay-shadow-light">
          <div
            ref={scrollerRef}
            className="flex items-center gap-3 overflow-x-auto px-3 py-3 no-scrollbar min-h-[56px]"
            role="list"
            aria-label="Categorias em destaque"
          >
            {includeAllChip ? (
              <Link
                href="/categories"
                className="clay-chip flex items-center gap-2 px-4 py-2 border border-clay-shadow-light hover:shadow-md hover:border-blue-200 smooth-transition whitespace-nowrap"
                role="listitem"
              >
                <LayoutGrid className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-slate-900">Categorias</span>
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
                  className="clay-chip flex items-center gap-2 px-4 py-2 border border-clay-shadow-light hover:shadow-md hover:border-blue-200 smooth-transition whitespace-nowrap"
                  role="listitem"
                  aria-label={category.name}
                >
                  {customIconSrc ? (
                    <Image
                      src={customIconSrc}
                      alt={`Icon - ${category.name}`}
                      width={20}
                      height={20}
                      className="h-5 w-5 rounded-sm object-cover"
                    />
                  ) : (
                    <Icon className="h-5 w-5 text-blue-600" />
                  )}
                  <span className="text-sm font-medium text-slate-900">{category.name}</span>
                </Link>
              );
            })}
          </div>

          <div className="absolute inset-y-0 right-0 flex items-center pr-2 bg-gradient-to-l from-clay-surface via-clay-surface/70 to-transparent rounded-r-clay-lg">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => scrollBy(320)}
              className="h-9 w-9 clay-chip border border-clay-shadow-light bg-clay-surface/90 hover:bg-clay-surface"
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
