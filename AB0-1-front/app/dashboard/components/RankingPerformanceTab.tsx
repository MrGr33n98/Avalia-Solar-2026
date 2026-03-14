'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy, TrendingUp, Users, MousePointerClick, Zap, BarChart3, Target } from 'lucide-react';
import { Company, fetchApi } from '@/lib/api';
import MagicQuadrant from './MagicQuadrant';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid, Area, AreaChart } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface Props {
  company: Company;
  stats?: any;
  themeMode?: 'light' | 'dark';
}

export default function RankingPerformanceTab({ company, stats, themeMode = 'dark' }: Props) {
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

  // Historical data for technical visualization
  const mockHistoricalData = [
    { week: 'W1', position: 5, leads: 4, clicks: 120 },
    { week: 'W2', position: 4, leads: 5, clicks: 150 },
    { week: 'W3', position: 4, leads: 6, clicks: 180 },
    { week: 'W4', position: 2, leads: 12, clicks: 350 },
    { week: 'Now', position: data?.rank_position || 1, leads: stats?.leadsReceived || 0, clicks: stats?.ctaClicks || 0 },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-[#002B4D] border-[0.5px] border-black/10 dark:border-white/10 p-3 rounded-xl shadow-lg dark:shadow-none text-[10px] font-bold uppercase tracking-widest">
          <p className="text-muted-foreground dark:text-white/40 mb-2 border-b border-black/5 dark:border-white/5 pb-1">{label}</p>
          <div className="space-y-1.5">
            <p className="text-brand-blue flex justify-between gap-4">Posição: <span className="text-foreground dark:text-white">{payload[0].value}º</span></p>
            <p className="text-brand-blue flex justify-between gap-4">Oportunidades: <span className="text-foreground dark:text-white">{payload[1].value}</span></p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-2xl bg-black/[0.03] dark:bg-white/5" />)}
        </div>
        <Skeleton className="h-[400px] w-full rounded-[2rem] bg-black/[0.03] dark:bg-white/5" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-foreground dark:text-white tracking-tighter mb-1">Ranking & Performance</h2>
          <p className="text-sm font-medium text-muted-foreground dark:text-white/40">
            Inteligência competitiva, ROI e posicionamento de mercado em tempo real.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-yellow/10 border border-brand-yellow/20">
          <Trophy className="h-4 w-4 text-brand-yellow" />
          <span className="text-xs font-black text-brand-yellow uppercase tracking-widest">
            Top {data?.rank_position || 'N/A'} na Categoria
          </span>
        </div>
      </div>

      {/* 🚀 HIGH-PRECISION KPI GRID - Responsive */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            label: 'Score Ranking', 
            value: data?.ranking_score ? Number(data.ranking_score).toFixed(1) : 'N/A', 
            icon: Trophy, 
            color: 'text-brand-yellow', 
            bg: 'bg-brand-yellow/10',
            borderColor: 'border-brand-yellow/20'
          },
          { 
            label: 'Total Leads', 
            value: stats?.leadsReceived || 0, 
            icon: Users, 
            color: 'text-brand-blue', 
            bg: 'bg-brand-blue/10',
            borderColor: 'border-brand-blue/20'
          },
          { 
            label: 'Reputação (Trust)', 
            value: Number(quadrantData.find((q: any) => q.isCurrentCompany)?.completenessOfVision || 0).toFixed(1), 
            icon: Zap, 
            color: 'text-brand-green', 
            bg: 'bg-brand-green/10',
            borderColor: 'border-brand-green/20'
          },
          { 
            label: 'Visibilidade', 
            value: stats?.profileViews || 0, 
            icon: MousePointerClick, 
            color: 'text-brand-cyan', 
            bg: 'bg-brand-cyan/10',
            borderColor: 'border-brand-cyan/20'
          }
        ].map((kpi, i) => (
          <Card key={i} className={cn("clay-precision bg-card dark:bg-[#002B4D] border-none group overflow-hidden")}>
            <CardContent className="p-5">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-muted-foreground/60 dark:text-white/30 uppercase tracking-[0.2em]">{kpi.label}</p>
                  <h3 className="text-3xl font-black text-foreground dark:text-white tracking-tighter font-mono">{kpi.value}</h3>
                </div>
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 shadow-inner border", kpi.bg, kpi.borderColor)}>
                  <kpi.icon className={cn("w-6 h-6", kpi.color)} />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3 text-brand-green" />
                <span className="text-[9px] font-black text-brand-green uppercase tracking-widest">+12% vs last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 📈 PERFORMANCE EVOLUTION - Responsive */}
        <Card className="lg:col-span-7 clay-precision bg-card dark:bg-[#002B4D] border-none overflow-hidden">
          <CardHeader className="p-6 border-b border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-black text-foreground dark:text-white tracking-tight flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-brand-blue" />
                  Vetor de Crescimento
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground dark:text-white/40 font-medium">Evolução temporal de leads e posicionamento competitivo.</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-brand-blue/10 border border-brand-blue/20">
                  <div className="w-2 h-2 rounded-full bg-brand-blue" />
                  <span className="text-[9px] font-black text-brand-blue dark:text-white/60 uppercase">Leads</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-brand-green/10 border border-brand-green/20">
                  <div className="w-2 h-2 rounded-full bg-brand-green" />
                  <span className="text-[9px] font-black text-brand-green dark:text-white/60 uppercase">Posição</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[320px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockHistoricalData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                  <defs>
                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0056D2" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0056D2" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={themeMode === 'light' ? "#000" : "#fff"} opacity={0.05} />
                  <XAxis 
                    dataKey="week" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fontWeight: 'bold', fill: 'rgba(100,116,139,0.5)', fontFamily: 'var(--font-mono)'}} 
                    dy={15} 
                  />
                  <YAxis 
                    yAxisId="left" 
                    reversed={true} 
                    domain={[1, 'dataMax + 2']} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fontWeight: 'bold', fill: 'rgba(52,199,89,0.5)', fontFamily: 'var(--font-mono)'}} 
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fontWeight: 'bold', fill: 'rgba(0,86,210,0.5)', fontFamily: 'var(--font-mono)'}} 
                  />
                  <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(0,0,0,0.1)', strokeWidth: 1 }} />
                  <Area 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="leads" 
                    stroke="#0056D2" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorLeads)"
                    name="Leads" 
                  />
                  <Line 
                    yAxisId="left" 
                    type="monotone" 
                    dataKey="position" 
                    stroke="#34C759" 
                    strokeWidth={3} 
                    dot={{r: 4, fill: '#34C759', strokeWidth: 2, stroke: themeMode === 'light' ? '#fff' : '#002B4D'}} 
                    activeDot={{r: 6, stroke: '#fff', strokeWidth: 2}} 
                    name="Posição" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 🎯 MAGIC QUADRANT - Responsive */}
        <Card className="lg:col-span-5 clay-precision bg-card dark:bg-[#002B4D] border-none overflow-hidden flex flex-col">
          <CardHeader className="p-6 border-b border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/5">
            <CardTitle className="text-lg font-black text-foreground dark:text-white tracking-tight flex items-center gap-2">
              <Target className="w-5 h-5 text-brand-cyan" />
              Quadrante Estratégico
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground dark:text-white/40 font-medium">Market share relativo e autoridade de marca.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 flex-1 flex flex-col justify-between">
            <div className="bg-black/[0.03] dark:bg-black/40 rounded-2xl border border-black/5 dark:border-white/5 p-2 shadow-inner">
              {quadrantData.length > 0 ? (
                <MagicQuadrant data={quadrantData} />
              ) : (
                <div className="h-[280px] flex flex-col items-center justify-center text-center p-8">
                  <div className="bg-black/5 dark:bg-white/5 p-6 rounded-full mb-4 border border-black/5 dark:border-white/10">
                    <Target className="h-10 w-10 text-muted-foreground/20 dark:text-white/10" />
                  </div>
                  <p className="text-xs font-bold text-muted-foreground/40 dark:text-white/20 uppercase tracking-widest max-w-[200px]">
                    Dados insuficientes para mapeamento competitivo.
                  </p>
                </div>
              )}
            </div>
            <div className="mt-6 p-4 rounded-xl bg-brand-cyan/5 border border-brand-cyan/10 relative group">
              <div className="flex items-start gap-3">
                <div className="bg-brand-cyan/20 p-2 rounded-lg mt-0.5">
                  <TrendingUp className="h-3.5 w-3.5 text-brand-cyan" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-brand-cyan uppercase tracking-[0.15em] mb-1">Dica Técnica</p>
                  <p className="text-[11px] text-foreground/70 dark:text-white/60 leading-relaxed font-medium">
                    Aumente sua <span className="text-brand-blue dark:text-white font-bold">Autoridade (X)</span> coletando avaliações 5 estrelas. Melhore a <span className="text-brand-blue dark:text-white font-bold">Execução (Y)</span> reduzindo o tempo de resposta aos leads.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
