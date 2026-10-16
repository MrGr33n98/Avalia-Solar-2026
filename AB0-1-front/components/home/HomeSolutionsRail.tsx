'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { HomeFeaturedChip } from './HomeFeaturedChip';

export interface SolutionItem {
  id: string;
  name: string;
  canonicalSlug: string;
  src: string;
  desc: string;
}

export const SOLUTIONS: SolutionItem[] = [
  {
    id: 'residencial',
    name: 'Energia Solar Residencial',
    canonicalSlug: 'energia-solar-residencial',
    src: '/3d-refined/energia-solar-residencial.png',
    desc: 'Casas e condomínios',
  },
  {
    id: 'comercial',
    name: 'Energia Solar Comercial',
    canonicalSlug: 'energia-solar-comercial',
    src: '/3d-refined/energia-solar-comercial.png',
    desc: 'Empresas e comércios',
  },
  {
    id: 'rural',
    name: 'Energia Solar Rural',
    canonicalSlug: 'energia-solar-rural',
    src: '/3d-refined/energia-solar-rural.png',
    desc: 'Agronegócio e fazendas',
  },
  {
    id: 'industrial',
    name: 'Energia Solar Industrial',
    canonicalSlug: 'energia-solar-industrial',
    src: '/3d-refined/energia-solar-industrial.png',
    desc: 'Indústrias e galpões',
  },
  {
    id: 'carregador-veicular',
    name: 'Carregador Veicular Solar',
    canonicalSlug: 'carregador-veicular-solar',
    src: '/3d-refined/carregador-veicular-solar.png',
    desc: 'Mobilidade elétrica',
  },
  {
    id: 'bombeamento',
    name: 'Bombeamento Solar',
    canonicalSlug: 'bombeamento-solar',
    src: '/3d-refined/bombeamento-solar.png',
    desc: 'Irrigação e poços artesianos',
  },
  {
    id: 'baterias',
    name: 'Baterias & Nobreak Solar',
    canonicalSlug: 'baterias-nobreak-solar',
    src: '/3d-refined/baterias-nobreak-solar.png',
    desc: 'Armazenamento off-grid e híbrido',
  },
  {
    id: 'manutencao',
    name: 'Manutenção & Monitoramento',
    canonicalSlug: 'manutencao-monitoramento-solar',
    src: '/3d-refined/manutencao-monitoramento-solar.png',
    desc: 'O&M e limpeza de painéis',
  },
];

export interface HomeSolutionsRailProps {
  className?: string;
}

export function HomeSolutionsRail({ className }: HomeSolutionsRailProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  const checkScroll = React.useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  React.useEffect(() => {
    checkScroll();
    const el = scrollContainerRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distance = direction === 'left' ? -320 : 320;
    el.scrollBy({ left: distance, behavior: 'smooth' });
  };

  return (
    <section aria-labelledby="home-solutions-title" className={className}>
      <div className="mb-2 flex items-center justify-between">
        <h2 id="home-solutions-title" className="text-base font-bold text-slate-900 sm:text-lg">
          Produtos em destaque
        </h2>
      </div>

      <div className="relative">
        {canScrollLeft ? (
          <button
            type="button"
            onClick={() => scroll('left')}
            aria-label="Ver soluções anteriores"
            className="absolute -left-2 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-md hover:bg-slate-50 md:flex"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        ) : null}

        <div
          ref={scrollContainerRef}
          role="region"
          aria-label="Produtos em destaque"
          tabIndex={0}
          className="flex w-full min-w-0 snap-x snap-proximity items-center gap-2 overflow-x-auto pb-1 no-scrollbar focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {SOLUTIONS.map((solution) => (
            <HomeFeaturedChip
              key={solution.id}
              href={`/categories/${solution.canonicalSlug}`}
              name={solution.name}
              slug={solution.canonicalSlug}
              iconUrl={solution.src}
            />
          ))}
        </div>

        {canScrollRight ? (
          <button
            type="button"
            onClick={() => scroll('right')}
            aria-label="Ver mais soluções"
            className="absolute -right-2 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-md hover:bg-slate-50 md:flex"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </section>
  );
}

export default HomeSolutionsRail;
