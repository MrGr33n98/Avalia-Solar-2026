'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, ChevronLeft, Building2 } from 'lucide-react';
import { buildCompanyPath } from '@/lib/slug';
import { cn } from '@/lib/utils';
import type { Company } from '@/lib/api';

export interface BrandCardData {
  id: string | number;
  name: string;
  logoUrl?: string | null;
  href: string;
}

interface BrandLogoCardProps {
  name: string;
  logoUrl?: string | null;
  href: string;
  className?: string;
}

export function BrandLogoCard({ name, logoUrl, href, className }: BrandLogoCardProps) {
  const [imageError, setImageError] = React.useState(false);

  return (
    <Link
      href={href}
      title={name}
      aria-label={`Ver perfil de ${name}`}
      className={cn(
        'group relative flex h-[36px] w-[104px] shrink-0 snap-start items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white transition-all',
        'hover:border-blue-500 hover:shadow-xs active:scale-95',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1',
        className
      )}
    >
      {logoUrl && !imageError ? (
        <div className="relative h-full w-full">
          <Image
            src={logoUrl}
            alt={name}
            fill
            sizes="104px"
            className="object-contain p-0.5 transition-transform duration-200 group-hover:scale-105"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        </div>
      ) : (
        <div className="flex h-full w-full items-center justify-center gap-1 px-1.5">
          <Building2 className="h-3 w-3 shrink-0 text-slate-400" aria-hidden="true" />
          <span className="truncate text-[10px] font-semibold text-slate-700">
            {name}
          </span>
        </div>
      )}
    </Link>
  );
}

interface HomeBrandsRailProps {
  companies?: Company[];
  className?: string;
  title?: string;
}

export function HomeBrandsRail({
  companies = [],
  className,
  title = 'Marcas em destaque',
}: HomeBrandsRailProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  // Extrair empresas cadastradas reais que possuam logotipo próprio autêntico (RC-02: NUNCA usar selo de verificação como logotipo)
  const brandItems: BrandCardData[] = React.useMemo(() => {
    if (!companies || companies.length === 0) return [];

    const withRealLogos = companies.filter(
      (comp) => Boolean(comp.logo_url && typeof comp.logo_url === 'string' && comp.logo_url.trim().length > 0)
    );

    return withRealLogos.map((comp) => ({
      id: comp.id,
      name: comp.name,
      logoUrl: comp.logo_url!,
      href: buildCompanyPath(comp.slug, comp.name, comp.id),
    }));
  }, [companies]);

  const checkScroll = React.useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 6);
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
  }, [checkScroll, brandItems]);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const offset = direction === 'left' ? -260 : 260;
    el.scrollBy({ left: offset, behavior: 'smooth' });
  };

  if (brandItems.length === 0) return null;

  return (
    <section className={cn('relative px-4 py-2.5 select-none w-full', className)}>
      {/* Header da seção: Título à esquerda, Ver todas à direita */}
      <div className="flex items-center justify-between pb-2">
        <h2 className="text-sm font-bold text-slate-900">{title}</h2>
        <Link
          href="/companies"
          className="inline-flex items-center gap-0.5 text-xs font-semibold text-blue-600 transition hover:text-blue-700 focus-visible:outline-none focus-visible:underline"
        >
          <span>Ver todas</span>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>

      {/* Container horizontal com setas perfeitamente centralizadas */}
      <div className="relative w-full">
        {/* Seta de navegação esquerda (Desktop) */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => handleScroll('left')}
            aria-label="Rolar marcas para a esquerda"
            className="absolute -left-2 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full border border-slate-300 bg-white/95 p-1 text-slate-700 shadow-md backdrop-blur transition hover:bg-slate-50 hover:text-slate-950 active:scale-95 md:flex"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Trilha de cards: 104px x 36px, snap-x snap-mandatory, logos maximizados */}
        <div
          ref={scrollContainerRef}
          tabIndex={0}
          role="region"
          aria-label="Carrossel de marcas em destaque"
          className="flex w-full flex-nowrap items-center gap-2 overflow-x-auto pb-1 no-scrollbar snap-x snap-mandatory scroll-px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {brandItems.map((brand) => (
            <BrandLogoCard
              key={brand.id}
              name={brand.name}
              logoUrl={brand.logoUrl}
              href={brand.href}
            />
          ))}
        </div>

        {/* Seta de navegação direita (Desktop) */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => handleScroll('right')}
            aria-label="Rolar marcas para a direita"
            className="absolute -right-2 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full border border-slate-300 bg-white/95 p-1 text-slate-700 shadow-md backdrop-blur transition hover:bg-slate-50 hover:text-slate-950 active:scale-95 md:flex"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </section>
  );
}

export default HomeBrandsRail;
