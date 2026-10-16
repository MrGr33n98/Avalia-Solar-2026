'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Building2, ChevronRight, Star } from 'lucide-react';

import ComparisonToggleButton from '@/components/ComparisonToggleButton';
import { CompanyVerifiedBadge } from '@/components/company/CompanyVerifiedBadge';
import { FavoriteButton } from '@/components/favorites/FavoriteButton';
import type { Company } from '@/lib/api';
import { buildCompanyPath } from '@/lib/slug';
import { cn } from '@/lib/utils';

interface HomeCompaniesRailProps {
  companies: Company[];
  title?: string;
  stateCode?: string;
  className?: string;
  viewAllHref?: string;
}

function publicRating(company: Company): { score: number; count: number } | null {
  const count = Number(company.rating_count ?? company.reviews_count ?? 0);
  const score = Number(company.average_rating ?? company.rating_avg ?? 0);
  if (count > 0 && score > 0) {
    return { score, count };
  }
  return null;
}

export function HomeCompaniesRail({
  companies,
  title,
  stateCode,
  className,
  viewAllHref = '/companies',
}: HomeCompaniesRailProps) {
  const displayTitle =
    title ||
    (stateCode
      ? `Empresas em destaque em ${stateCode.toUpperCase()}`
      : 'Empresas em destaque');
  const visibleCompanies = companies?.slice(0, 6) || [];

  if (visibleCompanies.length === 0) return null;

  return (
    <section
      className={cn('relative w-full px-4 py-4', className)}
      aria-labelledby="home-companies-title"
    >
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2
          id="home-companies-title"
          className="text-lg font-bold tracking-tight text-slate-950 sm:text-xl"
        >
          {displayTitle}
        </h2>
        <Link
          href={viewAllHref}
          className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-blue-600 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          Ver todas
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="grid min-w-0 grid-cols-[repeat(2,minmax(0,1fr))] auto-rows-fr gap-2.5 sm:gap-3 lg:grid-cols-3">
        {visibleCompanies.map((company) => {
          const companyHref = buildCompanyPath(company.slug, company.name, company.id);
          const logoUrl =
            typeof company.logo_url === 'string' ? company.logo_url.trim() : '';
          const rating = publicRating(company);

          return (
            <article
              key={company.id}
              className={cn(
                'relative flex min-h-[172px] min-w-0 flex-col rounded-xl border',
                'border-slate-200 bg-white p-2.5 shadow-xs',
                'transition-colors hover:border-slate-300 sm:p-3'
              )}
            >
              {/* Linha superior: logotipo e botão de favoritos */}
              <div className="flex min-w-0 items-start justify-between gap-1">
                <Link
                  href={companyHref}
                  aria-label={`Ver perfil de ${company.name}`}
                  className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  {logoUrl ? (
                    <Image
                      src={logoUrl}
                      alt={`Logotipo ${company.name}`}
                      fill
                      sizes="44px"
                      className="object-contain p-1"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-0.5 bg-slate-50 text-slate-500">
                      <Building2 className="h-5 w-5 text-slate-400" aria-label="Logotipo não informado" />
                    </div>
                  )}
                </Link>

                <FavoriteButton
                  favoritableType="Company"
                  favoritableId={company.id}
                  source="home_rail"
                  className="h-11 w-11 shrink-0 text-slate-500"
                />
              </div>

              {/* Linha da identidade: Nome em linha própria + selo verificado com shrink-0 */}
              <div className="mt-2 flex min-w-0 items-start gap-1">
                <h3 className="min-w-0 flex-1 break-words text-[12px] font-bold leading-4 text-slate-950 sm:text-sm">
                  <Link
                    href={companyHref}
                    title={company.name}
                    className="hover:text-blue-600 focus-visible:underline"
                  >
                    {company.name}
                  </Link>
                </h3>
                {company.verified === true && (
                  <span className="inline-flex shrink-0 pt-0.5">
                    <CompanyVerifiedBadge size="sm" className="!h-4 !w-4" />
                  </span>
                )}
              </div>

              {/* Avaliação real, sem fallback artificial 5.0 */}
              <div className="mt-1 flex min-w-0 items-center gap-1 text-[11px] leading-4">
                {rating ? (
                  <>
                    <Star
                      className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400"
                      aria-hidden="true"
                    />
                    <span className="font-bold tabular-nums text-slate-900">
                      {rating.score.toFixed(1)}
                    </span>
                    <span className="min-w-0 text-slate-500">({rating.count})</span>
                  </>
                ) : (
                  <span className="text-slate-500">Sem avaliações</span>
                )}
              </div>

              {/* Linha exclusiva para botão Comparar com 100% da largura */}
              <div className="mt-auto min-w-0 pt-2">
                <ComparisonToggleButton
                  company={company}
                  variant="default"
                  compactLabel
                  animated={false}
                  size="sm"
                  className={cn(
                    '!h-10 !w-full !min-w-0 !px-2 !text-[11px]',
                    'rounded-lg border-slate-200 font-semibold',
                    'hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-600'
                  )}
                />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default HomeCompaniesRail;
