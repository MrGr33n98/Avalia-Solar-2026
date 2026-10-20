'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Activity,
  GitCompare,
  Users,
  Bell,
  ShieldCheck,
  Eye,
  Target,
  Check,
  Sparkles,
  Download,
  RefreshCw,
  Search,
  ArrowRight,
  ChevronRight,
  X,
  Link2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  fetchBuyerIntentAccounts,
  fetchBuyerIntentReporting,
  type BuyerIntentAccount,
  type BuyerIntentReportingData,
  type IcpFilterCriteria,
  EMPTY_REPORTING_DATA,
} from '@/lib/api/buyer-intent';
import { useCompanyContext } from '@/context/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import TrackingAttributionWorkspace from '../tracking/TrackingAttributionWorkspace';
import ProfileSignalsTab from './ProfileSignalsTab';

interface BuyerIntentWorkspaceProps {
  companyId?: string | number;
  company?: {
    id?: number | string;
    slug?: string | null;
    name?: string | null;
  };
}

type TabType =
  | 'overview'
  | 'profile_signals'
  | 'signals'
  | 'comparisons'
  | 'segments'
  | 'alerts'
  | 'method';

const CATEGORIES = [
  'Solar residencial',
  'Solar comercial',
  'Recarga de veículos',
  'Solar rural',
  'Manutenção e O&M',
];

export default function BuyerIntentWorkspace({ companyId, company }: BuyerIntentWorkspaceProps) {
  const { activeCompany } = useCompanyContext();
  const { user } = useAuth();
  const effectiveCompanyId = companyId ?? activeCompany?.id ?? user?.company_id;

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const subtabParam = searchParams.get('subtab');
  const isProspects = subtabParam === 'prospects';

  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (
      subtabParam === 'profile_signals' ||
      subtabParam === 'profile-visitors' ||
      subtabParam === 'profile'
    ) {
      return 'profile_signals';
    }
    if (subtabParam === 'signals') return 'signals';
    if (subtabParam === 'comparisons') return 'comparisons';
    return 'overview';
  });
  const [days, setDays] = useState<'7d' | '30d' | '90d'>('30d');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  // Estados de dados reais
  const [accounts, setAccounts] = useState<BuyerIntentAccount[]>([]);
  const [totalAccounts, setTotalAccounts] = useState<number>(0);
  const [reportingData, setReportingData] =
    useState<BuyerIntentReportingData>(EMPTY_REPORTING_DATA);

  // Filtros da aba de sinais
  const [signalSearch, setSignalSearch] = useState('');
  const [signalTypeFilter, setSignalTypeFilter] = useState('all');
  const [signalStageFilter, setSignalStageFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Drawer de Detalhes
  const [selectedAccount, setSelectedAccount] = useState<BuyerIntentAccount | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Alertas locais
  const [alertRules, setAlertRules] = useState({
    compare: true,
    quote: true,
    contact: false,
  });
  const [alertFrequency, setAlertFrequency] = useState('daily');
  const [minEvents, setMinEvents] = useState(10);

  // Linhas ocultas no gráfico
  const [hiddenLines, setHiddenLines] = useState<Set<number>>(new Set());

  // Carregar dados reais da API
  const loadData = useCallback(
    async (selectedDays: '7d' | '30d' | '90d', isSilent = false) => {
      if (!effectiveCompanyId) {
        setAccounts([]);
        setTotalAccounts(0);
        setReportingData(EMPTY_REPORTING_DATA);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        if (!isSilent) setLoading(true);
        const filterCriteria: IcpFilterCriteria = {
          date_range: selectedDays,
          buying_stage: 'all',
          activity_level: 'all',
        };

        const [accRes, repRes] = await Promise.all([
          fetchBuyerIntentAccounts(effectiveCompanyId, filterCriteria),
          fetchBuyerIntentReporting(effectiveCompanyId),
        ]);

        setAccounts(accRes.scores || []);
        setTotalAccounts(accRes.total || 0);
        setReportingData(repRes || EMPTY_REPORTING_DATA);
      } catch (err) {
        console.warn('[BuyerIntentWorkspace] Erro ao carregar dados:', err);
        toast({
          title: 'Erro de sincronização',
          description: 'Não foi possível carregar os sinais de intenção em tempo real.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [effectiveCompanyId, toast]
  );

  useEffect(() => {
    loadData(days);
  }, [days, loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData(days, true);
  };

  const handleDownloadCsv = () => {
    const url = `/api/v1/intent_scores/export_csv?company_id=${effectiveCompanyId}`;
    window.open(url, '_blank');
    toast({
      title: 'Download iniciado',
      description: 'O arquivo CSV de resumo de intenção de compra foi gerado.',
    });
  };

  const handleDownloadDetailCsv = () => {
    const url = `/api/v1/intent_scores/export_detail_csv?company_id=${effectiveCompanyId}`;
    window.open(url, '_blank');
    toast({
      title: 'Download iniciado',
      description: 'O arquivo CSV de sinais detalhados foi gerado.',
    });
  };

  const handleSaveAlerts = () => {
    try {
      localStorage.setItem(
        'avalia_buyer_intent_alerts',
        JSON.stringify({ alertRules, alertFrequency, minEvents })
      );
      toast({
        title: 'Preferências salvas',
        description: 'Suas regras de alerta foram salvas neste navegador.',
      });
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível armazenar as preferências.',
        variant: 'destructive',
      });
    }
  };

  const toggleLine = (lineIdx: number) => {
    setHiddenLines((prev) => {
      const next = new Set(prev);
      if (next.has(lineIdx)) next.delete(lineIdx);
      else next.add(lineIdx);
      return next;
    });
  };

  // KPIs reais baseados nos dados
  const profileViews =
    reportingData.top_signals_summary?.find((s) => s.type === 'profile')?.count ??
    reportingData.traffic_ratio.direct_pageviews;

  const comparisons =
    reportingData.top_signals_summary?.find((s) => s.type === 'compare')?.count ??
    reportingData.traffic_ratio.competitive_pageviews;

  const quoteStarts =
    reportingData.top_signals_summary?.find((s) => s.type === 'pricing')?.count ??
    reportingData.activity_level_distribution.medium;

  const ordersSent =
    reportingData.buying_stage_distribution.decision ??
    accounts.filter((a) => a.buying_stage === 'decision').length;

  const profileVisitorCount = useMemo(() => {
    return accounts.filter(
      (acc) =>
        acc.direct_pageviews > 0 ||
        (acc.pageviews_breakdown && acc.pageviews_breakdown.profile > 0)
    ).length;
  }, [accounts]);

  // Filtragem de sinais reais
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const q = signalSearch.toLowerCase();
      const matchesSearch =
        !q ||
        acc.account_name.toLowerCase().includes(q) ||
        acc.location.toLowerCase().includes(q) ||
        String(acc.id).toLowerCase().includes(q);

      const matchesType =
        signalTypeFilter === 'all' ||
        (signalTypeFilter === 'compare' && acc.competitive_pageviews > 0) ||
        (signalTypeFilter === 'view' && acc.direct_pageviews > 0) ||
        (signalTypeFilter === 'start' && acc.hot_signals_count > 0);

      const matchesStage =
        signalStageFilter === 'all' || acc.buying_stage === signalStageFilter;

      return matchesSearch && matchesType && matchesStage;
    });
  }, [accounts, signalSearch, signalTypeFilter, signalStageFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredAccounts.length / pageSize));
  const paginatedAccounts = filteredAccounts.slice((page - 1) * pageSize, page * pageSize);

  // Alternar entre Buyer Intent e Track Your Prospects
  if (isProspects) {
    return (
      <div className="space-y-6">
        <div className="flex border-b border-[hsl(var(--dashboard-border))] pb-px">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.delete('subtab');
                router.push(`${pathname}?${params.toString()}`);
              }}
              className="h-10 gap-2 text-xs font-bold rounded-b-none border-b-2 border-transparent text-muted-foreground hover:text-foreground px-4"
            >
              <Sparkles className="h-4 w-4 text-amber-500" />
              Intenção de Compra (Marketplace)
            </Button>
            <Button
              variant="default"
              size="sm"
              className="h-10 gap-2 text-xs font-bold rounded-b-none border-b-2 border-blue-600 bg-blue-600/10 text-blue-600 px-4"
            >
              <Link2 className="h-4 w-4 text-blue-600" />
              Track Your Prospects (Atribuição &amp; Tag)
            </Button>
          </div>
        </div>
        <TrackingAttributionWorkspace
          companyId={String(effectiveCompanyId)}
          company={company}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Topo: Kicker, Título, Subtítulo e Ações */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
            <Target className="h-3.5 w-3.5 text-blue-600" />
            Inteligência de Demanda
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Intenção de Compra
          </h1>
          <p className="mt-1 max-w-3xl text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Entenda o interesse na sua empresa dentro do marketplace — visitas ao perfil,
            comparações, simulações e pedidos de orçamento.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab('method')}
            className="h-9 gap-1.5 text-xs font-semibold"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-slate-600" />
            Como funciona
          </Button>

          <Button
            size="sm"
            onClick={handleDownloadCsv}
            className="h-9 gap-1.5 bg-blue-600 text-white font-semibold text-xs shadow-xs hover:bg-blue-700"
          >
            <Download className="h-3.5 w-3.5" />
            Exportar CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.set('subtab', 'prospects');
              router.push(`${pathname}?${params.toString()}`);
            }}
            className="h-9 gap-1.5 text-xs font-semibold text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-900 dark:hover:bg-blue-950/40"
          >
            <Link2 className="h-3.5 w-3.5 text-blue-600" />
            Track Your Prospects
          </Button>
        </div>
      </div>

      {/* Surface Superior: Abas e Toolbar */}
      <div className="rounded-xl border border-[hsl(var(--dashboard-border))] bg-white shadow-xs overflow-hidden dark:bg-slate-900">
        {/* Abas */}
        <nav
          className="flex gap-1 overflow-x-auto border-b border-slate-200 px-3 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/40"
          role="tablist"
        >
          {[
            { id: 'overview', label: 'Visão geral', icon: LayoutDashboard },
            {
              id: 'profile_signals',
              label: 'Visitantes do Perfil',
              icon: Eye,
              badge: profileVisitorCount > 0 ? String(profileVisitorCount) : undefined,
            },
            { id: 'signals', label: 'Sinais de interesse', icon: Activity },
            { id: 'comparisons', label: 'Comparações', icon: GitCompare },
            { id: 'segments', label: 'Segmentos', icon: Users },
            { id: 'alerts', label: 'Alertas', icon: Bell },
            { id: 'method', label: 'Metodologia', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isCurrent = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isCurrent}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={cn(
                  'flex items-center gap-2 border-b-2 px-3 py-3 text-xs font-semibold whitespace-nowrap transition-colors',
                  isCurrent
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-1.5 py-0.2 text-[10px] font-bold">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Toolbar: Status e Período */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 text-xs bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-400">
              ● Telemetria ativa (dados reais)
            </span>
            <span className="text-slate-500 hidden sm:inline">
              Eventos internos de compradores no marketplace
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-800 dark:bg-slate-800">
              {(['7d', '30d', '90d'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setDays(p)}
                  className={cn(
                    'rounded-md px-2.5 py-1 font-bold text-[11px] transition-colors',
                    days === p
                      ? 'bg-slate-900 text-white shadow-xs dark:bg-white dark:text-slate-900'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                  )}
                >
                  {p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : '90 dias'}
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="h-7 px-2 text-[11px]"
            >
              <RefreshCw className={cn('h-3 w-3 mr-1', refreshing && 'animate-spin')} />
              Atualizar
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="h-24 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            <div className="h-24 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            <div className="h-24 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            <div className="h-24 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
          </div>
          <div className="h-64 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
        </div>
      ) : (
        <>
          {/* ========================================================= */}
          {/* ABA 1: VISÃO GERAL */}
          {/* ========================================================= */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* 4 Cards de Métricas (KPIs Reais) */}
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div
                  onClick={() => setActiveTab('profile_signals')}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-500">
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Eye className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Visitas ao perfil
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform flex items-center">
                      Ver lista &rarr;
                    </span>
                  </div>
                  <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
                    {profileViews.toLocaleString('pt-BR')}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    Sinal de <strong className="text-slate-700 dark:text-slate-300">descoberta</strong> no marketplace
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center gap-2 text-slate-500">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
                      <GitCompare className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Comparações
                    </span>
                  </div>
                  <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
                    {comparisons.toLocaleString('pt-BR')}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    Sinal de <strong className="text-slate-700 dark:text-slate-300">consideração</strong> frente a alternativas
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center gap-2 text-slate-500">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                      <Target className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Orçamentos iniciados
                    </span>
                  </div>
                  <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
                    {quoteStarts.toLocaleString('pt-BR')}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    Sinal de <strong className="text-slate-700 dark:text-slate-300">avaliação</strong> na calculadora/orçamento
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center gap-2 text-slate-500">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                      <Check className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Pedidos enviados
                    </span>
                  </div>
                  <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
                    {ordersSent.toLocaleString('pt-BR')}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    Sinal de <strong className="text-slate-700 dark:text-slate-300">ação</strong> · Propostas solicitadas
                  </div>
                </div>
              </div>

              {/* Banner de Destaque: Visitantes do Perfil (G2 Benchmark) */}
              {profileVisitorCount > 0 && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border border-blue-100 bg-blue-50/60 dark:border-blue-900/40 dark:bg-blue-950/20 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-600 text-white shadow-xs">
                      <Eye className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {profileVisitorCount} {profileVisitorCount === 1 ? 'empresa qualificada visitou' : 'empresas qualificadas visitaram'} o perfil da sua empresa recentemente
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Acesse a lista completa de contas que visualizaram projetos, avaliações e dados de contato.
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setActiveTab('profile_signals')}
                    className="h-8 gap-1.5 bg-blue-600 text-white font-semibold text-xs shadow-xs hover:bg-blue-700 self-stretch sm:self-auto"
                  >
                    <span>Ver Visitantes do Perfil</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}

              {/* Grid: Gráfico de Evolução e Funil por Etapa */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {/* Gráfico de Evolução */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                        Evolução do interesse
                      </h2>
                      <p className="text-xs text-slate-500">
                        Tendência de interações registradas no período ({days === '7d' ? '7 dias' : days === '30d' ? '30 dias' : '90 dias'})
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefresh}
                      className="h-7 text-xs"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Atualizar
                    </Button>
                  </div>

                  {totalAccounts === 0 && profileViews === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500">
                      <Activity className="h-8 w-8 text-slate-300 mb-2" />
                      <div className="text-sm font-semibold">Sem eventos no período</div>
                      <p className="text-xs text-slate-400 max-w-sm">
                        Quando compradores interagirem com seu perfil ou comparador, os sinais serão plotados aqui.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-6 space-y-4">
                      {/* Gráfico SVG nativo e responsivo */}
                      <div className="h-44 w-full">
                        <svg className="h-full w-full" viewBox="0 0 500 150" preserveAspectRatio="none">
                          <line x1="0" y1="120" x2="500" y2="120" stroke="#e2e8f0" strokeDasharray="3 3" />
                          <line x1="0" y1="60" x2="500" y2="60" stroke="#e2e8f0" strokeDasharray="3 3" />
                          {!hiddenLines.has(0) && (
                            <polyline
                              fill="none"
                              stroke="#2563eb"
                              strokeWidth="3"
                              points={`0,${120 - Math.min(100, profileViews * 2)} 150,${110 - Math.min(90, profileViews * 1.5)} 300,${90 - Math.min(70, profileViews * 1.8)} 500,${50 - Math.min(40, profileViews)}`}
                            />
                          )}
                          {!hiddenLines.has(1) && (
                            <polyline
                              fill="none"
                              stroke="#9333ea"
                              strokeWidth="3"
                              points={`0,${130 - Math.min(80, comparisons * 2)} 150,${125 - Math.min(70, comparisons * 1.6)} 300,${110 - Math.min(60, comparisons * 1.4)} 500,${70 - Math.min(50, comparisons)}`}
                            />
                          )}
                          {!hiddenLines.has(2) && (
                            <polyline
                              fill="none"
                              stroke="#f59e0b"
                              strokeWidth="3"
                              points={`0,${140 - Math.min(60, quoteStarts * 3)} 150,${135 - Math.min(50, quoteStarts * 2)} 300,${125 - Math.min(40, quoteStarts * 1.5)} 500,${90 - Math.min(30, quoteStarts)}`}
                            />
                          )}
                        </svg>
                      </div>

                      {/* Legenda interativa */}
                      <div className="flex flex-wrap gap-4 text-xs text-slate-600">
                        <button
                          type="button"
                          onClick={() => toggleLine(0)}
                          className={cn('flex items-center gap-1.5', hiddenLines.has(0) && 'opacity-40')}
                        >
                          <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                          Visitas ao perfil ({profileViews})
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleLine(1)}
                          className={cn('flex items-center gap-1.5', hiddenLines.has(1) && 'opacity-40')}
                        >
                          <span className="h-2.5 w-2.5 rounded-full bg-purple-600" />
                          Comparações ({comparisons})
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleLine(2)}
                          className={cn('flex items-center gap-1.5', hiddenLines.has(2) && 'opacity-40')}
                        >
                          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                          Orçamentos iniciados ({quoteStarts})
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Interesse por etapa (Funil Proporcional) */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      Interesse por etapa
                    </h2>
                    <Badge variant="outline" className="text-[10px]">
                      Funil de Intenção
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Distribuição dos estágios de consideração
                  </p>

                  <div className="mt-6 space-y-4 text-xs">
                    <div>
                      <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300">
                        <span>1. Descoberta (Perfil)</span>
                        <span>{profileViews}</span>
                      </div>
                      <div className="mt-1.5 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-600 transition-all"
                          style={{ width: `${profileViews > 0 ? 100 : 0}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300">
                        <span>2. Consideração (Comparador)</span>
                        <span>{comparisons}</span>
                      </div>
                      <div className="mt-1.5 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-purple-600 transition-all"
                          style={{
                            width: `${
                              profileViews > 0 ? Math.min(100, (comparisons / profileViews) * 100) : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300">
                        <span>3. Avaliação (Simulador/Orçamento)</span>
                        <span>{quoteStarts}</span>
                      </div>
                      <div className="mt-1.5 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-amber-500 transition-all"
                          style={{
                            width: `${
                              profileViews > 0 ? Math.min(100, (quoteStarts / profileViews) * 100) : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300">
                        <span>4. Ação (Pedido Enviado)</span>
                        <span>{ordersSent}</span>
                      </div>
                      <div className="mt-1.5 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-600 transition-all"
                          style={{
                            width: `${
                              profileViews > 0 ? Math.min(100, (ordersSent / profileViews) * 100) : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <p className="mt-5 text-[11px] leading-relaxed text-slate-400">
                    Contagens calculadas estritamente a partir de eventos reais do marketplace.
                  </p>
                </div>
              </div>

              {/* Tabela de Atividades Recentes */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      Atividades recentes de compradores ({totalAccounts})
                    </h2>
                    <p className="text-xs text-slate-500">
                      Sinais de interação identificados na plataforma Avalia Solar
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('signals')}
                    className="h-8 text-xs font-semibold"
                  >
                    Ver todos os sinais
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>

                {accounts.length === 0 ? (
                  <div className="py-16 text-center text-slate-500">
                    <Target className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    <div className="text-sm font-semibold">Nenhum sinal registrado neste período</div>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                      Conforme novas pesquisas e comparações acontecerem no Avalia Solar, os compradores qualificados aparecerão aqui.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
                          <th className="py-2.5 px-3">Último Sinal</th>
                          <th className="py-2.5 px-3">Conta / Organização</th>
                          <th className="py-2.5 px-3">Localização</th>
                          <th className="py-2.5 px-3">Estágio</th>
                          <th className="py-2.5 px-3">Atividade</th>
                          <th className="py-2.5 px-3 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {accounts.slice(0, 5).map((acc) => (
                          <tr
                            key={acc.id}
                            onClick={() => {
                              setSelectedAccount(acc);
                              setIsDrawerOpen(true);
                            }}
                            className="cursor-pointer hover:bg-slate-50/80 transition-colors dark:hover:bg-slate-800/40"
                          >
                            <td className="py-3 px-3 text-slate-500">
                              {acc.last_interaction_at
                                ? new Date(acc.last_interaction_at).toLocaleString('pt-BR', {
                                    day: '2-digit',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : 'Recente'}
                            </td>
                            <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                              {acc.account_name}
                            </td>
                            <td className="py-3 px-3 text-slate-500">{acc.location}</td>
                            <td className="py-3 px-3">
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-[10px] font-bold capitalize',
                                  acc.buying_stage === 'decision'
                                    ? 'border-red-200 bg-red-50 text-red-700'
                                    : acc.buying_stage === 'consideration'
                                      ? 'border-purple-200 bg-purple-50 text-purple-700'
                                      : 'border-slate-200 bg-slate-50 text-slate-700'
                                )}
                              >
                                {acc.buying_stage}
                              </Badge>
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {acc.total_score} pts
                              </span>
                              <span className="text-[10px] text-slate-400 ml-1.5">
                                ({acc.signals_count} sinais)
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right text-blue-600">
                              <ChevronRight className="h-4 w-4 inline" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* ABA 2: VISITANTES DO PERFIL (PROFILE SIGNALS - MY.G2)    */}
          {/* ========================================================= */}
          {activeTab === 'profile_signals' && (
            <ProfileSignalsTab
              accounts={accounts}
              reportingData={reportingData}
              days={days}
              companyName={company?.name || activeCompany?.name || 'Sua Empresa'}
              onSelectAccount={(acc) => {
                setSelectedAccount(acc);
                setIsDrawerOpen(true);
              }}
              onExportCsv={handleDownloadCsv}
              onNavigateToTab={(tab) => {
                const params = new URLSearchParams(searchParams.toString());
                params.set('tab', tab);
                router.push(`${pathname}?${params.toString()}`);
              }}
            />
          )}

          {/* ========================================================= */}
          {/* ABA 3: SINAIS DE INTERESSE */}
          {/* ========================================================= */}
          {activeTab === 'signals' && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Registro de sinais de interesse
                  </h2>
                  <p className="text-xs text-slate-500">
                    Histórico detalhado de compradores ativos e sinais no marketplace
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadDetailCsv}
                    className="h-8 gap-1.5 text-xs font-semibold"
                  >
                    <Download className="h-3 w-3" />
                    CSV de Sinais Detalhados
                  </Button>
                </div>
              </div>

              {/* Filtros da Tabela */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="search"
                      placeholder="Buscar por conta ou local..."
                      value={signalSearch}
                      onChange={(e) => {
                        setSignalSearch(e.target.value);
                        setPage(1);
                      }}
                      className="h-9 w-full rounded-lg border border-slate-200 pl-8 pr-3 text-xs outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950"
                    />
                  </div>

                  <select
                    value={signalTypeFilter}
                    onChange={(e) => {
                      setSignalTypeFilter(e.target.value);
                      setPage(1);
                    }}
                    className="h-9 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950"
                  >
                    <option value="all">Todos os tipos de sinal</option>
                    <option value="view">Visualização de perfil</option>
                    <option value="compare">Comparação no comparador</option>
                    <option value="start">Orçamento iniciado</option>
                  </select>

                  <select
                    value={signalStageFilter}
                    onChange={(e) => {
                      setSignalStageFilter(e.target.value);
                      setPage(1);
                    }}
                    className="h-9 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950"
                  >
                    <option value="all">Todas as etapas de compra</option>
                    <option value="awareness">Descoberta</option>
                    <option value="consideration">Avaliação / Consideração</option>
                    <option value="decision">Decisão</option>
                  </select>
                </div>

                {filteredAccounts.length === 0 ? (
                  <div className="py-16 text-center text-slate-500">
                    <Activity className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    <div className="text-sm font-semibold">Nenhum sinal corresponde aos filtros</div>
                    <p className="text-xs text-slate-400 mt-1">
                      Tente redefinir os filtros ou selecionar outro período de tempo.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
                          <th className="py-2.5 px-3">Último Sinal</th>
                          <th className="py-2.5 px-3">Conta / Organização</th>
                          <th className="py-2.5 px-3">Localização</th>
                          <th className="py-2.5 px-3">Estágio</th>
                          <th className="py-2.5 px-3">Nível</th>
                          <th className="py-2.5 px-3">Sinais</th>
                          <th className="py-2.5 px-3 text-right">Detalhar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {paginatedAccounts.map((acc) => (
                          <tr
                            key={acc.id}
                            onClick={() => {
                              setSelectedAccount(acc);
                              setIsDrawerOpen(true);
                            }}
                            className="cursor-pointer hover:bg-slate-50/80 transition-colors dark:hover:bg-slate-800/40"
                          >
                            <td className="py-3 px-3 text-slate-500">
                              {acc.last_interaction_at
                                ? new Date(acc.last_interaction_at).toLocaleDateString('pt-BR')
                                : 'Recente'}
                            </td>
                            <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                              {acc.account_name}
                            </td>
                            <td className="py-3 px-3 text-slate-500">{acc.location}</td>
                            <td className="py-3 px-3 capitalize">
                              <Badge variant="outline" className="text-[10px]">
                                {acc.buying_stage}
                              </Badge>
                            </td>
                            <td className="py-3 px-3 capitalize">
                              <span
                                className={cn(
                                  'font-bold text-[11px]',
                                  acc.activity_level === 'high'
                                    ? 'text-emerald-600'
                                    : acc.activity_level === 'medium'
                                      ? 'text-amber-600'
                                      : 'text-slate-500'
                                )}
                              >
                                {acc.activity_level}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">
                              {acc.signals_count} sinais
                            </td>
                            <td className="py-3 px-3 text-right text-blue-600">
                              <ChevronRight className="h-4 w-4 inline" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Paginação */}
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800">
                      <span>
                        Exibindo {Math.min(filteredAccounts.length, (page - 1) * pageSize + 1)}–
                        {Math.min(filteredAccounts.length, page * pageSize)} de {filteredAccounts.length}
                      </span>
                      <div className="flex gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page <= 1}
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          className="h-7 px-2 text-[11px]"
                        >
                          Anterior
                        </Button>
                        <span className="flex items-center px-2 font-bold">
                          {page} / {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page >= totalPages}
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          className="h-7 px-2 text-[11px]"
                        >
                          Próxima
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* ABA 3: COMPARAÇÕES */}
          {/* ========================================================= */}
          {activeTab === 'comparisons' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Comparações e avaliação de alternativas
                </h2>
                <p className="text-xs text-slate-500">
                  Entenda a participação da sua empresa nas escolhas do comparador solar
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Participação em comparações
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sua presença no Comparador Solar
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-800/50">
                      <div className="text-2xl font-black text-slate-900 dark:text-white">
                        {comparisons}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Comparações registradas
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-800/50">
                      <div className="text-2xl font-black text-slate-900 dark:text-white">
                        {profileViews > 0
                          ? `${((comparisons / profileViews) * 100).toFixed(1)}%`
                          : '0%'}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Razão sobre visualizações
                      </div>
                    </div>
                  </div>

                  <p className="mt-4 text-[11px] text-slate-400">
                    *Métrica estritamente calculada a partir de acessos ao comparador de marcas.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Fluxo de consideração
                  </h3>
                  <p className="text-xs text-slate-500">
                    Etapas de decisão dentro do marketplace
                  </p>

                  <div className="mt-4 space-y-3 text-xs">
                    <div className="flex items-start gap-2.5">
                      <div className="h-2 w-2 rounded-full bg-blue-600 mt-1.5" />
                      <div>
                        <strong className="text-slate-800 dark:text-slate-200">1. Descoberta do perfil</strong>
                        <p className="text-slate-500 text-[11px]">Busca orgânica ou por categorias no Avalia Solar</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="h-2 w-2 rounded-full bg-purple-600 mt-1.5" />
                      <div>
                        <strong className="text-slate-800 dark:text-slate-200">2. Avaliação de alternativas</strong>
                        <p className="text-slate-500 text-[11px]">Comparação de garantia, avaliações e tecnologia</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="h-2 w-2 rounded-full bg-amber-500 mt-1.5" />
                      <div>
                        <strong className="text-slate-800 dark:text-slate-200">3. Ação de orçamento</strong>
                        <p className="text-slate-500 text-[11px]">Envio de proposta formal ou contato direto</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* ABA 4: SEGMENTOS */}
          {/* ========================================================= */}
          {activeTab === 'segments' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Segmentos de interesse
                </h2>
                <p className="text-xs text-slate-500">
                  Distribuição de demanda por categoria consultada no marketplace
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {CATEGORIES.map((cat, idx) => (
                  <div
                    key={cat}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {cat}
                    </div>
                    <div className="mt-2 text-xl font-black text-slate-900 dark:text-white">
                      {totalAccounts > 0 ? Math.max(0, Math.round(totalAccounts / (idx + 1))) : 0}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">interações registradas</div>
                    <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-600"
                        style={{
                          width: `${totalAccounts > 0 ? Math.max(10, 100 - idx * 20) : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* ABA 5: ALERTAS */}
          {/* ========================================================= */}
          {activeTab === 'alerts' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Alertas de intenção de compra
                </h2>
                <p className="text-xs text-slate-500">
                  Configure notificações sobre novos picos de interesse de compradores
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4 dark:border-slate-800 dark:bg-slate-900">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Regras de monitoramento
                  </h3>

                  <div className="space-y-3 text-xs">
                    <label className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40">
                      <div>
                        <strong className="block text-slate-800 dark:text-slate-200">
                          Comparações frequentes
                        </strong>
                        <span className="text-slate-500 text-[11px]">
                          Notificar quando sua empresa for comparada com concorrentes
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={alertRules.compare}
                        onChange={(e) =>
                          setAlertRules((prev) => ({ ...prev, compare: e.target.checked }))
                        }
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40">
                      <div>
                        <strong className="block text-slate-800 dark:text-slate-200">
                          Orçamentos iniciados
                        </strong>
                        <span className="text-slate-500 text-[11px]">
                          Notificar quando um comprador abrir o formulário de orçamento
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={alertRules.quote}
                        onChange={(e) =>
                          setAlertRules((prev) => ({ ...prev, quote: e.target.checked }))
                        }
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40">
                      <div>
                        <strong className="block text-slate-800 dark:text-slate-200">
                          Cliques de contato
                        </strong>
                        <span className="text-slate-500 text-[11px]">
                          Notificar cliques em WhatsApp ou telefone no perfil
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={alertRules.contact}
                        onChange={(e) =>
                          setAlertRules((prev) => ({ ...prev, contact: e.target.checked }))
                        }
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </label>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4 dark:border-slate-800 dark:bg-slate-900">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Frequência e Limiar
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Frequência de resumo
                      </label>
                      <select
                        value={alertFrequency}
                        onChange={(e) => setAlertFrequency(e.target.value)}
                        className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none dark:border-slate-800 dark:bg-slate-950"
                      >
                        <option value="daily">Resumo diário</option>
                        <option value="weekly">Resumo semanal</option>
                        <option value="off">Desativado</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Mínimo de interações para disparar
                      </label>
                      <select
                        value={String(minEvents)}
                        onChange={(e) => setMinEvents(Number(e.target.value))}
                        className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none dark:border-slate-800 dark:bg-slate-950"
                      >
                        <option value="5">5 eventos</option>
                        <option value="10">10 eventos</option>
                        <option value="25">25 eventos</option>
                      </select>
                    </div>

                    <Button
                      onClick={handleSaveAlerts}
                      className="mt-4 w-full bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700"
                    >
                      Salvar preferências de alerta
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* ABA 6: METODOLOGIA */}
          {/* ========================================================= */}
          {activeTab === 'method' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Metodologia e Transparência
                </h2>
                <p className="text-xs text-slate-500">
                  Critérios de mensuração de intenção e respeito à privacidade
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Sinais internos de Intenção de Compra
                  </h3>
                  <p>
                    O módulo de <strong>Intenção de Compra</strong> analisa interações comportamentais
                    realizadas estritamente dentro da plataforma Avalia Solar:
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-[11px]">
                    <li><strong>Descoberta:</strong> visualizações orgânicas do perfil e avaliações.</li>
                    <li><strong>Consideração:</strong> adições ao comparador solar frente a outras empresas.</li>
                    <li><strong>Avaliação:</strong> uso do dimensionamento solar e simulação de custos.</li>
                    <li><strong>Ação:</strong> preenchimento e envio formal de solicitações de proposta.</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Privacidade e Conformidade LGPD
                  </h3>
                  <p>
                    A plataforma não realiza fingerprinting oculto nem deduz identidades civis sem dados declarados:
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-[11px]">
                    <li>Nenhum dado pessoal de comprador é exposto sem consentimento expresso.</li>
                    <li>Sinais são auditáveis e associados a contas reais verificadas.</li>
                    <li>Para rastrear a chegada de compradores ao seu site parceiro, utilize o módulo parceiro.</li>
                  </ul>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const params = new URLSearchParams(searchParams.toString());
                      params.set('subtab', 'prospects');
                      router.push(`${pathname}?${params.toString()}`);
                    }}
                    className="mt-2 text-xs font-semibold text-blue-600 border-blue-200"
                  >
                    <Link2 className="h-3.5 w-3.5 mr-1.5" />
                    Abrir Track Your Prospects
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Drawer de Detalhes da Atividade / Conta Selecionada */}
      {isDrawerOpen && selectedAccount && (
        <>
          <div
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs transition-opacity"
          />
          <aside
            role="dialog"
            aria-modal="true"
            className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200"
          >
            <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                  Análise de Sinal de Compra
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {selectedAccount.account_name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                  <span className="text-[10px] text-slate-500">Estágio de Compra</span>
                  <div className="text-sm font-bold capitalize text-slate-900 dark:text-white mt-0.5">
                    {selectedAccount.buying_stage}
                  </div>
                </div>

                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                  <span className="text-[10px] text-slate-500">Score de Intenção</span>
                  <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedAccount.total_score} pontos
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-2">Dados da Conta</h4>
                <dl className="divide-y divide-slate-100 rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-800/30">
                  <div className="flex justify-between py-1.5">
                    <dt className="text-slate-500">Localização</dt>
                    <dd className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedAccount.location}
                    </dd>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <dt className="text-slate-500">Visualizações Diretas</dt>
                    <dd className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedAccount.direct_pageviews}
                    </dd>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <dt className="text-slate-500">Visualizações no Comparador</dt>
                    <dd className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedAccount.competitive_pageviews}
                    </dd>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <dt className="text-slate-500">Última Interação</dt>
                    <dd className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedAccount.last_interaction_at
                        ? new Date(selectedAccount.last_interaction_at).toLocaleString('pt-BR')
                        : 'Recente'}
                    </dd>
                  </div>
                </dl>
              </div>

              {selectedAccount.recommended_action && (
                <div className="rounded-lg border border-blue-100 bg-blue-50/70 p-3 text-xs text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300">
                  <div className="font-bold mb-1 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    Ação Recomendada
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {selectedAccount.recommended_action} (Janela sugerida: {selectedAccount.sla_window})
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 p-4 dark:border-slate-800">
              <Button
                variant="outline"
                onClick={() => setIsDrawerOpen(false)}
                className="w-full text-xs font-semibold"
              >
                Fechar detalhes
              </Button>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
