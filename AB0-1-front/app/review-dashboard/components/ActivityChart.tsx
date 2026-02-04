'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart,
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
      <Card className="rounded-2xl shadow-sm border overflow-hidden">
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="h-[300px] flex items-end gap-2 px-6 pb-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="flex-1" style={{ height: `${Math.random() * 60 + 20}%` }} />
          ))}
        </CardContent>
      </Card>
    );
  }

  const isEmpty = data.length === 0 || data.every(d => d.profile_views === 0 && d.whatsapp_clicks === 0 && d.cta_clicks === 0);

  return (
    <Card className="rounded-2xl shadow-sm border overflow-hidden">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Atividade (últimos 30 dias)</CardTitle>
        <CardDescription>Visualizações e interações com seu perfil e orçamentos.</CardDescription>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <div className="h-[300px] flex flex-col items-center justify-center text-center px-6">
            <p className="text-gray-500 font-medium">Sem dados ainda</p>
            <p className="text-sm text-gray-400 max-w-[280px]">
              Quando você interagir com empresas e solicitar orçamentos, os gráficos aparecem aqui.
            </p>
          </div>
        ) : (
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getDate()}/${date.getMonth() + 1}`;
                  }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Line
                  name="Visitas"
                  type="monotone"
                  dataKey="profile_views"
                  stroke="#0D9488"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
                <Line
                  name="Cliques WhatsApp"
                  type="monotone"
                  dataKey="whatsapp_clicks"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
                <Line
                  name="Cliques CTA"
                  type="monotone"
                  dataKey="cta_clicks"
                  stroke="#6366F1"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
