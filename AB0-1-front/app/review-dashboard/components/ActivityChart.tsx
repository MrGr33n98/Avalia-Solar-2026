'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart as LineChartIcon } from 'lucide-react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface ChartDataPoint {
  date: string;
  profile_views: number;
  whatsapp_clicks: number;
  cta_clicks: number;
}

interface ActivityChartProps {
  data?: ChartDataPoint[];
  loading?: boolean;
}

export function ActivityChart({ data = [], loading }: ActivityChartProps) {
  if (loading) {
    return (
      <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="h-[280px] flex items-end gap-2 px-6 pb-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton
              key={i}
              className="flex-1 rounded-t-lg"
              style={{ height: `${Math.random() * 60 + 20}%` }}
            />
          ))}
        </CardContent>
      </Card>
    );
  }

  const safeData = Array.isArray(data) ? data : [];
  const isEmpty =
    safeData.length === 0 ||
    safeData.every((d) => d.profile_views === 0 && d.whatsapp_clicks === 0 && d.cta_clicks === 0);

  return (
    <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100 pb-2">
        <CardTitle className="text-base font-semibold text-slate-950 md:text-lg">
          Estatísticas de Impacto
        </CardTitle>
        <CardDescription className="text-xs font-medium text-slate-500">
          Seus insights dos últimos 30 dias.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {isEmpty ? (
          <div className="flex min-h-[140px] flex-col items-center justify-center space-y-3 px-4 py-6 text-center md:min-h-[220px]">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-300">
              <LineChartIcon className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-950">Gráficos em breve</p>
              <p className="mx-auto max-w-[240px] text-xs font-medium text-slate-500">
                Seus insights aparecerão após solicitar orçamentos.
              </p>
            </div>
          </div>
        ) : (
          <div className="h-[280px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart
                data={safeData}
                margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getDate()}/${date.getMonth() + 1}`;
                  }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '16px',
                    border: '1px solid #f1f5f9',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
                    padding: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                  labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                />
                <Legend
                  iconType="circle"
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{
                    paddingBottom: '20px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                  }}
                />
                <Line
                  name="Visitas"
                  type="monotone"
                  dataKey="profile_views"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
                <Line
                  name="Cliques"
                  type="monotone"
                  dataKey="whatsapp_clicks"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
