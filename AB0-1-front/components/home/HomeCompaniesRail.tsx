'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Building2, ChevronRight } from 'lucide-react';

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

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3">
        {visibleCompanies.map((company) => {
          const companyHref = buildCompanyPath(company.slug, company.name, company.id);
          const logoUrl =
            typeof company.logo_url === 'string' ? company.logo_url.trim() : '';

          return (
            <article
              key={company.id}
              className="relative flex min-w-0 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-2.5 shadow-xs transition hover:border-slate-300 hover:shadow-md sm:p-3"
            >
              <div className="flex min-w-0 items-start gap-2 sm:gap-3">
                <Link
                  href={companyHref}
                  aria-label={`Ver perfil de ${company.name}`}
                  className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-white sm:h-16 sm:w-16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  {logoUrl ? (
                    <Image
                      src={logoUrl}
                      alt={`Logotipo ${company.name}`}
                      fill
                      sizes="96px"
                      className="object-contain p-1.5"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-0.5 bg-slate-50 text-slate-500">
                      <Building2 className="h-5 w-5 text-slate-400" aria-hidden="true" />
                      <span className="text-[9px] font-semibold">Avalia</span>
                    </div>
                  )}
                </Link>

                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex items-start justify-between gap-1">
                    <h3 className="min-w-0 flex-1 truncate text-xs font-bold leading-tight text-slate-950 sm:text-sm">
                      <Link
                        href={companyHref}
                        className="truncate hover:text-blue-600 focus-visible:outline-none focus-visible:underline"
                        title={company.name}
                      >
                        {company.name}
                      </Link>
                    </h3>
                    <FavoriteButton
                      favoritableType="Company"
                      favoritableId={company.id}
                      source="home_rail"
                      className="h-7 w-7 shrink-0 rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-600 sm:h-8 sm:w-8"
                    />
                  </div>

                  <div className="mt-2">
                    <ComparisonToggleButton
                      company={company}
                      variant="card"
                      compactLabel
                      className="h-8 w-full text-xs font-medium"
                    />
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default HomeCompaniesRail;
