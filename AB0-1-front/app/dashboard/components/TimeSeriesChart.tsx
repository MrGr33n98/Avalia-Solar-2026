/**
 * TimeSeriesChart Component
 * 
 * Displays time-series analytics data (views, CTAs, leads) over time
 * Aligned with Precision Energy System:
 * - Silicon Dark Palette (#002B4D)
 * - Borders-only depth (0.5px)
 * - Brand color tokens for visualization
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
import { cn } from '@/lib/utils';

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
  themeMode = 'dark',
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

  // Line configurations using Precision Energy tokens
  const lineConfigs = {
    views: {
      dataKey: 'Visualizações',
      stroke: '#2563EB', // brand-blue oficial
      fill: '#2563EB',
    },
    cta_clicks: {
      dataKey: 'CTAs',
      stroke: '#00AFEF', // brand-cyan
      fill: '#00AFEF',
    },
    leads: {
      dataKey: 'Leads',
      stroke: '#10B981', // brand-green suporte
      fill: '#10B981',
    },
    whatsapp: {
      dataKey: 'WhatsApp',
      stroke: '#047857', // dark green suporte
      fill: '#047857',
    },
    email: {
      dataKey: 'Email',
      stroke: '#6C5CE7', // brand-purple
      fill: '#6C5CE7',
    },
    phone: {
      dataKey: 'Telefone',
      stroke: '#F59E0B', // brand-yellow
      fill: '#F59E0B',
    },
    website: {
      dataKey: 'Website',
      stroke: '#64748B', // brand-muted
      fill: '#64748B',
    },
  };

  const activeLinesConfig = showLines.map((key) => lineConfigs[key]).filter(Boolean);

  if (loading) {
    return (
      <Card className={cn("shadow-none", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-[#CBD5E1]")}>
        <CardHeader className="p-4">
          <Skeleton className="h-6 w-[200px]" />
          <Skeleton className="h-4 w-[300px] mt-2" />
        </CardHeader>
        <CardContent className="p-4">
          <Skeleton className="h-[300px] w-full rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className={cn("shadow-none", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-[#CBD5E1]")}>
        <CardHeader className="p-4">
          <CardTitle className={cn("text-lg font-bold tracking-tight", isDark ? "text-white" : "text-slate-850")}>{title}</CardTitle>
          <CardDescription className={isDark ? "text-white/40" : "text-slate-500"}>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px] p-4">
          <p className={cn("text-sm font-medium", isDark ? "text-white/30" : "text-slate-400")}>
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
    margin: { top: 5, right: 10, left: 0, bottom: 5 },
  };

  const Chart = chartType === 'area' ? AreaChart : LineChart;
  const DataComponent: any = chartType === 'area' ? Area : Line;

  return (
    <Card className={cn("shadow-none", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-[#CBD5E1]")}>
      <CardHeader className={cn("p-4 border-b", isDark ? "border-slate-800" : "border-slate-100")}>
        <CardTitle className={cn("text-lg font-bold tracking-tight", isDark ? "text-white" : "text-slate-800")}>{title}</CardTitle>
        <CardDescription className={cn("text-xs", isDark ? "text-white/40" : "text-slate-500")}>{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <ResponsiveContainer width="100%" height={300}>
          <Chart {...commonProps}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDark ? "#ffffff" : "#64748B"}
              opacity={0.08}
              vertical={false}
            />
            <XAxis
              dataKey="date"
              stroke={isDark ? "#ffffff" : "#64748B"}
              opacity={0.4}
              style={{ fontSize: '10px', fontWeight: 'bold' }}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis 
              stroke={isDark ? "#ffffff" : "#64748B"} 
              opacity={0.4} 
              style={{ fontSize: '10px', fontWeight: 'bold' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#0F172A' : '#ffffff',
                border: isDark ? '0.5px solid rgba(255,255,255,0.1)' : '1px solid #CBD5E1',
                borderRadius: '10px',
                boxShadow: 'none',
                padding: '12px',
              }}
              itemStyle={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}
              labelStyle={{ color: isDark ? 'rgba(255,255,255,0.4)' : '#64748B', fontWeight: 'bold', fontSize: '10px', marginBottom: '8px' }}
              cursor={{ stroke: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.06)', strokeWidth: 1 }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{
                paddingBottom: '20px',
                fontSize: '10px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: isDark ? 'rgba(255,255,255,0.5)' : '#64748B',
              }}
            />
            {activeLinesConfig.map((config, index) => (
              <DataComponent
                key={index}
                type="monotone"
                dataKey={config.dataKey}
                stroke={config.stroke}
                fill={chartType === 'area' ? config.fill : undefined}
                fillOpacity={chartType === 'area' ? 0.1 : undefined}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, stroke: isDark ? '#ffffff' : '#2563EB', strokeWidth: 2 }}
              />
            ))}
          </Chart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

