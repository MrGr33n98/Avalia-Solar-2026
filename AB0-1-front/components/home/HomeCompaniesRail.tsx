'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Building2, ChevronLeft, ChevronRight, Star } from 'lucide-react';

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

export interface PaginationMeta {
  page?: number;
  per_page?: number;
  total?: number;
  total_pages?: number;
  prev_page?: number | null;
  next_page?: number | null;
}

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

const STATE_LABELS: Record<string, string> = {
  AC: 'Acre',
  AL: 'Alagoas',
  AP: 'Amapá',
  AM: 'Amazonas',
  BA: 'Bahia',
  CE: 'Ceará',
  DF: 'Distrito Federal',
  ES: 'Espírito Santo',
  GO: 'Goiás',
  MA: 'Maranhão',
  MT: 'Mato Grosso',
  MS: 'Mato Grosso do Sul',
  MG: 'Minas Gerais',
  PA: 'Pará',
  PB: 'Paraíba',
  PR: 'Paraná',
  PE: 'Pernambuco',
  PI: 'Piauí',
  RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte',
  RS: 'Rio Grande do Sul',
  RO: 'Rondônia',
  RR: 'Roraima',
  SC: 'Santa Catarina',
  SP: 'São Paulo',
  SE: 'Sergipe',
  TO: 'Tocantins',
};

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
  const resolvedStateLabel =
    (!stateCode && stateLabel) || STATE_LABELS[normalizedState] || stateLabel || normalizedState;

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

  const sectionRef = React.useRef<HTMLElement>(null);
  const [currentPage, setCurrentPage] = React.useState(1);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [normalizedState]);

  const isPageAdvanced = currentPage > 1;
  const needsQuery = Boolean(normalizedState || isPageAdvanced);

  const {
    data: paginatedResponse,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['home-companies', normalizedState || 'national', 'page', currentPage, 'v3'],
    queryFn: async ({ signal }) => {
      const res = await publicCompaniesApi.getAllPaginated(
        {
          ...(normalizedState ? { serves_state: normalizedState } : { featured: true }),
          status: 'active',
          page: currentPage,
          per_page: 9,
          fields: 'card',
          include:
            'logo_url,banner_url,badges,verified_badge_image_url,verified_badge_url,average_rating,rating_count,verified,city,state,coverage_cities,coverage_states,response_time_sla,delivered_projects_score,warranty_years',
        },
        { signal }
      );
      return res;
    },
    enabled: needsQuery,
    placeholderData: (previousData) => previousData,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  }, activeQueryClient);

  const queryCompanies = paginatedResponse?.data;
  const paginationMeta = (paginatedResponse?.meta as { pagination?: PaginationMeta } | undefined)?.pagination;

  const { visibleCompanies, hasLocalMatches } = React.useMemo(() => {
    if (needsQuery) {
      if (queryCompanies !== undefined) {
        if (queryCompanies.length > 0) {
          return { visibleCompanies: queryCompanies.slice(0, 9), hasLocalMatches: true };
        }
        if (currentPage > 1) {
          return { visibleCompanies: [], hasLocalMatches: true };
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
  }, [companies, normalizedState, needsQuery, queryCompanies, localSsrMatches, currentPage]);

  const totalPages = React.useMemo(() => {
    if (paginationMeta?.total_pages) {
      return Math.max(1, Number(paginationMeta.total_pages));
    }
    if (!normalizedState && !paginatedResponse && companies && companies.length > 9) {
      return Math.ceil(companies.length / 9);
    }
    return 1;
  }, [paginationMeta?.total_pages, normalizedState, paginatedResponse, companies]);

  const totalCount = React.useMemo(() => {
    if (paginationMeta?.total !== undefined && paginationMeta?.total !== null) {
      return Number(paginationMeta.total);
    }
    if (queryCompanies) {
      return queryCompanies.length;
    }
    return companies ? companies.length : 0;
  }, [paginationMeta?.total, queryCompanies, companies]);

  const handlePageChange = React.useCallback(
    (newPage: number) => {
      if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
      setCurrentPage(newPage);
      track('company_rail_page_changed', {
        page: newPage,
        previous_page: currentPage,
        state: normalizedState || 'national',
        total_pages: totalPages,
        view_mode: viewMode,
      });

      if (typeof window !== 'undefined' && sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect();
        if (rect.top < 0) {
          sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    },
    [totalPages, currentPage, normalizedState, viewMode]
  );

  const primaryTitle = title || 'Empresas em destaque';
  const locationSubtitle =
    !title && normalizedState
      ? hasLocalMatches
        ? resolvedStateLabel
        : 'Atuação nacional'
      : null;

  const effectiveViewAll =
    viewAllHref === '/companies'
      ? `/companies?state=${encodeURIComponent(normalizedState)}`
      : viewAllHref;

  if (!companies || companies.length === 0 || visibleCompanies.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      className={cn('relative w-full px-4 py-3', className)}
      aria-labelledby="home-companies-title"
    >
      <div className="mb-2 flex flex-col gap-1">
        <div
          data-testid="home-companies-header"
          className="grid grid-cols-1 gap-1.5 min-[480px]:grid-cols-[minmax(0,1fr)_auto] min-[480px]:items-center min-[480px]:gap-2 sm:gap-4"
        >
          <h2
            id="home-companies-title"
            className="flex min-w-0 flex-col gap-0.5"
          >
            <span className="truncate text-[15px] font-semibold leading-5 tracking-tight text-slate-950 sm:text-lg sm:font-bold lg:text-xl">
              {primaryTitle}
            </span>
            {locationSubtitle ? (
              <span
                data-testid="home-companies-location-subtitle"
                className="truncate text-xs font-medium leading-4 text-slate-500 sm:text-sm"
              >
                {locationSubtitle}
              </span>
            ) : null}
          </h2>
          <div className="flex min-w-0 items-center justify-end gap-2">
            {/* View Mode Switcher: Grid / List */}
            <div
              role="group"
              aria-label="Alternar modo de visualização"
              data-testid="company-view-mode-switcher"
              className="inline-flex h-8 w-[68px] shrink-0 items-center justify-between gap-0.5 rounded-[10px] border border-[#E0E0E0] bg-white p-0.5 shadow-2xs"
            >
              <button
                type="button"
                onClick={() => handleViewModeChange('grid')}
                aria-label="Visualização em grade"
                aria-pressed={viewMode === 'grid'}
                className={cn(
                  "relative flex h-7 w-[30px] min-h-0 min-w-0 shrink-0 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
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
                aria-pressed={viewMode === 'list'}
                className={cn(
                  "relative flex h-7 w-[30px] min-h-0 min-w-0 shrink-0 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
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
              className="inline-flex min-h-11 shrink-0 items-center gap-0.5 rounded-lg px-1.5 text-xs font-semibold leading-none text-blue-600 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:px-2 sm:text-sm"
            >
              Ver todas
              <ChevronRight className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
        {!hasLocalMatches && normalizedState && queryCompanies !== undefined && (
          <p className="text-xs text-slate-500">
            Ainda não há empresas com sede cadastrada em {resolvedStateLabel}. Exibindo empresas em destaque com atuação nacional.
          </p>
        )}
        {isError && needsQuery && (
          <div className="mt-2 flex items-center justify-between rounded-xl border border-red-200 bg-red-50/70 px-3.5 py-2">
            <p className="text-xs font-medium text-red-800">
              Não foi possível carregar empresas para {resolvedStateLabel}.
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

      {totalPages > 1 && (
        <nav
          aria-label="Navegação entre páginas de empresas em destaque"
          className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3"
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1 || isFetching}
              aria-label="Página anterior"
              className={cn(
                'inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition-colors',
                'hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-700'
              )}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              <span>Anterior</span>
            </button>

            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || isFetching}
              aria-label="Próxima página"
              className={cn(
                'inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition-colors',
                'hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-700'
              )}
            >
              <span>Próxima</span>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
            <span>
              Página <strong className="font-bold text-slate-900">{currentPage}</strong> de{' '}
              <strong className="font-bold text-slate-900">{totalPages}</strong>
            </span>
            {totalCount > 0 && (
              <span className="text-slate-400">
                • {totalCount} {totalCount === 1 ? 'empresa' : 'empresas'}
              </span>
            )}
          </div>
        </nav>
      )}
    </section>
  );
}

export default HomeCompaniesRail;
