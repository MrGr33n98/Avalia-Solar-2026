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
import { CompanyDirectoryRow } from '@/components/companies/CompanyDirectoryRow';
import { track } from '@/lib/analytics/consolidated';

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
  targetState,
}: {
  company: Company;
  desktopOnly?: boolean;
  targetState?: string;
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

        <div className="mt-1 flex flex-wrap items-center gap-1.5 min-w-0 text-[11px] leading-4 text-slate-500 lg:mt-0.5">
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

          {targetState && company.state && company.state.toUpperCase() !== targetState.toUpperCase() && (
            <>
              <span className="text-slate-300 select-none">•</span>
              <span className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-medium text-slate-600">
                Atende {targetState.toUpperCase()}
              </span>
            </>
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

import { useQuery, QueryClient, QueryClientContext } from '@tanstack/react-query';
import { useLocation } from '@/contexts/LocationContext';
import { publicCompaniesApi } from '@/lib/api-public';

let fallbackClient: QueryClient | null = null;
function getFallbackQueryClient(): QueryClient {
  if (!fallbackClient) {
    fallbackClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 60 * 1000,
        },
      },
    });
  }
  return fallbackClient;
}

export function HomeCompaniesRail({
  companies,
  title,
  stateCode,
  className,
  viewAllHref = '/companies',
}: HomeCompaniesRailProps) {
  const contextClient = React.useContext(QueryClientContext);
  const activeQueryClient = contextClient || getFallbackQueryClient();

  const { selectedState, stateLabel } = useLocation();
  const effectiveState = (stateCode || selectedState || '').trim();
  const normalizedState = effectiveState.toUpperCase();

  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('avalia.company_view_mode.v1');
      if (stored === 'list' || stored === 'grid') {
        setViewMode(stored);
      } else if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setViewMode('list');
      }
    } catch {
      // Silencia restrição de localStorage
    }
  }, []);

  const handleViewModeChange = React.useCallback((mode: 'grid' | 'list') => {
    setViewMode(mode);
    try {
      localStorage.setItem('avalia.company_view_mode.v1', mode);
    } catch {
      // Silencia restrição de localStorage
    }
    track('company_view_mode_changed', { mode, source: 'home_rail' });
  }, []);

  // Check if initial SSR companies already have local matches
  const localSsrMatches = React.useMemo(() => {
    if (!companies || companies.length === 0 || !normalizedState) return [];
    return companies.filter((c) => {
      if (c.state?.toUpperCase() === normalizedState) return true;
      if (c.coverage_states && Array.isArray(c.coverage_states)) {
        return c.coverage_states.some((s) => s.toUpperCase() === normalizedState);
      }
      return false;
    });
  }, [companies, normalizedState]);

  // Query is needed when an effectiveState is present and SSR does not already have 6+ matches
  const needsQuery = Boolean(normalizedState && localSsrMatches.length < 6);

  const {
    data: queryCompanies,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['home-companies', 'regional', normalizedState, 'v2'],
    queryFn: async ({ signal }) => {
      const list = await publicCompaniesApi.getAll(
        {
          serves_state: normalizedState,
          status: 'active',
          limit: 9,
          fields: 'card',
          include:
            'logo_url,banner_url,badges,verified_badge_image_url,verified_badge_url,average_rating,rating_count,verified,city,state,coverage_cities,coverage_states,response_time_sla,delivered_projects_score,warranty_years',
        },
        { signal }
      );
      return Array.isArray(list) ? list : [];
    },
    enabled: needsQuery,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  }, activeQueryClient);

  const { visibleCompanies, hasLocalMatches } = React.useMemo(() => {
    if (needsQuery) {
      if (queryCompanies !== undefined) {
        if (queryCompanies.length > 0) {
          return { visibleCompanies: queryCompanies.slice(0, 9), hasLocalMatches: true };
        }
        return { visibleCompanies: (companies || []).slice(0, 9), hasLocalMatches: false };
      }
      if (localSsrMatches.length > 0) {
        const others = (companies || []).filter((c) => !localSsrMatches.some((m) => m.id === c.id));
        return { visibleCompanies: [...localSsrMatches, ...others].slice(0, 9), hasLocalMatches: true };
      }
      return { visibleCompanies: (companies || []).slice(0, 9), hasLocalMatches: false };
    }

    if (!companies || companies.length === 0) {
      return { visibleCompanies: [], hasLocalMatches: false };
    }

    if (!normalizedState) {
      return { visibleCompanies: companies.slice(0, 9), hasLocalMatches: true };
    }

    if (localSsrMatches.length > 0) {
      const others = companies.filter((c) => !localSsrMatches.some((m) => m.id === c.id));
      return { visibleCompanies: [...localSsrMatches, ...others].slice(0, 9), hasLocalMatches: true };
    }

    return { visibleCompanies: companies.slice(0, 9), hasLocalMatches: false };
  }, [companies, normalizedState, needsQuery, queryCompanies, localSsrMatches]);

  const displayTitle =
    title ||
    (normalizedState
      ? hasLocalMatches
        ? `Empresas em destaque em ${stateLabel || normalizedState}`
        : `Empresas em destaque (atuação nacional)`
      : 'Empresas em destaque');

  const effectiveViewAll =
    viewAllHref === '/companies'
      ? `/companies?state=${encodeURIComponent(normalizedState)}`
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
          <div className="flex items-center gap-2">
            {/* View Mode Switcher: Grid / List */}
            <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => handleViewModeChange('grid')}
                aria-label="Visualização em grade"
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-lg transition-colors',
                  viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-900'
                )}
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => handleViewModeChange('list')}
                aria-label="Visualização em lista"
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-lg transition-colors',
                  viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-900'
                )}
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              </button>
            </div>

            <Link
              href={effectiveViewAll}
              className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-blue-600 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Ver todas
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
        {!hasLocalMatches && normalizedState && queryCompanies !== undefined && (
          <p className="text-xs text-slate-500">
            Ainda não há empresas com sede cadastrada em {stateLabel || normalizedState}. Exibindo empresas em destaque com atuação nacional.
          </p>
        )}
        {isError && needsQuery && (
          <div className="mt-2 flex items-center justify-between rounded-xl border border-red-200 bg-red-50/70 px-3.5 py-2">
            <p className="text-xs font-medium text-red-800">
              Não foi possível carregar empresas para {stateLabel || normalizedState}.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-lg border border-red-300 bg-white px-2.5 py-1 text-xs font-bold text-red-800 shadow-2xs hover:bg-red-50 transition"
            >
              Tentar novamente
            </button>
          </div>
        )}
      </div>

      {/*
        Grid responsivo:
        - Mobile (<320px): 1 coluna
        - Mobile (>=320px): 2 colunas
        - Desktop (>=1024px / lg): 3 colunas (3x3 com até 9 empresas)
      */}
      {viewMode === 'list' ? (
        <div
          className={cn(
            'flex flex-col gap-2.5 transition-opacity duration-200',
            isFetching && 'opacity-60'
          )}
        >
          {visibleCompanies.map((company, index) => (
            <CompanyDirectoryRow
              key={company.id}
              company={company}
              index={index}
              selectedState={normalizedState}
              className={index >= 6 ? 'hidden lg:flex' : undefined}
            />
          ))}
        </div>
      ) : (
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
              targetState={normalizedState}
              desktopOnly={index >= 6}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default HomeCompaniesRail;
