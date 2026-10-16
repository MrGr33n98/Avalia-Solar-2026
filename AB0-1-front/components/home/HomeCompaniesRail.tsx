'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, ChevronRight, ChevronLeft, MapPin, Building2 } from 'lucide-react';
import { CompanyVerifiedBadge } from '@/components/company/CompanyVerifiedBadge';
import { FavoriteButton } from '@/components/favorites/FavoriteButton';
import { buildCompanyPath } from '@/lib/slug';
import { cn } from '@/lib/utils';
import type { Company } from '@/lib/api';

interface HomeCompaniesRailProps {
  companies: Company[];
  title?: string;
  stateCode?: string;
  className?: string;
  viewAllHref?: string;
}

export function HomeCompaniesRail({
  companies,
  title,
  stateCode,
  className,
  viewAllHref = '/companies',
}: HomeCompaniesRailProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  const displayTitle = React.useMemo(() => {
    if (title) return title;
    if (stateCode) return `Empresas em destaque em ${stateCode.toUpperCase()}`;
    return 'Empresas em destaque no catálogo';
  }, [title, stateCode]);

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
  }, [checkScroll, companies]);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const offset = direction === 'left' ? -380 : 380;
    el.scrollBy({ left: offset, behavior: 'smooth' });
  };

  if (!companies || companies.length === 0) return null;

  return (
    <section className={cn('relative px-4 py-3 select-none w-full', className)}>
      <div className="flex items-center justify-between pb-2.5">
        <h2 className="text-sm font-bold text-slate-900 line-clamp-1">{displayTitle}</h2>
        <Link
          href={viewAllHref}
          className="inline-flex shrink-0 items-center text-xs font-semibold text-blue-600 hover:text-blue-700"
        >
          <span>Ver todas</span>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>

      {/* Seta de navegação esquerda (Desktop) */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => handleScroll('left')}
          aria-label="Ver empresas anteriores"
          className="absolute left-2 top-[55%] z-20 hidden -translate-y-1/2 items-center justify-center rounded-full border border-slate-300 bg-white/95 p-1.5 text-slate-700 shadow-md backdrop-blur transition hover:bg-slate-50 hover:text-slate-950 active:scale-95 md:flex"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      <div
        ref={scrollContainerRef}
        tabIndex={0}
        role="region"
        aria-label="Lista de empresas recomendadas"
        className="flex w-full flex-nowrap items-stretch gap-2.5 overflow-x-auto pb-2 no-scrollbar snap-x snap-mandatory scroll-px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {companies.slice(0, 10).map((company) => {
          const companyHref = buildCompanyPath(company.slug, company.name, company.id);
          const location = [company.city, company.state].filter(Boolean).join(', ');
          const hasRating = typeof company.average_rating === 'number' && company.average_rating > 0;
          const reviewsCount = company.rating_count || company.reviews_count || 0;

          const bannerUrl = typeof company.banner_url === 'string' ? company.banner_url.trim() : '';
          const logoUrl = typeof company.logo_url === 'string' ? company.logo_url.trim() : '';
          const hasBanner = Boolean(bannerUrl);
          const hasLogo = Boolean(logoUrl);

          // Tags de especialidade seguras (dados reais de services ou categories)
          const tags: string[] =
            Array.isArray(company.services) && company.services.length > 0
              ? company.services.slice(0, 2)
              : Array.isArray(company.categories) && company.categories.length > 0
              ? company.categories.map((c) => c.name).slice(0, 2)
              : company.category
              ? [company.category]
              : [];

          return (
            <div
              key={company.id}
              className="flex w-[196px] sm:w-[208px] shrink-0 snap-start flex-col rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden transition-all hover:border-slate-300 hover:shadow-sm"
            >
              {/* Área de mídia compacta (84-88px, ~30% mais baixa que os 112-128px anteriores) */}
              <div className="relative h-[84px] sm:h-[88px] w-full overflow-hidden bg-slate-50/80">
                <Link href={companyHref} className="block h-full w-full">
                  {hasBanner ? (
                    <Image
                      src={bannerUrl}
                      alt={`Imagem de capa de ${company.name}`}
                      fill
                      sizes="(max-width: 640px) 196px, 208px"
                      className="h-full w-full object-cover object-center transition-transform duration-300 hover:scale-105"
                    />
                  ) : hasLogo ? (
                    <div className="relative flex h-full w-full items-center justify-center bg-white p-2">
                      <Image
                        src={logoUrl}
                        alt={`Logotipo ${company.name}`}
                        fill
                        sizes="(max-width: 640px) 196px, 208px"
                        className="object-contain object-center transition-transform duration-300 hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-slate-100 text-slate-400">
                      <Building2 className="h-6 w-6 text-slate-300" aria-hidden="true" />
                      <span className="text-[10px] font-medium text-slate-500">Avalia Solar</span>
                    </div>
                  )}
                </Link>

                {/* Botão de favoritar autenticado no canto superior direito */}
                <div className="absolute right-1.5 top-1.5 z-10">
                  <FavoriteButton
                    favoritableType="Company"
                    favoritableId={company.id}
                    source="home_rail"
                    className="h-7 w-7 rounded-full bg-white/90 shadow-xs backdrop-blur-xs hover:bg-white text-slate-600 hover:text-red-500"
                  />
                </div>
              </div>

              {/* Informações da empresa - padding reduzido para 10px (p-2.5) */}
              <div className="flex flex-1 flex-col p-2.5">
                {/* Nome da empresa e selo azul verificado adjacente sem afastar para a direita */}
                <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 leading-snug break-words">
                  <Link
                    href={companyHref}
                    className="hover:text-blue-600 focus-visible:outline-none focus-visible:underline"
                    title={company.name}
                  >
                    {company.name}
                  </Link>
                  {company.verified && (
                    <span className="inline-flex items-center align-middle ml-1 shrink-0">
                      <CompanyVerifiedBadge size="sm" />
                    </span>
                  )}
                </h3>

                {/* Avaliações reais ou 'Sem avaliações' */}
                <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-600">
                  {hasRating ? (
                    <>
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" aria-hidden="true" />
                      <span className="font-bold text-slate-900">{company.average_rating?.toFixed(1)}</span>
                      {reviewsCount > 0 && (
                        <span className="text-slate-500">({reviewsCount} avaliações)</span>
                      )}
                    </>
                  ) : (
                    <span className="text-[10px] text-slate-400">Sem avaliações</span>
                  )}
                </div>

                {/* Localização real */}
                {location && (
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500 truncate">
                    <MapPin className="h-3 w-3 shrink-0 text-slate-400" aria-hidden="true" />
                    <span className="truncate">{location}</span>
                  </div>
                )}

                {/* Chips de tags reais se existirem */}
                {tags.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-auto pt-2">
                  <Link
                    href={companyHref}
                    className="flex h-[30px] w-full items-center justify-center rounded-lg bg-slate-50 py-1 text-xs font-semibold text-blue-600 border border-slate-200/80 transition-colors hover:bg-blue-50 hover:border-blue-200"
                  >
                    Ver perfil
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Seta de navegação direita (Desktop) */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => handleScroll('right')}
          aria-label="Ver mais empresas"
          className="absolute right-2 top-[55%] z-20 hidden -translate-y-1/2 items-center justify-center rounded-full border border-slate-300 bg-white/95 p-1.5 text-slate-700 shadow-md backdrop-blur transition hover:bg-slate-50 hover:text-slate-950 active:scale-95 md:flex"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </section>
  );
}

export default HomeCompaniesRail;
