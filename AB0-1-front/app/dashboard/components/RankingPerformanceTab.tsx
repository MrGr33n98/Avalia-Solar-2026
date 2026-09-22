'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { 
  Trophy, 
  BarChart3, 
  Target,
  Activity,
  Award,
  Filter,
  ShieldCheck,
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Company, fetchApi, companyDashboardApi, RankingFilterOptions } from '@/lib/api';
import MagicQuadrant from './MagicQuadrant';
import MetricCard from './MetricCard';
import { 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  CartesianGrid, 
  Area, 
  AreaChart,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface DashboardStats { conversionRate?: number; profileViews?: number }
interface Criterion { slug: string; title: string }
interface CriteriaResponse { criteria?: Criterion[] }
interface TooltipEntry { color?: string; name: string; value: string | number }
interface Props {
  company: Company;
  stats?: DashboardStats | null;
  themeMode?: 'light' | 'dark';
}

export default function RankingPerformanceTab({ company, stats, themeMode: _themeMode = 'dark' }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(() => searchParams.get('ranking_category') || 'all');
  const [selectedCriterionSlug, setSelectedCriterionSlug] = useState<string>(() => searchParams.get('ranking_criterion') || 'all');
  const [selectedState, setSelectedState] = useState<string>(() => searchParams.get('ranking_state') || 'all');
  const [selectedCity, setSelectedCity] = useState<string>(() => searchParams.get('ranking_city') || '');
  const [debouncedCity, setDebouncedCity] = useState<string>(() => searchParams.get('ranking_city') || '');
  const [selectedSector, setSelectedSector] = useState<string>(() => searchParams.get('ranking_sector') || 'all');
  const [historyDays, setHistoryDays] = useState<string>(() => searchParams.get('ranking_history') || '90');
  const [quadrantMode, setQuadrantMode] = useState<'default' | 'reviews'>(() => searchParams.get('ranking_quadrant') === 'reviews' ? 'reviews' : 'default');
  const [historyMetric, setHistoryMetric] = useState<'position' | 'percentile' | 'score'>('position');

  useEffect(() => {
    const debounceTimer = window.setTimeout(() => setDebouncedCity(selectedCity.trim()), 350);
    return () => window.clearTimeout(debounceTimer);
  }, [selectedCity]);

  const criteriaQuery = useQuery({
    queryKey: ['category-evaluation-context', selectedCategoryId],
    queryFn: async () => {
      if (selectedCategoryId === 'all') return { criteria: [] };
      return fetchApi<CriteriaResponse>(`/categories/${selectedCategoryId}/evaluation_context`);
    },
    enabled: selectedCategoryId !== 'all',
  });

  const filterOptionsQuery = useQuery({
    queryKey: ['company-analytics-ranking-filter-options', company.id, selectedState],
    queryFn: () =>
      companyDashboardApi.getRankingFilterOptions(
        company.id,
        selectedState !== 'all' ? selectedState : undefined
      ),
    enabled: Boolean(company.id),
    staleTime: 6 * 60 * 60 * 1000,
  });

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams.toString());
    const filters = {
      ranking_category: selectedCategoryId !== 'all' ? selectedCategoryId : undefined,
      ranking_criterion: selectedCriterionSlug !== 'all' ? selectedCriterionSlug : undefined,
      ranking_state: selectedState !== 'all' ? selectedState : undefined,
      ranking_city: debouncedCity || undefined,
      ranking_sector: selectedSector !== 'all' ? selectedSector : undefined,
      ranking_history: historyDays !== '90' ? historyDays : undefined,
      ranking_quadrant: quadrantMode !== 'default' ? quadrantMode : undefined,
    };
    Object.entries(filters).forEach(([key, value]) => value ? nextParams.set(key, value) : nextParams.delete(key));
    if (nextParams.toString() !== searchParams.toString()) {
      router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false });
    }
  }, [debouncedCity, historyDays, pathname, quadrantMode, router, searchParams, selectedCategoryId, selectedCriterionSlug, selectedSector, selectedState]);

  const rankingQuery = useQuery({
    queryKey: ['company-analytics-ranking', company.id, selectedCategoryId, selectedCriterionSlug, selectedState, debouncedCity, selectedSector, quadrantMode, historyDays],
    queryFn: async () => {
      return companyDashboardApi.getRanking(
        company.id,
        selectedCategoryId !== 'all' ? selectedCategoryId : undefined,
        selectedCriterionSlug !== 'all' ? selectedCriterionSlug : undefined,
        selectedState !== 'all' ? selectedState : undefined,
        debouncedCity || undefined,
        selectedSector !== 'all' ? selectedSector : undefined,
        quadrantMode,
        Number(historyDays)
      );
    },
    enabled: Boolean(company.id),
    staleTime: 30 * 1000,
    placeholderData: (previousData) => previousData,
    // Não tenta novamente em erros 500 estruturais (ex: migration ausente).
    // Só reintenta em erros de rede pura (sem status) ou 429/503 (transitórios).
    retry: (failCount, error) => {
      const status = (error as { status?: number })?.status;
      if (status != null && status >= 500 && status !== 503) return false;
      if (status === 429 || status === 503) return failCount < 2;
      return failCount < 1; // erro de rede: 1 retry
    },
    refetchOnWindowFocus: false,
  });

  const { data, isLoading, isError, isPlaceholderData, refetch } = rankingQuery;
  const filterOptions: RankingFilterOptions | undefined = filterOptionsQuery.data;
  const transparency = data?.definition;
  const ranking = data?.ranking;
  const quadrant = data?.quadrant;
  const quadrantMeta = quadrant?.meta;
  const hasSnapshot = ranking?.status === 'ready' || ranking?.status === 'stale';
  const isPreview = data?.mode === 'preview';

  const quadrantData = useMemo(() => {
    return quadrant?.points || [];
  }, [quadrant?.points]);

  const historicalData = useMemo(() => {
    return data?.history?.items || [];
  }, [data?.history?.items]);
  const hasActiveFilters = selectedCategoryId !== 'all' || selectedCriterionSlug !== 'all' || selectedState !== 'all' || Boolean(selectedCity) || selectedSector !== 'all' || historyDays !== '90' || quadrantMode !== 'default';
  const historyLabel = historyDays === '365' ? 'últimos 12 meses' : `últimos ${historyDays} dias`;
  const historyMetricConfig = {
    position: { label: 'Posição', color: 'hsl(var(--chart-3))', reversed: true, suffix: 'º' },
    percentile: { label: 'Percentil', color: 'hsl(var(--chart-1))', reversed: false, suffix: '%' },
    score: { label: 'Pontuação', color: 'hsl(var(--chart-4))', reversed: false, suffix: ' pts' },
  } as const;
  const selectedHistoryMetric = historyMetricConfig[historyMetric];
  const positionMovement = useMemo(() => {
    const difference = data?.history?.trend_30d?.position_change;
    if (difference == null) return null;
    if (difference === 0) return 'Sem mudança em 30 dias';

    return difference > 0
      ? `↑ ${difference} posições em 30 dias`
      : `↓ ${Math.abs(difference)} posições em 30 dias`;
  }, [data?.history?.trend_30d]);
  const resetFilters = () => {
    setSelectedCategoryId('all');
    setSelectedCriterionSlug('all');
    setSelectedState('all');
    setSelectedCity('');
    setSelectedSector('all');
    setHistoryDays('90');
    setQuadrantMode('default');
  };
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedCriterionSlug('all');
  };
  const handleStateChange = (state: string) => {
    setSelectedState(state);
    setSelectedCity('');
  };

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-4 rounded-lg shadow-lg min-w-[180px]">
          <p className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest mb-3 border-b border-slate-100 dark:border-white/5 pb-2">
            Atualização: {label}
          </p>
          <div className="space-y-3">
            {payload.map((entry: TooltipEntry, index: number) => (
              <div key={index} className="flex items-center justify-between gap-4">
                 <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{entry.name}</span>
                 </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                    {entry.name === 'Posição'
                      ? `${entry.value}º`
                      : entry.name === 'Percentil'
                        ? `${entry.value}%`
                        : `${Number(entry.value).toLocaleString('pt-BR')} pts`}
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

  const rankingProcessing = data?.status === 'processing';
  const rankingEmpty = data?.status === 'empty';
  const rankingStale = data?.status === 'stale';
  const rankingLocked = data?.status === 'locked';

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-20">
      {isError && (
        <Card className="border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/20">
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3"><AlertCircle className="mt-0.5 h-5 w-5 text-red-600" /><div><p className="font-semibold text-red-900 dark:text-red-200">Não foi possível atualizar o ranking</p><p className="mt-1 text-sm text-red-800/80 dark:text-red-200/80">Os dados exibidos abaixo não foram atualizados nesta tentativa.</p></div></div>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>Tentar novamente</Button>
          </CardContent>
        </Card>
      )}
      {isPlaceholderData && (
        <p className="text-sm text-muted-foreground" role="status">
          Atualizando a comparação para os filtros selecionados.
        </p>
      )}
      {(rankingProcessing || rankingEmpty || rankingStale || rankingLocked) && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20">
          <CardContent className="p-5">
            <p className="font-semibold text-amber-900 dark:text-amber-200">
              {rankingLocked
                ? 'Ranking avançado bloqueado'
                : rankingProcessing
                  ? 'Ranking em processamento'
                  : rankingStale
                    ? 'Ranking com dados defasados'
                    : 'População insuficiente para comparar'}
            </p>
            <p className="mt-1 text-sm text-amber-800/80 dark:text-amber-200/80">
              {rankingLocked
                ? 'Altere seu plano para acessar o desempenho orgânico.'
                : rankingProcessing
                  ? 'O primeiro snapshot diário está sendo calculado. Tente novamente após a próxima atualização.'
                  : rankingStale
                    ? 'Mostramos o último snapshot disponível enquanto a atualização é concluída.'
                    : 'Amplie os filtros ou aguarde empresas comparáveis neste escopo.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Cabeçalho estratégico */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-6 w-6 text-amber-500" />
            <h2 className="text-3xl font-bold tracking-tight uppercase text-foreground dark:text-white">
              Desempenho no Mercado
            </h2>
          </div>
          <p className="text-sm text-muted-foreground font-medium max-w-lg leading-relaxed">
            Acompanhe sua posição no Avalia Solar, compare seu desempenho e entenda os fatores que influenciam o ranking orgânico.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex p-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 items-center px-4 py-1.5 gap-3">
            <Award className="h-4 w-4 text-amber-500" />
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest whitespace-nowrap">
              Sua posição: {ranking?.position && ranking?.population ? `${ranking.position}º de ${ranking.population} empresas` : 'aguardando ranking'}
            </span>
          </div>
          {isPreview && (
            <div className="flex p-1 bg-brand-blue/5 rounded-lg border border-brand-blue/20 items-center px-4 py-1.5 gap-3">
              <ShieldCheck className="h-4 w-4 text-brand-blue" />
              <span className="text-[10px] font-bold text-brand-blue uppercase tracking-widest whitespace-nowrap">
                Comparação atual ativa
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Matriz de KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Sua posição"
          value={ranking?.position && ranking?.population ? `${ranking.position}º de ${ranking.population}` : '--'}
          icon={Activity}
          change={positionMovement || (hasSnapshot ? 'Ranking oficial' : 'Aguardando snapshot')}
          changeType="neutral"
          color="brand-yellow"
          delay={0.1}
        />
        <MetricCard
          title="Percentil de mercado"
          value={ranking?.percentile != null ? `${Number(ranking.percentile).toFixed(1)}%` : '--'}
          icon={Target}
          change={ranking?.population ? `Entre ${ranking.population} empresas` : 'Aguardando população'}
          changeType="neutral"
          color="brand-blue"
          delay={0.2}
        />
        <MetricCard
          title="Pontuação orgânica"
          value={ranking?.score != null ? `${Number(ranking.score).toFixed(1)} pts` : '--'}
          icon={ShieldCheck}
          change="Usada no ranking orgânico"
          changeType="neutral"
          color="brand-green"
          delay={0.3}
        />
        <MetricCard
          title="Conversão do perfil"
          value={stats?.conversionRate !== undefined ? `${Number(stats.conversionRate).toFixed(1)}%` : '--'}
          icon={Target}
          change="Leads gerados por visualizações"
          changeType="neutral"
          color="brand-cyan"
          delay={0.4}
        />
      </div>

      <Card className="border border-sky-100 bg-sky-50/50 dark:border-sky-900/30 dark:bg-sky-950/20">
        <CardContent className="p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
          <p className="text-xs font-bold text-sky-900 dark:text-sky-200">Ranking orgânico</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                {transparency?.score_definition || 'Snapshot ainda não disponível. O ranking será calculado no próximo ciclo de dados.'}
              </p>
            </div>
            <Badge variant="outline" className="w-fit text-[10px]">{transparency?.definition_version || 'Pendente'}</Badge>
          </div>
          <div className="mt-3 grid gap-2 text-[11px] text-slate-500 sm:grid-cols-3">
            <span>Escopo: {transparency?.scope === 'category' ? 'categoria' : 'global'}</span>
            <span>Patrocínio: {transparency?.sponsored_included ? 'incluído' : 'não influencia este ranking'}</span>
            <span>Atualizado: {transparency?.computed_at ? new Date(transparency.computed_at).toLocaleString('pt-BR') : 'aguardando processamento'}</span>
          </div>
          {transparency?.quality_flags?.length ? <p className="mt-2 text-[10px] text-amber-700 dark:text-amber-300">Qualidade dos dados: {transparency.quality_flags.join(', ')}</p> : null}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Visualização de Vetor de Crescimento */}
        <Card className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <CardHeader className="p-6 border-b border-slate-200/50 dark:border-white/[0.06] flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold text-foreground dark:text-white tracking-tight flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-brand-blue" />
                Evolução do desempenho orgânico
              </CardTitle>
              <CardDescription className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                {isPreview ? `O histórico representa o ranking oficial · ${historyLabel}` : `Snapshots diários · ${historyLabel}`}
              </CardDescription>
            </div>
            <Select value={historyMetric} onValueChange={(value) => setHistoryMetric(value as typeof historyMetric)}>
              <SelectTrigger className="w-[150px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="position">Posição</SelectItem>
                <SelectItem value="percentile">Percentil</SelectItem>
                <SelectItem value="score">Pontuação</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="p-8 pb-12">
            <div className="h-[400px] w-full mt-6">
              {historicalData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historicalData} margin={{ top: 20, right: 30, bottom: 20, left: -20 }}>
                    <defs>
                      <linearGradient id="ranking-history-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={selectedHistoryMetric.color} stopOpacity={0.24}/>
                        <stop offset="95%" stopColor={selectedHistoryMetric.color} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="week"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fontWeight: 600, fill: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
                      dy={15}
                    />
                    <YAxis
                      reversed={selectedHistoryMetric.reversed}
                      domain={historyMetric === 'position' ? [1, 'dataMax + 1'] : ['auto', 'auto']}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fontWeight: 800, fill: selectedHistoryMetric.color, fontFamily: 'var(--font-mono)' }}
                    />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }} />
                    <Area
                      type="monotone"
                      dataKey={historyMetric}
                      stroke={selectedHistoryMetric.color}
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#ranking-history-gradient)"
                      name={selectedHistoryMetric.label}
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
                  Mapa de Posicionamento
                </CardTitle>
                <div className="h-9 w-9 rounded-xl bg-brand-green/10 flex items-center justify-center">
                   <Activity className="h-4 w-4 text-brand-green" />
                </div>
              </div>

              <div className="relative group">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-brand-blue transition-colors" />
                <Select value={selectedCategoryId} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="w-full h-11 pl-12 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-[10px] font-bold uppercase tracking-widest focus:ring-brand-blue/30">
                    <SelectValue placeholder="SELETOR DE ESCOPO (CATEGORIA)" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <SelectItem value="all" className="text-[10px] font-bold uppercase">ESCOPO GLOBAL</SelectItem>
                    {(filterOptions?.categories || []).map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)} className="text-[10px] font-bold uppercase">
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="relative group">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-brand-blue transition-colors" />
                <Select value={selectedState} onValueChange={handleStateChange}>
                  <SelectTrigger className="w-full h-11 pl-12 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-[10px] font-bold uppercase tracking-widest focus:ring-brand-blue/30">
                    <SelectValue placeholder="ESTADO (UF)" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <SelectItem value="all" className="text-[10px] font-bold uppercase">BRASIL TODO</SelectItem>
                    {(filterOptions?.states || []).map((uf) => (
                      <SelectItem key={uf} value={uf} className="text-[10px] font-bold uppercase">{uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="relative group">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-brand-blue transition-colors" />
                <Select value={selectedSector} onValueChange={setSelectedSector}>
                  <SelectTrigger className="w-full h-11 pl-12 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-[10px] font-bold uppercase tracking-widest focus:ring-brand-blue/30">
                    <SelectValue placeholder="SETOR / PROJETO" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <SelectItem value="all" className="text-[10px] font-bold uppercase">TODOS OS SETORES</SelectItem>
                    {(filterOptions?.sectors || []).map((sector) => (
                      <SelectItem key={sector} value={sector} className="text-[10px] font-bold uppercase">
                        {sector}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="relative group">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-brand-blue transition-colors" />
                <input 
                  type="text"
                  list="ranking-city-options"
                  placeholder="CIDADE (EX: SÃO PAULO)"
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full h-11 pl-12 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-[10px] font-bold uppercase tracking-widest focus:ring-brand-blue/30 focus:outline-none"
                />
                <datalist id="ranking-city-options">
                  {(filterOptions?.cities || []).map((city) => <option key={city} value={city} />)}
                </datalist>
              </div>

              <div className="relative group">
                <Select value={quadrantMode} onValueChange={(value) => setQuadrantMode(value as 'default' | 'reviews')}>
                  <SelectTrigger className="w-full h-11 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-[10px] font-bold uppercase tracking-widest">
                    <SelectValue placeholder="BASE DO QUADRANTE" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Autoridade e execução</SelectItem>
                    <SelectItem value="reviews">Somente reviews</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="relative group">
                <Select value={historyDays} onValueChange={setHistoryDays}>
                  <SelectTrigger className="w-full h-11 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-[10px] font-bold uppercase tracking-widest focus:ring-brand-blue/30">
                    <SelectValue placeholder="PERÍODO" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <SelectItem value="30" className="text-[10px] font-bold uppercase">Últimos 30 dias</SelectItem>
                    <SelectItem value="90" className="text-[10px] font-bold uppercase">Últimos 90 dias</SelectItem>
                    <SelectItem value="365" className="text-[10px] font-bold uppercase">Últimos 12 meses</SelectItem>
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
                    {(criteriaQuery.data?.criteria || []).map((criterion: Criterion) => (
                      <SelectItem key={criterion.slug} value={criterion.slug} className="text-[10px] font-bold uppercase">
                        {criterion.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {hasActiveFilters && <Button type="button" variant="ghost" size="sm" className="w-full" onClick={resetFilters}><RotateCcw className="mr-2 h-4 w-4" />Limpar filtros</Button>}
            </div>
          </CardHeader>
          <CardContent className="p-8 flex-1 flex flex-col">
            <div className="flex-1 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 relative overflow-hidden group/quad">
              {quadrantData.length > 0 ? (
                <MagicQuadrant
                  data={quadrantData}
                  xAxisLabel={quadrantMeta?.x_axis_label}
                  yAxisLabel={quadrantMeta?.y_axis_label}
                  criterionTitle={quadrantMeta?.criterion_title}
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
                  <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">Como melhorar sua posição</p>
                  <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                    {selectedCriterionSlug !== 'all'
                      ? `A comparação atual usa ${quadrantMeta?.criterion_title || 'o critério selecionado'} no mapa. Ela não altera sua posição oficial nem o histórico.`
                      : data?.insights?.next_best_action?.message || 'Aguardando dados comparáveis para recomendar uma ação específica.'}
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
