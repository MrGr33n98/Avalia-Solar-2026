'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  LayoutGrid,
  TrendingUp,
  Wrench,
  BatteryCharging,
  Car,
  Zap,
  Leaf,
} from 'lucide-react';
import { track } from '@/lib/analytics/lazy';
import { cn } from '@/lib/utils';

const HIGHLIGHTS = [
  {
    id: 'todos',
    title: 'Todos os Artigos',
    href: '/blog',
    icon: LayoutGrid,
    categoryKey: null,
  },
  {
    id: 'economia',
    title: 'Economia & Tarifas',
    href: '/blog?category=financiamento-energia-solar',
    icon: TrendingUp,
    categoryKey: 'financiamento-energia-solar',
  },
  {
    id: 'instalacao',
    title: 'Instalação Solar',
    href: '/blog?category=energia-solar-residencial',
    icon: Wrench,
    categoryKey: 'energia-solar-residencial',
  },
  {
    id: 'baterias',
    title: 'Baterias e Armazenamento',
    href: '/blog?category=baterias',
    icon: BatteryCharging,
    categoryKey: 'baterias',
  },
  {
    id: 'mobilidade',
    title: 'Mobilidade Elétrica',
    href: '/blog?category=mobilidade-eletrica',
    icon: Car,
    categoryKey: 'mobilidade-eletrica',
  },
  {
    id: 'mercado-livre',
    title: 'Mercado Livre',
    href: '/blog?category=mercado-livre-de-energia',
    icon: Zap,
    categoryKey: 'mercado-livre-de-energia',
  },
  {
    id: 'sustentabilidade',
    title: 'Sustentabilidade',
    href: '/blog?category=sustentabilidade',
    icon: Leaf,
    categoryKey: 'sustentabilidade',
  },
];

export function CategoryHighlights() {
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get('category');

  return (
    <div className="py-3">
      <div className="max-w-7xl mx-auto">
        <nav
          className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1"
          aria-label="Categorias do blog"
        >
          {HIGHLIGHTS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.id === 'todos'
                ? !currentCategory
                : currentCategory === item.categoryKey;

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  'inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-semibold transition-all duration-150 shrink-0 border',
                  isActive
                    ? 'border-[#FFD21F] bg-[#FFD21F] text-[#101114] shadow-sm font-bold'
                    : 'border-[#E8EAED] bg-white text-[#475467] hover:border-slate-300 hover:text-[#101114] hover:bg-slate-50 shadow-[0_1px_3px_rgba(16,17,20,0.02)]'
                )}
                onClick={() =>
                  track('blog_category_click', {
                    category_id: item.id,
                    category_name: item.title,
                    element_type: 'highlight_tab',
                  })
                }
              >
                <Icon
                  className={cn(
                    'h-3.5 w-3.5',
                    isActive ? 'text-[#101114]' : 'text-[#667085]'
                  )}
                  aria-hidden="true"
                />
                {item.title}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
