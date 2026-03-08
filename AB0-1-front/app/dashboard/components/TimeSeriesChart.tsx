/**
 * TimeSeriesChart Component
 * 
 * Displays time-series analytics data (views, CTAs, leads) over time
 * Uses Recharts for visualization
 */

'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface TimeSeriesDataPoint {
  date: string;
  profile_views: number;
  cta_clicks: number;
  whatsapp_clicks: number;
  email_clicks: number;
  phone_clicks: number;
  website_clicks: number;
  leads: number;
}

interface TimeSeriesChartProps {
  data: TimeSeriesDataPoint[];
  loading?: boolean;
  themeMode?: 'light' | 'dark';
  title?: string;
  description?: string;
  chartType?: 'line' | 'area';
  showLines?: ('views' | 'cta_clicks' | 'leads' | 'whatsapp' | 'email' | 'phone' | 'website')[];
}

export default function TimeSeriesChart({
  data,
  loading = false,
  themeMode = 'light',
  title = 'Métricas ao Longo do Tempo',
  description = 'Acompanhe a evolução das suas métricas nos últimos dias',
  chartType = 'line',
  showLines = ['views', 'cta_clicks', 'leads'],
}: TimeSeriesChartProps) {
  const isDark = themeMode === 'dark';

  // Transform data for Recharts
  const chartData = useMemo(() => {
    return data.map((point) => ({
      date: new Date(point.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      'Visualizações': point.profile_views,
      'CTAs': point.cta_clicks,
      'Leads': point.leads,
      'WhatsApp': point.whatsapp_clicks,
      'Email': point.email_clicks,
      'Telefone': point.phone_clicks,
      'Website': point.website_clicks,
    }));
  }, [data]);

  // Line configurations
  const lineConfigs = {
    views: {
      dataKey: 'Visualizações',
      stroke: isDark ? '#60a5fa' : '#3b82f6', // blue
      fill: isDark ? '#60a5fa' : '#3b82f6',
    },
    cta_clicks: {
      dataKey: 'CTAs',
      stroke: isDark ? '#34d399' : '#10b981', // green
      fill: isDark ? '#34d399' : '#10b981',
    },
    leads: {
      dataKey: 'Leads',
      stroke: isDark ? '#f97316' : '#ea580c', // orange
      fill: isDark ? '#f97316' : '#ea580c',
    },
    whatsapp: {
      dataKey: 'WhatsApp',
      stroke: isDark ? '#22c55e' : '#16a34a', // whatsapp green
      fill: isDark ? '#22c55e' : '#16a34a',
    },
    email: {
      dataKey: 'Email',
      stroke: isDark ? '#8b5cf6' : '#7c3aed', // purple
      fill: isDark ? '#8b5cf6' : '#7c3aed',
    },
    phone: {
      dataKey: 'Telefone',
      stroke: isDark ? '#ec4899' : '#db2777', // pink
      fill: isDark ? '#ec4899' : '#db2777',
    },
    website: {
      dataKey: 'Website',
      stroke: isDark ? '#06b6d4' : '#0891b2', // cyan
      fill: isDark ? '#06b6d4' : '#0891b2',
    },
  };

  const activeLinesConfig = showLines.map((key) => lineConfigs[key]).filter(Boolean);

  if (loading) {
    return (
      <Card className={isDark ? 'bg-slate-900 border-slate-800' : 'bg-white'}>
        <CardHeader>
          <Skeleton className="h-6 w-[200px]" />
          <Skeleton className="h-4 w-[300px] mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className={isDark ? 'bg-slate-900 border-slate-800' : 'bg-white'}>
        <CardHeader>
          <CardTitle className={isDark ? 'text-white' : 'text-foreground'}>{title}</CardTitle>
          <CardDescription className={isDark ? 'text-slate-400' : ''}>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-muted-foreground'}`}>
            Sem dados disponíveis para o período selecionado
          </p>
        </CardContent>
      </Card>
    );
  }

  const commonProps = {
    width: 500,
    height: 300,
    data: chartData,
    margin: { top: 5, right: 30, left: 20, bottom: 5 },
  };

  const Chart = chartType === 'area' ? AreaChart : LineChart;
  const DataComponent = chartType === 'area' ? Area : Line;

  return (
    <Card className={isDark ? 'bg-slate-900 border-slate-800' : 'bg-white'}>
      <CardHeader>
        <CardTitle className={isDark ? 'text-white' : 'text-foreground'}>{title}</CardTitle>
        <CardDescription className={isDark ? 'text-slate-400' : ''}>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <Chart {...commonProps}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDark ? '#334155' : '#e2e8f0'}
              opacity={0.5}
            />
            <XAxis
              dataKey="date"
              stroke={isDark ? '#94a3b8' : '#64748b'}
              style={{ fontSize: '12px' }}
            />
            <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#1e293b' : '#ffffff',
                border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                borderRadius: '8px',
                color: isDark ? '#f1f5f9' : '#0f172a',
              }}
              labelStyle={{ color: isDark ? '#cbd5e1' : '#475569', fontWeight: 600 }}
            />
            <Legend
              wrapperStyle={{
                paddingTop: '20px',
                fontSize: '14px',
                color: isDark ? '#cbd5e1' : '#475569',
              }}
            />
            {activeLinesConfig.map((config, index) => (
              <DataComponent
                key={index}
                type="monotone"
                dataKey={config.dataKey}
                stroke={config.stroke}
                fill={chartType === 'area' ? config.fill : undefined}
                fillOpacity={chartType === 'area' ? 0.2 : undefined}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </Chart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
