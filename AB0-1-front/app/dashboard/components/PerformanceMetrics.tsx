'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
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
  Printer,
  Lock,
  Zap,
  Activity,
  BarChart3,
  Clock,
  ExternalLink
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import MetricCard from './MetricCard';
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
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <Alert variant="destructive" className="rounded-[2rem] border-none clay-precision bg-red-500/10 text-red-500 p-8">
          <AlertCircle className="h-8 w-8 mb-4" />
          <AlertDescription className="text-sm font-black uppercase tracking-[0.2em] leading-relaxed">
            CRITICAL DATA CORRUPTION: {error}
            <br />
            <span className="opacity-60 text-[10px]">FAILED TO SYNCHRONIZE WITH ANALYTICS ENGINE</span>
          </AlertDescription>
        </Alert>
      </motion.div>
    );
  }

  return (
    <div className="space-y-12 max-w-[1400px] mx-auto pb-32">
      {/* Precision Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8 no-print">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                <Activity className="h-6 w-6 text-indigo-500" />
            </div>
            <h2 className="text-4xl font-black text-foreground dark:text-white tracking-tighter uppercase">
              Precision Analytics
            </h2>
          </div>
          <p className="text-sm text-muted-foreground font-medium max-w-lg leading-relaxed">
            Monitoramento em tempo real de tráfego de alta fidelidade, vetores de conversão e métricas de retenção institucional.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-wrap items-center gap-4"
        >
          <DateRangePicker value={timeRange} customRange={customDateRange} onChange={handleDateRangeChange} />
          <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-white/[0.03] rounded-2xl border border-slate-200 dark:border-white/5">
             <ExportButton timeseriesData={timeseriesData} aggregatedData={analyticsData} companyName="Avalia Solar" />
             <Button variant="ghost" size="sm" onClick={() => window.print()} className="h-10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/[0.05]">
               <Printer className="h-4 w-4 mr-2" />
               Report Generation
             </Button>
          </div>
        </motion.div>
      </div>

      {/* High-Fi Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Telemetry: Profile Views"
          value={metrics.profileViews.total}
          icon={Eye}
          change={`${metrics.profileViews.trend > 0 ? '+' : ''}${metrics.profileViews.trend}%`}
          changeType={metrics.profileViews.trend > 0 ? 'positive' : 'negative'}
          color="brand-blue"
          delay={0.1}
          trend={[30, 45, 35, 60, 50, 75, 45, 80, 95]}
        />
        <MetricCard 
          title="Active Intent: CTA Clicks"
          value={metrics.ctaClicks.total}
          icon={MousePointerClick}
          change={`${((metrics.ctaClicks.total / metrics.profileViews.total || 0) * 100).toFixed(1)}% Ratio`}
          changeType="neutral"
          color="brand-cyan"
          delay={0.2}
          trend={[10, 25, 15, 40, 30, 55, 25, 60, 85]}
        />
        <MetricCard 
          title="Institution Retention: Sessão"
          value={metrics.engagement ? formatTime(metrics.engagement.avgTimeOnPage) : '0:00'}
          icon={Clock}
          change={`${metrics.engagement?.pagesPerSession.toFixed(1) || '0.0'} P/S`}
          changeType="positive"
          color="brand-green"
          delay={0.3}
          trend={[40, 35, 45, 30, 50, 45, 60, 55, 70]}
        />
        <MetricCard 
          title="Traffic Friction: Rejeição"
          value={metrics.engagement ? `${metrics.engagement.bounceRate}%` : '0%'}
          icon={ArrowUpRight}
          change={metrics.engagement ? (metrics.engagement.bounceRate < 50 ? 'Optimum' : 'Warning') : 'Loading'}
          changeType={metrics.engagement?.bounceRate < 50 ? 'positive' : 'negative'}
          color="brand-yellow"
          delay={0.4}
          trend={[60, 55, 50, 45, 40, 45, 40, 35, 30]}
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
          <CTABreakdownChart data={{
            whatsapp_clicks: analyticsData?.whatsapp_clicks_30d || 0,
            email_clicks: analyticsData?.email_clicks_30d || 0,
            phone_clicks: analyticsData?.phone_clicks_30d || 0,
            website_clicks: analyticsData?.website_clicks_30d || 0,
          }} loading={loading} themeMode={themeMode || 'dark'} />
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
        <TopCampaignsCard companyId={companyId} themeMode={themeMode || 'dark'} limit={5} />
      </motion.div>
    </div>
  );
}
