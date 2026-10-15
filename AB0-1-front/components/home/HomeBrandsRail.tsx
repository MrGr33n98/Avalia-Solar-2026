'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BrandItem {
  id: string;
  name: string;
  slug: string;
  displayStyle?: {
    color?: string;
    fontWeight?: string;
    letterSpacing?: string;
  };
}

export const CATALOG_BRANDS: BrandItem[] = [
  {
    id: 'weg',
    name: 'WEG',
    slug: 'weg',
    displayStyle: { color: '#00579E', fontWeight: '900', letterSpacing: '0.05em' },
  },
  {
    id: 'intelbras',
    name: 'intelbras',
    slug: 'intelbras',
    displayStyle: { color: '#00A859', fontWeight: '800', letterSpacing: '-0.02em' },
  },
  {
    id: 'sungrow',
    name: 'SUNGROW',
    slug: 'sungrow',
    displayStyle: { color: '#F37021', fontWeight: '900', letterSpacing: '0.08em' },
  },
  {
    id: 'huawei',
    name: 'HUAWEI',
    slug: 'huawei',
    displayStyle: { color: '#CF0A2C', fontWeight: '800', letterSpacing: '0.04em' },
  },
  {
    id: 'solis',
    name: 'Solis',
    slug: 'solis',
    displayStyle: { color: '#0066B3', fontWeight: '800' },
  },
  {
    id: 'growatt',
    name: 'Growatt',
    slug: 'growatt',
    displayStyle: { color: '#55A51C', fontWeight: '800' },
  },
];

interface HomeBrandsRailProps {
  className?: string;
  title?: string;
}

export function HomeBrandsRail({
  className,
  title = 'Marcas em destaque',
}: HomeBrandsRailProps) {
  if (!CATALOG_BRANDS || CATALOG_BRANDS.length === 0) return null;

  return (
    <section className={cn('px-4 py-3 select-none w-full', className)}>
      <div className="flex items-center justify-between pb-2">
        <h2 className="text-sm font-bold text-slate-900">{title}</h2>
        <Link
          href="/companies"
          className="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-700"
        >
          <span>Ver todas</span>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>

      <div
        tabIndex={0}
        role="region"
        aria-label="Lista de marcas parceiras"
        className="flex w-full flex-nowrap items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {CATALOG_BRANDS.map((brand) => (
          <Link
            key={brand.id}
            href={`/companies?q=${encodeURIComponent(brand.name)}`}
            className="flex h-11 shrink-0 items-center justify-center rounded-xl border border-slate-200/90 bg-white px-4 py-2 shadow-xs transition-all hover:border-slate-300 hover:shadow active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <span
              className="text-xs font-extrabold select-none uppercase tracking-wide"
              style={brand.displayStyle}
            >
              {brand.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default HomeBrandsRail;
