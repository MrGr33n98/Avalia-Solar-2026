/**
 * CTABreakdownChart Component
 * 
 * Horizontal bar chart showing breakdown of CTA clicks by type
 * Shows: WhatsApp, Email, Phone, Website
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
  themeMode = 'light',
  title = 'Breakdown de CTAs',
  description = 'Distribuição de cliques por tipo de CTA',
  orientation = 'horizontal',
}: CTABreakdownChartProps) {
  const isDark = themeMode === 'dark';

  // Transform data for Recharts
  const chartData = useMemo(() => {
    return [
      {
        name: 'WhatsApp',
        value: data.whatsapp_clicks,
        color: isDark ? '#22c55e' : '#16a34a',
        icon: MessageSquare,
      },
      {
        name: 'Email',
        value: data.email_clicks,
        color: isDark ? '#8b5cf6' : '#7c3aed',
        icon: Mail,
      },
      {
        name: 'Telefone',
        value: data.phone_clicks,
        color: isDark ? '#ec4899' : '#db2777',
        icon: Phone,
      },
      {
        name: 'Website',
        value: data.website_clicks,
        color: isDark ? '#06b6d4' : '#0891b2',
        icon: Globe,
      },
    ].sort((a, b) => b.value - a.value); // Sort by value descending
  }, [data, isDark]);

  const totalClicks = chartData.reduce((sum, item) => sum + item.value, 0);

  if (loading) {
    return (
      <Card className={isDark ? 'bg-slate-900 border-slate-800' : 'bg-white'}>
        <CardHeader>
          <Skeleton className="h-6 w-[200px]" />
          <Skeleton className="h-4 w-[300px] mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (totalClicks === 0) {
    return (
      <Card className={isDark ? 'bg-slate-900 border-slate-800' : 'bg-white'}>
        <CardHeader>
          <CardTitle className={isDark ? 'text-white' : 'text-foreground'}>{title}</CardTitle>
          <CardDescription className={isDark ? 'text-slate-400' : ''}>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[250px]">
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-muted-foreground'}`}>
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
        <div
          className={`p-3 rounded-lg shadow-lg ${
            isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
          }`}
        >
          <p
            className={`font-semibold text-sm mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}
          >
            {data.name}
          </p>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
            {data.value} cliques ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={isDark ? 'bg-slate-900 border-slate-800' : 'bg-white'}>
      <CardHeader>
        <CardTitle className={isDark ? 'text-white' : 'text-foreground'}>{title}</CardTitle>
        <CardDescription className={isDark ? 'text-slate-400' : ''}>
          {description} · Total: {totalClicks.toLocaleString()} cliques
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart
            data={chartData}
            layout={orientation === 'horizontal' ? 'vertical' : 'horizontal'}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDark ? '#334155' : '#e2e8f0'}
              opacity={0.5}
            />
            {orientation === 'horizontal' ? (
              <>
                <XAxis
                  type="number"
                  stroke={isDark ? '#94a3b8' : '#64748b'}
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke={isDark ? '#94a3b8' : '#64748b'}
                  style={{ fontSize: '12px' }}
                  width={80}
                />
              </>
            ) : (
              <>
                <XAxis
                  dataKey="name"
                  stroke={isDark ? '#94a3b8' : '#64748b'}
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  type="number"
                  stroke={isDark ? '#94a3b8' : '#64748b'}
                  style={{ fontSize: '12px' }}
                />
              </>
            )}
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[0, 8, 8, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Legend with icons */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          {chartData.map((item) => {
            const Icon = item.icon;
            const percentage = ((item.value / totalClicks) * 100).toFixed(1);
            return (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: item.color }}
                />
                <Icon className="w-4 h-4" style={{ color: item.color }} />
                <span
                  className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-700'} flex-1`}
                >
                  {item.name}
                </span>
                <span
                  className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}
                >
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
