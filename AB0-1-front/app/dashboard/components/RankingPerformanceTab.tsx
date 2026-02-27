'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy, TrendingUp, Users, MousePointerClick, Zap } from 'lucide-react';
import { Company, fetchApi } from '@/lib/api';
import MagicQuadrant from './MagicQuadrant';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  company: Company;
  stats?: any;
}

export default function RankingPerformanceTab({ company, stats }: Props) {
  const rankingQuery = useQuery({
    queryKey: ['company-analytics-ranking', company.id],
    queryFn: async () => {
      return fetchApi<any>('/company_dashboard/analytics/ranking', { params: { company_id: company.id } });
    },
    enabled: Boolean(company.id),
  });

  const { data, isLoading } = rankingQuery;

  const quadrantData = useMemo(() => {
    if (!data?.magic_quadrant_points) return [];
    return data.magic_quadrant_points;
  }, [data]);

  // Fallback para histórico se não tivermos o timeseries integrado aqui ainda
  const mockHistoricalData = [
    { week: 'Semana 1', position: 5, leads: 4, clicks: 120 },
    { week: 'Semana 2', position: 4, leads: 5, clicks: 150 },
    { week: 'Semana 3', position: 4, leads: 6, clicks: 180 },
    { week: 'Semana 4', position: 2, leads: 12, clicks: 350 },
    { week: 'Atual', position: data?.rank_position || 1, leads: stats?.leads_received || 0, clicks: stats?.cta_clicks || 0 },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs border border-slate-700">
          <p className="font-bold mb-1">{label}</p>
          <p className="text-emerald-400">Posição: {payload[0].value}º</p>
          <p className="text-blue-400">Leads: {payload[1].value}</p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-[400px] w-full" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Ranking & Performance</h2>
        <p className="text-sm text-slate-500 mt-1">
          Acompanhe sua evolução no ranking local e o retorno sobre o investimento (ROI).
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">Score Ranking</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-black text-amber-900">{data?.ranking_score ? data.ranking_score.toFixed(1) : 'N/A'}</h3>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center text-amber-700">
                <Trophy className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">Leads (Visão Geral)</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-black text-blue-900">{stats?.leads_received || 0}</h3>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-700">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">Reputação (Trust)</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-black text-emerald-900">
                    {quadrantData.find((q: any) => q.isCurrentCompany)?.completenessOfVision?.toFixed(1) || '0'}
                  </h3>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-700">
                <Zap className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 border-indigo-200">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-1">Visualizações de Perfil</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-black text-indigo-900">{stats?.profile_views || 0}</h3>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700">
                <MousePointerClick className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Evolução */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Evolução de Leads e CTAs</CardTitle>
            <CardDescription>Acompanhe a geração de oportunidades nas últimas semanas.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockHistoricalData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} dy={10} />
                  <YAxis yAxisId="left" reversed={true} domain={[1, 10]} axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#10b981'}} dx={-10} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#3b82f6'}} dx={10} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Line yAxisId="left" type="monotone" dataKey="position" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} name="Posição" />
                  <Line yAxisId="right" type="monotone" dataKey="leads" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff'}} name="Leads" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Magic Quadrant */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Posicionamento de Mercado (Quadrante Mágico)</CardTitle>
            <CardDescription>Sua posição relativa à concorrência na categoria principal.</CardDescription>
          </CardHeader>
          <CardContent>
            {quadrantData.length > 0 ? (
              <MagicQuadrant data={quadrantData} />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-500 bg-slate-50 rounded-lg">
                Sem dados suficientes de concorrentes para gerar o quadrante ainda.
              </div>
            )}
            <div className="mt-4 text-xs text-slate-500 text-center bg-slate-50 p-3 rounded-lg">
              <span className="font-bold text-slate-700">Dica:</span> Aumente seu número de avaliações 5 estrelas para mover-se mais à direita (Líderes). Responda aos leads rapidamente para subir (Execução).
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
