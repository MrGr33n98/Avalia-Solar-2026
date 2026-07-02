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
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  Plus,
  RefreshCw,
  Scale,
  Search,
  Share2,
  ShieldCheck,
  Star,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { CompanyLogo } from '@/components/CompanyLogo';
import { BannerSlot } from '@/components/banners/BannerSlot';
import BestMatchCard from '@/components/compare/BestMatchCard';
import CompareHeroBanner from '@/components/compare/CompareHeroBanner';
import CompareSummary from '@/components/compare/CompareSummary';
import CompareTable from '@/components/compare/CompareTable';
import ComparisonTableSkeleton from '@/components/compare/ComparisonTableSkeleton';
import RecommendedCompanies from '@/components/compare/RecommendedCompanies';
import { getRecommendedCompanies } from '@/components/compare/compare-insights';
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
import { CONTACT } from '@/lib/site';

const MAX_COMPANIES = 3;

const selectionFromParams = (params: URLSearchParams): string[] => {
  const value = params.get('companies') || params.get('slugs') || params.get('company') || '';
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, MAX_COMPANIES);
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
    addToComparison,
    removeFromComparison,
    replaceComparison,
    clearComparison,
    isLoading: isStorageLoading,
    canAddMore,
  } = useComparison();
  const detailCacheRef = useRef(new Map<string, Company>());
  const summaryCacheRef = useRef(new Map<number, Company>());
  const [isResolvingUrl, setIsResolvingUrl] = useState(requestedCompanies.length > 0);
  const [loadError, setLoadError] = useState(false);
  const [retryVersion, setRetryVersion] = useState(0);
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);

  const companies = useMemo(
    () => comparisonList.slice(0, MAX_COMPANIES).map(mapCompanyToCompareCompany),
    [comparisonList]
  );
  const selectedIds = useMemo(() => companies.map((company) => company.id), [companies]);
  const contextCity = searchParams.get('city') || user?.city || companies[0]?.city || null;

  const candidatesQuery = useRecommendedCompanyCandidates(companies, contextCity);
  const recommendations = useMemo(
    () =>
      getRecommendedCompanies({
        selectedCompanies: companies,
        allCompanies: candidatesQuery.data || [],
        city: contextCity,
        limit: 3,
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
      .slice(0, MAX_COMPANIES)
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
  }, [comparisonList, isResolvingUrl, isStorageLoading, loadError, router, searchParams]);

  const handleAdd = useCallback(
    (company: CompareCompany) => {
      if (!canAddMore) {
        toast.warning('Você pode comparar até 3 empresas por vez.');
        return;
      }
      addToComparison(company);
      setQuery('');
    },
    [addToComparison, canAddMore]
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
    openLeadModal({ preferredCompanyId: company.id, source: 'comparison-page', type: 'quick' });
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

  return (
    <div className="min-h-[calc(100vh-4rem)] overflow-x-clip bg-slate-50">
      <CompareHero />

      <div className="mx-auto max-w-[1240px] px-4 pt-4 sm:px-6">
        <BannerSlot placement="compare_page_top" limit={3} />
      </div>

      <main className="mx-auto max-w-[1240px] px-4 pb-10 pt-6 sm:px-6" id="main-content">
        {isLoading ? (
          <PageLoadingState />
        ) : loadError ? (
          <PageErrorState onRetry={() => setRetryVersion((version) => version + 1)} />
        ) : (
          <div className="space-y-6">
            {companies.length > 0 && <CompareSummary companies={companies} />}
            {companies.length > 1 && (
              <BestMatchCard companies={companies} city={contextCity} onQuote={handleQuote} />
            )}

            <div className="flex items-center justify-between gap-3">
              <SelectedCompanyChips companies={companies} onRemove={removeFromComparison} />
              {companies.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleShare}
                  aria-label="Compartilhar comparação"
                >
                  <Share2 className="mr-2 h-4 w-4" aria-hidden="true" /> Compartilhar
                </Button>
              )}
            </div>

            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div className="min-w-0 space-y-6 lg:order-1">
                <BannerSlot placement="compare_page_inline" limit={3} />
                {companies.length > 0 ? (
                  <CompareTable
                    companies={companies}
                    onRemove={removeFromComparison}
                    onQuote={handleQuote}
                  />
                ) : (
                  <EmptyComparisonState />
                )}
              </div>

              <aside
                className="order-first space-y-4 lg:order-2"
                aria-label="Descoberta de empresas"
              >
                <CompanySearchPanel
                  query={query}
                  onQueryChange={setQuery}
                  results={searchResults}
                  selectedCompanies={companies}
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
                  loading={candidatesQuery.isLoading}
                  error={candidatesQuery.isError}
                  onRetry={() => void candidatesQuery.refetch()}
                  onAdd={handleAdd}
                  onReplace={handleReplace}
                />
                <BannerSlot placement="compare_page_sidebar" limit={3} />
                <VerificationTip />
              </aside>
            </div>

            <DiscoveryCta />
            <BannerSlot placement="compare_page_bottom" limit={3} />
          </div>
        )}
      </main>
    </div>
  );
}

function CompareHero() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-[1240px] px-4 py-8 sm:px-6 lg:py-10">
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex items-center gap-2 text-xs text-slate-500"
        >
          <Link href="/" className="hover:text-blue-700">
            Home
          </Link>
          <span aria-hidden="true">›</span>
          <span>Comparar empresas</span>
        </nav>
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_520px]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-blue-700">
              <Scale className="h-3.5 w-3.5" aria-hidden="true" /> Comparador de empresas
            </span>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Compare antes de decidir.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
              Coloque até três empresas lado a lado e avalie reputação, verificação, cobertura e
              condições comerciais.
            </p>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 text-xs font-semibold text-slate-600">
              <HeroBenefit icon={ClipboardCheck} label="Dados verificados" />
              <HeroBenefit icon={Star} label="Avaliações reais" />
              <HeroBenefit icon={BarChart3} label="Comparação imparcial" />
              <HeroBenefit icon={CheckCircle2} label="100% gratuito" />
            </div>
          </div>
          <CompareHeroBanner />
        </div>
      </div>
    </header>
  );
}

function HeroBenefit({ icon: Icon, label }: { icon: typeof Star; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      {label}
    </span>
  );
}

function PageLoadingState() {
  return (
    <div
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]"
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
      <h2 className="mt-4 text-xl font-black text-slate-950">
        Não foi possível carregar as empresas para comparação.
      </h2>
      <Button onClick={onRetry} className="mt-5">
        Tentar novamente
      </Button>
    </div>
  );
}

function EmptyComparisonState() {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 text-center shadow-sm">
      <Scale className="h-10 w-10 text-blue-700" aria-hidden="true" />
      <h2 className="mt-4 text-2xl font-black text-slate-950">Escolha empresas para comparar.</h2>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        Use a busca e as recomendações para montar sua comparação.
      </p>
      <Button asChild variant="outline" className="mt-5">
        <Link href="/companies">Ver empresas cadastradas</Link>
      </Button>
    </div>
  );
}

function SelectedCompanyChips({
  companies,
  onRemove,
}: {
  companies: CompareCompany[];
  onRemove: (id: number) => void;
}) {
  if (companies.length === 0) return <span />;
  return (
    <div className="flex min-w-0 gap-2 overflow-x-auto pb-1" aria-label="Empresas selecionadas">
      {companies.map((company) => (
        <span
          key={company.id}
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-2 pr-1 text-xs font-bold text-slate-800"
        >
          {company.name}
          <button
            type="button"
            onClick={() => onRemove(company.id)}
            aria-label={`Remover ${company.name} da comparação`}
            className="rounded-full p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
    </div>
  );
}

interface SearchPanelProps {
  query: string;
  onQueryChange: (value: string) => void;
  results: CompareCompany[];
  selectedCompanies: CompareCompany[];
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
  isSearching,
  searchError,
  canAddMore,
  onAdd,
  onRemove,
  onClear,
}: SearchPanelProps) {
  const noResults =
    query.trim().length >= 2 && !isSearching && !searchError && results.length === 0;
  return (
    <section
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      aria-labelledby="company-search-title"
    >
      <h2 id="company-search-title" className="text-base font-black text-slate-950">
        Adicionar empresa
      </h2>
      <p className="mt-1 text-xs leading-5 text-slate-500">
        Busque e selecione até 3 empresas para comparar lado a lado.
      </p>
      <p className="mt-2 text-xs font-bold text-slate-700">
        {selectedCompanies.length} de 3 selecionadas
      </p>
      <label htmlFor="compare-company-search" className="sr-only">
        Buscar empresa ou cidade
      </label>
      <div className="relative mt-4">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <Input
          id="compare-company-search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Buscar empresa ou cidade..."
          className="pl-9 pr-9"
        />
        {isSearching && (
          <Loader2
            className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-blue-700"
            aria-hidden="true"
          />
        )}
      </div>
      {!canAddMore && (
        <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-900">
          <strong>Você atingiu o limite de empresas.</strong>
          <br />
          Remova uma empresa ou substitua por uma recomendada.
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
              <Link href="/companies" className="font-bold text-blue-700">
                Ver empresas cadastradas
              </Link>
            </p>
          )}
          {results.map((company) => (
            <button
              key={company.id}
              type="button"
              disabled={!canAddMore}
              onClick={() => onAdd(company)}
              className="flex w-full items-center gap-2 rounded-lg border border-slate-200 p-2 text-left enabled:hover:border-blue-300 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={`Adicionar ${company.name} à comparação`}
            >
              <CompanyLogo logoUrl={company.logoUrl} name={company.name} size="sm" />
              <span className="min-w-0 flex-1">
                <strong className="block truncate text-xs text-slate-900">{company.name}</strong>
                <span className="block truncate text-[10px] text-slate-500">
                  {[company.city, company.state].filter(Boolean).join(', ')}
                </span>
              </span>
              <Plus className="h-4 w-4 text-blue-700" aria-hidden="true" />
            </button>
          ))}
        </div>
      )}
      {selectedCompanies.length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-3">
          <div className="space-y-2">
            {selectedCompanies.map((company) => (
              <div key={company.id} className="flex items-center gap-2 text-xs">
                <CompanyLogo logoUrl={company.logoUrl} name={company.name} size="sm" />
                <span className="min-w-0 flex-1 truncate font-bold text-slate-800">
                  {company.name}
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(company.id)}
                  aria-label={`Remover ${company.name} da comparação`}
                  className="rounded-md border border-slate-200 p-1.5 text-slate-400 hover:text-red-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="mt-3 w-full" onClick={onClear}>
            Limpar comparação
          </Button>
        </div>
      )}
    </section>
  );
}

function VerificationTip() {
  return (
    <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
      <h2 className="flex items-center gap-2 text-sm font-black text-emerald-950">
        <ShieldCheck className="h-5 w-5" aria-hidden="true" /> Dica Avalia Solar
      </h2>
      <p className="mt-2 text-xs leading-5 text-emerald-900">
        Empresas verificadas passam por validação de dados e documentos, garantindo mais confiança
        para sua decisão.
      </p>
      <Link
        href="/help"
        className="mt-3 inline-flex items-center text-xs font-bold text-emerald-800"
      >
        Saiba mais sobre verificação <ArrowRight className="ml-1 h-3 w-3" />
      </Link>
    </section>
  );
}

function DiscoveryCta() {
  const suggestionHref = `mailto:${CONTACT.team.email}?subject=${encodeURIComponent('Sugestão de empresa para o comparador')}`;
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-base font-black text-slate-950">Não encontrou o que procura?</h2>
        <p className="mt-1 text-sm text-slate-500">
          Explore empresas verificadas ou solicite a inclusão de uma empresa para comparar.
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href="/companies">Explorar mais empresas</Link>
        </Button>
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
          <a href={suggestionHref}>Sugerir empresa</a>
        </Button>
      </div>
    </section>
  );
}
