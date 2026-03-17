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
  // Lock to dark theme for consistency with Silicon foundation
  const isDark = true;

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
      stroke: '#0056D2', // brand-blue
      fill: '#0056D2',
    },
    cta_clicks: {
      dataKey: 'CTAs',
      stroke: '#00AFEF', // brand-cyan
      fill: '#00AFEF',
    },
    leads: {
      dataKey: 'Leads',
      stroke: '#34C759', // brand-green
      fill: '#34C759',
    },
    whatsapp: {
      dataKey: 'WhatsApp',
      stroke: '#28A745', // dark green
      fill: '#28A745',
    },
    email: {
      dataKey: 'Email',
      stroke: '#6C5CE7', // brand-purple
      fill: '#6C5CE7',
    },
    phone: {
      dataKey: 'Telefone',
      stroke: '#FCEE21', // brand-yellow
      fill: '#FCEE21',
    },
    website: {
      dataKey: 'Website',
      stroke: '#6D6E71', // brand-gray
      fill: '#6D6E71',
    },
  };

  const activeLinesConfig = showLines.map((key) => lineConfigs[key]).filter(Boolean);

  if (loading) {
    return (
      <Card className="bg-[#002B4D] border-white/10 shadow-none">
        <CardHeader className="p-4">
          <Skeleton className="h-6 w-[200px] bg-white/5" />
          <Skeleton className="h-4 w-[300px] mt-2 bg-white/5" />
        </CardHeader>
        <CardContent className="p-4">
          <Skeleton className="h-[300px] w-full bg-white/5 rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="bg-[#002B4D] border-white/10 shadow-none">
        <CardHeader className="p-4">
          <CardTitle className="text-white text-lg font-bold tracking-tight">{title}</CardTitle>
          <CardDescription className="text-white/40">{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px] p-4">
          <p className="text-sm text-white/30 font-medium">
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
    <Card className="bg-[#002B4D] border-white/10 shadow-none">
      <CardHeader className="p-4 border-b border-white/5">
        <CardTitle className="text-white text-lg font-bold tracking-tight">{title}</CardTitle>
        <CardDescription className="text-white/40 text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <ResponsiveContainer width="100%" height={300}>
          <Chart {...commonProps}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#ffffff"
              opacity={0.05}
              vertical={false}
            />
            <XAxis
              dataKey="date"
              stroke="#ffffff"
              opacity={0.3}
              style={{ fontSize: '10px', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis 
              stroke="#ffffff" 
              opacity={0.3} 
              style={{ fontSize: '10px', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#002B4D',
                border: '0.5px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                boxShadow: 'none',
                padding: '12px',
              }}
              itemStyle={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}
              labelStyle={{ color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', fontSize: '10px', marginBottom: '8px', fontFamily: 'var(--font-mono)' }}
              cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
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
                color: 'rgba(255,255,255,0.5)',
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
                activeDot={{ r: 4, stroke: '#ffffff', strokeWidth: 2 }}
              />
            ))}
          </Chart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
