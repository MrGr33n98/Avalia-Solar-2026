'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { reviewsApi, leadsApi, reviewDashboardApi, Review, Lead } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { track } from '@/lib/analytics/lazy';
import { toast } from 'sonner';

import dynamic from 'next/dynamic';

import { ReputationDashboard } from './components/ReputationDashboard';

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

function emptySummary(): ReviewDashboardSummary {
  const today = new Date();
  const activity = Array.from({ length: 31 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (30 - index));

    return {
      date: date.toISOString().slice(0, 10),
      profile_views: 0,
      whatsapp_clicks: 0,
      cta_clicks: 0,
    };
  });

  return {
    kpis: {
      estimated_savings: 0,
      quotes_total: 0,
      quotes_open: 0,
      quotes_replied: 0,
      reviews_published: 0,
    },
    profile: {
      completion_percent: 0,
    },
    charts: {
      activity_30d: activity,
    },
  };
}

function isAuthError(error: unknown) {
  const apiError = error as { status?: number; message?: string };
  return apiError?.status === 401 || apiError?.message?.includes('[401]');
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
        const [summaryRes, reviewsRes, leadsRes] = await Promise.allSettled([
          reviewDashboardApi.getSummary(),
          reviewsApi.listMine(),
          leadsApi.mine(),
        ]);

        const failures = [summaryRes, reviewsRes, leadsRes].filter(
          (result): result is PromiseRejectedResult => result.status === 'rejected'
        );

        if (failures.some((failure) => isAuthError(failure.reason))) {
          setIsRedirecting(true);
          router.push(
            `/login?redirect=${encodeURIComponent('/review-dashboard')}&error=session_expired`
          );
          return;
        }

        if (summaryRes.status === 'fulfilled') {
          setSummary(summaryRes.value as ReviewDashboardSummary);
        } else {
          console.warn('[ReviewDashboard] Summary unavailable', summaryRes.reason);
          setSummary(emptySummary());
        }

        if (reviewsRes.status === 'fulfilled') {
          setReviews(normalizeApiList(reviewsRes.value as ApiListResponse<Review>));
        } else {
          console.warn('[ReviewDashboard] Reviews unavailable', reviewsRes.reason);
          setReviews([]);
        }

        if (leadsRes.status === 'fulfilled') {
          setLeads(
            normalizeApiList(leadsRes.value as ApiListResponse<Lead>).sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
          );
        } else {
          console.warn('[ReviewDashboard] Leads unavailable', leadsRes.reason);
          setLeads([]);
        }

        if (failures.length === 3) {
          setError('Não foi possível carregar os dados do painel agora.');
        }

        if (isRefresh) {
          if (failures.length > 0) {
            toast.warning('Painel atualizado parcialmente.');
          } else {
            toast.success('Painel atualizado com sucesso!');
          }
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

  if (!user) return null;

  return (
    <ReputationDashboard
      user={user}
      summary={summary}
      reviews={reviews}
      leads={leads}
      loading={loading}
      refreshing={refreshing}
      error={error}
      activityChart={<ActivityChart data={summary?.charts?.activity_30d} loading={loading} />}
      onRefresh={handleRefresh}
      onDeleteReview={handleDeleteReview}
      onEditReview={(id) => {
        track('review_edit_click', { review_id: id });
        router.push(`/reviews/${id}/edit`);
      }}
    />
  );
}
