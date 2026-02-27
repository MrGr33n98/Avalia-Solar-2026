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
  Copy,
  Link,
  ShieldCheck,
  Check
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { fetchApi } from '@/lib/api';
import { subscribeCompanyDashboard } from '@/lib/cable';
import MetricCard from './MetricCard';
import OpportunitiesCard from '@/components/ui/OpportunitiesCard';
import OnboardingIncentive from '@/components/ui/OnboardingIncentive';
import NPSDetailedCard from '@/components/ui/NPSDetailedCard';
import RankingTable, { type RankingRow } from '@/components/ui/RankingTable';
import dynamic from 'next/dynamic';
import { useToast } from '@/hooks/use-toast';

const AdvancedAnalytics = dynamic(() => import('./AdvancedAnalytics'), {
  loading: () => <div className="h-[400px] w-full animate-pulse bg-gray-100 rounded-lg" />,
  ssr: false
});

type OverviewTabProps = {
  companyId: string;
  company?: any;
  themeMode?: 'light' | 'dark';
  onNavigateToReviews?: () => void;
};

export default function OverviewTab({ companyId, company, themeMode = 'light', onNavigateToReviews }: OverviewTabProps) {
  const queryClient = useQueryClient();
  const [reviewLink, setReviewLink] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    setReviewLink(`${window.location.origin}/companies/${companyId}/review`);
  }, [companyId]);

  const statsQuery = useQuery({
    queryKey: ['company-analytics-overview', companyId],
    queryFn: async () => {
      const data = await fetchApi<any>('/company_dashboard/analytics/overview', { params: { company_id: companyId } });
      
      const profileFields = [
        company?.name,
        company?.description,
        company?.logo?.url || company?.logo_url,
        company?.banner?.url || company?.banner_url,
        company?.city,
        company?.state,
        company?.website_url || company?.website,
        company?.phone || company?.whatsapp,
      ];
      const filledFields = profileFields.filter(Boolean).length;
      const profileCompletion = Math.round((filledFields / profileFields.length) * 100);

      return {
        profileViews: data.views_30d ?? 0,
        ctaClicks: data.cta_clicks_30d ?? 0,
        whatsappClicks: data.whatsapp_clicks_30d ?? 0,
        leadsReceived: data.leads_30d ?? 0,
        conversionRate: data.conversion_rate ?? 0,
        reviewsCount: company?.reviews_count ?? 0,
        averageRating: company?.rating_avg ?? 0,
        pendingApprovals: 0,
        averageResponseTime: 0,
        profileCompletion,
      };
    },
    enabled: Boolean(companyId),
  });

  const assetsQuery = useQuery({
    queryKey: ['company-analytics-assets', companyId],
    queryFn: async () => fetchApi<any>('/company_dashboard/assets', { params: { company_id: companyId } }),
    enabled: Boolean(companyId),
  });

  useEffect(() => {
    if (!companyId) return;
    const subscription = subscribeCompanyDashboard(companyId, () => {
      queryClient.invalidateQueries({ queryKey: ['company-analytics-overview', companyId] });
    });
    return () => {
      if (!subscription) return;
      if (typeof subscription === 'function') subscription();
      else if (typeof subscription.unsubscribe === 'function') subscription.unsubscribe();
    };
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

  const copyToClipboard = async (text: string, description: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Copiado!', description: `${description} copiado para a área de transferência.` });
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao copiar.', variant: 'destructive' });
    }
  };

  const hasNoData = stats && stats.profileViews === 0 && stats.leadsReceived === 0;
  
  const checklist = [
    { label: 'Completar Perfil', done: (stats?.profileCompletion || 0) >= 80, impact: '+ ranking local' },
    { label: 'Configurar CTAs', done: Boolean(company?.website || company?.whatsapp), impact: '+ conversão' },
    { label: 'Obter 5 Avaliações', done: (stats?.reviewsCount || 0) >= 5, impact: '+ confiança' },
    { label: 'Instalar Selo de Confiança', done: false, impact: '+ cliques orgânicos' }
  ];

  return (
    <div className="space-y-5">
      {hasNoData && (
        <Card className="border-blue-200 bg-blue-50/50 shadow-sm mb-6">
          <CardHeader>
            <CardTitle className="text-blue-900 text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              Sua jornada começa aqui!
            </CardTitle>
            <CardDescription className="text-blue-700">
              Parece que seu perfil ainda não recebeu interações suficientes. Siga o checklist abaixo para ativar seu dashboard e começar a capturar leads.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                {checklist.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${item.done ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                        <Check className="w-4 h-4" />
                      </div>
                      <span className={`font-medium ${item.done ? 'text-slate-900 line-through opacity-70' : 'text-slate-900'}`}>{item.label}</span>
                    </div>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">{item.impact}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col justify-center space-y-4 p-4 bg-white rounded-lg border border-blue-100 shadow-sm">
                <h4 className="font-semibold text-slate-800">1. Compartilhe seu Link Público (Rastreado)</h4>
                <div className="flex items-center gap-2">
                  <input type="text" readOnly value={assetsQuery.data?.utm_ready_link || ''} className="flex-1 p-2 text-sm border rounded bg-slate-50 text-slate-500" />
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(assetsQuery.data?.utm_ready_link || '', 'Link')}><Copy className="w-4 h-4" /></Button>
                </div>
                <h4 className="font-semibold text-slate-800 mt-2">2. Instale o Selo no seu Site</h4>
                <div className="flex items-center gap-2">
                  <input type="text" readOnly value={assetsQuery.data?.badge_embed_code || ''} className="flex-1 p-2 text-sm border rounded bg-slate-50 text-slate-500" />
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(assetsQuery.data?.badge_embed_code || '', 'Selo')}><Copy className="w-4 h-4" /></Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {statsQuery.isLoading ? (
        <Skeleton className="h-[150px] w-full rounded-xl" />
      ) : stats && !hasNoData ? (
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
            <MetricCard title="Leads" value={stats?.leadsReceived || 0} icon={Target} color="brand-cyan" />
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
              <h4 className="text-lg font-bold text-foreground">{stats?.averageResponseTime || 0} horas</h4>
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
              <h4 className="text-lg font-bold text-foreground">{stats?.profileCompletion || 0}%</h4>
              <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2">
                <div className="bg-green-500 h-full rounded-full" style={{ width: `${stats?.profileCompletion || 0}%` }} />
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
              <h4 className="text-lg font-bold text-foreground">{stats?.conversionRate?.toFixed(1) || 0}%</h4>
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