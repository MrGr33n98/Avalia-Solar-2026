'use client';

import {
  Suspense,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  BadgeCheck,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { CompanyLogo } from '@/components/CompanyLogo';
import { BannerSlot } from '@/components/banners/BannerSlot';
import { CampaignTopBanner } from '@/components/banners/CampaignTopBanner';
import BestMatchCard from '@/components/compare/BestMatchCard';
import CompareSummary from '@/components/compare/CompareSummary';
import CompareTable from '@/components/compare/CompareTable';
import ComparisonTableSkeleton from '@/components/compare/ComparisonTableSkeleton';
import RecommendedCompanies from '@/components/compare/RecommendedCompanies';
import { CompareCheckboxControl } from '@/components/compare/CompareCheckboxControl';
import { getRecommendedCompanies } from '@/components/compare/compare-insights';
import { BreadcrumbSchema } from '@/components/seo/BreadcrumbSchema';
import {
  CompareCompany,
  mapCompanyToCompareCompany,
} from '@/components/compare/mapCompanyToCompareCompany';
import {
  useCompareCompanySearch,
  useRecommendedCompanyCandidates,
} from '@/components/compare/useCompareDiscovery';
import { useAuth } from '@/contexts/AuthContext';
import { useComparison } from '@/hooks/useComparison';
import { companiesApi, type Company } from '@/lib/api';
import { openLeadModal } from '@/lib/lead-engine';
import { buildCompanyPath } from '@/lib/slug';
import { absoluteUrl } from '@/lib/site';
import { canUsePaidConversion } from '@/lib/feature-access';
import { hasAnalyticsConsent } from '@/lib/analytics/consent';
import { sendIntentSignal } from '@/lib/analytics/hooks/useIntentTracking';
import { AnimatedCompareIcon } from '@/components/icons/AnimatedCompareIcon';

import {
  COMPARISON_LIMITS,
  COMPARISON_LIMIT_MESSAGES,
  COMPARE_RECOMMENDATION_LIMIT,
} from '@/lib/comparison/config';

const selectionFromParams = (params: URLSearchParams): string[] => {
  const value = params.get('companies') || params.get('slugs') || params.get('company') || '';
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, COMPARISON_LIMITS.desktop);
};

export default function ComparePage() {
  return (
    <Suspense fallback={<PageLoadingState />}>
      <ComparePageContent />
    </Suspense>
  );
}

function ComparePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const requestedCompanies = useMemo(
    () => selectionFromParams(new URLSearchParams(searchParams.toString())),
    [searchParams]
  );
  const requestKey = requestedCompanies.join(',');
  const {
    comparisonList,
    visibleList,
    addToComparison,
    removeFromComparison,
    replaceComparison,
    clearComparison,
    isLoading: isStorageLoading,
    canAddMore,
    maxComparison,
    experience,
  } = useComparison();
  const detailCacheRef = useRef(new Map<string, Company>());
  const summaryCacheRef = useRef(new Map<number, Company>());
  const [isResolvingUrl, setIsResolvingUrl] = useState(requestedCompanies.length > 0);
  const [loadError, setLoadError] = useState(false);
  const [retryVersion, setRetryVersion] = useState(0);
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);

  const companies = useMemo(
    () => visibleList.map(mapCompanyToCompareCompany),
    [visibleList]
  );
  const selectedIds = useMemo(() => companies.map((company) => company.id), [companies]);
  const comparedSelectionKey = useMemo(
    () => selectedIds.filter((id) => Number.isSafeInteger(id) && id > 0).sort((a, b) => a - b).join('-'),
    [selectedIds]
  );
  const comparisonIntentSeenRef = useRef(new Set<string>());
  useEffect(() => {
    if (isStorageLoading || isResolvingUrl || loadError || selectedIds.length < 2 || !hasAnalyticsConsent()) return;
    if (!comparedSelectionKey || comparisonIntentSeenRef.current.has(comparedSelectionKey)) return;
    comparisonIntentSeenRef.current.add(comparedSelectionKey);

    // Only a rendered comparison is counted, not an add/remove checkbox action.
    const participants = comparedSelectionKey.split('-').map(Number);
    participants.forEach((companyId) => {
      sendIntentSignal({
        company_id: companyId,
        signal_type: 'comparison_view',
        signal_category: 'research_intent',
        element_type: 'compare_page',
        metadata: {
          source: 'compare_page',
          compared_company_ids: participants,
          comparison_size: participants.length,
        },
      });
    });
  }, [comparedSelectionKey, isStorageLoading, isResolvingUrl, loadError, selectedIds.length]);

  const contextCity = searchParams.get('city') || user?.city || companies[0]?.city || null;

  const candidatesQuery = useRecommendedCompanyCandidates(companies, contextCity);
  const recommendations = useMemo(
    () =>
      getRecommendedCompanies({
        selectedCompanies: companies,
        allCompanies: candidatesQuery.data || [],
        city: contextCity,
        limit: COMPARE_RECOMMENDATION_LIMIT,
      }),
    [candidatesQuery.data, companies, contextCity]
  );
  const searchQuery = useCompareCompanySearch(deferredQuery, selectedIds);
  const searchResults = useMemo(
    () => (searchQuery.data || []).map(mapCompanyToCompareCompany),
    [searchQuery.data]
  );

  useEffect(() => {
    [...comparisonList, ...(candidatesQuery.data || []), ...(searchQuery.data || [])].forEach(
      (company) => summaryCacheRef.current.set(company.id, company)
    );
  }, [candidatesQuery.data, comparisonList, searchQuery.data]);

  useEffect(() => {
    if (!requestKey) {
      setIsResolvingUrl(false);
      setLoadError(false);
      return;
    }

    let cancelled = false;
    setIsResolvingUrl(true);
    setLoadError(false);

    const loadCompanies = async () => {
      const identifiers = requestKey.split(',').filter(Boolean);
      const loaded = await Promise.all(
        identifiers.map(async (identifier) => {
          const cached = detailCacheRef.current.get(identifier);
          if (cached) return cached;

          const company = /^\d+$/.test(identifier)
            ? await companiesApi.getById(identifier)
            : await companiesApi.getBySlug(identifier);
          if (company) {
            const summary = summaryCacheRef.current.get(company.id);
            const detailedCompany = summary
              ? {
                  ...summary,
                  ...company,
                  trust: company.trust || summary.trust,
                  reputation: company.reputation || summary.reputation,
                  operations: company.operations || summary.operations,
                  coverage: company.coverage || summary.coverage,
                  actions: company.actions || summary.actions,
                }
              : company;
            detailCacheRef.current.set(identifier, detailedCompany);
            detailCacheRef.current.set(
              detailedCompany.slug || String(detailedCompany.id),
              detailedCompany
            );
            return detailedCompany;
          }
          return company;
        })
      );

      if (cancelled) return;
      const validCompanies = loaded.filter((company): company is Company => Boolean(company));
      if (validCompanies.length === 0) {
        setLoadError(true);
      } else {
        replaceComparison(validCompanies);
      }
      setIsResolvingUrl(false);
    };

    void loadCompanies().catch(() => {
      if (!cancelled) {
        setLoadError(true);
        setIsResolvingUrl(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [requestKey, retryVersion, replaceComparison]);

  useEffect(() => {
    if (isStorageLoading || isResolvingUrl || loadError) return;
    const slugs = comparisonList
      .slice(0, maxComparison)
      .map((company) => company.slug || String(company.id))
      .filter(Boolean);
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete('slugs');
    nextParams.delete('company');
    if (slugs.length > 0) nextParams.set('companies', slugs.join(','));
    else nextParams.delete('companies');
    const nextQuery = nextParams.toString();
    const currentQuery = searchParams.toString();
    const nextUrl = nextQuery ? `/compare?${nextQuery}` : '/compare';
    const currentUrl = currentQuery ? `/compare?${currentQuery}` : '/compare';
    if (nextUrl !== currentUrl) router.replace(nextUrl, { scroll: false });
  }, [comparisonList, isResolvingUrl, isStorageLoading, loadError, maxComparison, router, searchParams]);

  const handleAdd = useCallback(
    (company: CompareCompany) => {
      if (!canAddMore) {
        toast.warning(COMPARISON_LIMIT_MESSAGES[experience]);
        return;
      }
      addToComparison(company);
      setQuery('');
    },
    [addToComparison, canAddMore, experience]
  );

  const handleReplace = useCallback(
    (selectedId: number, replacement: CompareCompany) => {
      const nextCompanies = comparisonList.map((company) =>
        company.id === selectedId ? replacement : company
      );
      replaceComparison(nextCompanies);
      setQuery('');
      toast.success('Empresa substituída com sucesso.');
    },
    [comparisonList, replaceComparison]
  );

  const handleQuote = useCallback((company: CompareCompany) => {
    if (!canUsePaidConversion(company, 'quote')) return;
    openLeadModal({
      preferredCompanyId: company.id,
      source: 'compare',
      decisionContext: { source: 'compare', view_mode: 'compare' },
      type: 'quick',
    });
  }, []);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Comparação Avalia Solar', url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link da comparação copiado.');
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      toast.error('Não foi possível compartilhar a comparação.');
    }
  }, []);

  const isLoading = isStorageLoading || isResolvingUrl;

  const compareJsonLd = useMemo(() => {
    if (companies.length === 0) return null;
    const names = companies.map((c) => c.name).join(' vs ');
    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `Comparação de Empresas: ${names}`,
      description: `Comparativo detalhado de nota, avaliações e termos de garantia entre ${companies.map((c) => c.name).join(', ')} no Avalia Solar.`,
      itemListElement: companies.map((comp, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        item: {
          '@type': 'Organization',
          name: comp.name,
          url: absoluteUrl(buildCompanyPath(comp.slug, comp.name, comp.id)),
          aggregateRating: comp.rating > 0 && comp.reviewsCount > 0 ? {
            '@type': 'AggregateRating',
            ratingValue: comp.rating,
            reviewCount: comp.reviewsCount,
          } : undefined,
        },
      })),
    };
  }, [companies]);

  return (
    <div className="min-h-[calc(100vh-4rem)] overflow-x-clip bg-slate-50">
      <BreadcrumbSchema
        items={[
          { name: 'Início', item: '/' },
          { name: 'Comparador', item: '/compare' },
        ]}
      />
      {compareJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(compareJsonLd) }}
        />
      )}
      <CompareHero />

      <CampaignTopBanner className="mx-auto max-w-[1280px] px-4 pt-3 sm:px-6 lg:px-8" />

      <main className="mx-auto max-w-[1280px] px-4 pb-28 pt-3 sm:px-6 md:pb-12 md:pt-5 lg:px-8" id="main-content">
        {isLoading ? (
          <PageLoadingState />
        ) : loadError ? (
          <PageErrorState onRetry={() => setRetryVersion((version) => version + 1)} />
        ) : (
          <div className="space-y-3.5 md:space-y-6">
            <SelectedCompaniesPanel
              companies={companies}
              maxComparison={maxComparison}
              onRemove={removeFromComparison}
              onClear={clearComparison}
            />

            <div className="grid items-start gap-3 md:gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
              {/* Coluna Principal: Best Match -> Resumo -> Tabela Detalhada -> Banner Inline */}
              <div className={`min-w-0 space-y-3 md:space-y-5 ${companies.length < 2 ? 'order-2 md:order-1' : 'order-1'}`}>
                {companies.length > 1 && (
                  <BestMatchCard companies={companies} city={contextCity} onQuote={handleQuote} />
                )}

                {companies.length > 0 && <div className="hidden md:block"><CompareSummary companies={companies} /></div>}

                {companies.length > 0 ? (
                  <section aria-labelledby="side-by-side-title" className={companies.length === 1 ? 'hidden space-y-3.5 md:block' : 'space-y-3.5'}>
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <h2 id="side-by-side-title" className="text-lg sm:text-xl font-bold tracking-tight text-slate-950">
                          Comparação lado a lado
                        </h2>
                        <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
                          {companies.length} de {maxComparison} empresas selecionadas
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleShare}
                        aria-label="Compartilhar comparação"
                        className="rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
                      >
                        <Share2 className="mr-2 h-4 w-4" aria-hidden="true" /> Compartilhar
                      </Button>
                    </div>
                    <CompareTable
                      companies={companies}
                      onRemove={removeFromComparison}
                      onQuote={handleQuote}
                    />
                  </section>
                ) : (
                  <div className="hidden md:block"><EmptyComparisonState /></div>
                )}

                <BannerSlot placement="compare_page_inline" limit={3} />
              </div>

              {/* Sidebar Lateral (ativa em xl >= 1280px; tablet/mobile empilha abaixo sem comprimir tabela) */}
              <aside
                className={`space-y-3 md:space-y-5 ${companies.length < 2 ? 'order-1 md:order-2' : 'order-2'}`}
                aria-label="Descoberta de empresas"
              >
                <CompanySearchPanel
                  query={query}
                  onQueryChange={setQuery}
                  results={searchResults}
                  selectedCompanies={companies}
                  maxComparison={maxComparison}
                  isSearching={searchQuery.isFetching}
                  searchError={searchQuery.isError}
                  canAddMore={canAddMore}
                  onAdd={handleAdd}
                  onRemove={removeFromComparison}
                  onClear={clearComparison}
                />
                <RecommendedCompanies
                  companies={recommendations}
                  selectedCompanies={companies}
                  maxComparison={maxComparison}
                  loading={candidatesQuery.isLoading}
                  error={candidatesQuery.isError}
                  onRetry={() => void candidatesQuery.refetch()}
                  onAdd={handleAdd}
                  onReplace={handleReplace}
                />
                <div className="hidden xl:block">
                  <BannerSlot
                    placement="compare_page_sidebar"
                    limit={3}
                    className="hidden xl:block"
                  />
                </div>
                <div className="hidden md:block"><VerificationTip /></div>
              </aside>
            </div>

            <DiscoveryCta companies={companies} />
            <BannerSlot placement="compare_page_bottom" limit={3} />
          </div>
        )}
      </main>
    </div>
  );
}

function CompareHero() {
  return (
    <header className="border-b border-slate-200/90 bg-white">
      <div
        className="mx-auto max-w-[1280px] bg-cover bg-center bg-no-repeat px-4 py-3 sm:px-6 md:py-6 lg:px-8 lg:py-8"
        style={{
          backgroundImage:
            "url('/assets/background-comparacao-empresas-2560x512-500kb.png')",
        }}
      >
        <nav
          aria-label="Breadcrumb"
          className="mb-3 hidden items-center gap-1.5 text-xs text-slate-500 md:flex"
        >
          <Link href="/" className="hover:text-blue-700 transition-colors">
            Início
          </Link>
          <span aria-hidden="true" className="text-slate-400">›</span>
          <span className="font-medium text-slate-800">Comparar empresas</span>
        </nav>
        <div className="grid min-h-0 items-center gap-2 md:min-h-[100px] md:gap-5 lg:grid-cols-[1fr_auto]">
          <div className="max-w-2xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="hidden items-center gap-2 rounded-md border border-blue-200 bg-blue-50/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-700 shadow-2xs md:inline-flex">
                  <AnimatedCompareIcon size={14} intensity="subtle" aria-hidden="true" /> Comparador
                </span>
                <h1 className="text-[23px] font-semibold leading-tight tracking-tight text-slate-950 md:mt-2 md:text-3xl md:font-bold lg:text-[2rem]">
                  Comparador de empresas
                </h1>
                <p className="mt-1 max-w-xl text-[13px] leading-5 text-slate-600 md:mt-1.5 md:text-sm md:leading-relaxed">
                  <span className="md:hidden">Compare avaliações, confiança e serviços de até duas empresas.</span>
                  <span className="hidden md:inline">Compare reputação, notas, garantias, cobertura e condições comerciais lado a lado para tomar a melhor decisão para o seu projeto solar.</span>
                </p>
              </div>

            </div>
          </div>
          <div className="hidden lg:flex w-full justify-center lg:justify-end">
            <BannerSlot
              placement="compare_hero"
              limit={1}
              priority={true}
              showLoadingSkeleton={false}
              className="w-full max-w-[480px] !py-0 [&>div]:rounded-xl [&>div]:border [&>div]:border-slate-200 [&>div]:shadow-sm"
            />
          </div>
        </div>
      </div>
    </header>
  );
}

function PageLoadingState() {
  return (
    <div
      className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]"
      role="status"
      aria-label="Carregando comparação"
    >
      <ComparisonTableSkeleton />
      <div className="space-y-4">
        <Skeleton className="h-60 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
      <span className="sr-only">Carregando...</span>
    </div>
  );
}

function PageErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      className="rounded-xl border border-red-100 bg-white px-6 py-16 text-center shadow-sm"
      role="alert"
    >
      <RefreshCw className="mx-auto h-8 w-8 text-red-600" aria-hidden="true" />
      <h2 className="mt-4 text-xl font-bold text-slate-950">
        Não foi possível carregar as empresas para comparação.
      </h2>
      <Button onClick={onRetry} className="mt-5 rounded-lg">
        Tentar novamente
      </Button>
    </div>
  );
}

function EmptyComparisonState() {
  return (
    <div className="flex min-h-[380px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white px-6 py-12 text-center shadow-xs">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        <AnimatedCompareIcon size={32} aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-xl sm:text-2xl font-bold text-slate-950">Escolha empresas para comparar</h2>
      <p className="mt-2 max-w-md text-xs sm:text-sm text-slate-500">
        Selecione empresas através da busca ou das recomendações para visualizar o comparativo completo.
      </p>
      <Button asChild variant="outline" className="mt-5 rounded-lg font-semibold">
        <Link href="/companies">Ver empresas cadastradas</Link>
      </Button>
    </div>
  );
}

function SelectedCompaniesPanel({
  companies,
  maxComparison,
  onRemove,
  onClear,
}: {
  companies: CompareCompany[];
  maxComparison: number;
  onRemove: (id: number) => void;
  onClear: () => void;
}) {
  return (
    <section
      aria-labelledby="selected-companies-title"
      className="rounded-lg border border-slate-200/90 bg-white p-3 shadow-none sm:rounded-xl sm:p-5 sm:shadow-sm"
    >
      <div className="mb-2.5 flex items-center justify-between gap-3 sm:mb-3.5">
        <h2 id="selected-companies-title" className="text-sm sm:text-base font-bold text-slate-950">
          Empresas selecionadas <span className="text-xs font-normal text-slate-500">({companies.length} de {maxComparison})</span>
        </h2>
        {companies.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-8 rounded-lg px-2.5 text-xs font-semibold text-slate-600 hover:text-red-700 hover:bg-red-50 transition-colors"
          >
            Limpar comparação
          </Button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:gap-2.5 lg:grid-cols-3">
        {companies.map((company) => (
          <article
            key={company.id}
            className="relative flex min-h-[102px] flex-col items-start gap-1.5 rounded-lg border border-slate-200/90 bg-slate-50/50 p-2.5 transition-colors hover:border-slate-300 md:min-h-[72px] md:flex-row md:items-center md:gap-3 md:rounded-xl md:p-3"
          >
            <CompanyLogo logoUrl={company.logoUrl} name={company.name} size="sm" badges={company.badges} />
            <div className="min-w-0 w-full flex-1 pr-6 md:w-auto md:pr-7">
              <p className="line-clamp-2 break-words text-xs font-semibold leading-4 text-slate-950 md:truncate md:text-sm md:font-bold">{company.name}</p>
              <p className="truncate text-[11px] text-slate-500 md:text-xs">
                {[company.city, company.state].filter(Boolean).join(', ') || 'Local não informado'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onRemove(company.id)}
              aria-label={`Remover ${company.name} da comparação`}
              className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 md:right-2 md:top-1/2 md:h-8 md:w-8 md:-translate-y-1/2"
            >
              <X className="h-4 w-4" />
            </button>
          </article>
        ))}
        {Array.from({ length: Math.max(0, maxComparison - companies.length) }, (_, index) => (
          <button
            type="button"
            key={`add-company-${index}`}
            onClick={() => {
              const search = document.getElementById('compare-company-search');
              search?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              search?.focus({ preventScroll: true });
            }}
            aria-label={`Adicionar empresa ${companies.length + index + 1} à comparação`}
            className={`flex min-h-[102px] flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-blue-200 bg-blue-50/30 p-2.5 text-xs font-semibold text-blue-700 transition-colors hover:border-blue-400 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 md:min-h-[72px] md:flex-row md:gap-2 md:rounded-xl md:border-2 md:bg-white md:p-3 md:text-sm ${index > 0 ? 'md:hidden' : ''}`}
          >
            <Plus className="h-5 w-5 stroke-[2]" aria-hidden="true" />
            <span className="text-center md:hidden">Empresa {companies.length + index + 1}</span>
            <span className="hidden md:inline">Adicionar empresa ({companies.length}/{maxComparison})</span>
          </button>
        ))}
      </div>
    </section>
  );
}

interface SearchPanelProps {
  query: string;
  onQueryChange: (value: string) => void;
  results: CompareCompany[];
  selectedCompanies: CompareCompany[];
  maxComparison: number;
  isSearching: boolean;
  searchError: boolean;
  canAddMore: boolean;
  onAdd: (company: CompareCompany) => void;
  onRemove: (id: number) => void;
  onClear: () => void;
}

function CompanySearchPanel({
  query,
  onQueryChange,
  results,
  selectedCompanies,
  maxComparison,
  isSearching,
  searchError,
  canAddMore,
  onAdd,
  onRemove,
}: SearchPanelProps) {
  const noResults =
    query.trim().length >= 2 && !isSearching && !searchError && results.length === 0;

  return (
    <section
      className="rounded-xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm"
      aria-labelledby="company-search-title"
    >
      <h2 id="company-search-title" className="text-base font-bold text-slate-950">
        Adicionar empresa
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">
        Busque e selecione até {maxComparison} empresas para comparar lado a lado.
      </p>

      <label htmlFor="compare-company-search" className="sr-only">
        Buscar empresa ou cidade
      </label>
      <div className="relative mt-2.5 md:mt-3.5">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <Input
          id="compare-company-search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Buscar empresa ou cidade..."
          className="h-11 rounded-lg border-slate-200 pl-9 pr-9 text-sm md:h-10"
        />
        {isSearching && (
          <Loader2
            className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-blue-700"
            aria-hidden="true"
          />
        )}
      </div>

      {!canAddMore && (
        <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50/80 p-3 text-xs leading-relaxed text-blue-900">
          <strong>Limite de empresas atingido ({maxComparison}).</strong>
          <br />
          Remova uma empresa para adicionar outra.
        </div>
      )}

      {query.trim().length >= 2 && (
        <div className="mt-3 space-y-2" aria-live="polite">
          {searchError && (
            <p className="rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-700">
              Não foi possível buscar empresas agora.
            </p>
          )}
          {noResults && (
            <p className="rounded-lg bg-slate-50 p-3 text-center text-xs text-slate-600">
              Nenhuma empresa encontrada.
              <br />
              <Link href="/companies" className="font-bold text-blue-700 hover:underline">
                Ver empresas cadastradas
              </Link>
            </p>
          )}
          {results.map((company) => (
            <div
              key={company.id}
              className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200/90 p-2.5 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <CompanyLogo logoUrl={company.logoUrl} name={company.name} size="sm" badges={company.badges} />
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-xs sm:text-[13px] text-slate-900">{company.name}</strong>
                  <span className="block truncate text-[11px] text-slate-500">
                    {[company.city, company.state].filter(Boolean).join(', ') || 'Local não informado'}
                  </span>
                </span>
              </div>
              <CompareCheckboxControl
                companyName={company.name}
                checked={selectedCompanies.some((c) => c.id === company.id)}
                disabled={!selectedCompanies.some((c) => c.id === company.id) && !canAddMore}
                onCheckedChange={(next) => {
                  if (next) onAdd(company);
                  else onRemove(company.id);
                }}
                density="compact"
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function VerificationTip() {
  return (
    <section className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 sm:p-5 shadow-xs">
      <h2 className="flex items-center gap-2 text-sm font-bold text-emerald-950">
        <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" aria-hidden="true" /> Dica Avalia Solar
      </h2>
      <p className="mt-2 text-xs leading-relaxed text-emerald-900">
        Empresas verificadas passam por validação de dados cadastrais e documentos societários, garantindo mais segurança para o seu projeto.
      </p>
      <Link
        href="/help"
        className="mt-3 inline-flex items-center text-xs font-bold text-emerald-800 hover:text-emerald-950 transition-colors"
      >
        Saiba mais sobre verificação <ArrowRight className="ml-1 h-3.5 w-3.5" />
      </Link>
    </section>
  );
}

function DiscoveryCta({ companies }: { companies: CompareCompany[] }) {
  const hasEligibleCompany = companies.some((company) => canUsePaidConversion(company, 'quote'));

  return (
    <section className="relative isolate overflow-hidden rounded-xl border border-slate-800 bg-[#0B0F1A] px-6 py-8 text-white md:px-10 md:py-10 shadow-md">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-50"
        aria-hidden="true"
        style={{
          backgroundImage:
            'radial-gradient(circle at 18% 10%, rgba(37,99,235,0.16), transparent 34%), radial-gradient(circle at 88% 86%, rgba(255,200,44,0.08), transparent 28%), radial-gradient(rgba(255,255,255,0.12) 0.7px, transparent 0.7px)',
          backgroundSize: 'auto, auto, 18px 18px',
        }}
      />
      <div
        className="pointer-events-none absolute -left-12 bottom-[-76px] h-36 w-36 rotate-45 border border-blue-400/20"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-10 top-[-88px] h-44 w-44 rotate-45 border border-[#FFC82C]/15"
        aria-hidden="true"
      />

      <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-14">
        <div className="max-w-[690px]">
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#FFC82C] sm:text-xs">
            <Sparkles className="h-4 w-4" strokeWidth={1.7} aria-hidden="true" />
            Próximo passo seguro
          </p>
          <h2 className="mt-3 max-w-[620px] text-2xl font-bold leading-tight tracking-[-0.025em] text-white sm:text-3xl lg:text-[2.15rem]">
            Faça a escolha certa para o seu{' '}
            <span className="text-[#FFC82C]">projeto solar</span>
          </h2>

          <div className="mt-5 flex flex-col gap-3 text-xs sm:text-sm text-slate-200 sm:flex-row sm:items-center sm:gap-6">
            <span className="inline-flex items-center gap-2">
              <BadgeCheck className="h-4.5 w-4.5 text-[#22C55E]" strokeWidth={1.7} aria-hidden="true" />
              Empresas verificadas
            </span>
            <span className="hidden h-5 w-px bg-slate-600 sm:block" aria-hidden="true" />
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4.5 w-4.5 text-[#22C55E]" strokeWidth={1.7} aria-hidden="true" />
              Comparação sem compromisso
            </span>
          </div>
        </div>

        <div className="lg:min-w-[310px]">
          {hasEligibleCompany && (
            <button
              type="button"
              onClick={() => openLeadModal({ source: 'comparison-bottom-cta', type: 'quick' })}
              className="inline-flex w-full items-center justify-center gap-2.5 rounded-xl border border-[#FFC82C] bg-[#FFC82C] px-7 py-3.5 text-sm font-bold text-[#0B0F1A] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#e8b51e] hover:bg-[#e8b51e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC82C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F1A] shadow-md sm:w-auto lg:w-full"
            >
              <FileText className="h-5 w-5" strokeWidth={1.7} aria-hidden="true" />
              Pedir orçamento gratuito
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
