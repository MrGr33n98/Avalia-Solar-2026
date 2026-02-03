'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { companiesApi, Company, companyAccessApi, CompanyAccessContext } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Building2, CheckCircle2, Clock3, Loader2, Search } from 'lucide-react';

const MIN_QUERY_LENGTH = 2;

export default function SelectCompanyPage() {
  const router = useRouter();
  const { user, loading: authLoading, refreshAuth } = useAuth();
  const [context, setContext] = useState<CompanyAccessContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Company[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [requestingId, setRequestingId] = useState<number | null>(null);
  const [selectingId, setSelectingId] = useState<number | null>(null);
  const [showRequestDialog, setShowRequestDialog] = useState<number | null>(null);
  const [requestMessage, setRequestMessage] = useState('');

  const activeIds = useMemo(
    () => new Set(context?.active_memberships?.map((member) => member.company_id) || []),
    [context]
  );

  const pendingIds = useMemo(
    () => new Set(context?.pending_requests?.map((request) => request.company_id) || []),
    [context]
  );

  const loadContext = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await companyAccessApi.context();
      setContext(data);
    } catch (err) {
      console.error('[SelectCompany] Failed to load context', err);
      setError('Nao foi possivel carregar seu contexto de empresas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user?.role === 'review') {
      router.push('/review-dashboard');
      return;
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (authLoading) return;
    if (user?.role === 'review') return;
    loadContext();
  }, [authLoading, user]);

  useEffect(() => {
    const term = query.trim();
    if (term.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const handle = setTimeout(async () => {
      try {
        const data = await companiesApi.getAll({ q: term, status: 'active', limit: 10 });
        setResults(data || []);
      } catch (err) {
        console.error('[SelectCompany] Search failed', err);
        setError('Nao foi possivel buscar empresas.');
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => clearTimeout(handle);
  }, [query]);

  const handleRequest = async (companyId: number) => {
    if (requestingId || activeIds.has(companyId) || pendingIds.has(companyId)) {
      return;
    }

    setRequestingId(companyId);
    setError(null);

    try {
      await companyAccessApi.createRequest(companyId, requestMessage);
      setRequestMessage('');
      setShowRequestDialog(null);
      await loadContext();
    } catch (err) {
      console.error('[SelectCompany] Request failed', err);
      setError('Nao foi possivel solicitar acesso agora.');
    } finally {
      setRequestingId(null);
    }
  };

  const handleEnter = async (companyId: number) => {
    if (selectingId) return;
    setSelectingId(companyId);
    try {
      await companyAccessApi.selectActiveCompany(companyId);
      await refreshAuth();
      router.push(`/company-dashboard?company_id=${companyId}`);
    } catch (err) {
      console.error('[SelectCompany] Failed to select active company', err);
      setError('Nao foi possivel selecionar a empresa agora.');
    } finally {
      setSelectingId(null);
    }
  };

  const suggestedCompanies = context?.suggested_companies || [];
  const pendingRequests = context?.pending_requests || [];
  const activeMemberships = context?.active_memberships || [];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Selecione sua empresa</h1>
          <p className="mt-2 text-slate-600">
            Voce ainda nao tem uma empresa vinculada? Busque e solicite acesso para continuar.
          </p>
        </header>

        {error && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-16 text-slate-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Carregando empresas...
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {activeMemberships.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Empresas vinculadas</CardTitle>
                  <CardDescription>Escolha uma empresa para acessar o dashboard.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {activeMemberships.map((member) => (
                    <div
                      key={member.company_id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{member.company_name}</p>
                        <p className="text-xs text-slate-500">/{member.company_slug || 'empresa'}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleEnter(member.company_id)}
                        disabled={selectingId === member.company_id}
                      >
                        {selectingId === member.company_id ? 'Entrando...' : 'Entrar'}
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {pendingRequests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Solicitacoes pendentes</CardTitle>
                  <CardDescription>Estamos aguardando a aprovacao do administrador.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{request.company_name}</p>
                        <p className="text-xs text-amber-700">Aguardando aprovacao</p>
                      </div>
                      <div className="flex items-center gap-2 text-amber-700">
                        <Clock3 className="h-4 w-4" />
                        <span className="text-xs">Pendente</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Solicitar acesso</CardTitle>
                <CardDescription>
                  Busque por nome, slug ou CNPJ para solicitar acesso.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Busque por nome ou slug da empresa..."
                    className="pl-10"
                  />
                </div>

                {searching && (
                  <div className="flex items-center justify-center py-4 text-sm text-slate-500">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Buscando...
                  </div>
                )}

                {query.trim().length >= MIN_QUERY_LENGTH ? (
                  <div className="space-y-3">
                    {results.length === 0 && !searching && (
                      <div className="rounded-md border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                        Nenhuma empresa encontrada para esta busca.
                      </div>
                    )}

                    {results.map((company) => {
                      const isActive = activeIds.has(company.id);
                      const isPending = pendingIds.has(company.id);
                      const isRequesting = requestingId === company.id;

                      return (
                        <div
                          key={company.id}
                          className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white px-4 py-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="rounded-md bg-slate-100 p-2">
                                <Building2 className="h-4 w-4 text-slate-600" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{company.name}</p>
                                <p className="text-xs text-slate-500">/{company.slug || 'empresa'}</p>
                              </div>
                            </div>
                            {isActive ? (
                              <div className="flex items-center gap-1 text-xs font-medium text-green-600">
                                <CheckCircle2 className="h-4 w-4" />
                                Já vinculado
                              </div>
                            ) : isPending ? (
                              <div className="flex items-center gap-1 text-xs font-medium text-amber-600">
                                <Clock3 className="h-4 w-4" />
                                Solicitação pendente
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setShowRequestDialog(company.id)}
                                disabled={requestingId !== null}
                              >
                                Solicitar Acesso
                              </Button>
                            )}
                          </div>

                          {showRequestDialog === company.id && (
                            <div className="mt-2 space-y-3 rounded-md bg-slate-50 p-3">
                              <p className="text-xs font-medium text-slate-700">
                                Explique brevemente seu vínculo com esta empresa:
                              </p>
                              <textarea
                                className="w-100 min-h-[80px] w-full rounded-md border border-slate-200 bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Ex: Sou o gerente de marketing, preciso gerenciar os leads e reviews."
                                value={requestMessage}
                                onChange={(e) => setRequestMessage(e.target.value)}
                              />
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setShowRequestDialog(null);
                                    setRequestMessage('');
                                  }}
                                >
                                  Cancelar
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleRequest(company.id)}
                                  disabled={isRequesting || !requestMessage.trim()}
                                >
                                  {isRequesting ? 'Enviando...' : 'Confirmar Solicitação'}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {suggestedCompanies.length === 0 ? (
                      <div className="rounded-md border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                        Digite pelo menos {MIN_QUERY_LENGTH} caracteres para buscar empresas.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-slate-700">Empresas sugeridas</p>
                        {suggestedCompanies.map((company) => {
                          const isPending = pendingIds.has(company.company_id);
                          return (
                            <div
                              key={company.company_id}
                              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-4 py-3"
                            >
                              <div className="flex items-center gap-3">
                                <div className="rounded-md bg-slate-100 p-2">
                                  <Building2 className="h-4 w-4 text-slate-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">{company.company_name}</p>
                                  <p className="text-xs text-slate-500">/{company.company_slug || 'empresa'}</p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                disabled={isPending || requestingId === company.company_id}
                                onClick={() => handleRequest(company.company_id)}
                              >
                                {isPending ? 'Aguardando aprovacao' : 'Solicitar acesso'}
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {activeMemberships.length === 0 && pendingRequests.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                  <p className="text-sm font-medium text-slate-700">
                    Assim que o acesso for aprovado, voce podera entrar no dashboard da empresa.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
