'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  TrendingUp, TrendingDown, Calendar, Filter, Download, Eye, MousePointer,
  Users, Target, Activity, Zap, AlertCircle, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { analyticsApi, type CompanyAnalytics } from '@/lib/api-analytics';

interface AdvancedAnalyticsIntegratedProps {
  themeMode: 'light' | 'dark';
  companyId: number;
}

export default function AdvancedAnalyticsIntegrated({ themeMode, companyId }: AdvancedAnalyticsIntegratedProps) {
  const [timeRange, setTimeRange] = useState('30');
  const [selectedMetric, setSelectedMetric] = useState<'views' | 'clicks' | 'leads' | 'conversion'>('views');
  const [stats, setStats] = useState<CompanyAnalytics | null>(null);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [trafficSources, setTrafficSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isDark = themeMode === 'dark';

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all analytics data in parallel
      const [statsData, historicalResponse, trafficResponse] = await Promise.all([
        analyticsApi.getStats(companyId),
        analyticsApi.getHistoricalData(companyId, parseInt(timeRange)),
        analyticsApi.getTrafficSources(companyId, parseInt(timeRange))
      ]);

      setStats(statsData);
      setHistoricalData(historicalResponse.map(item => ({
        date: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        fullDate: item.date,
        views: item.views,
        clicks: item.clicks,
        leads: item.leads,
        conversion: item.conversion
      })));
      setTrafficSources(trafficResponse);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Erro ao carregar dados de analytics');
    } finally {
      setLoading(false);
    }
  }, [companyId, timeRange]);

  // Fetch data from API
  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // Calculate trends
  const calculateTrend = (current: number, previous: number): { value: number; isPositive: boolean } => {
    if (previous === 0) return { value: 0, isPositive: true };
    const trend = ((current - previous) / previous) * 100;
    return { value: Math.abs(trend), isPositive: trend >= 0 };
  };

  // Loading State
  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
          <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
            Carregando analytics...
          </p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-4">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
            {error}
          </p>
          <Button onClick={fetchAnalyticsData} size="sm">
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  // Metrics for the cards
  const metrics = [
    {
      title: 'Visualizações',
      value: stats?.profile_views || 0,
      change: 12.5,
      icon: <Eye className="h-5 w-5" />,
      color: 'blue'
    },
    {
      title: 'Cliques',
      value: stats?.cta_clicks || 0,
      change: 8.3,
      icon: <MousePointer className="h-5 w-5" />,
      color: 'purple'
    },
    {
      title: 'Leads',
      value: stats?.leads_received || 0,
      change: 15.7,
      icon: <Users className="h-5 w-5" />,
      color: 'green'
    },
    {
      title: 'Conversão',
      value: `${stats?.conversion_rate.toFixed(1)}%`,
      change: -2.4,
      icon: <Target className="h-5 w-5" />,
      color: 'orange'
    }
  ];

  const colorMap: Record<string, string> = {
    blue: '#3b82f6',
    purple: '#8b5cf6',
    green: '#10b981',
    orange: '#f59e0b'
  };

  // Chart colors based on theme
  const chartColors = {
    primary: isDark ? '#60a5fa' : '#3b82f6',
    secondary: isDark ? '#a78bfa' : '#8b5cf6',
    success: isDark ? '#34d399' : '#10b981',
    warning: isDark ? '#fbbf24' : '#f59e0b',
    grid: isDark ? '#374151' : '#e5e7eb',
    text: isDark ? '#9ca3af' : '#6b7280'
  };

  const conversionFunnelData = [
    { name: 'Visualizações', value: stats?.profile_views || 0, percentage: 100, color: chartColors.primary },
    { name: 'Engajamento', value: Math.floor((stats?.cta_clicks || 0) * 1.5), percentage: 56, color: chartColors.secondary },
    { name: 'CTAs', value: stats?.cta_clicks || 0, percentage: 13, color: chartColors.success },
    { name: 'Leads', value: stats?.leads_received || 0, percentage: 2.3, color: chartColors.warning }
  ];

  const topPagesData = [
    { page: 'Página Principal', visits: stats?.profile_views || 0, avgTime: '3:24', bounceRate: '32%' },
    { page: 'Produtos', visits: Math.floor((stats?.profile_views || 0) * 0.6), avgTime: '4:12', bounceRate: '28%' },
    { page: 'Sobre', visits: Math.floor((stats?.profile_views || 0) * 0.4), avgTime: '2:18', bounceRate: '45%' },
    { page: 'Contato', visits: Math.floor((stats?.profile_views || 0) * 0.3), avgTime: '1:42', bounceRate: '38%' }
  ];

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className={cn("text-2xl font-bold", isDark ? "text-white" : "text-gray-900")}>
            Analytics Avançado
          </h2>
          <p className={cn("text-sm mt-1", isDark ? "text-gray-400" : "text-gray-600")}>
            Análise detalhada de performance e comportamento
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={fetchAnalyticsData}>
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Atualizar
          </Button>

          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={cn("border", isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200")}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className={cn("text-sm font-medium", isDark ? "text-gray-400" : "text-gray-600")}>
                      {metric.title}
                    </p>
                    <p className={cn("text-2xl font-bold mt-2", isDark ? "text-white" : "text-gray-900")}>
                      {typeof metric.value === 'number' ? metric.value.toLocaleString('pt-BR') : metric.value}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      {metric.change >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                      <span className={cn(
                        "text-sm font-medium",
                        metric.change >= 0 ? "text-green-500" : "text-red-500"
                      )}>
                        {Math.abs(metric.change)}%
                      </span>
                      <span className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                        vs período anterior
                      </span>
                    </div>
                  </div>
                  <div className={cn(
                    "p-3 rounded-lg",
                    isDark ? "bg-gray-700" : "bg-gray-100"
                  )} style={{ color: colorMap[metric.color] }}>
                    {metric.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart - Takes 2 columns */}
        <Card className={cn("lg:col-span-2 border", isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200")}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className={isDark ? "text-white" : "text-gray-900"}>
                Tendência Histórica
              </CardTitle>
              <Select value={selectedMetric} onValueChange={(v: any) => setSelectedMetric(v)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="views">Visualizações</SelectItem>
                  <SelectItem value="clicks">Cliques</SelectItem>
                  <SelectItem value="leads">Leads</SelectItem>
                  <SelectItem value="conversion">Conversão</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={historicalData}>
                <defs>
                  <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis 
                  dataKey="date" 
                  stroke={chartColors.text}
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke={chartColors.text}
                  style={{ fontSize: '12px' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#1f2937' : '#ffffff',
                    border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    color: isDark ? '#fff' : '#000'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey={selectedMetric} 
                  stroke={chartColors.primary}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorMetric)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Traffic Sources */}
        <Card className={cn("border", isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200")}>
          <CardHeader>
            <CardTitle className={isDark ? "text-white" : "text-gray-900"}>
              Fontes de Tráfego
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={trafficSources.map(source => ({ name: source.source, value: source.visits }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {trafficSources.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={Object.values(chartColors)[index % 4]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#1f2937' : '#ffffff',
                    border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {trafficSources.map((source, index) => (
                <div key={source.source} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: Object.values(chartColors)[index % 4] }}
                    />
                    <span className={isDark ? "text-gray-300" : "text-gray-700"}>
                      {source.source}
                    </span>
                  </div>
                  <span className={cn("font-medium", isDark ? "text-white" : "text-gray-900")}>
                    {source.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel & Top Pages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <Card className={cn("border", isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200")}>
          <CardHeader>
            <CardTitle className={isDark ? "text-white" : "text-gray-900"}>
              Funil de Conversão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {conversionFunnelData.map((stage, index) => (
                <div key={stage.name}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn("text-sm font-medium", isDark ? "text-gray-300" : "text-gray-700")}>
                      {stage.name}
                    </span>
                    <span className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
                      {stage.value.toLocaleString('pt-BR')} ({stage.percentage}%)
                    </span>
                  </div>
                  <div className={cn("h-3 rounded-full overflow-hidden", isDark ? "bg-gray-700" : "bg-gray-200")}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${stage.percentage}%` }}
                      transition={{ duration: 1, delay: index * 0.2 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className={cn(
              "mt-6 p-4 rounded-lg",
              isDark ? "bg-blue-500/10 border border-blue-500/20" : "bg-blue-50 border border-blue-200"
            )}>
              <div className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <p className={cn("text-sm font-medium", isDark ? "text-blue-300" : "text-blue-900")}>
                    Insight: Taxa de conversão está {stats && stats.conversion_rate > 5 ? 'acima' : 'abaixo'} da média
                  </p>
                  <p className={cn("text-xs mt-1", isDark ? "text-blue-400" : "text-blue-700")}>
                    Considere otimizar as CTAs para melhorar a conversão de leads
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Pages */}
        <Card className={cn("border", isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200")}>
          <CardHeader>
            <CardTitle className={isDark ? "text-white" : "text-gray-900"}>
              Páginas Mais Visitadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPagesData.map((page, index) => (
                <div 
                  key={page.page}
                  className={cn(
                    "p-4 rounded-lg border",
                    isDark ? "bg-gray-700/50 border-gray-600" : "bg-gray-50 border-gray-200"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn("font-medium", isDark ? "text-white" : "text-gray-900")}>
                      {page.page}
                    </span>
                    <span className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
                      {page.visits.toLocaleString('pt-BR')} visitas
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className={isDark ? "text-gray-400" : "text-gray-600"}>Tempo Médio:</span>
                      <span className={cn("ml-2 font-medium", isDark ? "text-gray-200" : "text-gray-800")}>
                        {page.avgTime}
                      </span>
                    </div>
                    <div>
                      <span className={isDark ? "text-gray-400" : "text-gray-600"}>Taxa de Rejeição:</span>
                      <span className={cn("ml-2 font-medium", isDark ? "text-gray-200" : "text-gray-800")}>
                        {page.bounceRate}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
