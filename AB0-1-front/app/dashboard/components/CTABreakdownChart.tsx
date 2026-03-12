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
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, Mail, Phone, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CTAData {
  whatsapp_clicks: number;
  email_clicks: number;
  phone_clicks: number;
  website_clicks: number;
}

interface CTABreakdownChartProps {
  data: CTAData;
  loading?: boolean;
  themeMode?: 'light' | 'dark';
  title?: string;
  description?: string;
  orientation?: 'horizontal' | 'vertical';
}

export default function CTABreakdownChart({
  data,
  loading = false,
  themeMode = 'dark',
  title = 'Breakdown de CTAs',
  description = 'Distribuição de cliques por tipo de CTA',
  orientation = 'horizontal',
}: CTABreakdownChartProps) {
  // Lock to dark foundation
  const isDark = true;

  // Transform data for Recharts using Brand Tokens
  const chartData = useMemo(() => {
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
        color: '#6C5CE7',
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
        color: '#00AFEF',
        icon: Globe,
      },
    ].sort((a, b) => b.value - a.value); 
  }, [data]);

  const totalClicks = chartData.reduce((sum, item) => sum + item.value, 0);

  if (loading) {
    return (
      <Card className="bg-[#002B4D] border-white/10 shadow-none">
        <CardHeader className="p-4">
          <Skeleton className="h-6 w-[200px] bg-white/5" />
          <Skeleton className="h-4 w-[300px] mt-2 bg-white/5" />
        </CardHeader>
        <CardContent className="p-4">
          <Skeleton className="h-[250px] w-full bg-white/5 rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  if (totalClicks === 0) {
    return (
      <Card className="bg-[#002B4D] border-white/10 shadow-none">
        <CardHeader className="p-4">
          <CardTitle className="text-white text-lg font-bold tracking-tight">{title}</CardTitle>
          <CardDescription className="text-white/40 text-xs">{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[250px] p-4">
          <p className="text-sm text-white/30 font-medium">
            Nenhum CTA clicado ainda
          </p>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.value / totalClicks) * 100).toFixed(1);
      return (
        <div className="p-3 rounded-xl bg-[#002B4D] border-[0.5px] border-white/10 shadow-none">
          <p className="font-bold text-xs text-white uppercase tracking-widest mb-1">
            {data.name}
          </p>
          <p className="text-[10px] font-bold text-white/40 font-mono uppercase">
            {data.value} cliques ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-[#002B4D] border-white/10 shadow-none">
      <CardHeader className="p-4 border-b border-white/5">
        <CardTitle className="text-white text-lg font-bold tracking-tight">{title}</CardTitle>
        <CardDescription className="text-white/40 text-xs">
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
              <div key={item.name} className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border-[0.5px] border-white/5">
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: item.color }} />
                <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest flex-1">
                  {item.name}
                </span>
                <span className="text-[10px] font-bold text-white font-mono">
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
