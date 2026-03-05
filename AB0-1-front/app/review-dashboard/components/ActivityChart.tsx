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
      <Card className="rounded-3xl shadow-sm border border-slate-100 overflow-hidden bg-white">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="h-[280px] flex items-end gap-2 px-6 pb-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="flex-1 rounded-t-lg" style={{ height: `${Math.random() * 60 + 20}%` }} />     
          ))}
        </CardContent>
      </Card>
    );
  }

  const safeData = Array.isArray(data) ? data : [];
  const isEmpty =
    safeData.length === 0 ||
    safeData.every(d => d.profile_views === 0 && d.whatsapp_clicks === 0 && d.cta_clicks === 0);

  return (
    <Card className="rounded-3xl shadow-sm border border-slate-100 overflow-hidden bg-white">
      <CardHeader className="pb-2 border-b border-slate-50">
        <CardTitle className="text-xl font-black text-slate-950 uppercase tracking-tight">Estatísticas de Impacto</CardTitle>
        <CardDescription className="text-xs font-medium text-slate-400">Suas interações e orçamentos nos últimos 30 dias.</CardDescription>   
      </CardHeader>
      <CardContent className="pt-6">
        {isEmpty ? (
          <div className="h-[260px] flex flex-col items-center justify-center text-center px-6 space-y-4">
            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
              <LineChartIcon className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <p className="text-slate-950 font-black uppercase text-sm">Gráficos em breve</p>
              <p className="text-xs text-slate-400 font-medium max-w-[240px] mx-auto">
                Inicie sua jornada solicitando orçamentos para visualizar seu impacto aqui.
              </p>
            </div>
          </div>
        ) : (
          <div className="h-[280px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart data={safeData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
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
                    fontWeight: 'bold'
                  }}
                  labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                />
                <Legend 
                  iconType="circle" 
                  verticalAlign="top" 
                  align="right" 
                  wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} 
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
