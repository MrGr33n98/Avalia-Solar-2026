'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { Category } from '@/lib/api';

export interface CategoryRailItem {
  id: string | number;
  label: string;
  slug: string;
  icon3d: string;
}

export const PRIMARY_3D_CATEGORIES: CategoryRailItem[] = [
  {
    id: 'solar',
    label: 'Solar',
    slug: 'energia-solar',
    icon3d: '/3d-refined/A11_energia-solar-256.webp',
  },
  {
    id: 'residencial',
    label: 'Residencial',
    slug: 'energia-solar-residencial',
    icon3d: '/3d-refined/A04_energia-solar-residencial-256.webp',
  },
  {
    id: 'comercial',
    label: 'Comercial',
    slug: 'energia-solar-comercial-e-industrial',
    icon3d: '/3d-refined/A03_energia-solar-comercial-e-industrial-256.webp',
  },
  {
    id: 'carregadores',
    label: 'Carregadores',
    slug: 'carregadores-residenciais-wallbox',
    icon3d: '/3d-refined/D02_carregadores-residenciais-wallbox-256.webp',
  },
  {
    id: 'baterias',
    label: 'Baterias',
    slug: 'baterias-e-armazenamento-de-energia',
    icon3d: '/3d-refined/A01_baterias-e-armazenamento-de-energia-256.webp',
  },
  {
    id: 'carport',
    label: 'Carport',
    slug: 'carport-solar-e-coberturas-solares',
    icon3d: '/3d-refined/A02_carport-solar-e-coberturas-solares-256.webp',
  },
];

interface HomeCategoryRailProps {
  categories?: Category[];
  className?: string;
}

export function HomeCategoryRail({ className }: HomeCategoryRailProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <nav
      aria-label="Categorias principais"
      className={cn('w-full select-none py-1.5', className)}
    >
      <div
        tabIndex={0}
        role="region"
        aria-label="Lista de categorias em uma linha"
        className="flex w-full flex-nowrap items-center gap-3 overflow-x-auto px-4 pb-2 pt-1 no-scrollbar focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {PRIMARY_3D_CATEGORIES.map((cat) => {
          const href = `/categories/${cat.slug}`;
          const isActive = pathname === href || searchParams?.get('category') === cat.slug;

          return (
            <Link
              key={cat.id}
              href={href}
              className={cn(
                'group flex shrink-0 flex-col items-center gap-1.5 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl transition-transform active:scale-95'
              )}
            >
              <div
                className={cn(
                  'relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl border transition-all p-2',
                  isActive
                    ? 'border-blue-600 bg-blue-50/80 shadow-sm ring-2 ring-blue-500/20'
                    : 'border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-sm'
                )}
              >
                <Image
                  src={cat.icon3d}
                  alt={cat.label}
                  width={56}
                  height={56}
                  loading="eager"
                  className="h-10 w-10 sm:h-11 sm:w-11 object-contain transition-transform duration-200 group-hover:scale-110"
                />
              </div>
              <span
                className={cn(
                  'text-[11px] sm:text-xs font-semibold leading-tight max-w-[68px] truncate',
                  isActive
                    ? 'text-blue-700 font-bold'
                    : 'text-slate-700 group-hover:text-slate-950'
                )}
              >
                {cat.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default HomeCategoryRail;
