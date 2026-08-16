'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCompanyContext } from '@/context/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  companiesApi,
  companyAccessApi,
  type CompanyAccessSuggestedCompany,
  type Company,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Building,
  Building2,
  Check,
  Search,
  Plus,
  Loader2,
  AlertCircle,
  ArrowRight,
  Send,
} from 'lucide-react';
import Image from 'next/image';
import { PremiumBadge } from '@/components/PremiumBadge';
import { SearchEmptyPanel, SearchInitialPanel, SearchLoadingPanel } from './FlowPanels';
import { track } from '@/lib/analytics';

const SEARCH_MIN_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 300;
type FlowState = 'initial' | 'searching' | 'results' | 'empty';

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const includesQuery = (candidate: string | null | undefined, query: string) => {
  if (!candidate) return false;
  return normalizeText(candidate).includes(query);
};

interface ApiErrorShape {
  context?: {
    details?: {
      message?: string;
      error?: string;
      errors?: string[];
    };
    message?: string;
  };
  message?: string;
}

const extractErrorMessage = (error: unknown, fallback: string) => {
  const maybeError = error as ApiErrorShape;
  const detailedMessage =
    maybeError?.context?.details?.message ||
    maybeError?.context?.details?.error ||
    maybeError?.context?.details?.errors?.[0] ||
    maybeError?.context?.message ||
    maybeError?.message;

  return typeof detailedMessage === 'string' && detailedMessage.trim().length > 0
    ? detailedMessage
    : fallback;
};

export default function SelectCompanyPage() {
  const router = useRouter();
  const { loading: authLoading, isAuthenticated } = useAuth();
  const { companies, selectCompany, isLoading } = useCompanyContext();

  const [search, setSearch] = useState('');
  const [selectingId, setSelectingId] = useState<number | null>(null);
  const [requestingId, setRequestingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [contextLoading, setContextLoading] = useState(true);
  const [contextError, setContextError] = useState<string | null>(null);
  const [suggestedCompanies, setSuggestedCompanies] = useState<CompanyAccessSuggestedCompany[]>([]);
  const [pendingRequestIds, setPendingRequestIds] = useState<number[]>([]);

  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<CompanyAccessSuggestedCompany[]>([]);
  const [flowState, setFlowState] = useState<FlowState>('initial');
  const [submittedSearch, setSubmittedSearch] = useState('');

  const normalizedQuery = useMemo(() => normalizeText(search.trim()), [search]);

  const hasPendingRequest = (companyId: number) => pendingRequestIds.includes(companyId);

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;

    if (!isAuthenticated) {
      setContextLoading(false);
      return () => {
        cancelled = true;
      };
    }

    const loadContext = async () => {
      setContextLoading(true);
      setContextError(null);
      try {
        const context = await companyAccessApi.context(
          { limit: 8 },
          { retries: 5, timeout: 25000, useClientCache: true }
        );
        if (cancelled) return;

        setSuggestedCompanies(context?.suggested_companies || []);
        setPendingRequestIds(
          (context?.pending_requests || []).map((request) => request.company_id)
        );
      } catch (error) {
        if (cancelled) return;
        setContextError(
          extractErrorMessage(
            error,
            'Nao foi possivel carregar as sugestoes de empresas para solicitacao de acesso.'
          )
        );
      } finally {
        if (!cancelled) {
          setContextLoading(false);
        }
      }
    };

    void loadContext();

    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    const trimmed = search.trim();
    if (trimmed.length < SEARCH_MIN_LENGTH) {
      setSearchResults([]);
      setSearchError(null);
      setSearchLoading(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setFlowState('searching');
      setSubmittedSearch(trimmed);
      setSearchLoading(true);
      setSearchError(null);
      try {
        const suggestedCompanies = isAuthenticated
          ? (
              await companyAccessApi.context(
                { q: trimmed, limit: 20 },
                { retries: 3, timeout: 20000, useClientCache: false }
              )
            ).suggested_companies || []
          : (await companiesApi.getAll({ q: trimmed, limit: 20 })).map((company) => ({
              company_id: company.id,
              company_name: company.name,
              company_slug: company.slug,
              city: company.city,
              state: company.state,
              verified: company.verified,
              logo_url: company.logo_url,
              cnpj: company.cnpj,
              rating: company.rating_avg,
            }));
        if (cancelled) return;

        setSearchResults(suggestedCompanies);
        setFlowState(suggestedCompanies.length ? 'results' : 'empty');
        track(suggestedCompanies.length ? 'search_performed' : 'search_no_results', {
          source: 'select_company',
          query_length: trimmed.length,
        });
      } catch (error) {
        if (cancelled) return;
        setSearchResults([]);
        setFlowState('empty');
        setSearchError(
          extractErrorMessage(
            error,
            'Nao foi possivel pesquisar empresas agora. Tente novamente em instantes.'
          )
        );
      } finally {
        if (!cancelled) {
          setSearchLoading(false);
        }
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [search, isAuthenticated]);

  const filteredMyCompanies = useMemo(() => {
    if (!normalizedQuery) return companies;
    return companies.filter((company) => {
      return (
        includesQuery(company.name, normalizedQuery) ||
        includesQuery(company.city, normalizedQuery) ||
        includesQuery(company.state, normalizedQuery)
      );
    });
  }, [companies, normalizedQuery]);

  const visibleSuggestedCompanies = useMemo(() => {
    const source = normalizedQuery.length >= SEARCH_MIN_LENGTH ? searchResults : suggestedCompanies;
    return source.filter(
      (company) => !companies.some((membership) => membership.id === company.company_id)
    );
  }, [normalizedQuery.length, searchResults, suggestedCompanies, companies]);

  const handleSelect = async (company: Company) => {
    if (selectingId || requestingId) return;

    try {
      setActionError(null);
      setActionSuccess(null);
      setSelectingId(company.id);

      await selectCompany(company);
      router.push(`/dashboard?company_id=${company.id}`);
    } catch (error) {
      setActionError(
        extractErrorMessage(error, 'Nao foi possivel selecionar a empresa. Tente novamente.')
      );
    } finally {
      setSelectingId(null);
    }
  };

  const handleRequestAccess = async (company: CompanyAccessSuggestedCompany) => {
    const companyId = company.company_id;
    if (!companyId || requestingId || selectingId) return;
    if (hasPendingRequest(companyId)) return;

    try {
      setActionError(null);
      setActionSuccess(null);
      setRequestingId(companyId);

      await companyAccessApi.createRequest(
        companyId,
        `Solicitacao de acesso enviada via tela de selecao para ${company.company_name}`
      );

      setPendingRequestIds((current) => Array.from(new Set([...current, companyId])));
      setActionSuccess(
        `Solicitação enviada para aprovação do admin da empresa ${company.company_name}.`
      );
    } catch (error) {
      setActionError(
        extractErrorMessage(error, 'Nao foi possivel enviar a solicitacao de acesso.')
      );
    } finally {
      setRequestingId(null);
    }
  };

  if (authLoading || isLoading || contextLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando empresas...</p>
        </div>
      </div>
    );
  }

  const submitSearch = () => {
    const value = search.trim();
    if (value.length < SEARCH_MIN_LENGTH) return;
    setSubmittedSearch(value);
    setFlowState('searching');
  };

  const journeyHeader = (
    <header className="mb-4 text-center">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#0755f5]">
        Encontre sua empresa
      </p>
      <h1 className="mt-1 text-xl font-bold text-[#10265b]">Encontre a empresa que você busca</h1>
      <p className="mt-1 text-xs text-[#60708f]">
        Encontre ou solicite acesso a empresas do setor solar.
      </p>
    </header>
  );

  const journeyProgress = (
    <nav
      aria-label="Progresso da jornada"
      className="mb-5 flex justify-center gap-2 text-[10px] font-semibold text-[#60708f]"
    >
      <span className="text-[#0755f5]">1 Buscar</span>
      <span aria-hidden="true">/</span>
      <span className={flowState === 'results' ? 'text-[#0755f5]' : undefined}>2 Resultados</span>
    </nav>
  );

  const searchForm = (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submitSearch();
      }}
      className="flex gap-2"
    >
      <div className="relative min-w-0 flex-1">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nome da empresa ou CNPJ"
          className="h-9 pl-8 text-xs"
        />
      </div>
      <Button
        type="submit"
        disabled={search.trim().length < SEARCH_MIN_LENGTH || searchLoading}
        className="h-9 bg-[#0755f5] px-3 text-xs text-white"
      >
        Buscar
      </Button>
    </form>
  );

  const shell = (content: React.ReactNode) => (
    <main className="min-h-screen bg-[#f8faff] px-4 py-8">
      <div className="mx-auto w-full max-w-[620px]">
        {journeyProgress}
        {journeyHeader}
        {content}
      </div>
    </main>
  );

  if (flowState === 'initial') {
    return shell(<SearchInitialPanel>{searchForm}</SearchInitialPanel>);
  }

  if (flowState === 'searching') {
    return shell(
      <SearchLoadingPanel>
        <div className="mb-5">{searchForm}</div>
        <div className="flex flex-col items-center py-7">
          <Loader2 className="h-10 w-10 animate-spin text-[#0755f5]" />
          <h2 className="mt-4 text-sm font-bold">Buscando empresas...</h2>
          <p className="mt-1 text-xs text-[#60708f]">Isso pode levar alguns segundos.</p>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex gap-3 rounded-lg border border-[#edf1f8] p-3">
              <div className="h-9 w-9 animate-pulse rounded bg-[#edf2fb]" />
              <div className="flex-1 space-y-2">
                <div className="h-2.5 w-2/3 animate-pulse rounded bg-[#edf2fb]" />
                <div className="h-2 w-1/2 animate-pulse rounded bg-[#f3f6fb]" />
              </div>
            </div>
          ))}
        </div>
      </SearchLoadingPanel>
    );
  }

  if (flowState === 'empty') {
    return shell(
      <div className="space-y-4">
        <SearchEmptyPanel>
          <Search className="h-14 w-14 text-[#0755f5]" />
          <h2 className="mt-4 text-sm font-bold">Nenhuma empresa encontrada</h2>
          <p className="mt-2 max-w-[300px] text-xs leading-5 text-[#60708f]">
            Não encontramos nenhuma empresa com “{submittedSearch}”.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('');
                setFlowState('initial');
              }}
            >
              Tentar outra busca
            </Button>
            <Button
              size="sm"
              className="bg-[#ffb900] text-[#15284c] hover:bg-[#e5a600]"
              onClick={() => router.push('/register-company')}
            >
              Cadastrar nova empresa
            </Button>
          </div>
        </SearchEmptyPanel>
        {suggestedCompanies.length > 0 && (
          <section className="rounded-xl border border-[#d8e4f8] bg-white p-4">
            <h2 className="text-sm font-bold">Você quis dizer?</h2>
            <p className="mt-2 text-xs text-[#60708f]">Empresas parecidas com sua busca:</p>
            <div className="mt-4 space-y-2">
              {suggestedCompanies.slice(0, 4).map((company) => (
                <button
                  key={company.company_id}
                  type="button"
                  onClick={() =>
                    router.push(`/companies/${company.company_slug || company.company_id}`)
                  }
                  className="flex w-full items-center gap-2 rounded-lg border border-[#e1e9f8] p-3 text-left text-xs font-semibold"
                >
                  <Building2 className="h-4 w-4 text-[#0755f5]" />
                  {company.company_name}
                  <ArrowRight className="ml-auto h-3 w-3" />
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  if (flowState === 'results') {
    return shell(
      <div className="space-y-4">
        <section className="rounded-xl border border-[#d8e4f8] bg-white p-4">
          <div className="mb-4">{searchForm}</div>
          <div className="mb-4 flex items-center justify-between text-xs text-[#60708f]">
            <span>{visibleSuggestedCompanies.length} empresas encontradas</span>
            <span className="rounded border px-2 py-1">Ordenar: Relevância</span>
          </div>
          <div className="space-y-2">
            {visibleSuggestedCompanies.map((company) => (
              <div
                key={company.company_id}
                className="flex flex-col gap-3 rounded-lg border border-[#e1e9f8] p-3 sm:flex-row sm:items-center"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#e1e9f8] bg-white">
                  {company.logo_url ? (
                    <img
                      src={company.logo_url}
                      alt={company.company_name}
                      className="h-full w-full object-contain p-1"
                    />
                  ) : (
                    <Building2 className="h-5 w-5 text-[#0755f5]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold">{company.company_name}</p>
                  <p className="text-[10px] text-[#60708f]">
                    {company.city || '-'}, {company.state || '-'} · CNPJ{' '}
                    {company.cnpj || 'não informado'}
                  </p>
                  {company.verified && <PremiumBadge className="mt-1 px-1 py-0" />}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    router.push(`/companies/${company.company_slug || company.company_id}`)
                  }
                >
                  Ver detalhes
                </Button>
                <Button
                  size="sm"
                  variant={hasPendingRequest(company.company_id) ? 'secondary' : 'outline'}
                  disabled={
                    hasPendingRequest(company.company_id) || requestingId === company.company_id
                  }
                  onClick={() => handleRequestAccess(company)}
                >
                  {requestingId === company.company_id
                    ? 'Enviando...'
                    : hasPendingRequest(company.company_id)
                      ? 'Solicitação pendente'
                      : 'Solicitar acesso'}
                </Button>
              </div>
            ))}
          </div>
        </section>
        <Button
          className="w-full bg-[#ffb900] text-[#15284c] hover:bg-[#e5a600]"
          onClick={() => router.push('/register-company')}
        >
          <Plus className="mr-1 h-4 w-4" />
          Cadastrar empresa
        </Button>
      </div>
    );
  }

  return null;
}
