'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { reviewsApi, Review, leadsApi, Lead } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, MessageCircle, FileText } from 'lucide-react';

const formatDate = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export default function ReviewDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    console.log('[ReviewDashboard] Page mounted, auth status:', { 
      authLoading, 
      userRole: user?.role, 
      userId: user?.id 
    });

    if (!authLoading) {
      if (!user) {
        console.warn('[ReviewDashboard] No user found, redirecting to login');
        setIsRedirecting(true);
        router.push(`/login?redirect=${encodeURIComponent('/review-dashboard')}`);
        return;
      }

      if (user.role === 'company') {
        console.log('[ReviewDashboard] Company user detected, redirecting to company-dashboard');
        setIsRedirecting(true);
        router.push('/company-dashboard');
        return;
      }

      if (user.role !== 'review') {
        console.warn('[ReviewDashboard] Unauthorized role:', user.role);
        setIsRedirecting(true);
        router.push('/login?error=unauthorized');
        return;
      }
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (authLoading || isRedirecting) return;
    if (user?.role === 'company') return;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('[ReviewDashboard] Loading dashboard data...');
        const [reviewsData, leadsData] = await Promise.all([
          reviewsApi.listMine(),
          leadsApi.mine()
        ]);
        
        console.log('[ReviewDashboard] Data loaded:', { 
          reviewsCount: Array.isArray(reviewsData) ? reviewsData.length : 0,
          leadsCount: Array.isArray(leadsData) ? leadsData.length : 0
        });

        setReviews(Array.isArray(reviewsData) ? reviewsData : []);
        setLeads(Array.isArray(leadsData) ? leadsData : []);
      } catch (err: any) {
        console.error('[ReviewDashboard] Failed to load dashboard data', err);
        const status = err?.status || err?.context?.status;
        
        if (status === 401) {
          console.warn('[ReviewDashboard] Unauthorized - session might have expired');
          setIsRedirecting(true);
          router.push(`/login?redirect=${encodeURIComponent('/review-dashboard')}&error=session_expired`);
          return;
        }
        
        setError('Nao foi possivel carregar seus dados do dashboard.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [authLoading, user]);

  const sortedReviews = useMemo(() => {
    return [...reviews].sort((a, b) => {
      const aTime = new Date(a.created_at).getTime();
      const bTime = new Date(b.created_at).getTime();
      return bTime - aTime;
    });
  }, [reviews]);

  const sortedLeads = useMemo(() => {
    return [...leads].sort((a, b) => {
      const aTime = new Date(a.created_at).getTime();
      const bTime = new Date(b.created_at).getTime();
      return bTime - aTime;
    });
  }, [leads]);

  const parseLeadMessage = (message: string) => {
    if (!message) return 'Sem mensagem adicional';
    
    try {
      if (message.startsWith('{')) {
        const data = JSON.parse(message);
        if (data.type === 'financing_proposal') {
          const amount = data.financed_amount?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
          return `Proposta de financiamento: ${amount} em ${data.months}x`;
        }
      }
    } catch (e) {
      // Not JSON or parse error, return as is
    }
    
    return message;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Meu Painel</h1>
          <p className="mt-2 text-slate-600">
            Acompanhe suas avaliacoes e orçamentos solicitados.
          </p>
        </header>

        { (loading || authLoading || isRedirecting) && (
          <Card>
            <CardContent className="flex items-center justify-center py-16 text-slate-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {authLoading ? 'Verificando acesso...' : 'Carregando dados...'}
            </CardContent>
          </Card>
        )}

        {error && !loading && !authLoading && !isRedirecting && (
          <Card className="border-red-200 bg-red-50 mb-8">
            <CardContent className="py-6 text-sm text-red-700">{error}</CardContent>
          </Card>
        )}

        {!loading && !authLoading && !isRedirecting && (
          <div className="space-y-10">
            {/* Seção de Orçamentos */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-slate-700" />
                <h2 className="text-xl font-semibold text-slate-900">Meus Orçamentos</h2>
              </div>
              
              {sortedLeads.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center gap-3 py-10 text-center text-slate-600">
                    <p className="text-sm">Voce ainda nao solicitou nenhum orçamento.</p>
                    <Button variant="outline" size="sm" onClick={() => router.push('/companies')}>
                      Solicitar orçamento
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {sortedLeads.map((lead) => (
                    <Card key={lead.id}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base">{lead.company || 'Empresa'}</CardTitle>
                          <Badge variant="outline" className="text-[10px]">
                            {formatDate(lead.created_at)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                          {parseLeadMessage(lead.message)}
                        </p>
                        <div className="text-[11px] text-slate-400">
                          ID: #{lead.id}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            {/* Seção de Reviews */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <MessageCircle className="h-5 w-5 text-slate-700" />
                <h2 className="text-xl font-semibold text-slate-900">Minhas Reviews</h2>
              </div>

              {sortedReviews.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center gap-3 py-10 text-center text-slate-600">
                    <p className="text-sm font-medium">Voce ainda nao fez nenhuma review.</p>
                    <Button variant="outline" size="sm" onClick={() => router.push('/companies')}>
                      Buscar empresas para avaliar
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {sortedReviews.map((review) => (
                    <Card key={review.id}>
                      <CardHeader className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <CardTitle className="text-lg">
                              {review.company?.name || 'Empresa'}
                            </CardTitle>
                            <CardDescription>
                              Nota {review.rating} • {formatDate(review.created_at)}
                            </CardDescription>
                          </div>
                          {review.status && (
                            <Badge variant={review.status === 'approved' ? 'default' : 'secondary'}>
                              {review.status}
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-slate-700">{review.comment}</p>

                        {review.reply && (
                          <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-semibold text-slate-500">Resposta da empresa</p>
                            <p className="mt-2 text-sm text-slate-700">{review.reply}</p>
                            {review.replied_at && (
                              <p className="mt-2 text-xs text-slate-500">
                                Respondido em {formatDate(review.replied_at)}
                              </p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
