'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCompanyContext } from '@/context/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  companiesApi,
  companyAccessApi,
  type CompanyAccessSuggestedCompany,
  type CompanyAccessPendingRequest,
  type Company,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Check,
  Search,
  Plus,
  Loader2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { normalizeCompanySelectionList } from './company-selection';
import VerificationBadge from '@/components/company/VerificationBadge';
import { SearchEmptyPanel, SearchInitialPanel, SearchLoadingPanel } from './FlowPanels';
import { CompanyAccessSidebar } from '@/components/company-access/CompanyAccessSidebar';
import { ErrorBoundary } from '@/components/error-boundary';
import { track } from '@/lib/analytics';
import { ApiError } from '@/lib/api-error';

const SEARCH_MIN_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 300;
type FlowState = 'initial' | 'searching' | 'results' | 'empty';

/**
 * Estado canônico da state machine de acesso empresarial.
 * Determina qual UI é exibida ao usuário nesta tela.
 */
type CompanyEntryState =
  | 'loading'          // auth ou companies ainda carregando
  | 'guest'            // não autenticado
  | 'no-membership'    // autenticado, 0 memberships → busca/solicitar
  | 'single-membership'// 1 membership → auto-select e redirecionar
  | 'multiple-memberships' // 2+ memberships → chooser
  | 'pending-only'     // 0 memberships ativas, somente pending requests
  | 'error';

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
  // Mensagem própria do erro só quando veio do servidor (ApiError 4xx); falhas de
  // rede/timeout/erros genéricos mostram o texto amigável do fallback.
  const serverMessage =
    error instanceof ApiError &&
    !error.isNetworkError &&
    !error.isTimeout &&
    typeof error.status === 'number' &&
    error.status >= 400 &&
    error.status < 500
      ? error.message
      : undefined;
  const detailedMessage =
    maybeError?.context?.details?.message ||
    maybeError?.context?.details?.error ||
    maybeError?.context?.details?.errors?.[0] ||
    maybeError?.context?.message ||
    serverMessage;

  return typeof detailedMessage === 'string' && detailedMessage.trim().length > 0
    ? detailedMessage
    : fallback;
};

function SelectCompanyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { companies, activeCompany, selectCompany, isLoading } = useCompanyContext();
  const isAddMode = searchParams.get('mode') === 'add';

  // State machine para determinar qual UI exibir
  const [entryState, setEntryState] = useState<CompanyEntryState>('loading');
  const [autoSelectAttempted, setAutoSelectAttempted] = useState(false);

  const [search, setSearch] = useState('');
  const [selectingId, setSelectingId] = useState<number | null>(null);
  const [requestingId, setRequestingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [contextLoading, setContextLoading] = useState(true);
  const [contextError, setContextError] = useState<string | null>(null);
  const [suggestedCompanies, setSuggestedCompanies] = useState<CompanyAccessSuggestedCompany[]>([]);
  const [pendingRequests, setPendingRequests] = useState<CompanyAccessPendingRequest[]>([]);
  const [pendingRequestIds, setPendingRequestIds] = useState<number[]>([]);

  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<CompanyAccessSuggestedCompany[]>([]);
  const [flowState, setFlowState] = useState<FlowState>('initial');
  const [submittedSearch, setSubmittedSearch] = useState('');

  const normalizedQuery = useMemo(() => normalizeText(search.trim()), [search]);

  const hasPendingRequest = (companyId: number) => pendingRequestIds.includes(companyId);

  // ── State machine resolution ────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading || isLoading) {
      setEntryState('loading');
      return;
    }

    if (!isAuthenticated) {
      setEntryState('guest');
      return;
    }

    // 1 empresa e não está em modo de adicionar outra: auto-select e redirecionar
    if (companies.length === 1 && !isAddMode && !autoSelectAttempted) {
      const company = activeCompany || companies[0];
      setAutoSelectAttempted(true);
      setEntryState('single-membership');
      void selectCompany(company)
        .then(() => router.replace(`/dashboard?company_id=${company.id}`))
        .catch(() => setEntryState('error'));
      return;
    }

    // 2+ empresas e não está em modo de adicionar outra:
    if (companies.length > 1 && !isAddMode && !autoSelectAttempted) {
      if (activeCompany) {
        setAutoSelectAttempted(true);
        router.replace(`/dashboard?company_id=${activeCompany.id}`);
        return;
      }
      setEntryState('multiple-memberships');
      return;
    }

    // Reviewer puro (sem companies) → vai para review-dashboard, não fica nesta tela
    if (user?.role === 'review' && companies.length === 0 && !isAddMode && !autoSelectAttempted) {
      router.replace('/review-dashboard');
      return;
    }

    if (companies.length > 1) {
      setEntryState('multiple-memberships');
      return;
    }

    if (isAddMode || companies.length === 0) {
      setEntryState('no-membership');
      return;
    }

    // 0 memberships ativas — verificar se tem pending requests
    if (pendingRequestIds.length > 0) {
      setEntryState('pending-only');
      return;
    }

    setEntryState('no-membership');
  }, [
    authLoading,
    isLoading,
    isAuthenticated,
    companies,
    activeCompany,
    pendingRequestIds,
    user,
    autoSelectAttempted,
    isAddMode,
    selectCompany,
    router,
  ]);

  // ── Carregamento resiliente do contexto (não bloqueia a busca) ───────────────
  const loadAccessContext = useCallback(async () => {
    if (authLoading) return;

    if (!isAuthenticated) {
      setContextLoading(false);
      return;
    }

    setContextLoading(true);
    setContextError(null);
    try {
      const context = await companyAccessApi.context(
        { limit: 8 },
        { retries: 1, timeout: 8000, useClientCache: true }
      );

      setSuggestedCompanies(context?.suggested_companies || []);
      const requests = context?.pending_requests || [];
      setPendingRequests(requests);
      setPendingRequestIds(requests.map((request) => request.company_id));
    } catch (error) {
      setContextError(
        extractErrorMessage(
          error,
          'Não foi possível carregar as sugestões de empresas. Tente novamente.'
        )
      );
    } finally {
      setContextLoading(false);
    }
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    void loadAccessContext();
  }, [loadAccessContext]);

  // ── Busca debounceada ───────────────────────────────────────────────────────
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
                { retries: 1, timeout: 8000, useClientCache: false }
              )
            ).suggested_companies || []
          : normalizeCompanySelectionList(
              await companiesApi.searchForSelection({ q: trimmed, limit: 20 })
            );
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
            'Não foi possível pesquisar empresas agora. Tente novamente em instantes.'
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
        extractErrorMessage(error, 'Não foi possível selecionar a empresa. Tente novamente.')
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
        `Solicitação de acesso enviada via tela de seleção para ${company.company_name}`
      );

      const newReq: CompanyAccessPendingRequest = {
        id: Date.now(),
        company_id: companyId,
        company_name: company.company_name,
        status: 'pending',
        requested_at: new Date().toISOString(),
      };
      setPendingRequests((current) => [newReq, ...current]);
      setPendingRequestIds((current) => Array.from(new Set([...current, companyId])));
      setActionSuccess(
        `Solicitação enviada para aprovação do admin da empresa ${company.company_name}.`
      );
    } catch (error) {
      setActionError(
        extractErrorMessage(error, 'Não foi possível enviar a solicitação de acesso.')
      );
    } finally {
      setRequestingId(null);
    }
  };

  // Cálculo da empresa ativa ou selecionada sem Hook (expressão pura sem violar Rules of Hooks)
  const activeOrSelectedCompany =
    activeCompany ??
    companies[0] ??
    (pendingRequests[0]
      ? suggestedCompanies.find((c) => c.company_id === pendingRequests[0].company_id) ?? null
      : null);

  // ── Retornos condicionais de guarda (todos os Hooks já foram chamados acima) ─
  if (entryState === 'loading' || authLoading || isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando empresas...</p>
        </div>
      </div>
    );
  }

  if (entryState === 'guest') {
    router.replace('/login?return_to=%2Fselect-company');
    return null;
  }

  if (!isAddMode && (entryState === 'single-membership' || entryState === 'error')) {
    return null;
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
          placeholder="Buscar por nome da empresa"
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
      <div className="mx-auto w-full max-w-[1024px]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 w-full max-w-[620px] mx-auto lg:max-w-none">
            {journeyProgress}
            {journeyHeader}

            {/* Alertas de Ação e Feedback Visual */}
            {actionError && (
              <div
                role="alert"
                className="mb-4 flex items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                  <span>{actionError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActionError(null)}
                  className="ml-2 font-bold text-red-600 hover:text-red-800"
                  aria-label="Fechar mensagem de erro"
                >
                  ✕
                </button>
              </div>
            )}

            {actionSuccess && (
              <div
                role="status"
                className="mb-4 flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800"
              >
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{actionSuccess}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActionSuccess(null)}
                  className="ml-2 font-bold text-emerald-600 hover:text-emerald-800"
                  aria-label="Fechar mensagem de sucesso"
                >
                  ✕
                </button>
              </div>
            )}

            {contextError && (
              <div
                role="alert"
                className="mb-4 flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                  <span>{contextError}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void loadAccessContext()}
                    className="font-semibold text-amber-900 underline hover:text-amber-950 focus:outline-none"
                    aria-label="Tentar carregar sugestões novamente"
                  >
                    Tentar novamente
                  </button>
                  <button
                    type="button"
                    onClick={() => setContextError(null)}
                    className="ml-2 font-bold text-amber-600 hover:text-amber-800"
                    aria-label="Fechar aviso"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {searchError && (
              <div
                role="alert"
                className="mb-4 flex items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                  <span>{searchError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSearchError(null)}
                  className="ml-2 font-bold text-red-600 hover:text-red-800"
                  aria-label="Fechar erro de busca"
                >
                  ✕
                </button>
              </div>
            )}

            {content}
          </div>

          <div className="lg:col-span-4 w-full">
            <ErrorBoundary
              fallback={
                <div className="w-full max-w-[300px] mx-auto rounded-lg border border-slate-200 bg-white p-4 shadow-sm text-xs text-slate-500">
                  <p className="font-semibold text-slate-700">Informações complementares</p>
                  <p className="mt-1 text-[11px]">Não foi possível carregar os dados laterais no momento.</p>
                </div>
              }
            >
              <CompanyAccessSidebar
                selectedCompany={activeOrSelectedCompany}
                pendingRequest={pendingRequests[0] || null}
              />
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </main>
  );

  // ── Renderização para usuários com 2+ empresas cadastradas ───────────────────
  if (entryState === 'multiple-memberships') {
    return shell(
      <div className="space-y-6">
        <section className="rounded-xl border border-[#d8e4f8] bg-white p-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#edf1f8]">
            <div>
              <h2 className="text-sm font-bold text-[#10265b]">Suas Empresas Vinculadas</h2>
              <p className="text-xs text-[#60708f] mt-0.5">Selecione a empresa que deseja gerenciar agora:</p>
            </div>
            <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 text-[10px]">
              {companies.length} empresas
            </Badge>
          </div>

          <div className="mt-3 space-y-2">
            {filteredMyCompanies.map((company) => (
              <div
                key={company.id}
                className="flex flex-col gap-3 rounded-lg border border-[#e1e9f8] p-3 sm:flex-row sm:items-center hover:border-[#0755f5]/30 transition-colors"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#e1e9f8] bg-white">
                  {company.logo_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={company.logo_url}
                      alt={company.name}
                      className="h-full w-full object-contain p-1"
                    />
                  ) : (
                    <Building2 className="h-5 w-5 text-[#0755f5]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold">{company.name}</p>
                  <p className="text-[10px] text-[#60708f]">
                    {company.city || '-'}, {company.state || '-'}
                  </p>
                </div>
                <Button
                  size="sm"
                  className="bg-[#0755f5] text-white hover:bg-[#0644c5] text-xs h-8"
                  disabled={selectingId === company.id}
                  onClick={() => handleSelect(company)}
                >
                  {selectingId === company.id ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Acessando...
                    </>
                  ) : (
                    <>
                      <span>Acessar painel</span>
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-[#d8e4f8] bg-white p-4">
          <h3 className="text-xs font-bold text-[#10265b] uppercase tracking-wider mb-2">
            Vincular outra empresa
          </h3>
          <p className="text-xs text-[#60708f] mb-3">
            Precisa gerenciar ou solicitar acesso a outra empresa parceira? Busque pelo nome abaixo:
          </p>
          {searchForm}
        </section>
      </div>
    );
  }

  if (flowState === 'initial') {
    return shell(
      <SearchInitialPanel>
        {searchForm}
        {contextLoading && (
          <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-[#60708f]">
            <Loader2 className="h-3 w-3 animate-spin text-[#0755f5]" />
            <span>Carregando dados iniciais...</span>
          </div>
        )}
      </SearchInitialPanel>
    );
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
                    /* eslint-disable-next-line @next/next/no-img-element */
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
                  <div className="flex items-center gap-1.5 min-w-0">
                    <p className="truncate text-xs font-bold">{company.company_name}</p>
                    {company.verified && <VerificationBadge verified={company.verified} size="sm" />}
                  </div>
                  <p className="text-[10px] text-[#60708f]">
                    {company.city || '-'}, {company.state || '-'}
                  </p>
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

function SelectCompanyLoading() {
  return (
    <div className="flex h-[80vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Carregando empresas...</p>
      </div>
    </div>
  );
}

export default function SelectCompanyPage() {
  return (
    <Suspense fallback={<SelectCompanyLoading />}>
      <SelectCompanyContent />
    </Suspense>
  );
}
