'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCompanyContext } from '@/context/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { companyAccessApi, type CompanyAccessSuggestedCompany, type Company } from '@/lib/api';
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
  const { loading: authLoading } = useAuth();
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
        setPendingRequestIds((context?.pending_requests || []).map((request) => request.company_id));
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
  }, [authLoading]);

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
        const context = await companyAccessApi.context(
          { q: trimmed, limit: 20 },
          { retries: 3, timeout: 20000, useClientCache: false }
        );
        if (cancelled) return;

        setSearchResults(context?.suggested_companies || []);
        setFlowState(context?.suggested_companies?.length ? 'results' : 'empty');
        track(context?.suggested_companies?.length ? 'search_performed' : 'search_no_results', { source: 'select_company', query_length: trimmed.length });
        const pendingIds = (context?.pending_requests || []).map((request) => request.company_id);
        setPendingRequestIds((current) => Array.from(new Set([...current, ...pendingIds])));
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
  }, [search]);

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

  const journeyHeader = (<header className="mb-4 text-center"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#0755f5]">Search - Todos os fluxos</p><h1 className="mt-1 text-xl font-bold text-[#10265b]">Encontre a empresa que você busca</h1><p className="mt-1 text-xs text-[#60708f]">Encontre ou solicite acesso a empresas do setor solar.</p></header>);
  const searchForm = (<form onSubmit={(event) => { event.preventDefault(); submitSearch(); }} className="flex gap-2"><div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome da empresa ou CNPJ" className="h-9 pl-8 text-xs" /></div><Button type="submit" disabled={search.trim().length < SEARCH_MIN_LENGTH || searchLoading} className="h-9 bg-[#0755f5] px-3 text-xs text-white">Buscar</Button></form>);
  if (flowState === 'initial') return <main className="min-h-screen bg-[#f8faff] px-4 py-8"><div className="mx-auto max-w-[1100px]">{journeyHeader}<div className="grid gap-4 md:grid-cols-3"><SearchInitialPanel>{searchForm}</SearchInitialPanel><div className="hidden min-h-[370px] rounded-xl border border-[#d8e4f8] bg-white md:block" /><div className="hidden min-h-[370px] rounded-xl border border-[#d8e4f8] bg-white md:block" /></div></div></main>;
  if (flowState === 'searching') return <main className="min-h-screen bg-[#f8faff] px-4 py-8"><div className="mx-auto max-w-[1100px]">{journeyHeader}<div className="grid gap-4 md:grid-cols-3"><SearchLoadingPanel><div className="mb-5">{searchForm}</div><div className="flex flex-col items-center py-7"><Loader2 className="h-10 w-10 animate-spin text-[#0755f5]" /><h2 className="mt-4 text-sm font-bold">Buscando empresas...</h2><p className="mt-1 text-xs text-[#60708f]">Isso pode levar alguns segundos.</p></div><div className="space-y-2">{[1,2,3].map((item) => <div key={item} className="flex gap-3 rounded-lg border border-[#edf1f8] p-3"><div className="h-9 w-9 animate-pulse rounded bg-[#edf2fb]" /><div className="flex-1 space-y-2"><div className="h-2.5 w-2/3 animate-pulse rounded bg-[#edf2fb]" /><div className="h-2 w-1/2 animate-pulse rounded bg-[#f3f6fb]" /></div></div>)}</div></SearchLoadingPanel><div className="hidden md:block" /><div className="hidden md:block" /></div></div></main>;
  if (flowState === 'empty') return <main className="min-h-screen bg-[#f8faff] px-4 py-8"><div className="mx-auto max-w-[1100px]">{journeyHeader}<div className="grid gap-4 md:grid-cols-3"><SearchEmptyPanel><Search className="h-14 w-14 text-[#0755f5]" /><h2 className="mt-4 text-sm font-bold">Nenhuma empresa encontrada</h2><p className="mt-2 max-w-[210px] text-xs leading-5 text-[#60708f]">Não encontramos nenhuma empresa com “{submittedSearch}”.</p><div className="mt-4 flex flex-wrap justify-center gap-2"><Button variant="outline" size="sm" onClick={() => { setSearch(''); setFlowState('initial'); }}>Tentar outra busca</Button><Button size="sm" className="bg-[#ffb900] text-[#15284c] hover:bg-[#e5a600]" onClick={() => router.push('/register-company')}>Cadastrar nova empresa</Button></div></SearchEmptyPanel><div className="hidden md:block" /><aside className="rounded-xl border border-[#d8e4f8] bg-white p-4"><h2 className="text-sm font-bold">Você quis dizer?</h2><p className="mt-2 text-xs text-[#60708f]">Empresas parecidas com sua busca:</p><div className="mt-4 space-y-2">{suggestedCompanies.slice(0,4).map((company) => <button key={company.company_id} type="button" onClick={() => router.push('/companies/'+(company.company_slug || company.company_id))} className="flex w-full items-center gap-2 rounded-lg border border-[#e1e9f8] p-3 text-left text-xs font-semibold"><Building2 className="h-4 w-4 text-[#0755f5]" />{company.company_name}<ArrowRight className="ml-auto h-3 w-3" /></button>)}</div><Button className="mt-4 w-full bg-[#ffb900] text-[#15284c] hover:bg-[#e5a600]"><Plus className="mr-1 h-4 w-4" />Cadastrar empresa</Button></aside></div></div></main>;
  if (flowState === 'results') return <main className="min-h-screen bg-[#f8faff] px-4 py-8"><div className="mx-auto max-w-[1100px]">{journeyHeader}<div className="grid gap-4 md:grid-cols-[1.25fr_1fr_.9fr]"><section className="rounded-xl border border-[#d8e4f8] bg-white p-4"><div className="flex gap-2">{searchForm}<Button variant="outline" size="sm">Filtros</Button></div><div className="my-4 flex items-center justify-between text-xs text-[#60708f]"><span>{visibleSuggestedCompanies.length} empresas encontradas</span><span className="rounded border px-2 py-1">Ordenar: Relevância</span></div><div className="space-y-2">{visibleSuggestedCompanies.map((company) => <div key={company.company_id} className="flex items-center gap-3 rounded-lg border border-[#e1e9f8] p-3"><Building2 className="h-7 w-7 text-[#0755f5]" /><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{company.company_name}</p><p className="text-[10px] text-[#60708f]">{company.city || '-'}, {company.state || '-'} · CNPJ {company.cnpj || 'não informado'}</p>{company.verified && <PremiumBadge className="mt-1 px-1 py-0" />}</div><Button size="sm" variant="outline" onClick={() => router.push('/companies/'+(company.company_slug || company.company_id))}>Ver detalhes</Button></div>)}</div></section><SearchEmptyPanel><Search className="h-10 w-10 text-[#0755f5]" /><p className="mt-3 text-xs text-[#60708f]">Outra busca sem resultado?</p></SearchEmptyPanel><aside className="rounded-xl border border-[#d8e4f8] bg-white p-4"><h2 className="text-sm font-bold">Próximos passos</h2><p className="mt-2 text-xs text-[#60708f]">Cadastre sua empresa e comece a receber solicitações.</p><Button className="mt-5 w-full bg-[#ffb900] text-[#15284c] hover:bg-[#e5a600]"><Plus className="mr-1 h-4 w-4" />Cadastrar empresa</Button></aside></div></div></main>;

  return (
    <div className="min-h-screen bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-[1100px] bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        <div className="p-6 sm:p-8 pb-4 space-y-2">
          <div className="mb-4 flex items-center gap-2 overflow-x-auto text-[10px] font-bold uppercase tracking-wide text-blue-600">{['Busca inicial', 'Buscando', 'Resultados', 'Não encontrada', 'Próximos passos'].map((step, index) => <span key={step} className="flex shrink-0 items-center gap-1"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white">{index + 1}</span>{step}{index < 4 && <span className="px-1 text-slate-300">→</span>}</span>)}</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Encontre a empresa que você busca
          </h1>
          <p className="text-gray-500 text-sm sm:text-base">
            Pesquise pelo nome ou CNPJ para solicitar acesso ou conhecer mais detalhes.
          </p>
        </div>

        <div className="px-6 sm:px-8 pb-6 space-y-5">
          <div className="relative flex gap-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome da empresa ou CNPJ"
              className="flex-1 pl-10 h-11 bg-gray-50 border-gray-200 focus-visible:ring-primary/20"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Button type="button" disabled={search.trim().length < SEARCH_MIN_LENGTH || searchLoading} className="bg-blue-600 text-white" onClick={() => { setFlowState('searching'); setSubmittedSearch(search.trim()); }}>Buscar</Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="px-3 py-1 bg-gray-100 text-gray-600">
              Minhas empresas: {companies.length}
            </Badge>
            <Badge variant="secondary" className="px-3 py-1 bg-gray-100 text-gray-600">
              Solicitações pendentes: {pendingRequestIds.length}
            </Badge>
          </div>

          {contextError && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{contextError}</span>
            </div>
          )}

          {actionError && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {actionSuccess && (
            <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <Check className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Minhas empresas</h4>

            {filteredMyCompanies.length > 0 ? (
              filteredMyCompanies.map((company) => {
                const isSelecting = selectingId === company.id;
                return (
                  <div
                    key={company.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/20 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="relative h-11 w-11 rounded-full border border-gray-100 bg-white overflow-hidden flex items-center justify-center shrink-0">
                        {company.logo_url ? (
                          <Image
                            src={company.logo_url}
                            alt={company.name}
                            fill
                            className="object-cover p-1"
                          />
                        ) : (
                          <Building2 className="h-5 w-5 text-gray-300" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 truncate">{company.name}</span>
                          {company.verified && (
                            <PremiumBadge className="px-1.5 py-0.5" />
                          )}
                        </div>
                        <span className="text-sm text-gray-500">
                          {company.city || '-'}, {company.state || '-'}
                        </span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold min-w-[160px]"
                      disabled={isSelecting || requestingId !== null}
                      onClick={() => handleSelect(company)}
                    >
                      {isSelecting ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Selecionando...
                        </span>
                      ) : (
                        'Selecionar'
                      )}
                    </Button>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-sm text-gray-500">
                Nenhuma empresa sua encontrada para a busca atual.
              </div>
            )}
          </div>

          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">
              Resultados encontrados
            </h4>

            {searchLoading && (
              <div className="space-y-3">{[1, 2, 3].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-xl border border-blue-50 p-4">
                  <div className="h-11 w-11 animate-pulse rounded-xl bg-blue-50" />
                  <div className="flex-1 space-y-2"><div className="h-3 w-2/3 animate-pulse rounded bg-blue-50" /><div className="h-2 w-1/2 animate-pulse rounded bg-slate-100" /></div>
                </div>
              ))}</div>
            )}

            {searchError && !searchLoading && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {searchError}
              </div>
            )}

            {!searchLoading && visibleSuggestedCompanies.length > 0 && (
              <div className="space-y-3">
                {visibleSuggestedCompanies.map((company) => {
                  const companyId = company.company_id;
                  const isRequesting = requestingId === companyId;
                  const isPending = hasPendingRequest(companyId);

                  return (
                    <div
                      key={companyId}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/20 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="relative h-11 w-11 rounded-full border border-gray-100 bg-white overflow-hidden flex items-center justify-center shrink-0">
                          {company.logo_url ? (
                            <Image
                              src={company.logo_url}
                              alt={company.company_name}
                              fill
                              className="object-cover p-1"
                            />
                          ) : (
                            <Building className="h-5 w-5 text-gray-300" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 truncate">
                              {company.company_name}
                            </span>
                            {company.verified && (
                              <PremiumBadge className="px-1.5 py-0.5" />
                            )}
                          </div>
                          <span className="text-sm text-gray-500">
                            {company.city || '-'}, {company.state || '-'}
                          </span>
                        </div>
                      </div>

                      <Button type="button" variant="outline" className="font-semibold" onClick={() => { track('company_viewed', { source: 'select_company' }); router.push(`/companies/${company.company_slug || companyId}`); }}>Ver detalhes</Button>

                      <Button
                        type="button"
                        variant={isPending ? 'secondary' : 'outline'}
                        className="font-semibold min-w-[190px]"
                        disabled={isPending || isRequesting || selectingId !== null}
                        onClick={() => handleRequestAccess(company)}
                      >
                        {isRequesting ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Enviando...
                          </span>
                        ) : isPending ? (
                          'Solicitação pendente'
                        ) : (
                          <span className="flex items-center gap-2">
                            <Send className="h-4 w-4" />
                            Solicitar acesso
                          </span>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            {!searchLoading && !searchError && visibleSuggestedCompanies.length === 0 && (
              <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-sm text-gray-500">
                {flowState === 'empty' && submittedSearch
                  ? <>Nenhuma empresa encontrada para “{submittedSearch}”. <Button className="ml-2 bg-amber-400 text-slate-900" onClick={() => router.push('/register-company')}>Cadastrar empresa</Button></>
                  : 'Digite pelo menos 2 caracteres para buscar empresas pelo nome.'}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 sm:p-8 bg-gray-50/80 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:justify-between">
          <div className="flex flex-col gap-1">
            <p className="text-gray-500 font-medium text-sm sm:text-base">
              Ainda não encontrou sua empresa?
            </p>
            <button
              type="button"
              className="text-xs text-blue-600 hover:underline text-left"
              onClick={() => router.push('/select-company/requests')}
            >
              Acompanhar solicitações enviadas
            </button>
          </div>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2"
            onClick={() => { track('company_registration_started', { source: 'select_company' }); router.push('/register-company'); }}
          >
            <Plus className="h-4 w-4" />
            Cadastrar empresa
          </Button>
        </div>
      </div>
    </div>
  );
}
