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
  quote_clicks: number;
  leads: number;
}

interface TimeSeriesChartProps {
  data: TimeSeriesDataPoint[];
  loading?: boolean;
  dataStatus?: 'ready' | 'empty' | 'processing' | 'unavailable' | 'locked' | 'stale' | 'error';
  themeMode?: 'light' | 'dark';
  title?: string;
  description?: string;
  chartType?: 'line' | 'area';
  showLines?: ('views' | 'cta_clicks' | 'leads' | 'whatsapp' | 'email' | 'phone' | 'website' | 'quote')[];
}

export default function TimeSeriesChart({
  data,
  loading = false,
  dataStatus = 'ready',
  title = 'Métricas ao Longo do Tempo',
  description = 'Acompanhe a evolução das suas métricas nos últimos dias',
  chartType = 'line',
  showLines = ['views', 'cta_clicks', 'leads'],
}: TimeSeriesChartProps) {
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
      'Orcamento': point.quote_clicks,
    }));
  }, [data]);

  // Line configurations using Precision Energy tokens
  const lineConfigs = {
    views: {
      dataKey: 'Visualizações',
      stroke: 'hsl(var(--dashboard-chart-1))', // brand-blue oficial
      fill: 'hsl(var(--dashboard-chart-1))',
    },
    cta_clicks: {
      dataKey: 'CTAs',
      stroke: 'hsl(var(--dashboard-chart-2))', // brand-cyan
      fill: 'hsl(var(--dashboard-chart-2))',
    },
    leads: {
      dataKey: 'Leads',
      stroke: 'hsl(var(--dashboard-chart-1))', // brand-green suporte
      fill: 'hsl(var(--dashboard-chart-1))',
    },
    whatsapp: {
      dataKey: 'WhatsApp',
      stroke: 'hsl(var(--dashboard-chart-2))', // dark green suporte
      fill: 'hsl(var(--dashboard-chart-2))',
    },
    email: {
      dataKey: 'Email',
      stroke: 'hsl(var(--dashboard-chart-1))', // brand-purple
      fill: 'hsl(var(--dashboard-chart-1))',
    },
    phone: {
      dataKey: 'Telefone',
      stroke: 'hsl(var(--dashboard-chart-2))', // brand-yellow
      fill: 'hsl(var(--dashboard-chart-2))',
    },
    website: {
      dataKey: 'Website',
      stroke: 'hsl(var(--dashboard-chart-1))', // brand-muted
      fill: 'hsl(var(--dashboard-chart-1))',
    },
    quote: {
      dataKey: 'Orcamento',
      stroke: 'hsl(var(--dashboard-chart-2))',
      fill: 'hsl(var(--dashboard-chart-2))',
    },
  };

  const activeLinesConfig = showLines.map((key) => lineConfigs[key]).filter(Boolean);

  if (dataStatus === 'error' || dataStatus === 'unavailable' || dataStatus === 'locked') {
    return (
      <Card className="bg-[hsl(var(--dashboard-panel))] border-[hsl(var(--dashboard-border))] shadow-none">
        <CardContent className="flex h-[310px] items-center justify-center p-4 text-sm text-[hsl(var(--dashboard-muted))]">
          Série temporal indisponível ou bloqueada para este plano.
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className={cn("shadow-none", 'bg-[hsl(var(--dashboard-panel))] border-[hsl(var(--dashboard-border))]')}>
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
      <Card className={cn("shadow-none", 'bg-[hsl(var(--dashboard-panel))] border-[hsl(var(--dashboard-border))]')}>
        <CardHeader className="p-4">
          <CardTitle className={cn("text-lg font-bold tracking-tight", 'text-[hsl(var(--dashboard-ink))]')}>{title}</CardTitle>
          <CardDescription className={'text-[hsl(var(--dashboard-muted))]'}>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px] p-4">
          <p className={cn("text-sm font-medium", 'text-[hsl(var(--dashboard-muted))]')}>
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

  return (
    <Card className={cn("shadow-none", 'bg-[hsl(var(--dashboard-panel))] border-[hsl(var(--dashboard-border))]')}>
      <CardHeader className={cn("p-4 border-b", 'border-[hsl(var(--dashboard-border))]')}>
        <CardTitle className={cn("text-lg font-bold tracking-tight", 'text-[hsl(var(--dashboard-ink))]')}>{title}</CardTitle>
        <CardDescription className={cn("text-xs", 'text-[hsl(var(--dashboard-muted))]')}>{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <ResponsiveContainer width="100%" height={300}>
          {chartType === 'area' ? (
            <AreaChart {...commonProps}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--dashboard-chart-grid))"
                opacity={0.08}
                vertical={false}
              />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--dashboard-muted))"
                opacity={0.4}
                style={{ fontSize: '10px', fontWeight: 'bold' }}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis
                stroke="hsl(var(--dashboard-muted))"
                opacity={0.4}
                style={{ fontSize: '10px', fontWeight: 'bold' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--dashboard-panel))',
                  border: '1px solid hsl(var(--dashboard-border))',
                  borderRadius: '10px',
                  boxShadow: 'none',
                  padding: '12px',
                }}
                itemStyle={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}
                labelStyle={{ color: 'hsl(var(--dashboard-muted))', fontWeight: 'bold', fontSize: '10px', marginBottom: '8px' }}
                cursor={{ stroke: 'hsl(var(--dashboard-chart-grid))', strokeWidth: 1 }}
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
                  color: 'hsl(var(--dashboard-muted))',
                }}
              />
              {activeLinesConfig.map((config, index) => (
                <Area
                  key={index}
                  type="monotone"
                  dataKey={config.dataKey}
                  stroke={config.stroke}
                  fill={config.fill}
                  fillOpacity={0.1}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4, stroke: 'hsl(var(--dashboard-ink))', strokeWidth: 2 }}
                />
              ))}
            </AreaChart>
          ) : (
            <LineChart {...commonProps}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--dashboard-chart-grid))"
                opacity={0.08}
                vertical={false}
              />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--dashboard-muted))"
                opacity={0.4}
                style={{ fontSize: '10px', fontWeight: 'bold' }}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis
                stroke="hsl(var(--dashboard-muted))"
                opacity={0.4}
                style={{ fontSize: '10px', fontWeight: 'bold' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--dashboard-panel))',
                  border: '1px solid hsl(var(--dashboard-border))',
                  borderRadius: '10px',
                  boxShadow: 'none',
                  padding: '12px',
                }}
                itemStyle={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}
                labelStyle={{ color: 'hsl(var(--dashboard-muted))', fontWeight: 'bold', fontSize: '10px', marginBottom: '8px' }}
                cursor={{ stroke: 'hsl(var(--dashboard-chart-grid))', strokeWidth: 1 }}
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
                  color: 'hsl(var(--dashboard-muted))',
                }}
              />
              {activeLinesConfig.map((config, index) => (
                <Line
                  key={index}
                  type="monotone"
                  dataKey={config.dataKey}
                  stroke={config.stroke}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4, stroke: 'hsl(var(--dashboard-ink))', strokeWidth: 2 }}
                />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
