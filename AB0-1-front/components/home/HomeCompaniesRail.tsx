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
      <h3 className="min-w-0 text-[12px] font-bold leading-4 text-slate-950 sm:text-sm lg:text-[13px] lg:leading-tight">
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
    <div className="relative min-w-0 text-[12px] font-bold leading-4 text-slate-950 sm:text-sm lg:text-[13px] lg:leading-tight">
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

export function HomeCompanyCard({
  company,
  desktopOnly = false,
}: {
  company: Company;
  desktopOnly?: boolean;
}) {
  const [logoError, setLogoError] = React.useState(false);
  const companyHref = buildCompanyPath(company.slug, company.name, company.id);
  const logoUrl =
    typeof company.logo_url === 'string' ? company.logo_url.trim() : '';
  const rating = publicRating(company);
  const hasValidLogo = Boolean(logoUrl) && !logoError;

  return (
    <article
      className={cn(
        'relative min-w-0 rounded-xl border border-slate-200 bg-white shadow-xs transition-colors hover:border-slate-300',
        desktopOnly ? 'hidden lg:grid' : 'flex flex-col lg:grid',
        'min-h-[160px] p-2.5 sm:p-3',
        'lg:min-h-[84px] lg:grid-cols-[44px_minmax(0,1fr)_auto_44px] lg:items-center lg:gap-x-2.5 lg:px-2.5 lg:py-2'
      )}
    >
      {/*
        Zona 1 (logo) e Zona 4 (favorito).
        No mobile: flex items-start justify-between gap-1 (logo à esquerda, favorito à direita).
        No desktop: lg:contents desmonta o wrapper e projeta os filhos nas colunas 1 e 4 do grid.
      */}
      <div className="flex min-w-0 items-start justify-between gap-1 lg:contents">
        <Link
          href={companyHref}
          aria-label={`Ver perfil de ${company.name}`}
          className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:h-14 sm:w-14 lg:col-start-1 lg:row-start-1 lg:h-11 lg:w-11"
        >
          {hasValidLogo ? (
            <Image
              src={logoUrl}
              alt={`Logotipo ${company.name}`}
              fill
              sizes="(min-width: 1024px) 44px, (min-width: 640px) 56px, 48px"
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
          className="h-11 w-11 shrink-0 text-slate-500 lg:col-start-4 lg:row-start-1"
        />
      </div>

      {/*
        Zona 2: Nome + Avaliação.
        No mobile: mt-2 min-w-0 abaixo da linha do logo.
        No desktop: lg:col-start-2 lg:row-start-1 lg:mt-0 centralizado verticalmente.
      */}
      <div className="mt-2 min-w-0 lg:col-start-2 lg:row-start-1 lg:mt-0 lg:flex lg:flex-col lg:justify-center">
        <CompanyNameWithBadge company={company} href={companyHref} />

        <div className="mt-1 min-w-0 text-[11px] leading-4 text-slate-500 lg:mt-0.5">
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
      </div>

      {/*
        Zona 3: Botão de Comparação.
        No mobile: mt-auto pt-1.5, largura total.
        No desktop: lg:col-start-3 lg:row-start-1 lg:mt-0 lg:pt-0 lg:w-auto lg:shrink-0.
      */}
      <div className="mt-auto min-w-0 pt-1.5 flex items-center justify-start lg:col-start-3 lg:row-start-1 lg:mt-0 lg:pt-0 lg:w-auto lg:shrink-0 lg:self-center">
        <ComparisonToggleButton
          company={company}
          variant="home-compact"
          size="sm"
        />
      </div>
    </article>
  );
}

import { useLocation } from '@/contexts/LocationContext';
import { publicCompaniesApi } from '@/lib/api-public';

export function HomeCompaniesRail({
  companies,
  title,
  stateCode,
  className,
  viewAllHref = '/companies',
}: HomeCompaniesRailProps) {
  const { selectedState, stateLabel } = useLocation();
  const effectiveState = stateCode || selectedState;

  const [dynamicCompanies, setDynamicCompanies] = React.useState<Company[] | null>(null);
  const [isFetching, setIsFetching] = React.useState(false);

  // Check if initial SSR companies already have local matches
  const localSsrMatches = React.useMemo(() => {
    if (!companies || companies.length === 0 || !effectiveState) return [];
    const normState = effectiveState.toUpperCase();
    return companies.filter((c) => {
      if (c.state?.toUpperCase() === normState) return true;
      if (c.coverage_states && Array.isArray(c.coverage_states)) {
        return c.coverage_states.some((s) => s.toUpperCase() === normState);
      }
      return false;
    });
  }, [companies, effectiveState]);

  React.useEffect(() => {
    if (!companies || companies.length === 0 || !effectiveState) {
      setDynamicCompanies(null);
      return;
    }

    if (localSsrMatches.length >= 6) {
      setDynamicCompanies(null);
      return;
    }

    let isMounted = true;
    setIsFetching(true);

    async function loadCompaniesForState() {
      try {
        let list = await publicCompaniesApi.getAll({
          serves_state: effectiveState,
          status: 'active',
          limit: 9,
          include:
            'logo_url,banner_url,badges,verified_badge_image_url,verified_badge_url,average_rating,rating_count,verified,city,state,coverage_cities,coverage_states,response_time_sla,delivered_projects_score,warranty_years',
        });

        if (!list || list.length === 0) {
          list = await publicCompaniesApi.getAll({
            state: effectiveState,
            status: 'active',
            limit: 9,
            include:
              'logo_url,banner_url,badges,verified_badge_image_url,verified_badge_url,average_rating,rating_count,verified,city,state,coverage_cities,coverage_states,response_time_sla,delivered_projects_score,warranty_years',
          });
        }

        if (isMounted) {
          setDynamicCompanies(list || []);
        }
      } catch (err) {
        console.warn('[HomeCompaniesRail] Erro ao buscar empresas para a UF:', effectiveState, err);
        if (isMounted) setDynamicCompanies([]);
      } finally {
        if (isMounted) setIsFetching(false);
      }
    }

    loadCompaniesForState();

    return () => {
      isMounted = false;
    };
  }, [effectiveState, localSsrMatches.length]);

  const { visibleCompanies, hasLocalMatches } = React.useMemo(() => {
    if (dynamicCompanies !== null) {
      if (dynamicCompanies.length > 0) {
        return { visibleCompanies: dynamicCompanies.slice(0, 9), hasLocalMatches: true };
      }
      return { visibleCompanies: (companies || []).slice(0, 9), hasLocalMatches: false };
    }

    if (!companies || companies.length === 0) {
      return { visibleCompanies: [], hasLocalMatches: false };
    }

    if (!effectiveState) {
      return { visibleCompanies: companies.slice(0, 9), hasLocalMatches: true };
    }

    if (localSsrMatches.length > 0) {
      const others = companies.filter((c) => !localSsrMatches.some((m) => m.id === c.id));
      return { visibleCompanies: [...localSsrMatches, ...others].slice(0, 9), hasLocalMatches: true };
    }

    return { visibleCompanies: companies.slice(0, 9), hasLocalMatches: false };
  }, [companies, effectiveState, dynamicCompanies, localSsrMatches]);

  const displayTitle =
    title ||
    (effectiveState
      ? hasLocalMatches
        ? `Empresas em destaque em ${stateLabel || effectiveState.toUpperCase()}`
        : `Empresas em destaque (atuação nacional)`
      : 'Empresas em destaque');

  const effectiveViewAll =
    viewAllHref === '/companies'
      ? `/companies?state=${encodeURIComponent(effectiveState)}`
      : viewAllHref;

  if (!companies || companies.length === 0 || visibleCompanies.length === 0) return null;

  return (
    <section
      className={cn('relative w-full px-4 py-4', className)}
      aria-labelledby="home-companies-title"
    >
      <div className="mb-3 flex flex-col gap-1">
        <div className="flex items-center justify-between gap-4">
          <h2
            id="home-companies-title"
            className="text-lg font-bold tracking-tight text-slate-950 sm:text-xl"
          >
            {displayTitle}
          </h2>
          <Link
            href={effectiveViewAll}
            className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-blue-600 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Ver todas
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        {!hasLocalMatches && effectiveState && dynamicCompanies !== null && (
          <p className="text-xs text-slate-500">
            Ainda não há empresas com sede cadastrada em {stateLabel || effectiveState}. Exibindo empresas em destaque com atuação nacional.
          </p>
        )}
      </div>

      {/*
        Grid responsivo:
        - Mobile (<320px): 1 coluna
        - Mobile (>=320px): 2 colunas
        - Desktop (>=1024px / lg): 3 colunas (3x3 com até 9 empresas)
      */}
      <div
        className={cn(
          'grid min-w-0 grid-cols-1 items-stretch gap-2.5 min-[320px]:grid-cols-[repeat(2,minmax(0,1fr))] sm:gap-3 lg:grid-cols-3 transition-opacity duration-200',
          isFetching && 'opacity-60'
        )}
      >
        {visibleCompanies.map((company, index) => (
          <HomeCompanyCard
            key={company.id}
            company={company}
            desktopOnly={index >= 6}
          />
        ))}
      </div>
    </section>
  );
}

export default HomeCompaniesRail;
