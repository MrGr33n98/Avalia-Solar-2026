'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LayoutGrid,
  Heart,
  BadgePercent,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Category } from '@/lib/api';

export interface CategoryRailItem {
  id: string | number;
  label: string;
  slug: string;
  icon3d: string;
}

export const ALL_3D_CATEGORIES: CategoryRailItem[] = [
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
    id: 'rural',
    label: 'Rural & Agro',
    slug: 'energia-solar-rural-e-agronegocio',
    icon3d: '/3d-refined/A05_energia-solar-rural-e-agronegocio-256.webp',
  },
  {
    id: 'inversores',
    label: 'Inversores',
    slug: 'inversores',
    icon3d: '/3d-refined/A08_inversores-256.webp',
  },
  {
    id: 'paineis',
    label: 'Painéis Solares',
    slug: 'paineis-solares',
    icon3d: '/3d-refined/A10_paineis-solares-256.webp',
  },
  {
    id: 'baterias',
    label: 'Baterias',
    slug: 'baterias-e-armazenamento-de-energia',
    icon3d: '/3d-refined/A01_baterias-e-armazenamento-de-energia-256.webp',
  },
  {
    id: 'carregadores',
    label: 'Carregadores VE',
    slug: 'carregadores-residenciais-wallbox',
    icon3d: '/3d-refined/D02_carregadores-residenciais-wallbox-256.webp',
  },
  {
    id: 'carport',
    label: 'Carport Solar',
    slug: 'carport-solar-e-coberturas-solares',
    icon3d: '/3d-refined/A02_carport-solar-e-coberturas-solares-256.webp',
  },
  {
    id: 'instaladores',
    label: 'Instaladores',
    slug: 'instaladores-de-energia-solar',
    icon3d: '/3d-refined/A07_instaladores-de-energia-solar-256.webp',
  },
  {
    id: 'financiamento',
    label: 'Financiamento',
    slug: 'financiamento-de-energia-solar',
    icon3d: '/3d-refined/A06_financiamento-de-energia-solar-256.webp',
  },
  {
    id: 'mercado-livre',
    label: 'Mercado Livre',
    slug: 'mercado-livre-de-energia',
    icon3d: '/3d-refined/C01_mercado-livre-de-energia-256.webp',
  },
  {
    id: 'kits-offgrid',
    label: 'Kits Off-Grid',
    slug: 'kits-solares-para-autossuficiencia',
    icon3d: '/3d-refined/G01_kits-solares-para-autossuficiencia-256.webp',
  },
  {
    id: 'veiculos-eletricos',
    label: 'Veículos Elétricos',
    slug: 'veiculos-eletricos',
    icon3d: '/3d-refined/D06_veiculos-eletricos-256.webp',
  },
  {
    id: 'frotas',
    label: 'Frotas Elétricas',
    slug: 'frotas-eletricas-corporativas',
    icon3d: '/3d-refined/B01_frotas-eletricas-corporativas-256.webp',
  },
  {
    id: 'estruturas',
    label: 'Estruturas',
    slug: 'estruturas-e-fixacao',
    icon3d: '/3d-refined/A12_estruturas-e-fixacao-256.webp',
  },
  {
    id: 'monitoramento',
    label: 'Monitoramento',
    slug: 'monitoramento-e-o-e-m',
    icon3d: '/3d-refined/A09_monitoramento-e-o-e-m-256.webp',
  },
  {
    id: 'credito-verde',
    label: 'Crédito Verde',
    slug: 'linhas-de-credito-verde',
    icon3d: '/3d-refined/H02_linhas-de-credito-verde-256.webp',
  },
  {
    id: 'seguros',
    label: 'Seguros',
    slug: 'seguradoras-para-solar-e-ve',
    icon3d: '/3d-refined/H03_seguradoras-para-solar-e-ve-256.webp',
  },
  {
    id: 'smart-grid',
    label: 'Smart Grid',
    slug: 'integracao-smart-grid',
    icon3d: '/3d-refined/F02_integracao-smart-grid-256.webp',
  },
  {
    id: 'projetos',
    label: 'Projetos',
    slug: 'simulacao-e-projeto-solar',
    icon3d: '/3d-refined/F04_simulacao-e-projeto-solar-256.webp',
  },
];

// Compatibilidade retroativa
export const PRIMARY_3D_CATEGORIES = ALL_3D_CATEGORIES;

interface HomeCategoryRailProps {
  categories?: Category[];
  className?: string;
}

export function HomeCategoryRail({ className }: HomeCategoryRailProps) {
  const pathname = usePathname();
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  const checkScroll = React.useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 8);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 8);
  }, []);

  React.useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll, { passive: true });

    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll]);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = direction === 'left' ? -320 : 320;
    el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const isTudoActive = pathname === '/' || pathname === '/companies';

  return (
    <nav
      aria-label="Barra de navegação de categorias"
      className={cn('relative w-full border-b border-slate-200/80 bg-white py-1', className)}
    >
      {/* Botão Seta Esquerda (Desktop) */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => handleScroll('left')}
          aria-label="Ver categorias anteriores"
          className="absolute left-1 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full border border-slate-300 bg-white/95 p-1.5 text-slate-700 shadow-md backdrop-blur transition hover:bg-slate-50 hover:text-slate-950 active:scale-95 md:flex"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      {/* Fade esquerdo quando há scroll */}
      {canScrollLeft && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 bottom-0 z-10 hidden w-10 bg-gradient-to-r from-white via-white/80 to-transparent md:block"
        />
      )}

      {/* Container horizontal com scroll */}
      <div
        ref={scrollContainerRef}
        tabIndex={0}
        role="region"
        aria-label="Todas as categorias em uma linha"
        className="flex w-full flex-nowrap items-center gap-1.5 overflow-x-auto px-4 py-1 no-scrollbar focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* 1. Botão Categorias ∨ (abre catálogo completo) */}
        <Link
          href="/categories"
          className="group flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <LayoutGrid className="h-4 w-4 text-purple-600 transition group-hover:scale-110" />
          <span>Categorias</span>
          <ChevronDown className="h-3.5 w-3.5 text-slate-500 transition group-hover:translate-y-0.5" />
        </Link>

        {/* 2. Botão Favoritos (coração) */}
        <Link
          href="/review-dashboard/favorites"
          className="group flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Heart className="h-4 w-4 text-rose-500 fill-rose-500 transition group-hover:scale-110" />
          <span>Favoritos</span>
        </Link>

        {/* 3. Botão Simulador / Cupons */}
        <Link
          href="/calculadora"
          className="group flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <BadgePercent className="h-4 w-4 text-amber-500 transition group-hover:scale-110" />
          <span>Simulador</span>
        </Link>

        {/* Divisor vertical sutil */}
        <div className="h-5 w-[1px] shrink-0 bg-slate-200 mx-1" aria-hidden="true" />

        {/* 4. Item 'Tudo' (ativo por padrão na Home com linha indicadora inferior) */}
        <Link
          href="/companies"
          className={cn(
            'group relative flex shrink-0 items-center gap-2 px-3 py-1.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
            isTudoActive
              ? 'font-bold text-slate-950'
              : 'font-medium text-slate-700 hover:text-slate-950'
          )}
        >
          <div className="relative h-6 w-6 shrink-0">
            <Image
              src="/3d-refined/A11_energia-solar-256.webp"
              alt="Tudo"
              width={28}
              height={28}
              className="h-6 w-6 object-contain transition group-hover:scale-110"
              priority
            />
          </div>
          <span>Tudo</span>
          {isTudoActive && (
            <span
              className="absolute -bottom-[5px] left-2 right-2 h-[2.5px] rounded-full bg-slate-950"
              aria-hidden="true"
            />
          )}
        </Link>

        {/* 5. Todas as categorias com ícone 3D e rótulo na mesma linha */}
        {ALL_3D_CATEGORIES.map((cat) => {
          const href = `/categories/${cat.slug}`;
          const isActive = pathname === href;

          return (
            <Link
              key={cat.id}
              href={href}
              className={cn(
                'group relative flex shrink-0 items-center gap-2 px-3 py-1.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                isActive
                  ? 'font-bold text-slate-950'
                  : 'font-medium text-slate-700 hover:text-slate-950'
              )}
            >
              <div className="relative h-6 w-6 shrink-0">
                <Image
                  src={cat.icon3d}
                  alt={cat.label}
                  width={28}
                  height={28}
                  className="h-6 w-6 object-contain transition group-hover:scale-110"
                  loading="lazy"
                />
              </div>
              <span className="whitespace-nowrap">{cat.label}</span>
              {isActive && (
                <span
                  className="absolute -bottom-[5px] left-2 right-2 h-[2.5px] rounded-full bg-slate-950"
                  aria-hidden="true"
                />
              )}
            </Link>
          );
        })}
      </div>

      {/* Fade direito quando há mais conteúdo */}
      {canScrollRight && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0 bottom-0 z-10 hidden w-10 bg-gradient-to-l from-white via-white/80 to-transparent md:block"
        />
      )}

      {/* Botão Seta Direita (Desktop) */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => handleScroll('right')}
          aria-label="Ver mais categorias"
          className="absolute right-1 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full border border-slate-300 bg-white/95 p-1.5 text-slate-700 shadow-md backdrop-blur transition hover:bg-slate-50 hover:text-slate-950 active:scale-95 md:flex"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </nav>
  );
}

export default HomeCategoryRail;
