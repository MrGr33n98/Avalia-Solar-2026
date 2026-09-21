'use client';

import { useState, useEffect, useMemo } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, 
  MousePointerClick, 
  ArrowUpRight,
  AlertCircle,
  Printer,
  Lock,
  Zap,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import MetricCard from './MetricCard';
import { useCompanyAnalytics } from '../hooks/useCompanyAnalytics';
import TimeSeriesChart from './TimeSeriesChart';
import CTABreakdownChart from './CTABreakdownChart';
import TopCampaignsCard from './TopCampaignsCard';
import DateRangePicker, { type DateRangePreset } from './DateRangePicker';
import ExportButton from './ExportButton';
import { useQuery } from '@tanstack/react-query';
import { companyDashboardApi, type AnalyticsQueryParams } from '@/lib/api';
import { cn } from '@/lib/utils';
import '../styles/print.css';

interface PerformanceMetricsProps {
  companyId: string;
  themeMode?: 'light' | 'dark';
}

interface Metrics {
  profileViews: {
    total: number | null;
    trend: number | null;
    unique: number | null;
    returning: number | null;
  };
  ctaClicks: {
    total: number | null;
    trend: number | null;
  };
  engagement: {
    avg_time_on_page_seconds?: number | null;
    bounce_rate_percent?: number | null;
    pages_per_session?: number | null;
    engagement_rate_percent?: number | null;
    source: string;
    last_synced_at?: string | null;
  } | null;
}

const formatDateForApi = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const resolveAnalyticsRange = (
  preset: DateRangePreset,
  customRange?: { from: Date; to: Date }
): AnalyticsQueryParams => {
  if (preset === 'custom' && customRange?.from && customRange.to) {
    return {
      from: formatDateForApi(customRange.from),
      to: formatDateForApi(customRange.to),
    };
  }

  const days = preset === '7d' ? 7 : preset === '90d' ? 90 : 30;
  const to = new Date();
  const from = new Date(to);
  from.setDate(to.getDate() - (days - 1));

  return {
    from: formatDateForApi(from),
    to: formatDateForApi(to),
  };
};

const formatTime = (seconds?: number | null) => {
  if (seconds === null || seconds === undefined) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatFreshnessLabel = (timestamp?: string | null) => {
  if (!timestamp) return null;

  const diffMs = Date.now() - new Date(timestamp).getTime();
  const diffMinutes = Math.max(Math.round(diffMs / 60000), 0);

  if (diffMinutes < 1) return 'Atualizado agora';
  if (diffMinutes < 60) return `Atualizado há ${diffMinutes} min`;

  const diffHours = Math.round(diffMinutes / 60);
  return `Atualizado há ${diffHours} h`;
};

export default function PerformanceMetrics({ companyId, themeMode }: PerformanceMetricsProps) {
  const [timeRange, setTimeRange] = useState<DateRangePreset>('30d');
  const [customDateRange, setCustomDateRange] = useState<{ from: Date; to: Date }>();
  
  useEffect(() => {
    const saved = localStorage.getItem(`analytics-date-range-${companyId}`);
    if (saved) {
      try {
        const { preset, customRange } = JSON.parse(saved);
        setTimeRange(preset);
        if (customRange) {
          setCustomDateRange({
            from: new Date(customRange.from),
            to: new Date(customRange.to),
          });
        }
      } catch (e) {
        console.error('Failed to load saved date range:', e);
      }
    }
  }, [companyId]);

  const handleDateRangeChange = (preset: DateRangePreset, customRange?: { from: Date; to: Date }) => {
    setTimeRange(preset);
    setCustomDateRange(customRange);
    
    localStorage.setItem(
      `analytics-date-range-${companyId}`,
      JSON.stringify({ preset, customRange })
    );
  };

  const analyticsQuery = useMemo<AnalyticsQueryParams>(
    () => resolveAnalyticsRange(timeRange, customDateRange),
    [customDateRange, timeRange]
  );
  
  const { data: analyticsData, loading, error } = useCompanyAnalytics({
    companyId,
    autoRefresh: true,
    refreshInterval: 30000,
    from: analyticsQuery.from,
    to: analyticsQuery.to,
  });

  const { data: timeseriesResponse, isLoading: timeseriesLoading } = useQuery({
    queryKey: [
      'analytics-timeseries',
      companyId,
      analyticsQuery.from ?? null,
      analyticsQuery.to ?? null,
    ],
    queryFn: () => companyDashboardApi.getAnalyticsTimeseries(companyId, analyticsQuery),
    enabled: Boolean(companyId),
  });

  const timeseriesData = useMemo(
    () => (timeseriesResponse?.data ?? []).map((point) => ({
      date: point.date,
      profile_views: point.views,
      cta_clicks: point.clicks,
      whatsapp_clicks: point.whatsapp,
      email_clicks: point.email,
      phone_clicks: point.phone,
      website_clicks: point.website,
      quote_clicks: point.quote,
      leads: point.leads,
    })),
    [timeseriesResponse]
  );
  const overviewReady = analyticsData?.data_status === 'ready' || analyticsData?.data_status === 'stale';
  const engagementReady =
    analyticsData?.engagement_status === 'ready' || analyticsData?.engagement_status === 'stale';
  const dataUnavailable =
    analyticsData?.data_status === 'unavailable' || timeseriesResponse?.data_status === 'unavailable';
  const dataError =
    analyticsData?.data_status === 'error' || timeseriesResponse?.data_status === 'error';
  const freshnessLabel = formatFreshnessLabel(analyticsData?.last_aggregated_at);

  const metrics: Metrics = {
    profileViews: {
      total: overviewReady ? (analyticsData?.views ?? analyticsData?.views_30d ?? null) : null,
      trend: analyticsData?.views_trend ?? null,
      unique: overviewReady ? (analyticsData?.unique_views ?? analyticsData?.unique_views_30d ?? null) : null,
      returning: overviewReady
        ? (analyticsData?.returning_views ?? analyticsData?.returning_views_30d ?? null)
        : null,
    },
    ctaClicks: {
      total: overviewReady ? (analyticsData?.cta_clicks ?? analyticsData?.cta_clicks_30d ?? null) : null,
      trend: analyticsData?.cta_clicks_trend ?? null,
    },
    engagement: engagementReady ? analyticsData?.engagement ?? null : null,
  };
  const ctaRatio =
    metrics.profileViews.total && metrics.profileViews.total > 0 && metrics.ctaClicks.total !== null
      ? `CTR ${((metrics.ctaClicks.total / metrics.profileViews.total) * 100).toFixed(2).replace('.', ',')}%`
      : undefined;
  const engagementDescription =
    analyticsData?.engagement_status === 'not_configured'
      ? 'GA4 nao configurado'
      : analyticsData?.engagement_status === 'unavailable'
        ? 'Dados de sessao ainda nao disponiveis'
        : analyticsData?.engagement_status === 'stale'
          ? 'Dados de sessao desatualizados'
          : undefined;

  if (loading) {
    return (
      <div className="space-y-12">
        <div className="flex justify-between">
            <Skeleton className="h-10 w-64 rounded-xl bg-slate-100 dark:bg-white/5" />
            <Skeleton className="h-10 w-48 rounded-xl bg-slate-100 dark:bg-white/5" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-[2rem] bg-slate-100 dark:bg-white/5" />
          ))}
        </div>
        <Skeleton className="h-[500px] w-full rounded-[3.5rem] bg-slate-100 dark:bg-white/5" />
      </div>
    );
  }

  if (error) {
    return (
      <>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Alert variant="destructive" className="rounded-[2rem] border-none clay-precision bg-red-500/10 text-red-500 p-8">
            <AlertCircle className="h-8 w-8 mb-4" />
            <AlertDescription className="text-sm font-black uppercase tracking-[0.2em] leading-relaxed">
              Não foi possível carregar os dados de analytics: {error}
              <br />
              <span className="opacity-60 text-[10px]">Tente novamente em instantes.</span>
            </AlertDescription>
          </Alert>
        </motion.div>

        {dataUnavailable && (
          <Alert className="mt-6 border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-100">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription>
              Os dados consolidados ainda não estão disponíveis para este período. Nenhuma métrica foi assumida como zero.
            </AlertDescription>
          </Alert>
        )}
      </>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 pb-32">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="no-print flex flex-wrap items-center gap-3"
      >
        <DateRangePicker value={timeRange} customRange={customDateRange} onChange={handleDateRangeChange} />
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-100 p-1 dark:border-white/5 dark:bg-white/[0.03]">
          <ExportButton
            timeseriesData={timeseriesData}
            aggregatedData={
              overviewReady &&
              analyticsData?.views_30d != null &&
              analyticsData?.cta_clicks_30d != null &&
              analyticsData?.whatsapp_clicks_30d != null &&
              analyticsData?.email_clicks_30d != null &&
              analyticsData?.phone_clicks_30d != null &&
              analyticsData?.website_clicks_30d != null &&
              analyticsData?.leads_30d != null &&
              analyticsData?.conversion_rate != null
                ? {
                    views_30d: analyticsData.views_30d,
                    cta_clicks_30d: analyticsData.cta_clicks_30d,
                    whatsapp_clicks_30d: analyticsData.whatsapp_clicks_30d,
                    email_clicks_30d: analyticsData.email_clicks_30d,
                    phone_clicks_30d: analyticsData.phone_clicks_30d,
                    website_clicks_30d: analyticsData.website_clicks_30d,
                    leads_30d: analyticsData.leads_30d,
                    conversion_rate: analyticsData.conversion_rate,
                  }
                : undefined
            }
            companyName="Avalia Solar"
          />
          <Button variant="ghost" size="sm" onClick={() => window.print()} className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/[0.05]">
            <Printer className="mr-2 h-4 w-4" />
            Report Generation
          </Button>
        </div>
        {freshnessLabel && (
          <p
            className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-white/40"
            title={`Fonte: ${analyticsData?.data_source ?? 'analytics'}${analyticsData?.last_aggregated_at ? `\nUltima consolidacao: ${new Date(analyticsData.last_aggregated_at).toLocaleString('pt-BR')}` : ''}`}
          >
            {freshnessLabel}
          </p>
        )}
      </motion.div>

      {dataUnavailable && (
        <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-100">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription>
            Os dados consolidados ainda nao estao disponiveis para este periodo. Nenhuma metrica foi assumida como zero.
          </AlertDescription>
        </Alert>
      )}

      {dataError && (
        <Alert variant="destructive" className="border-red-500/30 bg-red-500/10">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Houve uma falha ao carregar parte do analytics deste periodo. Os dados nao foram mascarados.
          </AlertDescription>
        </Alert>
      )}

      {/* High-Fi Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Visualizacoes de perfil"
          value={metrics.profileViews.total ?? '—'}
          icon={Eye}
          change={metrics.profileViews.trend === null ? undefined : `${metrics.profileViews.trend > 0 ? '+' : ''}${metrics.profileViews.trend}%`}
          changeType={metrics.profileViews.trend === null ? 'neutral' : metrics.profileViews.trend > 0 ? 'positive' : 'negative'}
          color="brand-blue"
          delay={0.1}
          trend={null}
          description={analyticsData?.data_status === 'stale' ? 'Dados consolidados desatualizados' : undefined}
        />
        <MetricCard 
          title="Cliques em acoes"
          value={metrics.ctaClicks.total ?? '—'}
          icon={MousePointerClick}
          change={ctaRatio}
          changeType="neutral"
          color="brand-cyan"
          delay={0.2}
          trend={null}
        />
        <MetricCard 
          title="Tempo medio por sessao"
          value={metrics.engagement ? formatTime(metrics.engagement.avg_time_on_page_seconds) : '—'}
          icon={Clock}
          change={
            metrics.engagement?.pages_per_session !== null && metrics.engagement?.pages_per_session !== undefined
              ? `${metrics.engagement.pages_per_session.toFixed(1)} P/S`
              : undefined
          }
          changeType={metrics.engagement ? 'positive' : 'neutral'}
          color="brand-green"
          delay={0.3}
          trend={null}
          description={engagementDescription}
        />
        <MetricCard 
          title="Taxa de rejeicao"
          value={metrics.engagement && metrics.engagement.bounce_rate_percent !== null && metrics.engagement.bounce_rate_percent !== undefined
            ? `${metrics.engagement.bounce_rate_percent}%`
            : '—'}
          icon={ArrowUpRight}
          change={metrics.engagement
            ? ((metrics.engagement.bounce_rate_percent ?? 0) < 50 ? 'Saudavel' : 'Atencao')
            : undefined}
          changeType={metrics.engagement
            ? ((metrics.engagement.bounce_rate_percent ?? 0) < 50 ? 'positive' : 'negative')
            : 'neutral'}
          color="brand-yellow"
          delay={0.4}
          trend={null}
          description={engagementDescription}
        />
      </div>

      {/* Analytics Visualization Layer */}
      <div className="relative group">
        <AnimatePresence>
          {!analyticsData?.is_premium_analytics && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex items-center justify-center p-6 bg-slate-950/20 backdrop-blur-xl rounded-[3rem] border border-white/5"
            >
              <div className="clay-precision bg-card dark:bg-[#0F172A] p-10 rounded-[2.5rem] shadow-2xl border-none text-center max-w-lg mx-auto transform transition-all hover:scale-[1.02] duration-500">
                <div className="flex justify-center mb-6">
                    <div className="relative">
                        <div className="h-20 w-20 rounded-[2rem] bg-indigo-500/10 flex items-center justify-center animate-pulse">
                            <Lock className="h-10 w-10 text-indigo-500" />
                        </div>
                        <motion.div 
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full"
                        />
                    </div>
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tighter mb-4 text-foreground dark:text-white">
                  Unlock Strategic Intelligence
                </h3>
                <p className="text-sm text-muted-foreground dark:text-white/40 mb-10 font-medium leading-relaxed">
                  Eleve seu dashboard ao nível Enterprise. Obtenha acesso a vertores temporais, análise de origem de tráfego profundo e mapas de conversão comportamental.
                </p>
                <Button 
                    onClick={() => window.location.href='/pricing'}
                    className="w-full rounded-[1.2rem] font-black uppercase tracking-widest text-xs bg-indigo-600 hover:bg-indigo-500 text-white h-14 shadow-lg shadow-indigo-600/20 transition-all border-none"
                >
                  <Zap className="h-4 w-4 mr-2 fill-current" />
                  Upgrade to Enterprise Core
                </Button>
                <p className="mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
                    Trusted by 500+ Energy Institutions
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className={cn(
          "grid grid-cols-1 lg:grid-cols-2 gap-8 transition-all duration-700",
          !analyticsData?.is_premium_analytics && "blur-[12px] pointer-events-none select-none grayscale-[0.5] opacity-20"
        )}>
          <TimeSeriesChart data={timeseriesData || []} loading={timeseriesLoading} themeMode={themeMode || 'dark'} />
          <CTABreakdownChart
            data={
              analyticsData?.cta_breakdown
                ? {
                    whatsapp_clicks: analyticsData.cta_breakdown.whatsapp,
                    email_clicks: analyticsData.cta_breakdown.email,
                    phone_clicks: analyticsData.cta_breakdown.phone,
                    website_clicks: analyticsData.cta_breakdown.website,
                    quote_clicks: analyticsData.cta_breakdown.quote,
                    other_clicks: analyticsData.cta_breakdown.other,
                    total_clicks: analyticsData.cta_breakdown.total,
                  }
                : null
            }
            loading={loading}
            themeMode={themeMode || 'dark'}
          />
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className={cn(
            "transition-all duration-700 delay-150",
            !analyticsData?.is_premium_analytics && "blur-[8px] pointer-events-none select-none opacity-10"
        )}
      >
        <TopCampaignsCard
          companyId={companyId}
          themeMode={themeMode || 'dark'}
          limit={5}
          from={analyticsQuery.from}
          to={analyticsQuery.to}
        />
      </motion.div>
    </div>
  );
}
