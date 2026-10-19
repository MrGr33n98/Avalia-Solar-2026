'use client';

import * as React from 'react';
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

export function splitNameHeadTail(name: string): { head: string; tail: string } {
  const trimmed = name.trim();
  const lastSpaceIndex = trimmed.lastIndexOf(' ');

  if (lastSpaceIndex === -1) {
    if (trimmed.length <= 8) {
      return { head: '', tail: trimmed };
    }
    const splitPoint = trimmed.length - 8;
    return {
      head: trimmed.slice(0, splitPoint),
      tail: trimmed.slice(splitPoint),
    };
  }

  const prefix = trimmed.slice(0, lastSpaceIndex + 1);
  const lastWord = trimmed.slice(lastSpaceIndex + 1);

  if (lastWord.length <= 8) {
    return { head: prefix, tail: lastWord };
  }

  const splitPoint = lastWord.length - 8;
  return {
    head: prefix + lastWord.slice(0, splitPoint),
    tail: lastWord.slice(splitPoint),
  };
}

export function CompanyNameWithBadge({
  company,
  href,
}: {
  company: Company;
  href: string;
}) {
  if (!company.verified) {
    return (
      <h3 className="min-w-0 text-[12px] font-bold leading-4 text-slate-950 sm:text-sm">
        <Link
          href={href}
          title={company.name}
          className="break-words hover:text-blue-600 focus-visible:underline focus-visible:outline-none"
        >
          {company.name}
        </Link>
      </h3>
    );
  }

  const { head, tail } = splitNameHeadTail(company.name);

  return (
    <div className="relative min-w-0 text-[12px] font-bold leading-4 text-slate-950 sm:text-sm">
      <Link
        href={href}
        title={company.name}
        aria-label={`Ver perfil de ${company.name}`}
        className="absolute inset-0 z-10 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      />

      <h3 className="pointer-events-none min-w-0 [overflow-wrap:anywhere]">
        <span className="transition-colors group-hover:text-blue-600">
          {head}
          <span
            data-testid="company-name-tail"
            className="inline-flex items-center whitespace-nowrap gap-[3px]"
          >
            <span>{tail}</span>
            <span
              data-testid="verified-badge-anchor"
              className="pointer-events-auto relative z-20 inline-flex items-center shrink-0"
            >
              <CompanyVerifiedBadge size="sm" className="!h-4 !w-4" />
            </span>
          </span>
        </span>
      </h3>
    </div>
  );
}

export function HomeCompanyCard({ company }: { company: Company }) {
  const [logoError, setLogoError] = React.useState(false);
  const companyHref = buildCompanyPath(company.slug, company.name, company.id);
  const logoUrl =
    typeof company.logo_url === 'string' ? company.logo_url.trim() : '';
  const rating = publicRating(company);

  return (
    <article
      className={cn(
        'relative flex min-h-[160px] min-w-0 flex-col rounded-xl border',
        'border-slate-200 bg-white p-2.5 shadow-xs transition-colors',
        'hover:border-slate-300 sm:p-3'
      )}
    >
      {/* Linha 1: logo (48x48 no mobile / 56x56 em sm+) e botão de favoritos (alvo 44x44) */}
      <div className="flex min-w-0 items-start justify-between gap-1">
        <Link
          href={companyHref}
          aria-label={`Ver perfil de ${company.name}`}
          className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:h-14 sm:w-14"
        >
          {logoUrl && !logoError ? (
            <Image
              src={logoUrl}
              alt={`Logotipo ${company.name}`}
              fill
              sizes="(max-width: 639px) 48px, 56px"
              className="object-contain object-center"
              onError={() => setLogoError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-50">
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

      {/* Linha 2: selo ancorado no último trecho do nome, sem posição absoluta */}
      <div className="mt-2 min-w-0">
        <CompanyNameWithBadge company={company} href={companyHref} />
      </div>

      {/* Linha 3: dados confirmados, sem 5.0 forçado */}
      <div className="mt-1 min-w-0 text-[11px] leading-4 text-slate-500">
        {rating ? (
          <div className="flex items-center gap-1">
            <Star
              className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400"
              aria-hidden="true"
            />
            <span className="font-bold tabular-nums text-slate-900">
              {rating.score.toFixed(1)}
            </span>
            <span>({rating.count})</span>
          </div>
        ) : (
          <span>Sem avaliações</span>
        )}
      </div>

      {/* Linha 4: h-12 de toque (48px) e 34px visuais com home-compact */}
      <div className="mt-auto min-w-0 pt-1.5">
        <ComparisonToggleButton
          company={company}
          variant="home-compact"
          animated={false}
          size="sm"
        />
      </div>
    </article>
  );
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

      {/*
        Auto-rows-fr removido para dimensionamento natural por conteúdo.
        2 colunas a partir de 320px no mobile e 3 colunas em lg.
      */}
      <div className="grid min-w-0 grid-cols-1 items-stretch gap-2.5 min-[320px]:grid-cols-[repeat(2,minmax(0,1fr))] sm:gap-3 lg:grid-cols-3">
        {visibleCompanies.map((company) => (
          <HomeCompanyCard key={company.id} company={company} />
        ))}
      </div>
    </section>
  );
}

export default HomeCompaniesRail;
