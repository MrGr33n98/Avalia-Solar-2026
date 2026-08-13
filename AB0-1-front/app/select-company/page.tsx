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

const SEARCH_MIN_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 300;

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
      setSearchLoading(true);
      setSearchError(null);
      try {
        const context = await companyAccessApi.context(
          { q: trimmed, limit: 20 },
          { retries: 3, timeout: 20000, useClientCache: false }
        );
        if (cancelled) return;

        setSearchResults(context?.suggested_companies || []);
        const pendingIds = (context?.pending_requests || []).map((request) => request.company_id);
        setPendingRequestIds((current) => Array.from(new Set([...current, ...pendingIds])));
      } catch (error) {
        if (cancelled) return;
        setSearchResults([]);
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
        `Solicitacao enviada para aprovacao do admin da empresa ${company.company_name}.`
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

  return (
    <div className="min-h-screen bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-[820px] bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        <div className="p-6 sm:p-8 pb-4 space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Escolha a empresa para administrar
          </h1>
          <p className="text-gray-500 text-sm sm:text-base">
            Busque por nome, selecione uma empresa sua ou solicite acesso para aprovacao.
          </p>
        </div>

        <div className="px-6 sm:px-8 pb-6 space-y-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar empresa por nome..."
              className="pl-10 h-11 bg-gray-50 border-gray-200 focus-visible:ring-primary/20"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="px-3 py-1 bg-gray-100 text-gray-600">
              Minhas empresas: {companies.length}
            </Badge>
            <Badge variant="secondary" className="px-3 py-1 bg-gray-100 text-gray-600">
              Solicitacoes pendentes: {pendingRequestIds.length}
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
              Empresas para solicitar acesso
            </h4>

            {searchLoading && (
              <div className="flex items-center justify-center py-6 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Buscando empresas...
              </div>
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
                          'Solicitacao pendente'
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
                {search.trim().length >= SEARCH_MIN_LENGTH
                  ? 'Nenhuma empresa encontrada com esse nome.'
                  : 'Digite pelo menos 2 caracteres para buscar empresas pelo nome.'}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 sm:p-8 bg-gray-50/80 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:justify-between">
          <div className="flex flex-col gap-1">
            <p className="text-gray-500 font-medium text-sm sm:text-base">
              Não encontrou sua empresa na busca?
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
            onClick={() => router.push('/register-company')}
          >
            <Plus className="h-4 w-4" />
            Cadastrar empresa
          </Button>
        </div>
      </div>
    </div>
  );
}
