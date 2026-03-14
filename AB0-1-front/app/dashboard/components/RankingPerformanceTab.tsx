'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  TrendingUp, 
  Users, 
  MousePointerClick, 
  Zap, 
  BarChart3, 
  Target,
  Globe,
  Activity,
  Award,
  Filter,
  ArrowUpRight,
  ShieldCheck,
  ZapIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Company, fetchApi } from '@/lib/api';
import MagicQuadrant from './MagicQuadrant';
import MetricCard from './MetricCard';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  CartesianGrid, 
  Area, 
  AreaChart,
  ReferenceLine
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';

interface Props {
  company: Company;
  stats?: any;
  themeMode?: 'light' | 'dark';
}

export default function RankingPerformanceTab({ company, stats, themeMode = 'dark' }: Props) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');

  const rankingQuery = useQuery({
    queryKey: ['company-analytics-ranking', company.id, selectedCategoryId],
    queryFn: async () => {
      const params: any = { company_id: company.id };
      if (selectedCategoryId !== 'all') {
        params.category_id = selectedCategoryId;
      }
      return fetchApi<any>('/company_dashboard/analytics/ranking', { params });
    },
    enabled: Boolean(company.id),
  });

  const { data, isLoading } = rankingQuery;

  const quadrantData = useMemo(() => {
    if (!data?.magic_quadrant_points) return [];
    return data.magic_quadrant_points;
  }, [data]);

  const mockHistoricalData = [
    { week: 'W1', position: 5, leads: 4, visibility: 1200 },
    { week: 'W2', position: 4, leads: 5, visibility: 1500 },
    { week: 'W3', position: 4, leads: 6, visibility: 1800 },
    { week: 'W4', position: 2, leads: 12, visibility: 3500 },
    { week: 'Now', position: data?.rank_position || 1, leads: stats?.leadsReceived || 0, visibility: stats?.profileViews || 0 },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="clay-precision bg-card/90 backdrop-blur-xl border-none p-5 rounded-[1.5rem] shadow-2xl min-w-[200px]">
          <p className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] mb-4 border-b border-white/5 pb-2">
            Temporal Logic: {label}
          </p>
          <div className="space-y-3">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-4">
                 <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{entry.name}</span>
                 </div>
                 <span className="text-xs font-black text-white font-mono">
                    {entry.name === 'Posição' ? `${entry.value}º` : entry.value.toLocaleString()}
                 </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 rounded-[2rem] bg-slate-100 dark:bg-white/5" />)}
        </div>
        <Skeleton className="h-[500px] w-full rounded-[3rem] bg-slate-100 dark:bg-white/5" />
      </div>
    );
  }

  return (
    <div className="space-y-12 max-w-[1400px] mx-auto pb-24">
      {/* Strategic Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-6 w-6 text-amber-500" />
            <h2 className="text-4xl font-black tracking-tighter uppercase text-foreground dark:text-white">
              Strategic Intelligence
            </h2>
          </div>
          <p className="text-sm text-muted-foreground font-medium max-w-lg leading-relaxed">
            Monitoramento analítico de alta precisão para benchmarking competitivo e otimização de tração orgânica.
          </p>
        </div>
        <div className="flex p-1 bg-slate-100 dark:bg-white/[0.03] rounded-2xl border border-slate-200 dark:border-white/5 items-center px-4 py-2 gap-3">
          <Award className="h-4 w-4 text-amber-500" />
          <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest whitespace-nowrap">
            Current Tier: Top {data?.rank_position || 'N/A'} Leader
          </span>
        </div>
      </div>

      {/* KPI Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Ranking Velocity"
          value={data?.ranking_score ? Number(data.ranking_score).toFixed(1) : '92.4'}
          icon={Activity}
          change="+4.2%"
          changeType="positive"
          color="brand-yellow"
          delay={0.1}
        />
        <MetricCard 
          title="Conversion Yield"
          value={stats?.leadsReceived || '0'}
          icon={Target}
          change="+12.5%"
          changeType="positive"
          color="brand-blue"
          delay={0.2}
        />
        <MetricCard 
          title="Vision Completeness"
          value={Number(quadrantData.find((q: any) => q.isCurrentCompany)?.completenessOfVision || 88).toFixed(1)}
          icon={ZapIcon}
          change="Optimum"
          changeType="neutral"
          color="brand-green"
          delay={0.3}
        />
        <MetricCard 
          title="Market Visibility"
          value={stats?.profileViews || '1.2k'}
          icon={Globe}
          change="+22.1%"
          changeType="positive"
          color="brand-cyan"
          delay={0.4}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Growth Vector Visualization */}
        <Card className="lg:col-span-8 clay-precision bg-card dark:bg-[#0F172A] border-none overflow-hidden shadow-2xl">
          <CardHeader className="p-8 border-b border-black/5 dark:border-white/5 flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-black text-foreground dark:text-white tracking-tight flex items-center gap-3">
                <BarChart3 className="w-6 h-6 text-blue-500" />
                Growth Velocity Vector
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground/60 font-semibold uppercase tracking-widest mt-1">Multi-dimensional Performance Tracking</CardDescription>
            </div>
            <div className="hidden sm:flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Oportunidades</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Posição Ranking</span>
                </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 pb-12">
            <div className="h-[400px] w-full mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockHistoricalData} margin={{ top: 20, right: 30, bottom: 20, left: -20 }}>
                  <defs>
                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="week" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fontWeight: 800, fill: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-mono)'}} 
                    dy={15} 
                  />
                  <YAxis 
                    yAxisId="left" 
                    reversed={true} 
                    domain={[1, 'dataMax + 1']} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fontWeight: 800, fill: 'rgba(16,185,129,0.4)', fontFamily: 'var(--font-mono)'}} 
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fontWeight: 800, fill: 'rgba(59,130,246,0.4)', fontFamily: 'var(--font-mono)'}} 
                  />
                  <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
                  <Area 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="leads" 
                    stroke="#3b82f6" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorLeads)"
                    name="Leads" 
                  />
                  <Area 
                    yAxisId="left" 
                    type="monotone" 
                    dataKey="position" 
                    stroke="#10b981" 
                    strokeWidth={4} 
                    fillOpacity={1}
                    fill="url(#colorPos)"
                    name="Posição" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Tactical Market Quadrant */}
        <Card className="lg:col-span-4 clay-precision bg-card dark:bg-[#0F172A] border-none overflow-hidden shadow-2xl flex flex-col">
          <CardHeader className="p-8 border-b border-black/5 dark:border-white/5">
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-black text-foreground dark:text-white tracking-tight flex items-center gap-3">
                  <Target className="w-6 h-6 text-emerald-500" />
                  Market Quadrant
                </CardTitle>
                <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                   <Activity className="h-5 w-5 text-emerald-500" />
                </div>
              </div>

              <div className="relative group">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
                <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                  <SelectTrigger className="w-full h-12 pl-12 rounded-xl bg-slate-50 dark:bg-white/[0.03] border-none text-[10px] font-black uppercase tracking-widest focus:ring-blue-500/30">
                    <SelectValue placeholder="SCOPE SELECTOR" />
                  </SelectTrigger>
                  <SelectContent className="clay-precision bg-card border-none rounded-xl">
                    <SelectItem value="all" className="text-[10px] font-black uppercase">GLOBAL SCOPE</SelectItem>
                    {company.categories?.map((cat: any) => (
                      <SelectItem key={cat.id} value={String(cat.id)} className="text-[10px] font-black uppercase">
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 flex-1 flex flex-col">
            <div className="flex-1 bg-black/20 rounded-[2rem] border border-white/5 p-4 shadow-inner relative overflow-hidden group/quad">
              {quadrantData.length > 0 ? (
                <MagicQuadrant data={quadrantData} />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <div className="h-24 w-24 rounded-[2rem] bg-white/5 flex items-center justify-center mb-6 animate-pulse">
                    <Target className="h-10 w-10 text-white/10" />
                  </div>
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] max-w-[180px]">
                    No enough telemetry for quadrant mapping.
                  </p>
                </div>
              )}
            </div>
            
            <div className="mt-8 p-6 rounded-[2rem] bg-indigo-600/5 border border-indigo-500/20 group hover:bg-indigo-600/10 transition-all">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-5 w-5 text-indigo-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1 group-hover:translate-x-1 transition-transform">Optimization Intelligence</p>
                  <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                    Sua pontuação de <span className="text-white font-bold">Autoridade</span> está acima da média setorial. Recomendamos focar na <span className="text-white font-bold">Taxa de Resposta</span> para alcançar o quadrante de Líder Absoluto.
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
