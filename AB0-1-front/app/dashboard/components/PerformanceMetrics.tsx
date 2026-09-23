'use client';

import { useState, useEffect, useMemo } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { 
  Eye, 
  MousePointerClick, 
  ArrowUpRight,
  AlertCircle,
  Printer,
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
import AttributionOverview from './analytics/AttributionOverview';
import { useQuery } from '@tanstack/react-query';
import { companyDashboardApi, type AnalyticsQueryParams } from '@/lib/api';
import '../styles/print.css';

interface PerformanceMetricsProps {
  companyId: string;
  companyName?: string;
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

export const resolveAnalyticsRange = (
  preset: DateRangePreset,
  customRange?: { from: Date; to: Date }
): AnalyticsQueryParams => {
  if (preset === 'custom' && customRange?.from && customRange.to) {
    return {
      from: formatDateForApi(customRange.from),
      to: formatDateForApi(customRange.to),
      preset: 'custom',
      timezone: 'America/Sao_Paulo',
    };
  }

  const days = preset === '7d' ? 7 : preset === '90d' ? 90 : 30;
  const to = new Date();
  const from = new Date(to);
  from.setDate(to.getDate() - (days - 1));

  return {
    from: formatDateForApi(from),
    to: formatDateForApi(to),
    preset,
    timezone: 'America/Sao_Paulo',
  };
};

export const formatExportRangeLabel = (preset: DateRangePreset, customRange?: { from: Date; to: Date }) => {
  if (preset === 'custom' && customRange?.from && customRange.to) {
    const format = (date: Date) => date.toLocaleDateString('pt-BR');
    return `${format(customRange.from)} a ${format(customRange.to)}`;
  }

  return { '7d': '7 dias', '30d': '30 dias', '90d': '90 dias', custom: 'período selecionado' }[preset];
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

export default function PerformanceMetrics({ companyId, companyName = 'Empresa', themeMode }: PerformanceMetricsProps) {
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

  const exportRangeLabel = formatExportRangeLabel(timeRange, customDateRange);

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
    preset: analyticsQuery.preset,
    timezone: analyticsQuery.timezone,
  });

  const { data: timeseriesResponse, isLoading: timeseriesLoading, isError: timeseriesError } = useQuery({
    queryKey: [
      'analytics-timeseries',
      companyId,
      analyticsQuery.from ?? null,
      analyticsQuery.to ?? null,
      analyticsQuery.preset ?? null,
      analyticsQuery.timezone ?? null,
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
    error || timeseriesError || analyticsData?.data_status === 'error' || timeseriesResponse?.data_status === 'error';
  const freshnessLabel = formatFreshnessLabel(analyticsData?.last_aggregated_at);

  const metrics: Metrics = {
    profileViews: {
      total: overviewReady ? (analyticsData?.metrics?.views ?? analyticsData?.views ?? analyticsData?.views_30d ?? null) : null,
      trend: analyticsData?.views_trend ?? null,
      unique: overviewReady ? (analyticsData?.unique_views ?? analyticsData?.unique_views_30d ?? null) : null,
      returning: overviewReady
        ? (analyticsData?.returning_views ?? analyticsData?.returning_views_30d ?? null)
        : null,
    },
    ctaClicks: {
      total: overviewReady ? (analyticsData?.metrics?.cta_clicks ?? analyticsData?.cta_clicks ?? analyticsData?.cta_clicks_30d ?? null) : null,
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
              (analyticsData?.metrics?.views ?? analyticsData?.views) != null &&
              (analyticsData?.metrics?.cta_clicks ?? analyticsData?.cta_clicks) != null &&
              analyticsData?.whatsapp_clicks != null &&
              analyticsData?.email_clicks != null &&
              analyticsData?.phone_clicks != null &&
              analyticsData?.website_clicks != null &&
              (analyticsData?.metrics?.leads ?? analyticsData?.leads) != null &&
              analyticsData?.conversion_rate != null
                ? {
                    views: analyticsData.metrics?.views ?? analyticsData.views!,
                    cta_clicks: analyticsData.metrics?.cta_clicks ?? analyticsData.cta_clicks!,
                    whatsapp_clicks: analyticsData.whatsapp_clicks,
                    email_clicks: analyticsData.email_clicks,
                    phone_clicks: analyticsData.phone_clicks,
                    website_clicks: analyticsData.website_clicks,
                    leads: analyticsData.metrics?.leads ?? analyticsData.leads!,
                    conversion_rate: analyticsData.conversion_rate,
                  }
                : undefined
            }
            companyName={companyName}
            rangeLabel={exportRangeLabel}
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

      {error && (
        <Alert variant="destructive" className="border-red-500/30 bg-red-500/10">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>O resumo de analytics está indisponível neste momento. Os demais blocos continuam independentes.</AlertDescription>
        </Alert>
      )}

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
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <TimeSeriesChart data={timeseriesData || []} loading={timeseriesLoading} dataStatus={timeseriesResponse?.data_status} themeMode={themeMode || 'dark'} />
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
          dataStatus={analyticsData?.data_status}
          themeMode={themeMode || 'dark'}
        />
      </div>
      <AttributionOverview
        companyId={companyId}
        from={analyticsQuery.from || ''}
        to={analyticsQuery.to || ''}
        preset={analyticsQuery.preset}
        rangeLabel={exportRangeLabel}
        premium={analyticsData?.is_premium_analytics !== false}
      />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="transition-all duration-700 delay-150"
      >
        <TopCampaignsCard
          companyId={companyId}
          preset={analyticsQuery.preset}
          timezone={analyticsQuery.timezone}
          themeMode={themeMode || 'dark'}
          limit={5}
          from={analyticsQuery.from}
          to={analyticsQuery.to}
        />
      </motion.div>
    </div>
  );
}
