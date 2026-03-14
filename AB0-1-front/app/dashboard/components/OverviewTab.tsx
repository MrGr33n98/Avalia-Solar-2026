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
  Check,
  ArrowRight,
  TrendingDown,
  CheckCircle2
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { fetchApi } from '@/lib/api';
import { subscribeCompanyDashboard } from '@/lib/cable';
import MetricCard from './MetricCard';
import OpportunityBoard from './OpportunityBoard';
import OpportunitiesCard from '@/components/ui/OpportunitiesCard';
import NPSDetailedCard from '@/components/ui/NPSDetailedCard';
import RankingTable, { type RankingRow } from '@/components/ui/RankingTable';
import dynamic from 'next/dynamic';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const AdvancedAnalytics = dynamic(() => import('./AdvancedAnalytics'), {
  loading: () => <div className="h-[400px] w-full animate-pulse bg-black/[0.03] dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl" />,
  ssr: false
});

type OverviewTabProps = {
  companyId: string;
  company?: any;
  themeMode?: 'light' | 'dark';
  onNavigateToReviews?: () => void;
};

export default function OverviewTab({ companyId, company, themeMode, onNavigateToReviews }: OverviewTabProps) {
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
        marketplacePotential: data.marketplace_potential,
        activeCategories: data.active_categories,
        reviewsCount: company?.reviews_count ?? 0,
        averageRating: company?.rating_avg ?? 0,
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
      if (subscription && typeof (subscription as any).unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, [companyId, queryClient]);

  const stats = statsQuery.data;
  const isPremium = company?.plan_status === 'active' || company?.featured;
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
      toast({ title: 'Copiado!', description: `${description} copiado com sucesso.` });
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
    <div className="space-y-8 pb-20">
      {/* 🛠️ OPPORTUNITY BOARD - High Impact Radar */}
      {statsQuery.isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          <Skeleton className="lg:col-span-8 h-[400px] rounded-[2.5rem] bg-black/[0.03] dark:bg-white/5 border border-black/5 dark:border-white/10" />
          <Skeleton className="lg:col-span-4 h-[400px] rounded-[2.5rem] bg-black/[0.03] dark:bg-white/5 border border-black/5 dark:border-white/10" />
        </div>
      ) : (
        <OpportunityBoard 
          isPremium={isPremium} 
          stats={{
            leads_received: stats?.leadsReceived || 0,
            marketplace_potential: stats?.marketplacePotential || { leads_in_category: 0, leads_in_region: 0, market_share_percent: 0 },
            active_categories: stats?.activeCategories || []
          }} 
        />
      )}

      {/* 🚀 ONBOARDING - Responsive Theme */}
      {hasNoData && (
        <Card className="clay-precision bg-card dark:bg-[#002B4D] border-none overflow-hidden group">
          <CardHeader className="p-6 border-b border-black/5 dark:border-white/5 bg-brand-blue/5 dark:bg-brand-blue/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-brand-blue/10 to-transparent opacity-50" />
            <CardTitle className="text-xl font-black text-foreground dark:text-white flex items-center gap-2 tracking-tight relative z-10">
              <Zap className="w-6 h-6 text-brand-yellow animate-pulse" />
              Sua jornada estratégica começa aqui
            </CardTitle>
            <CardDescription className="text-muted-foreground dark:text-white/60 font-medium max-w-2xl relative z-10">
              Detectamos baixo volume de interações. Execute o checklist de precisão para otimizar seu ranqueamento e capturar leads.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-blue dark:text-brand-cyan mb-4">Checklist de Ativação</p>
                {checklist.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-black/[0.02] dark:bg-black/20 border border-black/5 dark:border-white/5 group/item transition-all hover:border-black/10 dark:hover:border-white/20">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                        item.done 
                          ? "bg-brand-green/10 dark:bg-brand-green/20 text-brand-green shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]" 
                          : "bg-black/5 dark:bg-white/5 text-muted-foreground dark:text-white/20"
                      )}>
                        {item.done ? <CheckCircle2 className="w-5 h-5" /> : <div className="w-2 h-2 rounded-full bg-current" />}
                      </div>
                      <span className={cn(
                        "text-sm font-bold tracking-tight",
                        item.done 
                          ? "text-muted-foreground/40 dark:text-white/40 line-through" 
                          : "text-foreground/80 dark:text-white/80"
                      )}>{item.label}</span>
                    </div>
                    <Badge variant="outline" className="bg-brand-blue/5 dark:bg-brand-blue/10 border-brand-blue/10 dark:border-brand-blue/20 text-brand-blue dark:text-brand-cyan text-[9px] font-black uppercase tracking-widest px-2 py-0.5">
                      {item.impact}
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="flex flex-col justify-center space-y-6 p-6 bg-black/[0.03] dark:bg-black/40 rounded-2xl border border-black/5 dark:border-white/5 shadow-inner">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground dark:text-white/40">1. Ativo de Distribuição (Link UTM)</label>
                  <div className="flex items-center gap-2 group/input">
                    <input type="text" readOnly value={assetsQuery.data?.utm_ready_link || ''} className="flex-1 h-10 px-4 text-xs font-mono font-bold border-none rounded-xl bg-white/50 dark:bg-[#002B4D] text-brand-blue dark:text-brand-cyan focus:ring-0" />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => copyToClipboard(assetsQuery.data?.utm_ready_link || '', 'Link')}
                      className="h-10 w-10 bg-white/80 dark:bg-white/5 hover:bg-brand-blue hover:text-white rounded-xl transition-all border border-black/5 dark:border-none"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground dark:text-white/40">2. Integração Web (Selo de Confiança)</label>
                  <div className="flex items-center gap-2 group/input">
                    <input type="text" readOnly value={assetsQuery.data?.badge_embed_code || ''} className="flex-1 h-10 px-4 text-xs font-mono font-bold border-none rounded-xl bg-white/50 dark:bg-[#002B4D] text-brand-blue dark:text-brand-cyan focus:ring-0" />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => copyToClipboard(assetsQuery.data?.badge_embed_code || '', 'Selo')}
                      className="h-10 w-10 bg-white/80 dark:bg-white/5 hover:bg-brand-blue hover:text-white rounded-xl transition-all border border-black/5 dark:border-none"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 📊 CORE ANALYTICS - Responsive Depth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {statsQuery.isLoading ? (
          <Skeleton className="h-[360px] w-full rounded-[2rem] bg-black/[0.03] dark:bg-white/5 border border-black/5 dark:border-white/10" />
        ) : (
          <div data-tour="reputation" className="clay-precision bg-card dark:bg-[#002B4D] rounded-[2rem] overflow-hidden">
            <NPSDetailedCard averageRating={Number(stats?.averageRating || 0)} reviewsCount={Number(stats?.reviewsCount || 0)} />
          </div>
        )}
        {statsQuery.isLoading ? (
          <Skeleton className="h-[360px] w-full rounded-[2rem] bg-black/[0.03] dark:bg-white/5 border border-black/5 dark:border-white/10" />
        ) : (
          <div className="clay-precision bg-card dark:bg-[#002B4D] rounded-[2rem] overflow-hidden p-1">
            <RankingTable rows={rankingRows} />
          </div>
        )}
      </div>

      {/* ⚙️ OPERATIONAL GRID - Responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Health */}
        <Card className="clay-precision bg-card dark:bg-[#002B4D] border-none group hover:scale-[1.02] transition-all">
          <CardContent className="p-5 flex items-center gap-5">
            <div className="p-3.5 bg-brand-green/10 rounded-2xl shadow-inner border border-brand-green/10">
              <CheckCircle className="h-6 w-6 text-brand-green" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 dark:text-white/30">Saúde dos Dados</p>
              <h4 className="text-xl font-black text-foreground dark:text-white tracking-tighter">{stats?.profileCompletion || 0}%</h4>
              <div className="w-full bg-black/[0.05] dark:bg-black/40 h-1.5 rounded-full mt-2.5 overflow-hidden border border-black/5 dark:border-white/5">
                <div className="bg-brand-green h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(52,199,89,0.4)]" style={{ width: `${stats?.profileCompletion || 0}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conversion Performance */}
        <Card className="clay-precision bg-card dark:bg-[#002B4D] border-none group hover:scale-[1.02] transition-all">
          <CardContent className="p-5 flex items-center gap-5">
            <div className="p-3.5 bg-brand-blue/10 rounded-2xl shadow-inner border border-brand-blue/10">
              <Star className="h-6 w-6 text-brand-blue" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 dark:text-white/30">Eficiência de Funil</p>
              <h4 className="text-xl font-black text-foreground dark:text-white tracking-tighter">{stats?.conversionRate?.toFixed(1) || 0}%</h4>
              <p className="text-[10px] font-bold text-brand-blue/60 dark:text-brand-cyan/60 mt-1 uppercase tracking-widest">
                Conversão em Avaliações
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Status / Opportunities */}
        {statsQuery.isLoading ? (
          <Skeleton className="h-[96px] w-full rounded-2xl bg-black/[0.03] dark:bg-white/5 border border-black/5 dark:border-white/10" />
        ) : stats && !hasNoData && stats.leadsReceived > 0 ? (
          <OpportunitiesCard
            leftLabel="Setor"
            leftValue={stats.leadsReceived}
            rightLabel="Sua Empresa"
            rightValue={stats.leadsReceived}
          />
        ) : (
          <Card className="clay-precision bg-card dark:bg-[#002B4D] border-none group hover:scale-[1.02] transition-all">
            <CardContent className="p-5 flex items-center gap-5">
              <div className="p-3.5 bg-brand-cyan/10 rounded-2xl shadow-inner border border-brand-cyan/10">
                <ShieldCheck className="h-6 w-6 text-brand-cyan" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 dark:text-white/30">Visibilidade</p>
                <h4 className="text-xl font-black text-foreground dark:text-white tracking-tighter uppercase">Perfil Ativo</h4>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
                  <p className="text-[10px] font-black text-brand-green uppercase tracking-widest">Público</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 🏆 GROWTH TOOLS - Responsive Hardware Signature */}
      <Card className="clay-precision bg-card dark:bg-[#002B4D] border-none overflow-hidden">
        <CardHeader className="p-6 border-b border-black/5 dark:border-white/5 bg-brand-cyan/5">
          <CardTitle className="text-lg font-black text-foreground dark:text-white flex items-center gap-3 tracking-tighter">
            <Zap className="w-5 h-5 text-brand-cyan" />
            Growth Engineering
          </CardTitle>
          <CardDescription className="text-muted-foreground dark:text-white/40 font-medium">
            Protocolos avançados para amplificação de prova social e captura orgânica.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-black/[0.03] dark:bg-black/20 rounded-[1.5rem] border border-black/5 dark:border-white/5 flex flex-col justify-between group hover:border-brand-blue/20 transition-all">
              <div className="space-y-2 mb-6">
                <h4 className="text-sm font-black text-foreground dark:text-white uppercase tracking-tight flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-brand-blue" />
                  Ativo de Rastreamento
                </h4>
                <p className="text-xs text-muted-foreground dark:text-white/40 leading-relaxed">Compartilhe sua identidade única para monitorar o ROI de cada interação digital.</p>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={assetsQuery.data?.utm_ready_link || ''} 
                  className="flex-1 h-9 px-4 text-[10px] font-mono font-bold border-none rounded-lg bg-white dark:bg-[#002B4D] text-brand-blue focus:ring-0 shadow-inner" 
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => copyToClipboard(assetsQuery.data?.utm_ready_link || '', 'Link')}
                  className="h-9 rounded-lg border-black/10 dark:border-white/10 bg-white/5 dark:bg-white/5 hover:bg-brand-blue hover:text-white text-muted-foreground dark:text-white transition-all shadow-sm"
                >
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            <div className="p-6 bg-black/[0.03] dark:bg-black/20 rounded-[1.5rem] border border-black/5 dark:border-white/5 flex flex-col justify-between group hover:border-brand-cyan/20 transition-all">
              <div className="space-y-2 mb-6">
                <h4 className="text-sm font-black text-foreground dark:text-white uppercase tracking-tight flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-brand-cyan" />
                  Validação Externa
                </h4>
                <p className="text-xs text-muted-foreground dark:text-white/40 leading-relaxed">Instale o componente de autoridade técnica diretamente no seu ecossistema web.</p>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={assetsQuery.data?.badge_embed_code || ''} 
                  className="flex-1 h-9 px-4 text-[10px] font-mono font-bold border-none rounded-lg bg-white dark:bg-[#002B4D] text-brand-blue dark:text-brand-cyan focus:ring-0 shadow-inner" 
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => copyToClipboard(assetsQuery.data?.badge_embed_code || '', 'Selo')}
                  className="h-9 rounded-lg border-black/10 dark:border-white/10 bg-white/5 dark:bg-white/5 hover:bg-brand-cyan hover:text-white text-muted-foreground dark:text-white transition-all shadow-sm"
                >
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 📈 ADVANCED ANALYTICS */}
      <div className="pt-4">
        <AdvancedAnalytics themeMode={themeMode || 'dark'} companyId={companyId} />
      </div>
    </div>
  );
}
