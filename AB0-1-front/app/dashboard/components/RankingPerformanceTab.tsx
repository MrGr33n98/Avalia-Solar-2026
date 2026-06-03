'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { Company, fetchApi, companyDashboardApi } from '@/lib/api';
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
  const [selectedCriterionSlug, setSelectedCriterionSlug] = useState<string>('all');

  const criteriaQuery = useQuery({
    queryKey: ['category-evaluation-context', selectedCategoryId],
    queryFn: async () => {
      if (selectedCategoryId === 'all') return { criteria: [] };
      return fetchApi<any>(`/categories/${selectedCategoryId}/evaluation_context`);
    },
    enabled: selectedCategoryId !== 'all',
  });

  useEffect(() => {
    setSelectedCriterionSlug('all');
  }, [selectedCategoryId]);

  const rankingQuery = useQuery({
    queryKey: ['company-analytics-ranking', company.id, selectedCategoryId, selectedCriterionSlug],
    queryFn: async () => {
      return companyDashboardApi.getRanking(
        company.id,
        selectedCategoryId !== 'all' ? selectedCategoryId : undefined,
        selectedCriterionSlug !== 'all' ? selectedCriterionSlug : undefined
      );
    },
    enabled: Boolean(company.id),
  });

  const { data, isLoading } = rankingQuery;

  const quadrantData = useMemo(() => {
    if (!data?.magic_quadrant_points) return [];
    return data.magic_quadrant_points;
  }, [data]);

  const historicalData = useMemo(() => {
    if (!data?.historical_data?.length) return [];
    return data.historical_data;
  }, [data]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-4 rounded-lg shadow-lg min-w-[180px]">
          <p className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest mb-3 border-b border-slate-100 dark:border-white/5 pb-2">
            Temporal Logic: {label}
          </p>
          <div className="space-y-3">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-4">
                 <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{entry.name}</span>
                 </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">
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
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-[112px] rounded-2xl bg-slate-100 dark:bg-white/5" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <Skeleton className="lg:col-span-8 h-[400px] rounded-2xl bg-slate-100 dark:bg-white/5" />
          <Skeleton className="lg:col-span-4 h-[400px] rounded-2xl bg-slate-100 dark:bg-white/5" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-20">
      {/* Cabeçalho estratégico */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-6 w-6 text-amber-500" />
            <h2 className="text-3xl font-bold tracking-tight uppercase text-foreground dark:text-white">
              Inteligência Estratégica
            </h2>
          </div>
          <p className="text-sm text-muted-foreground font-medium max-w-lg leading-relaxed">
            Monitoramento analítico de alta precisão para benchmarking competitivo e otimização de tração orgânica.
          </p>
        </div>
        <div className="flex p-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 items-center px-4 py-1.5 gap-3">
          <Award className="h-4 w-4 text-amber-500" />
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest whitespace-nowrap">
            Nível Atual: Posição {data?.rank_position || 'N/D'} entre Líderes
          </span>
        </div>
      </div>

      {/* Matriz de KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Velocidade no Ranking"
          value={data?.ranking_score !== undefined && data?.ranking_score !== null ? Number(data.ranking_score).toFixed(1) : '--'}
          icon={Activity}
          change="+4.2%"
          changeType="positive"
          color="brand-yellow"
          delay={0.1}
        />
        <MetricCard 
          title="Eficiência de Conversão"
          value={stats?.leadsReceived !== undefined ? stats.leadsReceived.toString() : '0'}
          icon={Target}
          change="+12.5%"
          changeType="positive"
          color="brand-blue"
          delay={0.2}
        />
        <MetricCard 
          title={data?.quadrant_meta?.criterion_title || 'Completude de Visão'}
          value={quadrantData.find((q: any) => q.is_current_company) 
            ? Number(quadrantData.find((q: any) => q.is_current_company)?.criterion_score ?? quadrantData.find((q: any) => q.is_current_company)?.completeness_of_vision ?? 0).toFixed(1)
            : '--'}
          icon={ZapIcon}
          change="Ótimo"
          changeType="neutral"
          color="brand-green"
          delay={0.3}
        />
        <MetricCard 
          title="Visibilidade de Mercado"
          value={stats?.profileViews !== undefined ? stats.profileViews.toLocaleString() : '--'}
          icon={Globe}
          change="+22.1%"
          changeType="positive"
          color="brand-cyan"
          delay={0.4}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Visualização de Vetor de Crescimento */}
        <Card className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <CardHeader className="p-6 border-b border-slate-200/50 dark:border-white/[0.06] flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold text-foreground dark:text-white tracking-tight flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-brand-blue" />
                Vetor de Velocidade de Crescimento
              </CardTitle>
              <CardDescription className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Acompanhamento de Performance Multidimensional</CardDescription>
            </div>
            <div className="hidden sm:flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-brand-blue" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Oportunidades</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-brand-green" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Posição Ranking</span>
                </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 pb-12">
            <div className="h-[400px] w-full mt-6">
              {historicalData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historicalData} margin={{ top: 20, right: 30, bottom: 20, left: -20 }}>
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
                      tick={{fontSize: 10, fontWeight: 600, fill: 'rgba(0,0,0,0.3)', fontFamily: 'var(--font-sans)'}} 
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
                      name="Oportunidades" 
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
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                   <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
                    <BarChart3 className="h-6 w-6 text-slate-300 dark:text-slate-600" />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.2em] max-w-[180px]">
                    Dados históricos insuficientes.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quadrante Tático de Mercado */}
        <Card className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col">
          <CardHeader className="p-6 border-b border-slate-200/50 dark:border-white/[0.06]">
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-foreground dark:text-white tracking-tight flex items-center gap-3">
                  <Target className="w-5 h-5 text-brand-green" />
                  Quadrante de Mercado
                </CardTitle>
                <div className="h-9 w-9 rounded-xl bg-brand-green/10 flex items-center justify-center">
                   <Activity className="h-4 w-4 text-brand-green" />
                </div>
              </div>

              <div className="relative group">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-brand-blue transition-colors" />
                <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                  <SelectTrigger className="w-full h-11 pl-12 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-[10px] font-bold uppercase tracking-widest focus:ring-brand-blue/30">
                    <SelectValue placeholder="SELETOR DE ESCOPO" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <SelectItem value="all" className="text-[10px] font-bold uppercase">ESCOPO GLOBAL</SelectItem>
                    {company.categories?.map((cat: any) => (
                      <SelectItem key={cat.id} value={String(cat.id)} className="text-[10px] font-bold uppercase">
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="relative group">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-brand-blue transition-colors" />
                <Select value={selectedCriterionSlug} onValueChange={setSelectedCriterionSlug}>
                  <SelectTrigger className="w-full h-11 pl-12 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-[10px] font-bold uppercase tracking-widest focus:ring-brand-blue/30">
                    <SelectValue placeholder="CRITÉRIO" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <SelectItem value="all" className="text-[10px] font-bold uppercase">TODOS OS CRITÉRIOS</SelectItem>
                    {(criteriaQuery.data?.criteria || []).map((criterion: any) => (
                      <SelectItem key={criterion.slug} value={criterion.slug} className="text-[10px] font-bold uppercase">
                        {criterion.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 flex-1 flex flex-col">
            <div className="flex-1 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 relative overflow-hidden group/quad">
              {quadrantData.length > 0 ? (
                <MagicQuadrant
                  data={quadrantData}
                  xAxisLabel={data?.quadrant_meta?.x_axis_label}
                  yAxisLabel={data?.quadrant_meta?.y_axis_label}
                  criterionTitle={data?.quadrant_meta?.criterion_title}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                   <div className="h-20 w-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6 animate-pulse">
                    <Target className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                  </div>
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] max-w-[180px]">
                    Dados insuficientes para mapear o quadrante.
                  </p>
                </div>
              )}
            </div>
            
            <div className="mt-8 p-6 rounded-2xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 group hover:border-indigo-200 transition-all">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-5 w-5 text-indigo-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1 group-hover:translate-x-1 transition-transform">Inteligência de Otimização</p>
                  <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                    {selectedCriterionSlug !== 'all'
                      ? `Seu quadrante agora é ponderado por ${data?.quadrant_meta?.criterion_title || 'o critério selecionado'} para esta categoria, equilibrado com sinais de autoridade de confiança e execução.`
                      : 'Seu quadrante é ponderado por sinais de autoridade de confiança (verificação, trust score, avaliações, selos, prova social) e sinais de execução (engajamento, eficiência de CTA, oportunidades e maturidade operacional).'}
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
