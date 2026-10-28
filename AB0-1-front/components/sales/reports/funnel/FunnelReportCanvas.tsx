'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Filter,
  DollarSign,
  Hash,
  Download,
  RotateCw,
  TrendingUp,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  Loader2,
  Layers,
} from 'lucide-react';
import { salesApi } from '@/lib/api/sales/client';
import { ApiAnalytics, ApiOpportunity } from '@/lib/api/sales/types';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';
import FunnelFilterBar, { FunnelFilterState } from './FunnelFilterBar';
import FunnelStageCard, { FunnelClickAction } from './FunnelStageCard';
import FunnelStageConnector from './FunnelStageConnector';
import FunnelDrilldownDrawer, { FunnelTargetDetail } from './FunnelDrilldownDrawer';
import { cn } from '@/lib/utils';

function fmtBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
  });
}

export default function FunnelReportCanvas() {
  const [filters, setFilters] = useState<FunnelFilterState>({
    period: 'this_month',
    measure: 'quantity',
    pipelineId: undefined,
    assigneeIds: [],
    sources: [],
    hasProduct: false,
  });

  const [activeTab, setActiveTab] = useState<'details' | 'leads'>('details');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<ApiAnalytics | null>(null);
  const [opportunities, setOpportunities] = useState<ApiOpportunity[]>([]);
  const [loadingOpportunities, setLoadingOpportunities] = useState(false);

  // Drilldown Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTarget, setDrawerTarget] = useState<FunnelTargetDetail | null>(null);

  // Carregar dados de analytics do funil
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await salesApi.getAnalytics(filters.period, filters.pipelineId);
      setAnalytics(data);
      if (!filters.pipelineId && data.pipeline) {
        setFilters((prev) => ({ ...prev, pipelineId: data.pipeline?.id }));
      }
    } catch (err) {
      console.error('[FunnelReport] Erro ao carregar funil:', err);
    } finally {
      setLoading(false);
    }
  }, [filters.period, filters.pipelineId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Carregar oportunidades para o drilldown / lista
  const loadOpportunities = useCallback(async () => {
    setLoadingOpportunities(true);
    try {
      const res = await salesApi.getOpportunities({
        pipeline_id: filters.pipelineId,
        all_statuses: true,
        per_page: 100,
      });
      setOpportunities(res || []);
    } catch (err) {
      console.error('[FunnelReport] Erro ao carregar oportunidades:', err);
    } finally {
      setLoadingOpportunities(false);
    }
  }, [filters.pipelineId]);

  useEffect(() => {
    loadOpportunities();
  }, [loadOpportunities]);

  const funnelItems = useMemo(() => analytics?.funnel || [], [analytics?.funnel]);

  // Calculate highest metric value to establish proportional stepped widths
  const maxMetric = useMemo(() => {
    if (funnelItems.length === 0) return 1;
    return Math.max(
      ...funnelItems.map((f) =>
        filters.measure === 'value' ? f.value_cents || (f.valor || 0) * 100 : f.count
      ),
      1
    );
  }, [funnelItems, filters.measure]);

  const totalLeads = useMemo(
    () => funnelItems.reduce((acc, f) => acc + (f.count || 0), 0),
    [funnelItems]
  );

  const totalValueCents = useMemo(
    () => funnelItems.reduce((acc, f) => acc + (f.value_cents || (f.valor || 0) * 100), 0),
    [funnelItems]
  );

  // Handle click on any stage action
  const handleStageActionClick = (action: FunnelClickAction) => {
    setDrawerTarget(action);
    setDrawerOpen(true);
  };

  // Handle click on transition connector
  const handleConnectorClick = (
    fromStageName: string,
    toStageName: string,
    advancedCount: number
  ) => {
    setDrawerTarget({
      type: 'advanced',
      fromStageName,
      toStageName,
      count: advancedCount,
    });
    setDrawerOpen(true);
  };

  // Exportar dados do funil em CSV
  const exportCSV = () => {
    if (!analytics || funnelItems.length === 0) return;
    const lines = [
      'Relatório de Funil de Vendas (IBM Carbon / Nutshell Style) - Avalia Solar',
      `Funil: ${analytics.pipeline?.name || 'Padrão'}`,
      `Período: ${filters.period}`,
      '',
      'Estágio,Oportunidades,Valor (R$),Already,Remain,Tempo Médio (dias),Avançaram,Taxa de Avanço (%),Closed,Won,Lost,Cancelled',
    ];

    funnelItems.forEach((f) => {
      const val = fmtBRL(f.value_cents || (f.valor || 0) * 100);
      lines.push(
        `"${f.stage}",${f.count},"${val}",${f.already_count || 0},${f.remain_count || 0},${f.average_time_days || 0},${f.advanced_count || 0},${f.conversion_rate_from_prev || 100}%,${f.closed_count || 0},${f.won_count || 0},${f.lost_count || 0},${f.cancelled_count || 0}`
      );
    });

    const csvContent = '\uFEFF' + lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `funnel-report-avalia-solar-${filters.period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <SalesLayoutWrapper>
      <div className="space-y-4 max-w-7xl mx-auto font-sans">
        {/* Top Header Editorial */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-xs bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                <Layers className="w-4 h-4" />
              </span>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Funnel
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              What are our conversion rates?
            </p>
          </div>
        </div>

        {/* Nutshell & IBM Carbon Filter Bar */}
        <FunnelFilterBar
          filters={filters}
          onFilterChange={(newF) => setFilters((prev) => ({ ...prev, ...newF }))}
          pipelines={analytics?.pipelines || []}
          totalLeads={totalLeads}
          totalValueCents={totalValueCents}
          onRefresh={loadData}
          onExport={exportCSV}
          loading={loading}
        />

        {/* KPI Summary Strip (IBM Carbon style: 1px border, high density, tabular nums) */}
        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xs shadow-2xs">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Valor Total em Pipeline
              </span>
              <p className="text-base font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5 tabular-nums">
                {fmtBRL(analytics.kpis.pipeline_value_cents)}
              </p>
              <span className="text-[10px] text-slate-400 mt-0.5 block font-mono">
                {analytics.kpis.open_deals} oportunidades ativas
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xs shadow-2xs">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Receita Ganha Fechada
              </span>
              <p className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums">
                {fmtBRL(analytics.kpis.won_revenue_cents)}
              </p>
              <span className="text-[10px] text-slate-400 mt-0.5 block font-mono">
                {analytics.kpis.won_deals} negócios fechados
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xs shadow-2xs">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Taxa de Conversão Global
              </span>
              <p className="text-base font-bold font-mono text-blue-600 dark:text-blue-400 mt-0.5 tabular-nums">
                {(analytics.kpis.conversion_rate * 100).toFixed(1)}%
              </p>
              <span className="text-[10px] text-slate-400 mt-0.5 block font-mono">
                Win Rate sobre encerrados
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xs shadow-2xs">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Ciclo Médio no Funil
              </span>
              <p className="text-base font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5 tabular-nums">
                {analytics.kpis.average_sales_cycle_days} dias
              </p>
              <span className="text-[10px] text-slate-400 mt-0.5 block font-mono">
                Tempo do lead ao ganho
              </span>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            VISUAL FUNNEL SECTION (3-Colunas Vertical + Chevrons Interativos)
            ───────────────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xs p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">
            <div>
              <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider font-mono">
                Conversão Etapa a Etapa (Nutshell Funnel)
              </h2>
              <p className="text-[11px] text-slate-400">
                Clique nos blocos, taxas de avanço ou desfechos para abrir o drilldown de leads
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2" />
              <p className="text-xs font-mono">Calculando métricas do funil...</p>
            </div>
          ) : funnelItems.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs font-mono">
              Nenhuma oportunidade encontrada para este funil e período.
            </div>
          ) : (
            <div className="space-y-1">
              {funnelItems.map((stage, idx) => {
                const isLast = idx === funnelItems.length - 1;
                const nextStage = funnelItems[idx + 1];
                const advancedCnt = stage.advanced_count ?? nextStage?.count ?? 0;
                const convRate = stage.conversion_rate ?? stage.conversion_rate_from_prev ?? 75;

                return (
                  <div key={stage.id || stage.stage}>
                    {/* Stage Card (3 Columns) */}
                    <FunnelStageCard
                      stage={stage}
                      index={idx}
                      isFirst={idx === 0}
                      maxMetric={maxMetric}
                      measure={filters.measure}
                      isSelected={
                        drawerOpen &&
                        drawerTarget?.type === 'stage' &&
                        drawerTarget.stageId === (stage.id || idx + 1)
                      }
                      onActionClick={handleStageActionClick}
                    />

                    {/* Transition Connector between stages */}
                    {!isLast && nextStage && (
                      <FunnelStageConnector
                        fromStageName={stage.stage}
                        toStageName={nextStage.stage}
                        advancedCount={advancedCnt}
                        conversionRate={convRate}
                        isSelected={
                          drawerOpen &&
                          drawerTarget?.type === 'advanced' &&
                          drawerTarget.fromStageName === stage.stage
                        }
                        onClick={() =>
                          handleConnectorClick(stage.stage, nextStage.stage, advancedCnt)
                        }
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ─────────────────────────────────────────────────────────────
            MASTER-DETAIL SECTION (Tabela Completa de Oportunidades)
            ───────────────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xs overflow-hidden shadow-2xs">
          {/* Tabs Navigation */}
          <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-4 pt-2 bg-slate-50/50 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={cn(
                'px-3 py-2 font-bold text-xs border-b-2 transition-colors cursor-pointer',
                activeTab === 'details'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              )}
            >
              Details (Tabela de Estágios)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('leads')}
              className={cn(
                'px-3 py-2 font-bold text-xs border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer',
                activeTab === 'leads'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              )}
            >
              <span>Todas as Oportunidades</span>
              {opportunities.length > 0 && (
                <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded-xs font-mono">
                  {opportunities.length}
                </span>
              )}
            </button>
          </div>

          {/* Tab 1: Details */}
          {activeTab === 'details' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 font-mono">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800 text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Estágio</th>
                    <th className="py-2.5 px-3 text-right">Oportunidades</th>
                    <th className="py-2.5 px-3 text-right">Valor (R$)</th>
                    <th className="py-2.5 px-3 text-right">Tempo Médio</th>
                    <th className="py-2.5 px-3 text-right">Avançaram</th>
                    <th className="py-2.5 px-3 text-right">Taxa de Avanço</th>
                    <th className="py-2.5 px-3 text-right">Closed (Won / Lost)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {funnelItems.map((stage) => {
                    const valCents = stage.value_cents || (stage.valor || 0) * 100;
                    return (
                      <tr
                        key={stage.id || stage.stage}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                          {stage.stage}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums">{stage.count}</td>
                        <td className="py-2.5 px-3 text-right tabular-nums">{fmtBRL(valCents)}</td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-slate-500">
                          {stage.average_time_days || 4.4} dias
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums font-semibold text-slate-700 dark:text-slate-300">
                          {stage.advanced_count || 0}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {stage.conversion_rate_from_prev || 100}%
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-slate-500">
                          <span className="text-emerald-600 font-semibold">{stage.won_count || 0}W</span>
                          {' / '}
                          <span className="text-rose-500 font-semibold">{stage.lost_count || 0}L</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab 2: Leads */}
          {activeTab === 'leads' && (
            <div className="overflow-x-auto">
              {loadingOpportunities ? (
                <div className="py-8 text-center text-xs text-slate-400 font-mono">
                  Carregando lista de oportunidades...
                </div>
              ) : opportunities.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 font-mono">
                  Nenhuma oportunidade cadastrada neste pipeline.
                </div>
              ) : (
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 font-mono">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800 text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">Oportunidade</th>
                      <th className="py-2.5 px-3">Empresa / Conta</th>
                      <th className="py-2.5 px-3">Estágio</th>
                      <th className="py-2.5 px-3 text-right">Valor Estimado</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {opportunities.map((opp) => (
                      <tr
                        key={opp.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                          <Link
                            href={`/dashboard/sales/opportunities/${opp.id}`}
                            className="hover:text-blue-600 transition-colors"
                          >
                            {opp.name}
                          </Link>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {opp.account?.name || '—'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]">
                            {opp.stage?.name || '—'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums font-bold text-slate-900 dark:text-slate-100">
                          {fmtBRL(opp.value_cents || 0)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={cn(
                              'text-[10px] px-1.5 py-0.2 rounded-xs uppercase tracking-wider font-semibold',
                              opp.status === 'won'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                                : opp.status === 'lost'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400'
                                : 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                            )}
                          >
                            {opp.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Link
                            href={`/dashboard/sales/opportunities/${opp.id}`}
                            className="text-blue-600 hover:underline text-[11px] font-semibold"
                          >
                            Abrir 360 ➔
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {/* ─────────────────────────────────────────────────────────────
            SLIDE-OVER DRILLDOWN DRAWER (Aberto ao Clicar em qualquer fatia)
            ───────────────────────────────────────────────────────────── */}
        <FunnelDrilldownDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          target={drawerTarget}
          opportunities={opportunities}
          loading={loadingOpportunities}
        />
      </div>
    </SalesLayoutWrapper>
  );
}
