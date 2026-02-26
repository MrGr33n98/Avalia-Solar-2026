'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  reviewsApi, 
  leadsApi, 
  reviewDashboardApi,
  Review, 
  Lead 
} from '@/lib/api';
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

const ActivityChart = dynamic(() => import('./components/ActivityChart').then(mod => mod.ActivityChart), {
  loading: () => <div className="h-[300px] w-full animate-pulse bg-slate-50 rounded-2xl" />,
  ssr: false
});

export default function ReviewDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  // State for dashboard data
  const [summary, setSummary] = useState<any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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
        router.push('/company-dashboard');
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
  const loadDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    setError(null);
    try {
      const [summaryRes, reviewsRes, leadsRes] = await Promise.all([
        reviewDashboardApi.getSummary(),
        reviewsApi.listMine(),
        leadsApi.mine()
      ]);
      
      setSummary(summaryRes);
      setReviews(Array.isArray(reviewsRes) ? reviewsRes : (reviewsRes as any)?.data || []);
      setLeads(Array.isArray(leadsRes) ? leadsRes : (leadsRes as any)?.data || []);
      
      if (isRefresh) {
        toast.success('Painel atualizado com sucesso!');
        track('review_dashboard_refresh', { user_id: user?.id });
      }
    } catch (err: any) {
      console.error('[ReviewDashboard] Failed to load data', err);
      if (err?.status === 401) {
        setIsRedirecting(true);
        router.push(`/login?redirect=${encodeURIComponent('/review-dashboard')}&error=session_expired`);
        return;
      }
      
      const errorMessage = err.message || 'Não foi possível carregar os dados do painel.';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, router]);

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
    } catch (err) {
      toast.error('Erro ao cancelar orçamento.');
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta avaliação?')) return;
    
    try {
      await reviewsApi.delete(Number(id));
      setReviews(prev => prev.filter(r => r.id.toString() !== id));
      toast.success('Avaliação excluída com sucesso.');
      track('review_delete_confirm', { review_id: id });
    } catch (err) {
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
    <div className="min-h-screen bg-slate-50/50 pb-12">
      {/* Hero Header - Compact & Strong Hierarchy */}
      <div className="bg-white border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-950 uppercase">
                Bem-vindo, {user?.name?.split(' ')[0] || 'Usuário'}!
              </h1>
              <p className="text-slate-500 font-medium">Acompanhe suas economias, avaliações e orçamentos em tempo real.</p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Notification Badge Quick Win */}
              <div className="relative">
                <Button variant="outline" size="icon" className="rounded-2xl h-11 w-11 border-slate-200">
                  <Bell className="h-5 w-5 text-slate-600" />
                </Button>
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600 text-[10px] font-black text-white items-center justify-center">3</span>
                </span>
              </div>

              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleRefresh}
                disabled={refreshing}
                className="rounded-2xl h-11 w-11 border-slate-200"
              >
                <RefreshCcw className={`h-5 w-5 text-slate-600 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-6 md:mt-10 space-y-6 md:space-y-10">
        {error && (
          <Card className="border-red-100 bg-red-50 rounded-2xl">
            <CardContent className="flex items-center gap-3 py-4 text-red-800">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="text-sm font-bold">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* KPI Cards Section - Density Intelligence */}
        <section>
          <KpiCards data={summary?.kpis} loading={loading} />
        </section>

        {/* Main Content Grid - Vertical Rhythm */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
          <div className="lg:col-span-8 space-y-6 md:space-y-10">
            {/* Urgent Notification Action */}
            <div className="bg-blue-600 rounded-3xl p-5 md:p-6 text-white shadow-xl shadow-blue-100 flex items-center justify-between group cursor-pointer hover:bg-blue-700 transition-all">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center">
                   <Bell className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-black uppercase tracking-tight text-lg">Novo Orçamento Recebido!</h3>
                  <p className="text-blue-100 text-sm font-medium">Empresa Solar Tech enviou uma proposta para você.</p>
                </div>
              </div>
              <ChevronRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
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
              <ActivityChart 
                data={summary?.charts?.activity_30d} 
                loading={loading} 
              />
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

          {/* Quick Actions Panel - Sticky & Compact */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="sticky top-24">
              <QuickActionsPanel 
                profileCompletion={summary?.profile?.completion_percent || 0}
                onActionClick={(actionId) => {
                  track('Quick Action Clicked', { action_id: actionId });
                }}
              />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
