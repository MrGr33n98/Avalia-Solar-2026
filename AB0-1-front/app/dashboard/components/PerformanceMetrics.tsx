'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Eye, 
  MousePointerClick, 
  MessageSquare, 
  TrendingUp,
  Users,
  ArrowUpRight,
  Download,
  Share2,
  Phone,
  Mail,
  Globe,
  Calendar,
  AlertCircle,
  Printer
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import StatsCard from './StatsCard';
import { useCompanyAnalytics } from '../hooks/useCompanyAnalytics';
import TimeSeriesChart from './TimeSeriesChart';
import CTABreakdownChart from './CTABreakdownChart';
import TopCampaignsCard from './TopCampaignsCard';
import DateRangePicker, { type DateRangePreset } from './DateRangePicker';
import ExportButton from './ExportButton';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import '../styles/print.css';

interface PerformanceMetricsProps {
  companyId: string;
  themeMode?: 'light' | 'dark';
}

interface Metrics {
  profileViews: {
    total: number;
    trend: number;
    unique: number;
    returning: number;
  };
  ctaClicks: {
    total: number;
    trend: number;
    byType: { type: string; count: number; label: string }[];
  };
  engagement: {
    avgTimeOnPage: number;
    bounceRate: number;
    pagesPerSession: number;
  };
  sources: {
    source: string;
    visits: number;
    percentage: number;
  }[];
}

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
  
  const { data: analyticsData, loading, error } = useCompanyAnalytics({
    companyId,
    autoRefresh: true,
    refreshInterval: 30000,
  });

  const { data: timeseriesData, isLoading: timeseriesLoading } = useQuery({
    queryKey: ['analytics-timeseries', companyId, timeRange],
    queryFn: async () => {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const response = await fetchApi<{ data: any[] }>('/company_dashboard/analytics/timeseries', {
        params: { company_id: companyId, days }
      });
      return response.data || [];
    },
    enabled: Boolean(companyId),
  });

  const metrics: Metrics = {
    profileViews: {
      total: analyticsData?.views_30d || 0,
      trend: analyticsData?.views_trend || 0,
      unique: analyticsData?.unique_views_30d || 0,
      returning: analyticsData?.returning_views_30d || 0,
    },
    ctaClicks: {
      total: analyticsData?.cta_clicks_30d || 0,
      trend: analyticsData?.cta_clicks_trend || 0,
      byType: [
        { type: 'whatsapp', count: analyticsData?.whatsapp_clicks_30d || 0, label: 'WhatsApp' },
        { type: 'email', count: analyticsData?.email_clicks_30d || 0, label: 'Email' },
        { type: 'phone', count: analyticsData?.phone_clicks_30d || 0, label: 'Telefone' },
        { type: 'website', count: analyticsData?.website_clicks_30d || 0, label: 'Website' },
      ],
    },
    engagement: analyticsData?.engagement || null,
    sources: analyticsData?.traffic_sources || [],
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 rounded-xl bg-black/[0.03] dark:bg-white/5" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl bg-black/[0.03] dark:bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="rounded-2xl border-none clay-precision bg-red-500/10 text-red-500">
        <AlertCircle className="h-5 w-5" />
        <AlertDescription className="font-bold uppercase tracking-widest text-xs ml-2">
          Falha na integridade dos dados: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 no-print">
        <div>
          <h2 className="text-3xl font-black text-foreground dark:text-white tracking-tighter mb-1 uppercase">Performance</h2>
          <p className="text-sm font-medium text-muted-foreground dark:text-white/40">Inteligência de tráfego e engajamento em tempo real.</p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangePicker value={timeRange} customRange={customDateRange} onChange={handleDateRangeChange} />
          <ExportButton timeseriesData={timeseriesData} aggregatedData={analyticsData} companyName="Empresa" />
          <Button variant="outline" size="sm" onClick={() => window.print()} className="h-9 rounded-xl border-black/10 dark:border-white/10 bg-card dark:bg-[#002B4D] text-[10px] font-black uppercase tracking-widest text-foreground/60 dark:text-white/60">
            <Printer className="h-3.5 w-3.5 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Profile Views */}
        <Card className="clay-precision bg-card dark:bg-[#002B4D] border-none group overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-5">
              <div className="p-3.5 rounded-2xl bg-brand-blue/10 border border-brand-blue/10 shadow-inner">
                <Eye className="h-6 w-6 text-brand-blue" />
              </div>
              <Badge variant={metrics.profileViews.trend > 0 ? 'default' : 'secondary'} className={cn(
                "text-[10px] font-black uppercase tracking-widest h-5 border-none",
                metrics.profileViews.trend > 0 ? "bg-brand-green/10 text-brand-green" : "bg-black/5 dark:bg-white/5 text-muted-foreground"
              )}>
                {metrics.profileViews.trend > 0 ? '+' : ''}{metrics.profileViews.trend}%
              </Badge>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 dark:text-white/30 mb-1">Visualizações</p>
              <p className="text-3xl font-black text-foreground dark:text-white tracking-tighter font-mono">{metrics.profileViews.total.toLocaleString()}</p>
              <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/5 space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-muted-foreground/40 dark:text-white/30">Únicos</span>
                  <span className="text-foreground/80 dark:text-white/80 font-mono">{metrics.profileViews.unique.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-muted-foreground/40 dark:text-white/30">Retornando</span>
                  <span className="text-foreground/80 dark:text-white/80 font-mono">{metrics.profileViews.returning.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total CTA Clicks */}
        <Card className="clay-precision bg-card dark:bg-[#002B4D] border-none group overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-5">
              <div className="p-3.5 rounded-2xl bg-brand-cyan/10 border border-brand-cyan/10 shadow-inner">
                <MousePointerClick className="h-6 w-6 text-brand-cyan" />
              </div>
              <Badge className="bg-brand-blue/10 text-brand-blue text-[10px] font-black uppercase tracking-widest border-none">
                {metrics.ctaClicks.total} TOTAL
              </Badge>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 dark:text-white/30 mb-1">Interações Ativas</p>
              <p className="text-3xl font-black text-foreground dark:text-white tracking-tighter font-mono">{metrics.ctaClicks.total.toLocaleString()}</p>
              <p className="text-[10px] font-black text-brand-cyan/60 mt-4 uppercase tracking-widest">
                Conversão: {((metrics.ctaClicks.total / metrics.profileViews.total) * 100).toFixed(1)}% de cliques
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Engagement Performance */}
        <Card className="clay-precision bg-card dark:bg-[#002B4D] border-none group overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-5">
              <div className="p-3.5 rounded-2xl bg-brand-green/10 border border-brand-green/10 shadow-inner">
                <Users className="h-6 w-6 text-brand-green" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 dark:text-white/30 mb-1">Tempo de Sessão</p>
              <p className="text-3xl font-black text-foreground dark:text-white tracking-tighter font-mono">
                {metrics.engagement ? formatTime(metrics.engagement.avgTimeOnPage) : '--:--'}
              </p>
              <p className="text-[10px] font-black text-brand-green/60 mt-4 uppercase tracking-widest">
                Qualidade: {metrics.engagement?.pagesPerSession.toFixed(1) || '0.0'} páginas / sessão
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Rejection Rate */}
        <Card className="clay-precision bg-card dark:bg-[#002B4D] border-none group overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-5">
              <div className="p-3.5 rounded-2xl bg-brand-yellow/10 border border-brand-yellow/10 shadow-inner">
                <ArrowUpRight className="h-6 w-6 text-brand-yellow" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 dark:text-white/30 mb-1">Taxa de Rejeição</p>
              <p className="text-3xl font-black text-foreground dark:text-white tracking-tighter font-mono">
                {metrics.engagement ? `${metrics.engagement.bounceRate}%` : '--%'}
              </p>
              <p className="text-[10px] font-black text-brand-yellow/60 mt-4 uppercase tracking-widest">
                Status: {metrics.engagement ? (metrics.engagement.bounceRate < 50 ? 'Retenção Alta' : 'Alerta de Fuga') : 'Monitorando'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Visualization Layer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TimeSeriesChart data={timeseriesData || []} loading={timeseriesLoading} themeMode={themeMode || 'dark'} />
        <CTABreakdownChart data={{
          whatsapp_clicks: analyticsData?.whatsapp_clicks_30d || 0,
          email_clicks: analyticsData?.email_clicks_30d || 0,
          phone_clicks: analyticsData?.phone_clicks_30d || 0,
          website_clicks: analyticsData?.website_clicks_30d || 0,
        }} loading={loading} themeMode={themeMode || 'dark'} />
      </div>

      <TopCampaignsCard companyId={companyId} themeMode={themeMode || 'dark'} limit={5} />
    </div>
  );
}
