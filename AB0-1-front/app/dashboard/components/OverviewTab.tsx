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
  CheckCircle2,
  Users
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { fetchApi } from '@/lib/api';
import { subscribeCompanyDashboard } from '@/lib/cable';
import MetricCard, { MetricsGrid } from './MetricCard';
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

  const mainMetrics = [
    {
      title: 'Profile Insights',
      value: stats?.profileViews || 0,
      icon: Eye,
      change: '+12%',
      changeType: 'positive' as const,
      trend: [20, 40, 35, 50, 45, 60, 55, 70, 65, 80],
      color: 'blue'
    },
    {
      title: 'Reputation Score',
      value: stats?.reviewsCount || 0,
      icon: Star,
      change: '+5',
      changeType: 'positive' as const,
      trend: [10, 15, 12, 20, 18, 25, 22, 30, 28, 35],
      color: 'yellow'
    },
    {
      title: 'Yield Conversion',
      value: `${(stats?.conversionRate || 0).toFixed(1)}%`,
      icon: TrendingUp,
      change: '+2.4%',
      changeType: 'positive' as const,
      trend: [30, 35, 32, 40, 38, 45, 42, 50, 48, 55],
      color: 'green'
    },
    {
      title: 'Precision Leads',
      value: stats?.leadsReceived || 0,
      icon: Users,
      change: '+8',
      changeType: 'positive' as const,
      trend: [15, 20, 18, 25, 22, 30, 28, 35, 32, 40],
      color: 'purple'
    }
  ];

  return (
    <div className="space-y-8 pb-20 max-w-[1600px] mx-auto animate-in fade-in duration-700">
      {/* 🚀 ELITE KPIs */}
      {statsQuery.isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-40 rounded-2xl bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      ) : (
        <MetricsGrid metrics={mainMetrics} />
      )}

      {/* 🛠️ STRATEGIC RADAR */}
      {statsQuery.isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          <Skeleton className="lg:col-span-8 h-[450px] rounded-[2rem] bg-white/[0.03]" />
          <Skeleton className="lg:col-span-4 h-[450px] rounded-[2rem] bg-white/[0.03]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           <div className="lg:col-span-12">
            <OpportunityBoard 
              isPremium={isPremium} 
              stats={{
                leads_received: stats?.leadsReceived || 0,
                marketplace_potential: stats?.marketplacePotential || { leads_in_category: 0, leads_in_region: 0, market_share_percent: 0 },
                active_categories: stats?.activeCategories || []
              }} 
            />
          </div>
        </div>
      )}

      {/* 🚀 ACCELERATION PROTOCOL */}
      {hasNoData && (
        <Card className="clay-precision bg-card dark:bg-[#0F172A] border-none overflow-hidden group shadow-2xl">
          <CardHeader className="p-8 border-b border-white/5 bg-gradient-to-r from-primary/5 to-transparent relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.1),transparent)]" />
            <CardTitle className="text-2xl font-black text-foreground dark:text-white flex items-center gap-3 tracking-tight relative z-10">
              <Zap className="w-8 h-8 text-amber-400 animate-pulse fill-amber-400/20" />
              Directives for Precision Growth
            </CardTitle>
            <CardDescription className="text-muted-foreground dark:text-white/50 font-medium max-w-2xl text-base relative z-10">
              Your ecosystem is currently at low latency. Execute the following protocols to synchronize with the marketplace and amplify lead capture.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary dark:text-blue-400 mb-6 flex items-center gap-2">
                  <div className="w-8 h-[1px] bg-primary/30" />
                  Operational Checklist
                </p>
                {checklist.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.02] dark:bg-black/20 border border-white/5 group/item transition-all hover:border-primary/20 hover:bg-primary/[0.02]">
                    <div className="flex items-center gap-5">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm",
                        item.done 
                          ? "bg-brand-green/20 text-brand-green border border-emerald-500/20" 
                          : "bg-white/5 text-muted-foreground dark:text-white/20 border border-white/5"
                      )}>
                        {item.done ? <CheckCircle2 className="w-6 h-6" /> : <div className="w-2.5 h-2.5 rounded-full bg-current animate-pulse" />}
                      </div>
                      <div className="space-y-0.5">
                        <span className={cn(
                          "text-base font-bold tracking-tight block",
                          item.done 
                            ? "text-muted-foreground/30 dark:text-white/30 line-through decoration-emerald-500/30" 
                            : "text-foreground dark:text-white"
                        )}>{item.label}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-green/80">
                          Result: {item.impact}
                        </span>
                      </div>
                    </div>
                    {item.done && <Badge variant="secondary" className="bg-brand-green/10 text-brand-green border-none text-[9px] font-black">COMPLETADO</Badge>}
                  </div>
                ))}
              </div>
              
              <div className="flex flex-col justify-center space-y-8 p-8 bg-black/20 dark:bg-[#0A0E17] rounded-3xl border border-white/5 relative overflow-hidden shadow-inner">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -mr-32 -mt-32 pointer-events-none" />
                
                <div className="space-y-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary dark:text-blue-400">Distribution Asset (UTM)</label>
                    <Badge variant="outline" className="text-[9px] border-primary/20 text-primary">PRONTO</Badge>
                  </div>
                  <div className="flex items-center gap-3 group/input">
                    <input type="text" readOnly value={assetsQuery.data?.utm_ready_link || ''} className="flex-1 h-12 px-5 text-xs font-mono font-bold border-none rounded-xl bg-white/5 dark:bg-[#0F172A] text-blue-400 focus:ring-1 focus:ring-primary/50 shadow-inner" />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => copyToClipboard(assetsQuery.data?.utm_ready_link || '', 'Link')}
                      className="h-12 w-12 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl transition-all shadow-lg shadow-primary/10"
                    >
                      <Copy className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-green">Security / Trust Badge</label>
                    <Badge variant="outline" className="text-[9px] border-emerald-500/20 text-brand-green">HTML5</Badge>
                  </div>
                  <div className="flex items-center gap-3 group/input">
                    <input type="text" readOnly value={assetsQuery.data?.badge_embed_code || ''} className="flex-1 h-12 px-5 text-xs font-mono font-bold border-none rounded-xl bg-white/5 dark:bg-[#0F172A] text-emerald-400 focus:ring-1 focus:ring-emerald-500/50 shadow-inner" />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => copyToClipboard(assetsQuery.data?.badge_embed_code || '', 'Selo')}
                      className="h-12 w-12 bg-brand-green/10 text-brand-green hover:bg-brand-green hover:text-white rounded-xl transition-all shadow-lg shadow-emerald-500/10"
                    >
                      <Copy className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 📊 ANALYTICS CLUSTER */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {statsQuery.isLoading ? (
          <Skeleton className="h-[400px] w-full rounded-[2.5rem] bg-white/[0.03]" />
        ) : (
          <div data-tour="reputation" className="clay-precision bg-card dark:bg-[#0F172A] rounded-[2.5rem] overflow-hidden border-none shadow-xl">
            <NPSDetailedCard averageRating={Number(stats?.averageRating || 0)} reviewsCount={Number(stats?.reviewsCount || 0)} />
          </div>
        )}
        {statsQuery.isLoading ? (
          <Skeleton className="h-[400px] w-full rounded-[2.5rem] bg-white/[0.03]" />
        ) : (
          <div className="clay-precision bg-card dark:bg-[#0F172A] rounded-[2.5rem] overflow-hidden p-1 border-none shadow-xl">
            <RankingTable rows={rankingRows} />
          </div>
        )}
      </div>

      {/* ⚙️ INTEGRATED OPERATIONALS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Health */}
        <Card className="clay-precision bg-card dark:bg-[#0F172A] border-none group hover:scale-[1.02] transition-all p-1 shadow-lg">
          <CardContent className="p-6 flex items-center gap-6">
            <div className="p-4 bg-brand-green/10 rounded-2xl border border-emerald-500/20 shadow-inner">
              <ShieldCheck className="h-7 w-7 text-brand-green" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 dark:text-white/30">System Integrity</p>
              <h4 className="text-2xl font-black text-foreground dark:text-white tracking-tight">{stats?.profileCompletion || 0}% Completion</h4>
              <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden border border-white/5 mt-3">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${stats?.profileCompletion || 0}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="bg-brand-green h-full rounded-full shadow-[0_0_12px_rgba(16,185,129,0.5)]" 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Funnel Efficiency */}
        <Card className="clay-precision bg-card dark:bg-[#0F172A] border-none group hover:scale-[1.02] transition-all p-1 shadow-lg">
          <CardContent className="p-6 flex items-center gap-6">
            <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 shadow-inner">
              <Zap className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 dark:text-white/30">Flow Efficiency</p>
              <h4 className="text-2xl font-black text-foreground dark:text-white tracking-tight">{stats?.conversionRate?.toFixed(1) || 0}% ROI Rate</h4>
              <p className="text-[10px] font-bold text-primary dark:text-blue-400 mt-2 uppercase tracking-widest flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Optimized Distribution
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Visibility Node */}
        {statsQuery.isLoading ? (
          <Skeleton className="h-[104px] w-full rounded-2xl bg-white/[0.03]" />
        ) : (
          <Card className="clay-precision bg-card dark:bg-[#0F172A] border-none group hover:scale-[1.02] transition-all p-1 shadow-lg">
            <CardContent className="p-6 flex items-center gap-6">
              <div className="p-4 bg-blue-400/10 rounded-2xl border border-blue-400/20 shadow-inner">
                <Eye className="h-7 w-7 text-blue-400" strokeWidth={2.5} />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 dark:text-white/30">Network Node</p>
                <h4 className="text-2xl font-black text-foreground dark:text-white tracking-tight uppercase">Active Status</h4>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3].map(i => <div key={i} className="w-1 h-3 rounded-full bg-brand-green/40" />)}
                  </div>
                  <p className="text-[10px] font-black text-brand-green uppercase tracking-widest">Global Discovery Synced</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 🚀 ELITE GROWTH ENGINEERING */}
      <Card className="clay-precision bg-card dark:bg-[#0F172A] border-none overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <CardHeader className="p-8 border-b border-white/5 bg-white/[0.01]">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-black text-foreground dark:text-white flex items-center gap-3 tracking-tighter">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Zap className="w-6 h-6 text-primary fill-primary/10" />
                </div>
                Growth Engineering Protocols
              </CardTitle>
              <CardDescription className="text-muted-foreground dark:text-white/40 font-medium text-base">
                Synchronize your technical authority assets with external web endpoints.
              </CardDescription>
            </div>
            <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors">V3.0 DEPLOYED</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Asset 1 */}
            <div className="p-8 bg-white/[0.01] dark:bg-black/30 rounded-3xl border border-white/5 flex flex-col justify-between group/asset hover:border-primary/30 transition-all duration-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover/asset:opacity-20 transition-opacity">
                <TrendingUp className="w-32 h-32 text-primary" />
              </div>
              <div className="space-y-3 mb-8 relative z-10">
                <h4 className="text-base font-black text-foreground dark:text-white uppercase tracking-tight flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Primary Tracking Asset
                </h4>
                <p className="text-sm text-muted-foreground dark:text-white/40 leading-relaxed font-medium">Inject this unique UTM identifier into your marketing flows to track high-resolution B2B ROI.</p>
              </div>
              <div className="flex items-center gap-3 relative z-10">
                <div className="flex-1 bg-white/5 dark:bg-[#0A0E17] rounded-xl p-4 border border-white/10 shadow-inner">
                  <span className="text-[10px] font-mono font-bold text-primary truncate block">{assetsQuery.data?.utm_ready_link || 'Loading protocol...'}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => copyToClipboard(assetsQuery.data?.utm_ready_link || '', 'Link')}
                  className="h-14 w-14 rounded-xl border-white/10 bg-white/5 hover:bg-primary hover:text-white transition-all shadow-xl group/btn"
                >
                  <Copy className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                </Button>
              </div>
            </div>

            {/* Asset 2 */}
            <div className="p-8 bg-white/[0.01] dark:bg-black/30 rounded-3xl border border-white/5 flex flex-col justify-between group/asset hover:border-emerald-500/30 transition-all duration-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover/asset:opacity-20 transition-opacity">
                <ShieldCheck className="w-32 h-32 text-brand-green" />
              </div>
              <div className="space-y-3 mb-8 relative z-10">
                <h4 className="text-base font-black text-foreground dark:text-white uppercase tracking-tight flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-green" />
                  Validation Component
                </h4>
                <p className="text-sm text-muted-foreground dark:text-white/40 leading-relaxed font-medium">Embed our authority node directly into your site to synchronize social proof in real-time.</p>
              </div>
              <div className="flex items-center gap-3 relative z-10">
                <div className="flex-1 bg-white/5 dark:bg-[#0A0E17] rounded-xl p-4 border border-white/10 shadow-inner">
                  <span className="text-[10px] font-mono font-bold text-brand-green truncate block">{assetsQuery.data?.badge_embed_code || 'Loading protocol...'}</span>
                </div>
                <Button 
                   variant="outline" 
                   size="icon" 
                   onClick={() => copyToClipboard(assetsQuery.data?.badge_embed_code || '', 'Selo')}
                   className="h-14 w-14 rounded-xl border-white/10 bg-white/5 hover:bg-brand-green hover:text-white transition-all shadow-xl group/btn"
                >
                  <Copy className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 📊 DEEP ANALYTICS ENGINE */}
      <div className="pt-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/10" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground/40">Advanced Analytics Engine</h3>
          <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/10" />
        </div>
        <AdvancedAnalytics themeMode={themeMode || 'dark'} companyId={companyId} />
      </div>
    </div>
  );

}
