'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { reviewsApi, leadsApi, reviewDashboardApi, Review, Lead } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCcw, AlertCircle, Bell, ChevronRight } from 'lucide-react';
import { track } from '@/lib/analytics/lazy';
import { toast } from 'sonner';

import dynamic from 'next/dynamic';

// Import newly created components
import { KpiCards } from './components/KpiCards';
import { QuickActionsPanel } from './components/QuickActionsPanel';
import { QuotesPanel } from './components/QuotesPanel';
import { ReviewsList } from './components/ReviewsList';
import { DashboardStrategicBanner } from './components/DashboardStrategicBanner';

interface ReviewDashboardSummary {
  kpis?: {
    estimated_savings?: number;
    quotes_total: number;
    quotes_open: number;
    quotes_replied: number;
    reviews_published: number;
  };
  profile?: {
    completion_percent?: number;
  };
  charts?: {
    activity_30d?: Array<{
      date: string;
      profile_views: number;
      whatsapp_clicks: number;
      cta_clicks: number;
    }>;
  };
}

type ApiListResponse<T> = T[] | { data?: T[] };

function normalizeApiList<T>(response: ApiListResponse<T>): T[] {
  if (Array.isArray(response)) return response;
  return Array.isArray(response.data) ? response.data : [];
}

const ActivityChart = dynamic(
  () => import('./components/ActivityChart').then((mod) => mod.ActivityChart),
  {
    loading: () => <div className="h-[300px] w-full animate-pulse bg-slate-50 rounded-2xl" />,
    ssr: false,
  }
);

export default function ReviewDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // State for dashboard data
  const [summary, setSummary] = useState<ReviewDashboardSummary | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);

  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const latestLead = leads[0] || null;

  // Authentication check
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        setIsRedirecting(true);
        router.push(`/login?redirect=${encodeURIComponent('/review-dashboard')}`);
        return;
      }

      if (user.role === 'company') {
        setIsRedirecting(true);
        router.push('/dashboard');
        return;
      }

      if (user.role !== 'review') {
        setIsRedirecting(true);
        router.push('/login?error=unauthorized');
        return;
      }

      // Track page view
      track('review_dashboard_view', { user_id: user.id, role: user.role });
    }
  }, [authLoading, user, router]);

  // Data loading
  const loadDashboardData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      setError(null);
      try {
        const [summaryRes, reviewsRes, leadsRes] = await Promise.all([
          reviewDashboardApi.getSummary(),
          reviewsApi.listMine(),
          leadsApi.mine(),
        ]);

        setSummary(summaryRes as ReviewDashboardSummary);
        setReviews(normalizeApiList(reviewsRes as ApiListResponse<Review>));
        setLeads(
          normalizeApiList(leadsRes as ApiListResponse<Lead>).sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        );

        if (isRefresh) {
          toast.success('Painel atualizado com sucesso!');
          track('review_dashboard_refresh', { user_id: user?.id });
        }
      } catch (err: unknown) {
        console.error('[ReviewDashboard] Failed to load data', err);
        const apiError = err as { status?: number; message?: string };
        if (apiError.status === 401) {
          setIsRedirecting(true);
          router.push(
            `/login?redirect=${encodeURIComponent('/review-dashboard')}&error=session_expired`
          );
          return;
        }

        const errorMessage = apiError.message || 'Não foi possível carregar os dados do painel.';
        setError(errorMessage);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user, router]
  );

  useEffect(() => {
    if (authLoading || isRedirecting) return;
    if (user?.role !== 'review') return;

    loadDashboardData();
  }, [authLoading, user, isRedirecting, loadDashboardData]);

  // Handlers
  const handleRefresh = () => {
    loadDashboardData(true);
  };

  const handleCancelQuote = async (id: string) => {
    try {
      toast.info('Solicitação de cancelamento enviada.');
      track('quote_cancel_click', { quote_id: id });
    } catch {
      toast.error('Erro ao cancelar orçamento.');
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta avaliação?')) return;

    try {
      await reviewsApi.delete(Number(id));
      setReviews((prev) => prev.filter((r) => r.id.toString() !== id));
      toast.success('Avaliação excluída com sucesso.');
      track('review_delete_confirm', { review_id: id });
    } catch {
      toast.error('Erro ao excluir avaliação.');
    }
  };

  if (authLoading || isRedirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-12">
      <div className="border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-[1240px] px-4 py-4 sm:px-6 md:py-6 lg:px-8">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">
                Olá, {user?.name?.split(' ')[0] || 'Usuário'}!
              </h1>
              <p className="text-sm font-medium text-slate-500 md:text-base">
                <span className="md:hidden">Seu painel de energia solar.</span>
                <span className="hidden md:inline">
                  Acompanhe suas economias, avaliações e orçamentos em tempo real.
                </span>
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <div className="relative">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-xl border-slate-200"
                >
                  <Bell className="h-4 w-4 text-slate-600" />
                </Button>
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-semibold text-white">
                  3
                </span>
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={refreshing}
                className="h-10 w-10 rounded-xl border-slate-200"
              >
                <RefreshCcw
                  className={`h-4 w-4 text-slate-600 ${refreshing ? 'animate-spin' : ''}`}
                />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto mt-4 max-w-[1240px] space-y-4 px-4 sm:px-6 md:mt-6 md:space-y-6 lg:px-8">
        {error && (
          <Card className="rounded-2xl border-red-100 bg-red-50">
            <CardContent className="flex items-center gap-3 py-3 text-red-800">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </CardContent>
          </Card>
        )}

        <section>
          <KpiCards data={summary?.kpis} loading={loading} />
        </section>

        <DashboardStrategicBanner placement="user_dashboard_mobile_top" />
        <DashboardStrategicBanner placement="user_dashboard_after_metrics" />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
          <div className="space-y-4 lg:col-span-8 md:space-y-6">
            <button
              type="button"
              onClick={() => {
                track(
                  latestLead ? 'dashboard_quote_cta_clicked' : 'dashboard_first_quote_clicked',
                  {
                    quote_id: latestLead?.id,
                  }
                );
                if (latestLead) return;
                router.push('/empresas');
              }}
              className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-white p-3 text-left shadow-sm transition hover:border-blue-200 hover:bg-blue-50/40 md:p-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <Bell className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-semibold text-slate-950 md:text-base">
                      {latestLead ? 'Novo orçamento recebido' : 'Solicite seu primeiro orçamento'}
                    </h3>
                    {latestLead && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                        Novo
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs font-medium text-slate-500 md:text-sm">
                    {latestLead
                      ? 'Uma empresa enviou uma proposta para você.'
                      : 'Compare propostas de empresas verificadas.'}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-blue-600 transition-transform group-hover:translate-x-0.5" />
            </button>

            <div className="lg:hidden">
              <QuickActionsPanel
                profileCompletion={summary?.profile?.completion_percent || 0}
                compact
                onActionClick={(actionId) => {
                  track('dashboard_next_step_clicked', { action_id: actionId, device: 'mobile' });
                }}
              />
            </div>

            <section id="quotes">
              <QuotesPanel
                data={leads}
                loading={loading}
                onCancel={handleCancelQuote}
                onViewDetails={(id) => {
                  track('quote_open_details', { quote_id: id });
                }}
              />
            </section>

            <section id="charts">
              <ActivityChart data={summary?.charts?.activity_30d} loading={loading} />
            </section>

            <section id="reviews">
              <ReviewsList
                data={reviews}
                loading={loading}
                onDelete={handleDeleteReview}
                onEdit={(id) => {
                  track('review_edit_click', { review_id: id });
                  router.push(`/reviews/${id}/edit`);
                }}
              />
            </section>
          </div>

          <aside className="hidden space-y-4 lg:col-span-4 lg:block">
            <div className="sticky top-24 space-y-4">
              <DashboardStrategicBanner placement="user_dashboard_desktop_sidebar" />
              <QuickActionsPanel
                profileCompletion={summary?.profile?.completion_percent || 0}
                onActionClick={(actionId) => {
                  track('dashboard_next_step_clicked', { action_id: actionId, device: 'desktop' });
                }}
              />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
