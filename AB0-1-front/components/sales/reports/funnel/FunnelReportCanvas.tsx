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
} from 'lucide-react';
import { salesApi } from '@/lib/api/sales/client';
import { ApiAnalytics, ApiOpportunity } from '@/lib/api/sales/types';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';
import { cn } from '@/lib/utils';

function fmtBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
  });
}

export default function FunnelReportCanvas() {
  const [period, setPeriod] = useState<string>('30d');
  const [pipelineId, setPipelineId] = useState<number | undefined>(undefined);
  const [measure, setMeasure] = useState<'value' | 'quantity'>('value');
  const [selectedStageId, setSelectedStageId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'leads'>('details');

  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<ApiAnalytics | null>(null);
  const [opportunities, setOpportunities] = useState<ApiOpportunity[]>([]);
  const [loadingOpportunities, setLoadingOpportunities] = useState(false);

  // Carregar dados de analytics do funil
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await salesApi.getAnalytics(period, pipelineId);
      setAnalytics(data);
      if (!pipelineId && data.pipeline) {
        setPipelineId(data.pipeline.id);
      }
    } catch (err) {
      console.error('[FunnelReport] Erro ao carregar funil:', err);
    } finally {
      setLoading(false);
    }
  }, [period, pipelineId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Carregar leads da aba Leads
  const loadOpportunities = useCallback(async () => {
    setLoadingOpportunities(true);
    try {
      const res = await salesApi.getOpportunities({
        pipeline_id: pipelineId,
        stage_id: selectedStageId ? [selectedStageId] : undefined,
        all_statuses: true,
        per_page: 50,
      });
      setOpportunities(res || []);
    } catch (err) {
      console.error('[FunnelReport] Erro ao carregar oportunidades:', err);
    } finally {
      setLoadingOpportunities(false);
    }
  }, [pipelineId, selectedStageId]);

  useEffect(() => {
    if (activeTab === 'leads') {
      loadOpportunities();
    }
  }, [activeTab, loadOpportunities]);

  const funnelItems = useMemo(() => analytics?.funnel || [], [analytics?.funnel]);
  const maxVal = useMemo(() => {
    if (funnelItems.length === 0) return 1;
    return Math.max(
      ...funnelItems.map((f) => (measure === 'value' ? f.value_cents || (f.valor || 0) * 100 : f.count)),
      1
    );
  }, [funnelItems, measure]);

  // Exportar dados do funil em CSV
  const exportCSV = () => {
    if (!analytics || funnelItems.length === 0) return;
    const lines = [
      'Relatório de Funil de Vendas & Onboarding - Avalia Solar',
      `Funil: ${analytics.pipeline?.name || 'Padrão'}`,
      `Período: ${period}`,
      '',
      'Estágio,Oportunidades,Valor (R$),Taxa de Passagem (%),Drop-off (%)',
    ];

    funnelItems.forEach((f) => {
      const val = fmtBRL(f.value_cents || (f.valor || 0) * 100);
      lines.push(`"${f.stage}",${f.count},"${val}",${f.conversion_rate_from_prev || 100}%,${f.drop_off_rate || 0}%`);
    });

    const csvContent = '\uFEFF' + lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-funil-avalia-solar-${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <SalesLayoutWrapper>
      <div className="space-y-6">
        {/* Top Header Editorial */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Filter className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Funnel
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Como as oportunidades avançam etapa por etapa no funil comercial e operacional?
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Pipeline Selector */}
            {analytics?.pipelines && analytics.pipelines.length > 0 && (
              <div className="relative">
                <select
                  value={pipelineId || ''}
                  onChange={(e) => setPipelineId(Number(e.target.value) || undefined)}
                  className="appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg pl-3 pr-8 py-2 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs cursor-pointer"
                >
                  {analytics.pipelines.map((p) => (
                    <option key={p.id} value={p.id}>
                      Funil: {p.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
              </div>
            )}

            {/* Measure Toggle: Value vs Quantity */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setMeasure('value')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
                  measure === 'value'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                )}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>R$ Valor</span>
              </button>
              <button
                type="button"
                onClick={() => setMeasure('quantity')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
                  measure === 'quantity'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                )}
              >
                <Hash className="w-3.5 h-3.5" />
                <span># Quantidade</span>
              </button>
            </div>

            {/* Period Selector */}
            <div className="relative">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg pl-3 pr-8 py-2 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs cursor-pointer"
              >
                <option value="this_month">Este Mês</option>
                <option value="30d">Últimos 30 dias</option>
                <option value="90d">Últimos 90 dias</option>
                <option value="this_year">Este Ano</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-xs disabled:opacity-50"
              title="Atualizar dados"
            >
              <RotateCw className={cn('w-4 h-4', loading && 'animate-spin')} />
            </button>

            {/* Export CSV */}
            <button
              type="button"
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar</span>
            </button>
          </div>
        </div>

        {/* KPI Summary Cards */}
        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-xl shadow-xs">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Valor Total em Pipeline
              </span>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {fmtBRL(analytics.kpis.pipeline_value_cents)}
              </p>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                {analytics.kpis.open_deals} oportunidades ativas
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-xl shadow-xs">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Receita Ganha Fechada
              </span>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {fmtBRL(analytics.kpis.won_revenue_cents)}
              </p>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                {analytics.kpis.won_deals} negócios fechados
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-xl shadow-xs">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Taxa de Conversão Global
              </span>
              <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                {(analytics.kpis.conversion_rate * 100).toFixed(1)}%
              </p>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Win Rate sobre encerrados
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-xl shadow-xs">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Ciclo Médio no Funil
              </span>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {analytics.kpis.average_sales_cycle_days} dias
              </p>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Tempo do lead à contratação
              </span>
            </div>
          </div>
        )}

        {/* Visual Funnel Section */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Visualização de Etapas & Taxas de Passagem
              </h2>
              <p className="text-xs text-slate-500">
                Largura proporcional ao {measure === 'value' ? 'valor monetário (R$)' : 'volume de oportunidades'}
              </p>
            </div>
            {selectedStageId && (
              <button
                type="button"
                onClick={() => setSelectedStageId(null)}
                className="text-xs text-indigo-600 hover:underline font-semibold"
              >
                Limpar filtro de estágio
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
              <p className="text-xs">Calculando estágios do funil...</p>
            </div>
          ) : funnelItems.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              Nenhuma oportunidade encontrada para este funil e período.
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {funnelItems.map((stage, idx) => {
                const valCents = stage.value_cents || (stage.valor || 0) * 100;
                const metricVal = measure === 'value' ? valCents : stage.count;
                const widthPercent = Math.max(Math.round((metricVal / maxVal) * 100), 8);
                const isSelected = selectedStageId === stage.id;
                const dropOff = stage.drop_off_rate ?? 0;
                const isHighDrop = dropOff > 50 && idx > 0;

                return (
                  <div
                    key={stage.id || stage.stage}
                    onClick={() => setSelectedStageId(isSelected ? null : stage.id || null)}
                    className={cn(
                      'group p-3 rounded-xl border transition-all cursor-pointer relative',
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20'
                    )}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                          {stage.stage}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-semibold">
                        <span className="text-slate-500 dark:text-slate-400">
                          {stage.count} {stage.count === 1 ? 'negócio' : 'negócios'}
                        </span>
                        <span className="text-slate-900 dark:text-slate-100">
                          {fmtBRL(valCents)}
                        </span>
                        {idx > 0 && (
                          <span
                            className={cn(
                              'text-[11px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1',
                              isHighDrop
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                            )}
                            title={`Taxa de passagem a partir do estágio anterior: ${stage.conversion_rate_from_prev || 100}%`}
                          >
                            {isHighDrop ? <AlertTriangle className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                            {stage.conversion_rate_from_prev || 100}% passagem
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Proportional Stage Bar */}
                    <div className="w-full bg-slate-200 dark:bg-slate-700/60 h-3 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          isSelected
                            ? 'bg-indigo-600 dark:bg-indigo-500'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600'
                        )}
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Master-Detail Section: Tabs (Details vs Leads) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          {/* Tabs Navigation */}
          <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-4 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={cn(
                'px-4 py-2.5 font-bold text-xs border-b-2 transition-colors',
                activeTab === 'details'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              )}
            >
              Details (Resumo dos Estágios)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('leads')}
              className={cn(
                'px-4 py-2.5 font-bold text-xs border-b-2 transition-colors flex items-center gap-1.5',
                activeTab === 'leads'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              )}
            >
              <span>Leads & Oportunidades</span>
              {opportunities.length > 0 && (
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded-full">
                  {opportunities.length}
                </span>
              )}
            </button>
          </div>

          {/* Tab 1: Details */}
          {activeTab === 'details' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Estágio</th>
                    <th className="py-3 px-4 text-right">Oportunidades Ativas</th>
                    <th className="py-3 px-4 text-right">Valor em Aberto (R$)</th>
                    <th className="py-3 px-4 text-right">Taxa de Passagem</th>
                    <th className="py-3 px-4 text-right">Drop-off (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {funnelItems.map((stage) => {
                    const valCents = stage.value_cents || (stage.valor || 0) * 100;
                    return (
                      <tr key={stage.id || stage.stage} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                          {stage.stage}
                        </td>
                        <td className="py-3 px-4 text-right">{stage.count}</td>
                        <td className="py-3 px-4 text-right">{fmtBRL(valCents)}</td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          {stage.conversion_rate_from_prev || 100}%
                        </td>
                        <td className="py-3 px-4 text-right text-slate-500">
                          {stage.drop_off_rate ? `${stage.drop_off_rate}%` : '—'}
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
                <div className="flex items-center justify-center py-12 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mr-2" />
                  <span className="text-xs">Carregando oportunidades do funil...</span>
                </div>
              ) : opportunities.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Nenhuma oportunidade encontrada para este funil.
                </div>
              ) : (
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Oportunidade</th>
                      <th className="py-3 px-4">Conta / Empresa</th>
                      <th className="py-3 px-4">Estágio</th>
                      <th className="py-3 px-4 text-right">Valor</th>
                      <th className="py-3 px-4">Responsável</th>
                      <th className="py-3 px-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {opportunities.map((opp) => (
                      <tr key={opp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                          {opp.name}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                          {opp.account?.name || '—'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                            {opp.stage?.name || '—'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-900 dark:text-slate-100">
                          {fmtBRL(opp.value_cents)}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                          {opp.owner?.name || opp.owner?.email || 'Não atribuído'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Link
                            href={`/dashboard/sales/leads?id=${opp.id}`}
                            className="p-1.5 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 inline-flex items-center justify-center rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                            title="Ver detalhes do lead"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
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
      </div>
    </SalesLayoutWrapper>
  );
}
