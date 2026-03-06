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
        profileCompletion,
        // Removed fake metrics: pendingApprovals, averageResponseTime
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
      if (subscription && typeof (subscription as any).unsubscribe === 'function') {
        subscription.unsubscribe();
      }
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
    <div className="space-y-6">
      {/* Onboarding Section - Preserved */}
      {hasNoData && (
        <Card className="border-blue-200 bg-blue-50/50 shadow-sm">
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

      {/* TOP SECTION: Main KPIs - Moved to absolute top for value-first hierarchy */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-tour="metrics">
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

      {/* MIDDLE SECTION: Analytics Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {statsQuery.isLoading ? (
          <Skeleton className="h-[340px] w-full rounded-xl" />
        ) : (
          <div data-tour="reputation">
            <NPSDetailedCard averageRating={Number(stats?.averageRating || 0)} reviewsCount={Number(stats?.reviewsCount || 0)} />
          </div>
        )}
        {statsQuery.isLoading ? (
          <Skeleton className="h-[340px] w-full rounded-xl" />
        ) : (
          <RankingTable rows={rankingRows} />
        )}
      </div>

      {/* SIDE/SECONDARY SECTION: Operational Metrics & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Profile Health & Action Items */}
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

        {/* Conversion Performance */}
        <Card className="border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-xl">
              <Star className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Taxa de Conversão</p>
              <h4 className="text-lg font-bold text-foreground">{stats?.conversionRate?.toFixed(1) || 0}%</h4>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Visitantes que deixaram avaliação
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Real Opportunities - Only if has meaningful data */}
        {statsQuery.isLoading ? (
          <Skeleton className="h-[88px] w-full rounded-xl" />
        ) : stats && !hasNoData && stats.leadsReceived > 0 ? (
          <OpportunitiesCard
            leftLabel="Categoria"
            leftValue={stats.leadsReceived}
            rightLabel={`Para ${companyName}`}
            rightValue={stats.leadsReceived}
          />
        ) : (
          <Card className="border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-emerald-50 rounded-xl">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Status do Perfil</p>
                <h4 className="text-lg font-bold text-foreground">Ativo</h4>
                <p className="text-[10px] text-emerald-600 flex items-center gap-0.5 mt-0.5">
                  <CheckCircle className="h-3 w-3" />
                  Publicado
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* GROWTH TOOLS SECTION: Always accessible */}
      <Card className="border-emerald-200 bg-emerald-50/30 shadow-sm">
        <CardHeader>
          <CardTitle className="text-emerald-900 text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-600" />
            Ferramentas de Crescimento
          </CardTitle>
          <CardDescription className="text-emerald-700">
            Use essas ferramentas para aumentar sua visibilidade e capturar mais leads.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4 p-4 bg-white rounded-lg border border-emerald-100 shadow-sm">
              <h4 className="font-semibold text-slate-800">📊 Link Público Rastreado</h4>
              <p className="text-sm text-slate-600">Compartilhe este link para rastrear visitas e leads.</p>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={assetsQuery.data?.utm_ready_link || ''} 
                  className="flex-1 p-2 text-sm border rounded bg-slate-50 text-slate-500" 
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => copyToClipboard(assetsQuery.data?.utm_ready_link || '', 'Link rastreado')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-4 p-4 bg-white rounded-lg border border-emerald-100 shadow-sm">
              <h4 className="font-semibold text-slate-800">🏆 Selo de Confiança</h4>
              <p className="text-sm text-slate-600">Instale no seu site para mostrar sua reputação.</p>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={assetsQuery.data?.badge_embed_code || ''} 
                  className="flex-1 p-2 text-sm border rounded bg-slate-50 text-slate-500" 
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => copyToClipboard(assetsQuery.data?.badge_embed_code || '', 'Código do selo')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* BOTTOM SECTION: Advanced Analytics */}
      <AdvancedAnalytics themeMode={themeMode} companyId={companyId} />
    </div>
  );
}
