/**
 * CTABreakdownChart Component
 * 
 * Horizontal bar chart showing breakdown of CTA clicks by type
 * Aligned with Precision Energy System:
 * - Silicon Dark Palette (#002B4D)
 * - Borders-only depth (0.5px)
 * - Brand color tokens for visualization
 */

'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, Mail, Phone, Globe, FileText, Shapes } from 'lucide-react';

interface CTAData {
  whatsapp_clicks: number;
  email_clicks: number;
  phone_clicks: number;
  website_clicks: number;
  quote_clicks: number;
  other_clicks: number;
  total_clicks: number;
}

interface CTABreakdownChartProps {
  data: CTAData | null;
  loading?: boolean;
  dataStatus?: 'ready' | 'empty' | 'processing' | 'unavailable' | 'locked' | 'stale' | 'error';
  themeMode?: 'light' | 'dark';
  title?: string;
  description?: string;
  orientation?: 'horizontal' | 'vertical';
}

export default function CTABreakdownChart({
  data,
  loading = false,
  dataStatus = 'ready',
  title = 'Breakdown de CTAs',
  description = 'Distribuição de cliques por tipo de CTA',
  orientation = 'horizontal',
}: CTABreakdownChartProps) {
  interface ChartDatum {
    name: string;
    value: number;
    color: string;
    icon: typeof MessageSquare;
  }

  // Transform data for Recharts using Brand Tokens
  const chartData = useMemo<ChartDatum[]>(() => {
    if (!data) return [];

    return [
      {
        name: 'WhatsApp',
        value: data.whatsapp_clicks,
        color: '#28A745',
        icon: MessageSquare,
      },
      {
        name: 'Email',
        value: data.email_clicks,
        color: 'hsl(var(--dashboard-chart-1))',
        icon: Mail,
      },
      {
        name: 'Telefone',
        value: data.phone_clicks,
        color: '#FCEE21',
        icon: Phone,
      },
      {
        name: 'Website',
        value: data.website_clicks,
        color: 'hsl(var(--dashboard-chart-2))',
        icon: Globe,
      },
      {
        name: 'Orcamento',
        value: data.quote_clicks,
        color: 'hsl(var(--dashboard-chart-2))',
        icon: FileText,
      },
      {
        name: 'Outros',
        value: data.other_clicks,
        color: '#94A3B8',
        icon: Shapes,
      },
    ].sort((a, b) => b.value - a.value); 
  }, [data]);

  const totalClicks = data?.total_clicks ?? chartData.reduce((sum, item) => sum + item.value, 0);

  if (dataStatus === 'error' || dataStatus === 'unavailable' || dataStatus === 'locked') {
    return (
      <Card className="bg-[hsl(var(--dashboard-panel))] border-[hsl(var(--dashboard-border))] shadow-none">
        <CardContent className="flex h-[310px] items-center justify-center p-4 text-sm text-[hsl(var(--dashboard-muted))]">
          Breakdown de CTAs indisponível ou bloqueado para este plano.
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="bg-[hsl(var(--dashboard-panel))] border-[hsl(var(--dashboard-border))] shadow-none">
        <CardHeader className="p-4">
          <Skeleton className="h-6 w-[200px] bg-[hsl(var(--dashboard-surface))]" />
          <Skeleton className="h-4 w-[300px] mt-2 bg-[hsl(var(--dashboard-surface))]" />
        </CardHeader>
        <CardContent className="p-4">
          <Skeleton className="h-[250px] w-full bg-[hsl(var(--dashboard-surface))] rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="bg-[hsl(var(--dashboard-panel))] border-[hsl(var(--dashboard-border))] shadow-none">
        <CardHeader className="p-4">
          <CardTitle className="text-[hsl(var(--dashboard-ink))] text-lg font-bold tracking-tight">{title}</CardTitle>
          <CardDescription className="text-[hsl(var(--dashboard-muted))] text-xs">{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[250px] p-4">
          <p className="text-sm text-[hsl(var(--dashboard-muted)/0.75)] font-medium">
            Dados de CTA ainda nao disponiveis para este periodo
          </p>
        </CardContent>
      </Card>
    );
  }

  if (totalClicks === 0) {
    return (
      <Card className="bg-[hsl(var(--dashboard-panel))] border-[hsl(var(--dashboard-border))] shadow-none">
        <CardHeader className="p-4">
          <CardTitle className="text-[hsl(var(--dashboard-ink))] text-lg font-bold tracking-tight">{title}</CardTitle>
          <CardDescription className="text-[hsl(var(--dashboard-muted))] text-xs">{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[250px] p-4">
          <p className="text-sm text-[hsl(var(--dashboard-muted)/0.75)] font-medium">
            Nenhum CTA clicado ainda
          </p>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ payload: ChartDatum }>;
  }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const percentage = totalClicks > 0 ? ((item.value / totalClicks) * 100).toFixed(1) : '0.0';
      return (
        <div className="p-3 rounded-xl bg-[hsl(var(--dashboard-panel))] border-[0.5px] border-[hsl(var(--dashboard-border))] shadow-none">
          <p className="font-bold text-xs text-[hsl(var(--dashboard-ink))] uppercase tracking-widest mb-1">
            {item.name}
          </p>
          <p className="text-[10px] font-bold text-[hsl(var(--dashboard-muted))] font-mono uppercase">
            {item.value} cliques ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-[hsl(var(--dashboard-panel))] border-[hsl(var(--dashboard-border))] shadow-none">
      <CardHeader className="p-4 border-b border-[hsl(var(--dashboard-border))]">
        <CardTitle className="text-[hsl(var(--dashboard-ink))] text-lg font-bold tracking-tight">{title}</CardTitle>
        <CardDescription className="text-[hsl(var(--dashboard-muted))] text-xs">
          {description} · <span className="font-mono text-brand-cyan">{totalClicks.toLocaleString()} total</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart
            data={chartData}
            layout={orientation === 'horizontal' ? 'vertical' : 'horizontal'}
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#ffffff"
              opacity={0.05}
              vertical={orientation === 'horizontal'}
              horizontal={orientation !== 'horizontal'}
            />
            {orientation === 'horizontal' ? (
              <>
                <XAxis
                  type="number"
                  stroke="#ffffff"
                  opacity={0.3}
                  style={{ fontSize: '10px', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#ffffff"
                  opacity={0.3}
                  style={{ fontSize: '10px', fontWeight: 'bold' }}
                  width={70}
                  tickLine={false}
                  axisLine={false}
                />
              </>
            ) : (
              <>
                <XAxis
                  dataKey="name"
                  stroke="#ffffff"
                  opacity={0.3}
                  style={{ fontSize: '10px', fontWeight: 'bold' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="number"
                  stroke="#ffffff"
                  opacity={0.3}
                  style={{ fontSize: '10px', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}
                  tickLine={false}
                  axisLine={false}
                />
              </>
            )}
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Legend with icons - optimized for mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
          {chartData.map((item) => {
            const Icon = item.icon;
            const percentage = ((item.value / totalClicks) * 100).toFixed(1);
            return (
              <div key={item.name} className="flex items-center gap-3 p-2 rounded-lg bg-[hsl(var(--dashboard-surface))] border-[0.5px] border-[hsl(var(--dashboard-border))]">
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: item.color }} />
                <span className="text-[10px] font-bold text-[hsl(var(--dashboard-muted))] uppercase tracking-widest flex-1">
                  {item.name}
                </span>
                <span className="text-[10px] font-bold text-[hsl(var(--dashboard-ink))] font-mono">
                  {percentage}%
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
