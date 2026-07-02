'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Scale,
  Search,
  ShieldCheck,
  Star,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { CompanyLogo } from '@/components/CompanyLogo';
import ComparisonTableSkeleton from '@/components/compare/ComparisonTableSkeleton';
import {
  CompareCompany,
  mapCompanyToCompareCompany,
} from '@/components/compare/mapCompanyToCompareCompany';
import { useComparison } from '@/hooks/useComparison';
import { companiesApi, type Company } from '@/lib/api';
import { openLeadModal } from '@/lib/lead-engine';

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
    <Suspense fallback={<CompareLoadingState />}>
      <ComparePageContent />
    </Suspense>
  );
}

function ComparePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
    isLoading: isStorageLoading,
    canAddMore,
  } = useComparison();
  const cacheRef = useRef(new Map<string, Company>());
  const [isResolvingUrl, setIsResolvingUrl] = useState(requestedCompanies.length > 0);
  const [loadError, setLoadError] = useState(false);
  const [retryVersion, setRetryVersion] = useState(0);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Company[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const companies = useMemo(
    () => comparisonList.slice(0, MAX_COMPANIES).map(mapCompanyToCompareCompany),
    [comparisonList]
  );

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
          const cached = cacheRef.current.get(identifier);
          if (cached) return cached;

          const company = /^\d+$/.test(identifier)
            ? await companiesApi.getById(identifier)
            : await companiesApi.getBySlug(identifier);

          if (company) {
            cacheRef.current.set(identifier, company);
            cacheRef.current.set(company.slug || String(company.id), company);
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
        setLoadError(false);
      }
      setIsResolvingUrl(false);
    };

    loadCompanies().catch(() => {
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
    const nextUrl = slugs.length
      ? `/compare?companies=${slugs.map(encodeURIComponent).join(',')}`
      : '/compare';
    const currentUrl = requestKey
      ? `/compare?companies=${requestKey.split(',').map(encodeURIComponent).join(',')}`
      : '/compare';

    if (nextUrl !== currentUrl) router.replace(nextUrl, { scroll: false });
  }, [comparisonList, isResolvingUrl, isStorageLoading, loadError, requestKey, router]);

  useEffect(() => {
    const normalizedQuery = query.trim();
    if (normalizedQuery.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    setIsSearching(true);
    const timeout = window.setTimeout(async () => {
      const results = await companiesApi.getAll({ q: normalizedQuery, limit: 8, status: 'active' });
      if (!cancelled) {
        setSearchResults(
          results.filter((result) => !comparisonList.some((selected) => selected.id === result.id))
        );
        results.forEach((company) => {
          cacheRef.current.set(company.slug || String(company.id), company);
        });
        setIsSearching(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [query, comparisonList]);

  const handleAdd = useCallback(
    (company: Company) => {
      addToComparison(company);
      setQuery('');
      setSearchResults([]);
    },
    [addToComparison]
  );

  const handleQuote = useCallback((company: CompareCompany) => {
    openLeadModal({ preferredCompanyId: company.id, source: 'comparison-page', type: 'quick' });
  }, []);

  const isLoading = isStorageLoading || isResolvingUrl;

  return (
    <div className="min-h-[calc(100vh-4rem)] overflow-x-clip bg-slate-50 pb-16">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1240px] px-4 py-10 sm:px-6 lg:py-14">
          <Link
            href="/companies"
            className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-800"
          >
            <ArrowRight className="h-4 w-4 rotate-180" aria-hidden="true" />
            Ver empresas
          </Link>
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.16em] text-blue-700">
              <Scale className="h-4 w-4" aria-hidden="true" /> Comparador de empresas
            </span>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Compare antes de decidir.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Coloque até três empresas lado a lado e avalie reputação, verificação, cobertura e
              condições comerciais.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1240px] px-4 py-8 sm:px-6 lg:py-10" id="main-content">
        {isLoading ? (
          <CompareLoadingState />
        ) : loadError ? (
          <CompareErrorState onRetry={() => setRetryVersion((version) => version + 1)} />
        ) : (
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section className="min-w-0" aria-labelledby="comparison-title">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 id="comparison-title" className="text-xl font-black text-slate-950">
                    Comparação lado a lado
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {companies.length} de {MAX_COMPANIES} empresas selecionadas
                  </p>
                </div>
                {companies.length > 0 && (
                  <Link
                    href="/companies"
                    className="text-sm font-bold text-blue-700 hover:underline"
                  >
                    Explorar mais empresas
                  </Link>
                )}
              </div>

              {companies.length === 0 ? (
                <EmptyComparisonState />
              ) : (
                <>
                  <MobileComparison
                    companies={companies}
                    onRemove={removeFromComparison}
                    onQuote={handleQuote}
                  />
                  <DesktopComparison
                    companies={companies}
                    onRemove={removeFromComparison}
                    onQuote={handleQuote}
                  />
                </>
              )}
            </section>

            <CompanySearchPanel
              query={query}
              onQueryChange={setQuery}
              results={searchResults}
              selectedCount={companies.length}
              isSearching={isSearching}
              canAddMore={canAddMore}
              onAdd={handleAdd}
            />
          </div>
        )}
      </main>
    </div>
  );
}

function CompareLoadingState() {
  return (
    <div
      className="mx-auto grid w-full max-w-[1240px] gap-8 lg:grid-cols-[minmax(0,1fr)_320px]"
      role="status"
      aria-label="Carregando empresas para comparação"
    >
      <ComparisonTableSkeleton />
      <aside
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        aria-label="Carregando painel de empresas"
      >
        <Skeleton className="h-6 w-44" />
        <Skeleton className="mt-4 h-11 w-full rounded-xl" />
        <div className="mt-6 space-y-4">
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </aside>
      <span className="sr-only">Carregando...</span>
    </div>
  );
}

function CompareErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      className="rounded-3xl border border-red-100 bg-white px-6 py-16 text-center shadow-sm"
      role="alert"
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
        <RefreshCw className="h-6 w-6" aria-hidden="true" />
      </div>
      <h2 className="mt-5 text-xl font-black text-slate-950">
        Não foi possível carregar as empresas para comparação.
      </h2>
      <Button onClick={onRetry} className="mt-6" aria-label="Tentar carregar as empresas novamente">
        Tentar novamente
      </Button>
    </div>
  );
}

function EmptyComparisonState() {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 text-center shadow-sm">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
        <Scale className="h-8 w-8" aria-hidden="true" />
      </div>
      <h2 className="mt-5 text-2xl font-black text-slate-950">Escolha empresas para comparar.</h2>
      <p className="mt-2 max-w-md text-slate-500">
        Use a busca ao lado para montar sua comparação com dados reais das empresas cadastradas.
      </p>
      <Button asChild variant="outline" className="mt-6">
        <Link href="/companies">Ver empresas cadastradas</Link>
      </Button>
    </div>
  );
}

type ComparisonProps = {
  companies: CompareCompany[];
  onRemove: (id: number) => void;
  onQuote: (company: CompareCompany) => void;
};

function DesktopComparison({ companies, onRemove, onQuote }: ComparisonProps) {
  return (
    <div className="hidden overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-[0_24px_60px_-38px_rgba(15,23,42,0.45)] md:block">
      <table className="w-full min-w-[720px] table-fixed border-collapse text-left">
        <caption className="sr-only">Comparação detalhada entre as empresas selecionadas</caption>
        <thead>
          <tr className="border-b border-slate-200 align-top">
            <th
              scope="col"
              className="w-40 bg-slate-50 p-5 text-xs font-extrabold uppercase tracking-wider text-slate-500"
            >
              Critério
            </th>
            {companies.map((company) => (
              <th scope="col" key={company.id} className="relative border-l border-slate-200 p-5">
                <button
                  onClick={() => onRemove(company.id)}
                  aria-label={`Remover ${company.name} da comparação`}
                  className="absolute right-3 top-3 rounded-full p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
                <CompanyLogo logoUrl={company.logoUrl} name={company.name} size="md" />
                <Link
                  href={`/companies/${company.slug || company.id}`}
                  className="mt-4 block pr-8 text-base font-black text-slate-950 hover:text-blue-700"
                >
                  {company.name}
                </Link>
                <VerificationBadge verified={company.verified} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <ComparisonRow
            label="Avaliação"
            companies={companies}
            render={(company) => (
              <div>
                <span className="inline-flex items-center gap-1 font-black text-slate-950">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
                  {company.rating.toFixed(1)}
                </span>
                <span className="ml-2 text-xs text-slate-500">
                  {company.reviewsCount} avaliações
                </span>
              </div>
            )}
          />
          <ComparisonRow
            label="Localização"
            companies={companies}
            render={(company) => (
              <span>
                {[company.city, company.state].filter(Boolean).join(', ') || 'Não informado'}
              </span>
            )}
          />
          <ComparisonRow
            label="Tempo de resposta"
            companies={companies}
            render={(company) => <span>{company.response_time_sla || 'Consultar'}</span>}
          />
          <ComparisonRow
            label="Experiência"
            companies={companies}
            render={(company) => (
              <span>
                {company.founded_year
                  ? `${Math.max(0, new Date().getFullYear() - company.founded_year)} anos`
                  : 'Não informado'}
              </span>
            )}
          />
          <ComparisonRow
            label="Financiamento"
            companies={companies}
            render={(company) => (
              <span>{company.financing_enabled ? 'Disponível' : 'Consultar'}</span>
            )}
          />
          <ComparisonRow
            label="Garantia"
            companies={companies}
            render={(company) => (
              <span>{company.warranty_years ? `${company.warranty_years} anos` : 'Consultar'}</span>
            )}
          />
          <tr className="border-t border-slate-200 bg-slate-50/60 align-top">
            <th scope="row" className="p-5 text-sm font-bold text-slate-700">
              Próximo passo
            </th>
            {companies.map((company) => (
              <td key={company.id} className="border-l border-slate-200 p-4">
                <Button
                  onClick={() => onQuote(company)}
                  className="w-full"
                  aria-label={`Solicitar orçamento da ${company.name}`}
                >
                  Solicitar orçamento
                </Button>
                <Button asChild variant="ghost" className="mt-2 w-full text-blue-700">
                  <Link
                    href={`/companies/${company.slug || company.id}`}
                    aria-label={`Ver perfil completo da ${company.name}`}
                  >
                    Ver perfil completo
                  </Link>
                </Button>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function ComparisonRow({
  label,
  companies,
  render,
}: {
  label: string;
  companies: CompareCompany[];
  render: (company: CompareCompany) => React.ReactNode;
}) {
  return (
    <tr className="border-b border-slate-100 last:border-0">
      <th scope="row" className="bg-slate-50/70 p-5 text-sm font-bold text-slate-700">
        {label}
      </th>
      {companies.map((company) => (
        <td
          key={company.id}
          className="border-l border-slate-100 p-5 text-sm font-semibold text-slate-700"
        >
          {render(company)}
        </td>
      ))}
    </tr>
  );
}

function MobileComparison({ companies, onRemove, onQuote }: ComparisonProps) {
  return (
    <div className="space-y-4 md:hidden">
      {companies.map((company) => (
        <article
          key={company.id}
          className="relative rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <button
            onClick={() => onRemove(company.id)}
            aria-label={`Remover ${company.name} da comparação`}
            className="absolute right-4 top-4 rounded-full bg-slate-50 p-2 text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
          <CompanyLogo logoUrl={company.logoUrl} name={company.name} size="md" />
          <h3 className="mt-4 pr-10 text-xl font-black text-slate-950">{company.name}</h3>
          <VerificationBadge verified={company.verified} />
          <dl className="mt-5 grid grid-cols-2 gap-3">
            <MobileStat
              label="Avaliação"
              value={`${company.rating.toFixed(1)} (${company.reviewsCount})`}
            />
            <MobileStat
              label="Localização"
              value={[company.city, company.state].filter(Boolean).join(', ') || 'Não informado'}
            />
            <MobileStat label="Resposta" value={company.response_time_sla || 'Consultar'} />
            <MobileStat
              label="Garantia"
              value={company.warranty_years ? `${company.warranty_years} anos` : 'Consultar'}
            />
          </dl>
          <Button
            onClick={() => onQuote(company)}
            className="mt-5 w-full"
            aria-label={`Solicitar orçamento da ${company.name}`}
          >
            Solicitar orçamento
          </Button>
          <Button asChild variant="outline" className="mt-2 w-full">
            <Link
              href={`/companies/${company.slug || company.id}`}
              aria-label={`Ver perfil completo da ${company.name}`}
            >
              Ver perfil completo
            </Link>
          </Button>
        </article>
      ))}
    </div>
  );
}

function MobileStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-bold text-slate-900">{value}</dd>
    </div>
  );
}

function VerificationBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">
      <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Empresa verificada
    </span>
  ) : (
    <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
      <Building2 className="h-3.5 w-3.5" aria-hidden="true" /> Cadastro em análise
    </span>
  );
}

type SearchPanelProps = {
  query: string;
  onQueryChange: (query: string) => void;
  results: Company[];
  selectedCount: number;
  isSearching: boolean;
  canAddMore: boolean;
  onAdd: (company: Company) => void;
};

function CompanySearchPanel({
  query,
  onQueryChange,
  results,
  selectedCount,
  isSearching,
  canAddMore,
  onAdd,
}: SearchPanelProps) {
  const showNoResults = query.trim().length >= 2 && !isSearching && results.length === 0;
  return (
    <aside
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24"
      aria-labelledby="company-search-title"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="company-search-title" className="font-black text-slate-950">
            Adicionar empresa
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {selectedCount}/{MAX_COMPANIES} selecionadas
          </p>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          <Plus className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      <label htmlFor="compare-company-search" className="sr-only">
        Buscar empresa por nome ou cidade
      </label>
      <div className="relative mt-5">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <Input
          id="compare-company-search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Nome ou cidade"
          className="pl-9"
          aria-label="Buscar empresa por nome ou cidade"
          disabled={!canAddMore}
        />
        {isSearching && (
          <Loader2
            className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-blue-600"
            aria-hidden="true"
          />
        )}
      </div>
      {!canAddMore && (
        <p className="mt-4 rounded-xl bg-blue-50 p-3 text-sm font-semibold text-blue-800">
          <CheckCircle2 className="mr-1 inline h-4 w-4" aria-hidden="true" />
          Limite de três empresas atingido.
        </p>
      )}
      <div className="mt-4 space-y-2" aria-live="polite">
        {results.map((company) => (
          <button
            key={company.id}
            onClick={() => onAdd(company)}
            className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3 text-left transition hover:border-blue-300 hover:bg-blue-50/50 focus:outline-none focus:ring-2 focus:ring-blue-600"
            aria-label={`Adicionar ${company.name} à comparação`}
          >
            <CompanyLogo logoUrl={company.logo_url} name={company.name} size="sm" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-slate-900">
                {company.name}
              </span>
              <span className="flex items-center gap-1 truncate text-xs text-slate-500">
                <MapPin className="h-3 w-3" aria-hidden="true" />
                {[company.city, company.state].filter(Boolean).join(', ') || 'Local não informado'}
              </span>
            </span>
            <Plus className="h-4 w-4 shrink-0 text-blue-700" aria-hidden="true" />
          </button>
        ))}
        {showNoResults && (
          <div className="rounded-xl bg-slate-50 p-4 text-center">
            <p className="text-sm font-bold text-slate-800">Nenhuma empresa encontrada.</p>
            <Link
              href="/companies"
              className="mt-2 inline-block text-sm font-bold text-blue-700 hover:underline"
            >
              Ver empresas cadastradas
            </Link>
          </div>
        )}
      </div>
      {query.trim().length < 2 && canAddMore && (
        <p className="mt-4 text-xs leading-5 text-slate-500">
          Digite pelo menos dois caracteres para buscar empresas cadastradas.
        </p>
      )}
    </aside>
  );
}
