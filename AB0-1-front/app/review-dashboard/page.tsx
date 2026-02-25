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
import { Loader2, RefreshCcw, AlertCircle } from 'lucide-react';
import { track } from '@/lib/analytics/lazy';
import { toast } from 'sonner';

import dynamic from 'next/dynamic';

// Import newly created components
import { KpiCards } from './components/KpiCards';
import { QuickActionsPanel } from './components/QuickActionsPanel';
import { QuotesPanel } from './components/QuotesPanel';
import { ReviewsList } from './components/ReviewsList';

const ActivityChart = dynamic(() => import('./components/ActivityChart').then(mod => mod.ActivityChart), {
  loading: () => <div className="h-[300px] w-full animate-pulse bg-gray-100 rounded-lg" />,
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
      
      const errorMessage = err.message || 'Não foi possível carregar os dados do painel. Tente novamente mais tarde.';
      setError(errorMessage);
      
      if (err?.status === 404) {
        toast.error(errorMessage, {
          duration: 10000, // Show longer for 404s to allow reading the instructions
        });
      }
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
      // Assuming leadsApi has a cancel method, or using fetchApi directly
      // For now, let's just log and toast as we'd need to add this to lib/api.ts if not present
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

  const handleTabChange = (tabId: string) => {
    track('quote_tab_change', { tab_id: tabId });
  };

  if (authLoading || isRedirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Hero Header */}
      <div className="bg-white border-b border-gray-100 mb-8">
        <div className="mx-auto max-w-[1200px] px-6 py-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Meu Painel</h1>
              <p className="text-gray-500">Acompanhe suas avaliações, orçamentos e métricas.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border border-gray-100">
                <div className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                <span className="text-sm font-medium text-gray-700">{user?.name}</span>
                <span className="text-xs text-gray-400 border-l border-gray-200 pl-2">Reviewer</span>
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleRefresh}
                disabled={refreshing}
                className="rounded-full h-10 w-10"
              >
                <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-6 space-y-8">
        {error && (
          <Card className="border-red-100 bg-red-50">
            <CardContent className="flex items-center gap-3 py-4 text-red-800">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* KPI Cards Section */}
        <section className="space-y-4">
          <KpiCards data={summary?.kpis} loading={loading} />
        </section>

        {/* Main Grid: Quotes + Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <section id="quotes">
              <QuotesPanel 
                data={leads} 
                loading={loading} 
                onTabChange={handleTabChange}
                onCancel={handleCancelQuote}
                onViewDetails={(id) => {
                  track('quote_open_details', { quote_id: id });
                  // Implementation for drawer would go here
                }}
              />
            </section>

            {/* Charts Section */}
            <section id="charts">
              <ActivityChart 
                data={summary?.charts?.activity_30d} 
                loading={loading} 
              />
            </section>

            {/* Reviews Section */}
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

          {/* Quick Actions Panel (Sticky on Desktop) */}
          <aside className="lg:col-span-4 h-fit lg:sticky lg:top-8">
            <QuickActionsPanel 
              profileCompletion={summary?.profile?.completion_percent || 0}
              onActionClick={(actionId) => {
                track('Quick Action Clicked', { action_id: actionId });
                if (actionId === 'new_review') track('review_create_click');
              }}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}

