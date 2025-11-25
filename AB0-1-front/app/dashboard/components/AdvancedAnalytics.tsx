'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  Download,
  Eye,
  MousePointer,
  Users,
  Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AdvancedAnalyticsProps {
  themeMode: 'light' | 'dark';
  companyId: string;
}

import { analyticsApi } from '@/lib/api-analytics';

const colorPalette = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#22c55e'];

export default function AdvancedAnalytics({ themeMode, companyId }: AdvancedAnalyticsProps) {
  const [timeRange, setTimeRange] = useState('30');
  const [selectedMetric, setSelectedMetric] = useState<'views' | 'clicks' | 'leads' | 'conversion'>('views');
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [trafficSourceData, setTrafficSourceData] = useState<any[]>([]);
  const [conversionFunnelData, setConversionFunnelData] = useState<any[]>([]);
  const [topPages, setTopPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const isDark = themeMode === 'dark';
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const days = parseInt(timeRange);
        const hist = await analyticsApi.getHistoricalData(Number(companyId), days);
        setHistoricalData((hist || []).map(d => ({
          date: new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
          views: d.views ?? 0,
          clicks: d.clicks ?? 0,
          leads: d.leads ?? 0,
          conversion: d.conversion ?? 0,
        })));
        const stats = await analyticsApi.getStats();
        const views = stats.profile_views ?? 0;
        const engagement = (stats.cta_clicks ?? 0) + (stats.whatsapp_clicks ?? 0);
        const ctas = stats.cta_clicks ?? 0;
        const leads = stats.leads_received ?? 0;
        setConversionFunnelData([
          { name: 'Visualizações', value: views, percentage: views ? 100 : 0, color: colorPalette[0] },
          { name: 'Engajamento', value: engagement, percentage: views ? Math.round((engagement / views) * 100) : 0, color: colorPalette[1] },
          { name: 'CTAs', value: ctas, percentage: views ? Math.round((ctas / views) * 100) : 0, color: colorPalette[2] },
          { name: 'Leads', value: leads, percentage: views ? Number(((leads / views) * 100).toFixed(1)) : 0, color: colorPalette[3] }
        ]);
        const sources = await analyticsApi.getTrafficSources(Number(companyId), days);
        setTrafficSourceData((sources || []).map((s, idx) => ({
          name: s.source,
          value: s.visits,
          percentage: s.percentage,
          color: colorPalette[idx % colorPalette.length]
        })));
        
        // Mock top pages data - replace with actual API call when available
        setTopPages([
          { page: '/empresa/painel', views: 1250, avgTime: '2m 45s', bounceRate: '23%' },
          { page: '/empresa/analytics', views: 890, avgTime: '3m 12s', bounceRate: '18%' },
          { page: '/empresa/configuracoes', views: 567, avgTime: '1m 58s', bounceRate: '31%' },
          { page: '/empresa/perfil', views: 445, avgTime: '2m 23s', bounceRate: '27%' },
          { page: '/empresa/metricas', views: 234, avgTime: '1m 45s', bounceRate: '35%' }
        ]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [companyId, timeRange]);
  
  // Calcular tendências
  const calculateTrend = (data: any[], key: string) => {
    if (data.length < 2) return { value: 0, isPositive: true };
    const recent = data.slice(-7).reduce((acc, d) => acc + d[key], 0) / 7;
    const previous = data.slice(-14, -7).reduce((acc, d) => acc + d[key], 0) / 7;
    const change = ((recent - previous) / previous) * 100;
    return { value: Math.abs(change).toFixed(1), isPositive: change >= 0 };
  };

  const viewsTrend = calculateTrend(historicalData, 'views');
  const clicksTrend = calculateTrend(historicalData, 'clicks');
  const leadsTrend = calculateTrend(historicalData, 'leads');

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={cn(
          'px-3 py-2 rounded-lg shadow-lg border',
          isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'
        )}>
          <p className={cn('text-xs font-medium mb-1', isDark ? 'text-slate-200' : 'text-gray-900')}>
            {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const metricConfig = {
    views: { label: 'Visualizações', color: '#3b82f6', icon: Eye },
    clicks: { label: 'Cliques', color: '#8b5cf6', icon: MousePointer },
    leads: { label: 'Leads', color: '#10b981', icon: Target },
    conversion: { label: 'Conversão %', color: '#f59e0b', icon: TrendingUp }
  };

  const currentConfig = metricConfig[selectedMetric];

  return (
    <div className="space-y-4">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className={cn(
            'text-lg font-semibold tracking-tight',
            isDark ? 'text-white' : 'text-gray-900'
          )}>
            Analytics Histórico
          </h3>
          <p className={cn(
            'text-xs mt-0.5',
            isDark ? 'text-slate-400' : 'text-gray-600'
          )}>
            Análise detalhada de performance e tendências
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className={cn(
              'w-[130px] h-8 text-xs',
              isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
            )}>
              <Calendar className="h-3 w-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            className={cn(
              'h-8 text-xs gap-1.5',
              isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-gray-200 hover:bg-gray-50'
            )}
          >
            <Download className="h-3 w-3" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Main Chart */}
      <Card className={cn(
        'border',
        isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-200'
      )}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                'p-2 rounded-lg',
                isDark ? 'bg-blue-500/10' : 'bg-blue-50'
              )}>
                <currentConfig.icon className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <CardTitle className={cn(
                  'text-sm font-medium',
                  isDark ? 'text-slate-200' : 'text-gray-900'
                )}>
                  {currentConfig.label} - Tendência
                </CardTitle>
                <p className={cn(
                  'text-xs mt-0.5',
                  isDark ? 'text-slate-400' : 'text-gray-600'
                )}>
                  Evolução ao longo do tempo
                </p>
              </div>
            </div>

            {/* Metric Selector */}
            <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-1">
              {Object.entries(metricConfig).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setSelectedMetric(key as any)}
                  className={cn(
                    'px-2 py-1 rounded text-xs font-medium transition-all',
                    selectedMetric === key
                      ? isDark
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'bg-white text-gray-900 shadow-sm'
                      : isDark
                        ? 'text-slate-400 hover:text-slate-300'
                        : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  {config.label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={historicalData}>
              <defs>
                <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={currentConfig.color} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={currentConfig.color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={isDark ? '#334155' : '#e5e7eb'}
                vertical={false}
              />
              <XAxis 
                dataKey="date" 
                stroke={isDark ? '#64748b' : '#9ca3af'}
                tick={{ fontSize: 11 }}
                tickLine={false}
              />
              <YAxis 
                stroke={isDark ? '#64748b' : '#9ca3af'}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey={selectedMetric}
                stroke={currentConfig.color}
                strokeWidth={2}
                fill="url(#colorMetric)"
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Secondary Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Conversion Funnel */}
        <Card className={cn(
          'border',
          isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-200'
        )}>
          <CardHeader className="pb-2">
            <CardTitle className={cn(
              'text-sm font-medium',
              isDark ? 'text-slate-200' : 'text-gray-900'
            )}>
              Funil de Conversão
            </CardTitle>
            <p className={cn(
              'text-xs',
              isDark ? 'text-slate-400' : 'text-gray-600'
            )}>
              Jornada do visitante ao lead
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {conversionFunnelData.map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className={isDark ? 'text-slate-300' : 'text-gray-700'}>
                      {item.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>
                        {item.value.toLocaleString('pt-BR')}
                      </span>
                      <span className="font-medium" style={{ color: item.color }}>
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden bg-muted/20">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.percentage}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Conversion Rate Insight */}
            <div className={cn(
              'mt-4 p-3 rounded-lg',
              isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200'
            )}>
              <div className="flex items-start gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500 mt-0.5" />
                <div>
                  <p className={cn(
                    'text-xs font-medium',
                    isDark ? 'text-emerald-400' : 'text-emerald-700'
                  )}>
                    Taxa de Conversão: 2.3%
                  </p>
                  <p className={cn(
                    'text-xs mt-1',
                    isDark ? 'text-emerald-500/70' : 'text-emerald-600'
                  )}>
                    45% acima da média da categoria (1.6%)
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Traffic Sources */}
        <Card className={cn(
          'border',
          isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-200'
        )}>
          <CardHeader className="pb-2">
            <CardTitle className={cn(
              'text-sm font-medium',
              isDark ? 'text-slate-200' : 'text-gray-900'
            )}>
              Fontes de Tráfego
            </CardTitle>
            <p className={cn(
              'text-xs',
              isDark ? 'text-slate-400' : 'text-gray-600'
            )}>
              De onde vêm seus visitantes
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <ResponsiveContainer width={140} height={140}>
                  <PieChart>
                    <Pie
                      data={trafficSourceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={2}
                      dataKey="value"
                    >
                  {trafficSourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex-1 space-y-2">
                {trafficSourceData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className={isDark ? 'text-slate-300' : 'text-gray-700'}>
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>
                        {item.value.toLocaleString('pt-BR')}
                      </span>
                      <span className="font-medium w-10 text-right" style={{ color: item.color }}>
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Traffic Insight */}
            <div className={cn(
              'mt-4 p-3 rounded-lg',
              isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-200'
            )}>
              <div className="flex items-start gap-2">
                <Users className="h-4 w-4 text-blue-500 mt-0.5" />
                <div>
                  <p className={cn(
                    'text-xs font-medium',
                    isDark ? 'text-blue-400' : 'text-blue-700'
                  )}>
                    Orgânico crescendo 28%
                  </p>
                  <p className={cn(
                    'text-xs mt-1',
                    isDark ? 'text-blue-500/70' : 'text-blue-600'
                  )}>
                    Seu SEO está funcionando muito bem!
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Pages Table */}
      <Card className={cn(
        'border',
        isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-200'
      )}>
        <CardHeader className="pb-2">
          <CardTitle className={cn(
            'text-sm font-medium',
            isDark ? 'text-slate-200' : 'text-gray-900'
          )}>
            Páginas Mais Visitadas
          </CardTitle>
          <p className={cn(
            'text-xs',
            isDark ? 'text-slate-400' : 'text-gray-600'
          )}>
            Performance por página
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={cn(
                  'border-b text-xs',
                  isDark ? 'border-slate-800' : 'border-gray-200'
                )}>
                  <th className={cn(
                    'text-left py-2 font-medium',
                    isDark ? 'text-slate-400' : 'text-gray-600'
                  )}>
                    Página
                  </th>
                  <th className={cn(
                    'text-right py-2 font-medium',
                    isDark ? 'text-slate-400' : 'text-gray-600'
                  )}>
                    Visualizações
                  </th>
                  <th className={cn(
                    'text-right py-2 font-medium',
                    isDark ? 'text-slate-400' : 'text-gray-600'
                  )}>
                    Tempo Médio
                  </th>
                  <th className={cn(
                    'text-right py-2 font-medium',
                    isDark ? 'text-slate-400' : 'text-gray-600'
                  )}>
                    Taxa Rejeição
                  </th>
                </tr>
              </thead>
              <tbody>
                {topPages.map((page, index) => (
                  <motion.tr
                    key={page.page}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      'border-b text-xs',
                      isDark ? 'border-slate-800/50' : 'border-gray-100'
                    )}
                  >
                    <td className={cn(
                      'py-3 font-medium',
                      isDark ? 'text-slate-300' : 'text-gray-900'
                    )}>
                      {page.page}
                    </td>
                    <td className={cn(
                      'text-right',
                      isDark ? 'text-slate-400' : 'text-gray-600'
                    )}>
                      {page.views.toLocaleString('pt-BR')}
                    </td>
                    <td className={cn(
                      'text-right',
                      isDark ? 'text-slate-400' : 'text-gray-600'
                    )}>
                      {page.avgTime}
                    </td>
                    <td className="text-right">
                      <span className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium',
                        page.bounceRate < 25
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : page.bounceRate < 35
                          ? 'bg-yellow-500/10 text-yellow-600'
                          : 'bg-red-500/10 text-red-600'
                      )}>
                        {page.bounceRate}%
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
