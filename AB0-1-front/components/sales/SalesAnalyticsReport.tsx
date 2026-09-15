'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, RotateCw, XCircle } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';
import {
  ReportIcon,
  ReportKpiCard,
  ReportsHeader,
  ReportsInsightCard,
  SalesTeamPerformance,
  EmailPerformance,
  ReportsSkeleton,
} from './reports';

export type Kpi = {
  pipeline_value_cents: number;
  weighted_pipeline_cents: number;
  won_revenue_cents: number;
  conversion_rate: number;
  average_ticket_cents: number;
  average_sales_cycle_days: number;
  open_deals: number;
  won_deals: number;
  lost_deals: number;
};

export type FunnelItem = {
  stage: string;
  count: number;
  valor?: number;
  value_cents?: number;
};

export type WinLossItem = {
  name: string;
  value: number;
  count?: number;
  color?: string;
};

export type TeamPerformanceItem = {
  owner_id: number;
  name: string;
  email: string;
  total_deals: number;
  won_deals: number;
  lost_deals: number;
  won_revenue_cents: number;
  win_rate: number;
};

export type RevenueByMonth = {
  month: string;
  realizado?: number;
  previsao?: number;
  won_cents?: number;
  pipeline_cents?: number;
};

export type EmailMetrics = Record<
  'sent' | 'delivered' | 'open' | 'click' | 'replied' | 'bounce' | 'complaint',
  number
>;

export type AnalyticsData = {
  kpis: Kpi;
  funnel: FunnelItem[];
  win_loss: WinLossItem[];
  revenue_by_month: RevenueByMonth[];
  loss_reasons?: WinLossItem[];
  team_performance?: TeamPerformanceItem[];
  email_metrics?: EmailMetrics;
};

const WIN_LOSS_COLORS = ['#10B981', '#EF4444', '#F59E0B', '#6B7280', '#3B82F6', '#8B5CF6'];

function fmtBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
  });
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-44 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/30">
      <ReportIcon
        src="/assets/avaliasolar_reports_icon_assets/05_status_indicadores/informacao.png"
        tone="neutral"
        size="sm"
        className="opacity-60"
      />
      <p className="mt-2 text-xs font-medium text-slate-400 italic text-center">{message}</p>
    </div>
  );
}

export default function SalesAnalyticsReport() {
  const [period, setPeriod] = useState('this_month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [data, setData] = useState<AnalyticsData | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUnauthorized(false);
    try {
      const res = await fetch(`/api/v1/sales/analytics?period=${period}`, {
        credentials: 'include',
      });

      if (res.status === 401 || res.status === 403) {
        setUnauthorized(true);
        setLoading(false);
        return;
      }
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `Erro ${res.status} ao carregar analytics.`);
      }

      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao conectar ao servidor.');
      console.error('[CRM] Analytics fetch error', err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const exportCSV = () => {
    if (!data) return;
    const lines: string[] = [];
    lines.push('Relatório de Analytics Comercial - Avalia Solar');
    lines.push(`Período: ${period}`);
    lines.push('');
    lines.push('INDICADORES PRINCIPAIS (KPIs)');
    lines.push(`Pipeline Total,${fmtBRL(data.kpis.pipeline_value_cents)}`);
    lines.push(`Pipeline Ponderado,${fmtBRL(data.kpis.weighted_pipeline_cents)}`);
    lines.push(`Receita Fechada,${fmtBRL(data.kpis.won_revenue_cents)}`);
    lines.push(`Taxa de Conversão,${(data.kpis.conversion_rate * 100).toFixed(1)}%`);
    lines.push(`Ticket Médio,${fmtBRL(data.kpis.average_ticket_cents)}`);
    lines.push(`Ciclo Médio de Vendas,${data.kpis.average_sales_cycle_days} dias`);
    lines.push(`Negócios Ganhos,${data.kpis.won_deals}`);
    lines.push(`Negócios Perdidos,${data.kpis.lost_deals}`);
    lines.push('');

    if (data.team_performance && data.team_performance.length > 0) {
      lines.push('DESEMPENHO DA EQUIPE');
      lines.push('Vendedor,Negócios Criados,Negócios Ganhos,Negócios Perdidos,Receita Gerada,Taxa de Conversão');
      data.team_performance.forEach((item) => {
        lines.push(
          `"${item.name}",${item.total_deals},${item.won_deals},${item.lost_deals},${fmtBRL(item.won_revenue_cents)},${item.win_rate}%`
        );
      });
      lines.push('');
    }

    if (data.funnel && data.funnel.length > 0) {
      lines.push('FUNIL DE VENDAS');
      lines.push('Estágio,Quantidade,Valor (R$)');
      data.funnel.forEach((item) => {
        lines.push(`"${item.stage}",${item.count},${fmtBRL(item.value_cents || (item.valor || 0) * 100)}`);
      });
    }

    const csvContent = '\uFEFF' + lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `analytics-vendas-${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const kpis = data?.kpis;
  const funnel = (data?.funnel ?? []).map((item) => ({
    ...item,
    valor: item.valor ?? (item.value_cents ? Math.round(item.value_cents / 100) : 0),
  }));
  const winLoss = (data?.win_loss ?? []).map((item, idx) => ({
    ...item,
    color: item.color || WIN_LOSS_COLORS[idx % WIN_LOSS_COLORS.length],
  }));
  const lossReasons = (data?.loss_reasons ?? []).map((item, idx) => ({
    ...item,
    color: item.color || WIN_LOSS_COLORS[idx % WIN_LOSS_COLORS.length],
  }));
  const teamPerformance = data?.team_performance ?? [];
  const revenueByMonth = (data?.revenue_by_month ?? []).map((item) => ({
    ...item,
    realizado: item.realizado ?? (item.won_cents ? Math.round(item.won_cents / 100) : 0),
    previsao: item.previsao ?? (item.pipeline_cents ? Math.round(item.pipeline_cents / 100) : 0),
  }));

  return (
    <SalesLayoutWrapper>
      <div className="mx-auto w-full max-w-7xl space-y-6">
        {/* Header Executivo & Subnavegação */}
        <ReportsHeader
          period={period}
          onPeriodChange={setPeriod}
          onExportCSV={exportCSV}
          onRefresh={fetchAnalytics}
          loading={loading}
          exportDisabled={!data}
        />

        {/* Loading State com Skeletons Reais */}
        {loading && <ReportsSkeleton />}

        {/* Unauthorized State */}
        {!loading && unauthorized && (
          <div
            className="flex flex-col items-center justify-center py-20 gap-4"
            data-testid="analytics-unauthorized"
          >
            <XCircle className="h-10 w-10 text-amber-500" />
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              Sessão expirada ou sem permissão
            </p>
            <a href="/login">
              <Button className="bg-blue-900 font-bold hover:bg-blue-950">Fazer Login</Button>
            </a>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div
            className="flex flex-col items-center justify-center py-20 gap-4"
            data-testid="analytics-error"
          >
            <AlertCircle className="h-10 w-10 text-rose-500" />
            <p className="font-semibold text-slate-900 dark:text-slate-100">{error}</p>
            <Button onClick={fetchAnalytics} variant="outline" className="font-semibold">
              <RotateCw className="mr-2 h-4 w-4" /> Tentar Novamente
            </Button>
          </div>
        )}

        {/* Conteúdo Principal com Dados Carregados */}
        {!loading && !error && !unauthorized && data !== null && (
          <>
            {/* Card de Insights e Alertas Executivos */}
            {kpis && (
              <ReportsInsightCard
                openDeals={kpis.open_deals}
                pipelineValueFormatted={fmtBRL(kpis.pipeline_value_cents)}
                weightedValueFormatted={fmtBRL(kpis.weighted_pipeline_cents)}
                wonDeals={kpis.won_deals}
                wonRevenueFormatted={fmtBRL(kpis.won_revenue_cents)}
                lostDeals={kpis.lost_deals}
                conversionRatePercent={kpis.conversion_rate * 100}
              />
            )}

            {/* Grid Hierarquizado de KPIs: Linha 1 (4 principais) */}
            {kpis && (
              <div
                className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4"
                data-testid="analytics-kpis"
              >
                <ReportKpiCard
                  label="Pipeline Total"
                  value={fmtBRL(kpis.pipeline_value_cents)}
                  detail={`${kpis.open_deals} negócios em aberto`}
                  iconSrc="/assets/avaliasolar_reports_icon_assets/01_kpi_metricas/pipeline_total.png"
                  iconTone="blue"
                  highlight
                  testId="kpi-pipeline-total"
                />
                <ReportKpiCard
                  label="Pipeline Ponderado"
                  value={fmtBRL(kpis.weighted_pipeline_cents)}
                  detail="soma de valor × probabilidade"
                  iconSrc="/assets/avaliasolar_reports_icon_assets/01_kpi_metricas/pipeline_ponderado.png"
                  iconTone="purple"
                  testId="kpi-pipeline-weighted"
                />
                <ReportKpiCard
                  label="Receita Fechada"
                  value={fmtBRL(kpis.won_revenue_cents)}
                  detail={`${kpis.won_deals} negócios ganhos`}
                  iconSrc="/assets/avaliasolar_reports_icon_assets/01_kpi_metricas/receita_fechada.png"
                  iconTone="emerald"
                  testId="kpi-won-revenue"
                />
                <ReportKpiCard
                  label="Taxa de Conversão"
                  value={`${(kpis.conversion_rate * 100).toFixed(1)}%`}
                  detail="Won / (Won + Lost)"
                  iconSrc="/assets/avaliasolar_reports_icon_assets/01_kpi_metricas/taxa_conversao.png"
                  iconTone="blue"
                  testId="kpi-conversion-rate"
                />
              </div>
            )}

            {/* Grid Hierarquizado de KPIs: Linha 2 (3 operacionais) */}
            {kpis && (
              <div className="grid gap-3.5 sm:grid-cols-3">
                <ReportKpiCard
                  label="Ticket Médio"
                  value={fmtBRL(kpis.average_ticket_cents)}
                  detail="média de negócios fechados"
                  iconSrc="/assets/avaliasolar_reports_icon_assets/01_kpi_metricas/ticket_medio.png"
                  iconTone="blue"
                  testId="kpi-ticket-medio"
                />
                <ReportKpiCard
                  label="Ciclo Médio de Venda"
                  value={
                    kpis.average_sales_cycle_days > 0
                      ? `${kpis.average_sales_cycle_days} dias`
                      : '—'
                  }
                  detail="da criação ao fechamento"
                  iconSrc="/assets/avaliasolar_reports_icon_assets/01_kpi_metricas/ciclo_venda.png"
                  iconTone="amber"
                  testId="kpi-ciclo-venda"
                />
                <ReportKpiCard
                  label="Perdidos no Período"
                  value={String(kpis.lost_deals)}
                  detail="negócios marcados como Lost"
                  iconSrc="/assets/avaliasolar_reports_icon_assets/01_kpi_metricas/perdidos_periodo.png"
                  iconTone="rose"
                  testId="kpi-lost-deals"
                />
              </div>
            )}

            {/* Evolução do Pipeline (Previsão Ponderada) */}
            <Card className="border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xs rounded-xl overflow-hidden">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 p-5">
                <div className="flex items-center gap-3">
                  <ReportIcon
                    src="/assets/avaliasolar_reports_icon_assets/02_tipos_graficos/grafico_linhas.png"
                    tone="blue"
                    size="md"
                  />
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Evolução do Pipeline
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                      Receita realizada (Won) vs. pipeline ponderado por período
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5">
                {revenueByMonth.length === 0 ? (
                  <EmptyChart message="Sem dados de receita para o período selecionado." />
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart
                      data={revenueByMonth}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1E3A8A" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#1E3A8A" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorPrev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#60A5FA" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 11, fill: '#6B7280' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#6B7280' }}
                        tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip formatter={(v: number) => fmtBRL(v * 100)} />
                      <Area
                        type="monotone"
                        dataKey="realizado"
                        name="Realizado (Won)"
                        stroke="#1E3A8A"
                        strokeWidth={2}
                        fill="url(#colorReal)"
                      />
                      <Area
                        type="monotone"
                        dataKey="previsao"
                        name="Pipeline Ponderado"
                        stroke="#60A5FA"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        fill="url(#colorPrev)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Funil de Vendas + Motivos de Perda */}
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Funil de Vendas */}
              <Card className="border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xs rounded-xl overflow-hidden">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 p-5">
                  <div className="flex items-center gap-3">
                    <ReportIcon
                      src="/assets/avaliasolar_reports_icon_assets/02_tipos_graficos/funil.png"
                      tone="blue"
                      size="md"
                    />
                    <div>
                      <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        Funil de Vendas
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                        Oportunidades ativas distribuídas por estágio
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-5">
                  {funnel.length === 0 ? (
                    <EmptyChart message="Nenhum dado de funil para o período selecionado." />
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart
                        data={funnel}
                        layout="vertical"
                        margin={{ top: 0, right: 10, left: 40, bottom: 0 }}
                      >
                        <XAxis type="number" hide />
                        <YAxis
                          dataKey="stage"
                          type="category"
                          tick={{ fontSize: 11, fill: '#64748B' }}
                          tickLine={false}
                          axisLine={false}
                          width={95}
                        />
                        <Tooltip
                          formatter={(val: number, name: string) =>
                            name === 'count'
                              ? [`${val} negócios`, 'Quantidade']
                              : [fmtBRL(val * 100), 'Valor']
                          }
                        />
                        <Bar dataKey="count" fill="#1E3A8A" radius={[0, 4, 4, 0]} maxBarSize={22} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Motivos de Perda */}
              <Card className="border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xs rounded-xl overflow-hidden">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 p-5">
                  <div className="flex items-center gap-3">
                    <ReportIcon
                      src="/assets/avaliasolar_reports_icon_assets/02_tipos_graficos/grafico_pizza.png"
                      tone="rose"
                      size="md"
                    />
                    <div>
                      <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        Motivos de Perda
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                        Principais motivos reportados no cancelamento de negócios
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-5">
                  {(lossReasons.length > 0 ? lossReasons : winLoss).length === 0 ? (
                    <EmptyChart message="Nenhum dado de perda registrado para o período selecionado." />
                  ) : (
                    <div className="flex items-center gap-6">
                      <ResponsiveContainer width="50%" height={200}>
                        <PieChart>
                          <Pie
                            data={lossReasons.length > 0 ? lossReasons : winLoss}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {(lossReasons.length > 0 ? lossReasons : winLoss).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: number) => `${v}%`} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-col gap-2">
                        {(lossReasons.length > 0 ? lossReasons : winLoss).map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs">
                            <span
                              className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-slate-700 dark:text-slate-300 font-medium">
                              {item.name}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              {item.value}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Desempenho da Equipe de Vendas (Leaderboard) */}
            <SalesTeamPerformance team={teamPerformance} formatCurrency={fmtBRL} />

            {/* Desempenho de E-mail (Analytics Strip) */}
            <EmailPerformance metrics={data.email_metrics} />
          </>
        )}

        {/* Empty State Global (quando data é null e não está carregando) */}
        {!loading && !error && !unauthorized && data === null && (
          <div
            className="flex flex-col items-center justify-center py-20 gap-4"
            data-testid="analytics-empty"
          >
            <ReportIcon
              src="/assets/avaliasolar_reports_icon_assets/05_status_indicadores/informacao.png"
              tone="neutral"
              size="lg"
            />
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              Nenhum dado disponível para o período selecionado.
            </p>
            <p className="text-xs text-slate-500">
              Crie oportunidades no pipeline para que os relatórios sejam gerados automaticamente.
            </p>
          </div>
        )}
      </div>
    </SalesLayoutWrapper>
  );
}
