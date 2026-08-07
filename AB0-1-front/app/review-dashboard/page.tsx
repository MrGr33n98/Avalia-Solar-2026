'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { track } from '@/lib/analytics/lazy';
import { toast } from 'sonner';
import { reviewsApi } from '@/lib/api';
import { useDashboardContext } from './DashboardLayoutClient';
import { ReputationDashboard } from './components/ReputationDashboard';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const ActivityChart = dynamic(() => import('./components/ActivityChart').then((mod) => mod.ActivityChart), {
  ssr: false,
  loading: () => (
    <div className="flex h-[300px] items-center justify-center rounded-none border border-slate-200 bg-white">
      <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
    </div>
  ),
});

export default function ReviewDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { summary, reviews, leads, loading, refreshing, error, onRefresh } = useDashboardContext();
  const activityData =
    summary?.charts?.activity_30d?.map((point) => ({
      date: point.date,
      profile_views: point.profile_views ?? 0,
      whatsapp_clicks: point.whatsapp_clicks ?? 0,
      cta_clicks: point.cta_clicks ?? 0,
    })) ?? undefined;

  const handleDeleteReview = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta avaliação?')) return;

    try {
      await reviewsApi.delete(Number(id));
      onRefresh();
      toast.success('Avaliação excluída com sucesso.');
      track('review_delete_confirm', { review_id: id });
    } catch {
      toast.error('Erro ao excluir avaliação.');
    }
  };

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
      activityChart={<ActivityChart data={activityData} loading={loading} />}
      onRefresh={onRefresh}
      onDeleteReview={handleDeleteReview}
      onEditReview={(id) => {
        track('review_edit_click', { review_id: id });
        router.push(`/reviews/${id}/edit`);
      }}
    />
  );
}
