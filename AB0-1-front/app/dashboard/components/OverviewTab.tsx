'use client';

import {
  Eye,
  Star,
  TrendingUp,
  Copy,
  ShieldCheck,
  CheckCircle2,
  Users,
  Zap,
  ArrowUpRight,
  Globe,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  MousePointerClick,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fetchApi, type FeatureAccessEntry } from '@/lib/api';
import { subscribeCompanyDashboard } from '@/lib/cable';
import { isFeatureEnabled } from '@/lib/feature-access';
import MetricCard from './MetricCard';
import OpportunityBoard from './OpportunityBoard';
import NPSDetailedCard from '@/components/ui/NPSDetailedCard';
import RankingTable, { type RankingRow } from '@/components/ui/RankingTable';
import dynamic from 'next/dynamic';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const AdvancedAnalytics = dynamic(() => import('./AdvancedAnalytics'), {
  loading: () => <div className="h-[400px] w-full animate-pulse bg-black/[0.03] dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl" />,
  ssr: false
});

type OverviewTabProps = {
  companyId: string;
  company?: any;
  featureAccess?: Record<string, FeatureAccessEntry>;
  themeMode?: 'light' | 'dark';
  onNavigateToReviews?: () => void;
};

/* ─── Animated Rolling Number ─── */
function RollingNumber({ value, className }: { value: number | string; className?: string }) {
  const displayValue = typeof value === 'number' ? value.toLocaleString('pt-BR') : value;
  return (
    <motion.span
      key={displayValue}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className={cn('tabular-nums font-mono', className)}
    >
      {displayValue}
    </motion.span>
  );
}

/* ─── Figma-style Stat Card (AS-EDS Clay Precision) ─── */
function StatCard({
  title,
  value,
  change,
  changeType = 'positive',
  icon: Icon,
  delay = 0,
}: {
  title: string;
  value: string | number;
  change: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: any;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.23, 1, 0.32, 1] }}
    >
      <div className={cn(
        'relative flex flex-col justify-between gap-3 p-5 rounded-xl transition-all duration-300',
        'bg-white dark:bg-slate-900',
        'border border-slate-200 dark:border-slate-800',
        'shadow-sm hover:shadow-md',
        'hover:border-slate-300 dark:hover:border-slate-700',
        'group cursor-default min-h-[112px]'
      )}>
        {/* Inset highlight */}


        <div className="flex items-center justify-between">
          <p className="text-[13px] font-medium text-slate-500 dark:text-white/50 leading-tight">
            {title}
          </p>
          {Icon && (
            <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <Icon className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
            </div>
          )}
        </div>
        <div className="flex items-end justify-between gap-2 flex-wrap">
          <RollingNumber
            value={value}
            className="text-[26px] font-semibold text-slate-900 dark:text-white leading-none tracking-tight"
          />
          <div className={cn(
            'flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md',
            changeType === 'positive' && 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10',
            changeType === 'negative' && 'text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10',
            changeType === 'neutral' && 'text-slate-500 dark:text-white/40',
          )}>
            <span>{change}</span>
            {changeType === 'positive' && (
              <ArrowUpRight className="h-3 w-3" />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Chart Tooltip (Figma-style) ─── */
function ChartTooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-[160px] rounded-lg border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-3 text-xs shadow-lg backdrop-blur-xl">
      <p className="font-medium text-slate-500 dark:text-white/50 mb-2">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-600 dark:text-white/60">{entry.name}</span>
          </div>
          <span className="font-semibold text-slate-900 dark:text-white tabular-nums">{entry.value?.toLocaleString('pt-BR')}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Traffic Source Bar (Figma horizontal bar adaptation) ─── */
function TrafficSourceBar({ label, segments, maxValue }: {
  label: string;
  segments: { value: number; color: string }[];
  maxValue: number;
}) {
  const total = segments.reduce((a, b) => a + b.value, 0);
  return (
    <div className="flex items-center gap-4 py-2">
      <span className="text-xs font-medium text-slate-600 dark:text-white/60 w-20 shrink-0 truncate">{label}</span>
      <div className="flex-1 flex gap-0.5 h-2 items-center">
        {segments.map((seg, i) => (
          <motion.div
            key={i}
            initial={{ width: 0 }}
            animate={{ width: `${Math.max((seg.value / maxValue) * 100, 2)}%` }}
            transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ backgroundColor: seg.color }}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Donut Chart Legend Row ─── */
function DonutLegendRow({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2">
        <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <span className="text-xs font-medium text-slate-600 dark:text-white/60">{label}</span>
      </div>
      <span className="text-xs font-semibold text-slate-900 dark:text-white tabular-nums">{value}</span>
    </div>
  );
}

/* ─── Clay Panel Styles (AS-EDS Precision) ─── */
const CLAY_PANEL = [
  'bg-white dark:bg-slate-900',
  'border border-slate-200 dark:border-slate-800',
  'shadow-sm',
].join(' ');

/* ─── Main Component ─── */
export default function OverviewTab({ companyId, company, featureAccess, themeMode, onNavigateToReviews }: OverviewTabProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [reviewLink, setReviewLink] = useState('');

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copiado!',
        description: `${type} copiado com sucesso para a área de transferência.`,
      });
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  useEffect(() => {
    setReviewLink(`${window.location.origin}/companies/${companyId}/review`);
  }, [companyId]);

  // ─── Data Queries ───
  const statsQuery = useQuery({
    queryKey: ['company-analytics-overview', companyId],
    queryFn: async () => {
      const data = await fetchApi<any>('/company_dashboard/analytics/overview', { params: { company_id: companyId } });

      const profileFields = [
        company?.name, company?.description,
        company?.logo?.url || company?.logo_url,
        company?.banner?.url || company?.banner_url,
        company?.city, company?.state,
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

  const timeseriesQuery = useQuery({
    queryKey: ['company-analytics-timeseries', companyId, 30],
    queryFn: async () => fetchApi<{ data: any[] }>('/company_dashboard/analytics/timeseries', { params: { company_id: companyId, days: 30 } }),
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
      queryClient.invalidateQueries({ queryKey: ['company-analytics-timeseries', companyId, 30] });
    });
    return () => {
      if (subscription && typeof (subscription as any).unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, [companyId, queryClient]);

  const stats = statsQuery.data;
  const isPremium = isFeatureEnabled(featureAccess, 'leads_marketplace');
  void isPremium;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* NPS / Ranking (Figma: 432x280) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
        >
          <div className={cn(
            'rounded-xl overflow-hidden h-full',
            CLAY_PANEL,
          )}>
            <NPSDetailedCard
              averageRating={Number(stats?.averageRating || 0)}
              reviewsCount={Number(stats?.reviewsCount || 0)}
            />
          </div>
        </motion.div>
      </div>

      {/* ═══ ROW 5: Full-width Analytics Block (Figma: 892x280) ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <div className={cn(
          'rounded-xl overflow-hidden',
          CLAY_PANEL,
        )}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Activity className="h-4 w-4 text-slate-400 dark:text-white/40" />
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Analytics Avançado</p>
              </div>
              <Badge variant="outline" className="text-[10px] font-medium border-slate-300 dark:border-white/10 text-slate-500 dark:text-white/40">
                30 dias
              </Badge>
            </div>
            <AdvancedAnalytics themeMode={themeMode || 'dark'} companyId={companyId} />
          </div>
        </div>
      </motion.div>

      {/* ═══ ROW 6: Operational Cards (Profile + Conversion + Status) ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Profile Completion */}
        <div className={cn(
          'flex items-center gap-5 p-5 rounded-xl',
          CLAY_PANEL,
        )}>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl border border-emerald-200 dark:border-emerald-500/20">
            <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <p className="text-xs font-medium text-slate-500 dark:text-white/40">Integridade do Perfil</p>
            <p className="text-xl font-semibold text-slate-900 dark:text-white">{stats?.profileCompletion || 0}%</p>
            <div className="w-full bg-slate-200 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats?.profileCompletion || 0}%` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                className="bg-emerald-500 h-full rounded-full"
              />
            </div>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className={cn(
          'flex items-center gap-5 p-5 rounded-xl',
          CLAY_PANEL,
        )}>
          <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-2xl border border-blue-200 dark:border-blue-500/20">
            <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-500 dark:text-white/40">Eficiência do Funil</p>
            <p className="text-xl font-semibold text-slate-900 dark:text-white">{stats?.conversionRate?.toFixed(1) || 0}%</p>
            <p className="text-[11px] text-blue-500 dark:text-blue-400 font-medium mt-1 flex items-center gap-1">
              <div className="w-1 h-1 rounded-full bg-current animate-pulse" />
              Distribuição ativa
            </p>
          </div>
        </div>

        {/* Active Status */}
        <div className={cn(
          'flex items-center gap-5 p-5 rounded-xl',
          CLAY_PANEL,
        )}>
          <div className="p-3 bg-cyan-50 dark:bg-cyan-500/10 rounded-2xl border border-cyan-200 dark:border-cyan-500/20">
            <Eye className="h-6 w-6 text-cyan-600 dark:text-cyan-400" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-500 dark:text-white/40">Status de Visibilidade</p>
            <p className="text-xl font-semibold text-slate-900 dark:text-white">Ativo</p>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="flex gap-0.5">
                {[1, 2, 3].map(i => <div key={i} className="w-1 h-2.5 rounded-full bg-emerald-400/50" />)}
              </div>
              <p className="text-[11px] text-emerald-500 dark:text-emerald-400 font-medium">Sincronizado</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ ROW 7: Growth Assets ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.55 }}
      >
        <div className={cn(
          'rounded-xl overflow-hidden',
          CLAY_PANEL,
        )}>
          <div className="p-6 border-b border-slate-200/50 dark:border-white/[0.06]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-500" />
                  Ativos de Crescimento
                </p>
                <p className="text-xs text-slate-500 dark:text-white/40 mt-0.5">Links rastreáveis e selos de confiança</p>
              </div>
              <Badge variant="outline" className="text-[10px] border-slate-300 dark:border-white/10 text-slate-500 dark:text-white/40">
                PRONTO
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-0">
            {/* UTM Asset */}
            <div className="p-6 md:border-r border-b md:border-b-0 border-slate-200/50 dark:border-white/[0.06]">
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2">Link com UTM</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white dark:bg-white/[0.04] rounded-xl px-4 py-3 border border-slate-200 dark:border-white/10">
                  <span className="text-xs font-mono text-blue-600 dark:text-blue-400 truncate block">
                    {assetsQuery.data?.utm_ready_link || 'Carregando...'}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(assetsQuery.data?.utm_ready_link || '', 'Link')}
                  className="h-11 w-11 rounded-xl border-slate-200 dark:border-white/10 hover:bg-blue-50 dark:hover:bg-blue-500/10"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {/* Badge Asset */}
            <div className="p-6">
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-2">Selo de Confiança (HTML)</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white dark:bg-white/[0.04] rounded-xl px-4 py-3 border border-slate-200 dark:border-white/10">
                  <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 truncate block">
                    {assetsQuery.data?.badge_embed_code || 'Carregando...'}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(assetsQuery.data?.badge_embed_code || '', 'Selo')}
                  className="h-11 w-11 rounded-xl border-slate-200 dark:border-white/10 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="relative mt-8 group"
        >
          <div className="absolute -inset-[1px] bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 rounded-xl blur-sm opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
          <div className={cn(
            'relative rounded-xl overflow-hidden p-8',
            CLAY_PANEL,
            'bg-blue-50/50 dark:bg-blue-500/[0.04]',
            'border border-blue-200/50 dark:border-blue-500/10',
          )}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-amber-100 dark:bg-amber-500/10 rounded-xl">
                <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Checklist de Ativação</p>
                <p className="text-xs text-slate-500 dark:text-white/40">Execute estes passos para maximizar seus resultados</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: 'Completar Perfil', done: (stats?.profileCompletion || 0) >= 80, impact: '+ ranking local' },
                { label: 'Configurar CTAs', done: Boolean(company?.website || company?.whatsapp), impact: '+ conversão' },
                { label: 'Obter 5 Avaliações', done: (stats?.reviewsCount || 0) >= 5, impact: '+ confiança' },
                { label: 'Instalar Selo', done: false, impact: '+ cliques orgânicos' },
              ].map((item, i) => (
                <div key={i} className={cn(
                  'flex items-center gap-3 p-4 rounded-xl',
                  'bg-white/80 dark:bg-white/[0.03]',
                  'border border-slate-200/60 dark:border-white/[0.06]',
                )}>
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                    item.done ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-white/20'
                  )}>
                    {item.done ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-current" />}
                  </div>
                  <div className="min-w-0">
                    <span className={cn(
                      'text-sm font-medium block',
                      item.done ? 'text-slate-400 dark:text-white/30 line-through' : 'text-slate-900 dark:text-white'
                    )}>{item.label}</span>
                    <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                      {item.impact}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
    </div>
  );
}
