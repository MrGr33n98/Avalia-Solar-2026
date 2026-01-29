'use client';

import {
  Eye,
  MessageSquare,
  Star,
  Target,
  Zap,
  TrendingUp,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchApi } from '@/lib/api';
import { subscribeCompanyDashboard } from '@/lib/cable';
import MetricCard from './MetricCard';
import OpportunitiesCard from '@/components/ui/OpportunitiesCard';
import OnboardingIncentive from '@/components/ui/OnboardingIncentive';
import NPSDetailedCard from '@/components/ui/NPSDetailedCard';
import RankingTable, { type RankingRow } from '@/components/ui/RankingTable';
import AdvancedAnalytics from './AdvancedAnalytics';

type DashboardStats = {
  profileViews: number;
  ctaClicks: number;
  whatsappClicks: number;
  leadsReceived: number;
  reviewsCount: number;
  averageRating: number;
  pendingApprovals: number;
  activeCampaigns: number;
  conversionRate: number;
};

type OverviewTabProps = {
  companyId: string;
  company?: any;
  themeMode?: 'light' | 'dark';
  onNavigateToReviews?: () => void;
};

const mapStats = (raw: any): DashboardStats => {
  const s = raw?.stats || raw || {};
  return {
    profileViews: s.profile_views ?? 0,
    ctaClicks: s.cta_clicks ?? 0,
    whatsappClicks: s.whatsapp_clicks ?? 0,
    leadsReceived: s.leads_received ?? 0,
    reviewsCount: s.reviews_count ?? 0,
    averageRating: s.average_rating ?? 0,
    pendingApprovals: s.pending_approvals ?? 0,
    activeCampaigns: s.active_campaigns ?? 0,
    conversionRate: s.conversion_rate ?? 0,
  };
};

export default function OverviewTab({ companyId, company, themeMode = 'light', onNavigateToReviews }: OverviewTabProps) {
  const queryClient = useQueryClient();
  const [reviewLink, setReviewLink] = useState<string>('');

  useEffect(() => {
    setReviewLink(`${window.location.origin}/companies/${companyId}/review`);
  }, [companyId]);

  const statsQuery = useQuery({
    queryKey: ['company-dashboard-stats', companyId],
    queryFn: async () => {
      const data = await fetchApi<{ stats: any }>('/company_dashboard/stats', { params: { company_id: companyId } });
      return mapStats(data);
    },
    enabled: Boolean(companyId),
  });

  useEffect(() => {
    if (!companyId) return;
    const unsubscribe = subscribeCompanyDashboard(companyId, () => {
      queryClient.invalidateQueries({ queryKey: ['company-dashboard-stats', companyId] });
    });
    return unsubscribe;
  }, [companyId, queryClient]);

  const stats = statsQuery.data;

  const companyName = (company?.name as string) || 'sua empresa';

  const rankingRows: RankingRow[] = useMemo(() => {
    const name = (company?.name as string) || 'Avaliasolar';
    const avatarUrl = company?.logo_url || company?.logo?.url || null;
    return [
      {
        id: String(companyId),
        name,
        nps: Number(stats?.averageRating || 0),
        reviewsCount: Number(stats?.reviewsCount || 0),
        avatarUrl,
      },
    ];
  }, [company, companyId, stats?.averageRating, stats?.reviewsCount]);

  return (
    <div className="space-y-5">
      {statsQuery.isLoading ? (
        <Skeleton className="h-16 w-full rounded-xl" />
      ) : stats && stats.reviewsCount < 5 ? (
        <OnboardingIncentive reviewLink={reviewLink} onStart={onNavigateToReviews} />
      ) : null}

      {statsQuery.isLoading ? (
        <Skeleton className="h-[150px] w-full rounded-xl" />
      ) : stats ? (
        <OpportunitiesCard
          leftLabel="Para a categoria"
          leftValue={stats.pendingApprovals}
          rightLabel={`Para ${companyName}`}
          rightValue={stats.leadsReceived}
        />
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {statsQuery.isLoading ? (
          <Skeleton className="h-[340px] w-full rounded-xl" />
        ) : (
          <NPSDetailedCard averageRating={Number(stats?.averageRating || 0)} reviewsCount={Number(stats?.reviewsCount || 0)} />
        )}
        {statsQuery.isLoading ? (
          <Skeleton className="h-[340px] w-full rounded-xl" />
        ) : (
          <RankingTable rows={rankingRows} />
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {statsQuery.isLoading ? (
          <>
            {Array.from({ length: 4 }).map((_, idx) => (
              <Skeleton key={idx} className="h-[138px] w-full rounded-lg" />
            ))}
          </>
        ) : (
          <>
            <MetricCard title="Visualizações" value={stats?.profileViews || 0} icon={Eye} color="blue" />
            <MetricCard title="Cliques em CTAs" value={stats?.ctaClicks || 0} icon={Zap} color="purple" />
            <MetricCard title="WhatsApp" value={stats?.whatsappClicks || 0} icon={MessageSquare} color="green" />
            <MetricCard title="Leads" value={stats?.leadsReceived || 0} icon={Target} color="orange" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Tempo Médio de Resposta</p>
              <h4 className="text-lg font-bold text-foreground">2.4 horas</h4>
              <p className="text-[10px] text-green-600 flex items-center gap-0.5 mt-0.5">
                <TrendingUp className="h-3 w-3" />
                15% mais rápido que o mês anterior
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-xl">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Completude do Perfil</p>
              <h4 className="text-lg font-bold text-foreground">92%</h4>
              <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2">
                <div className="bg-green-500 h-full rounded-full" style={{ width: '92%' }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-xl">
              <Star className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Taxa de Conversão de Avaliações</p>
              <h4 className="text-lg font-bold text-foreground">12.5%</h4>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Visitantes que deixaram avaliação
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="border-gray-200 bg-gradient-to-br from-blue-50 to-blue-100/50">
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-gray-800 mb-1">Crescimento</div>
            <div className="text-xs text-gray-600 leading-relaxed">
              Evolução consistente das métricas do seu perfil no Avaliasolar.
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50">
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-gray-800 mb-1">Engajamento</div>
            <div className="text-xs text-gray-600 leading-relaxed">
              Acompanhe cliques em CTA e contatos via WhatsApp para otimizar conversão.
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200 bg-gradient-to-br from-purple-50 to-purple-100/50">
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-gray-800 mb-1">Posicionamento</div>
            <div className="text-xs text-gray-600 leading-relaxed">
              Melhore sua reputação com avaliações e informações completas do produto.
            </div>
          </CardContent>
        </Card>
      </div>

      <AdvancedAnalytics themeMode={themeMode} companyId={companyId} />
    </div>
  );
}
