'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Info,
  DollarSign,
  Hash,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  PipelineSnapshotSummary,
  PipelineSnapshotPoint,
  SnapshotsMeta,
} from '@/lib/api/sales/types';

interface PipelineSizeCardProps {
  summary: PipelineSnapshotSummary;
  series: PipelineSnapshotPoint[];
  meta: SnapshotsMeta;
}

function fmtCurrency(cents: number | null): string {
  if (cents === null || cents === undefined) return '—';
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });
}

function fmtDateLabel(dateStr: string): string {
  try {
    const [, m, d] = dateStr.split('-');
    return `${d}/${m}`;
  } catch {
    return dateStr;
  }
}

export function PipelineSizeCard({ summary, series, meta }: PipelineSizeCardProps) {
  // Mobile Metric Switch: 'both' | 'value' | 'count'
  const [activeMetric, setActiveMetric] = useState<'both' | 'value' | 'count'>('both');

  const chartData = series.map((s) => ({
    date: s.date,
    label: fmtDateLabel(s.date),
    value: s.open_value_cents !== null ? Math.round(s.open_value_cents / 100) : null,
    count: s.open_count,
    hasSnapshot: s.has_snapshot,
    isLive: s.is_live_estimated,
  }));

  const valueDelta = summary.delta_open_value_pct;
  const countDelta = summary.delta_open_count_pct;

  return (
    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs rounded-xl overflow-hidden font-sans">
      <CardHeader className="p-4 sm:p-6 pb-2 border-b border-slate-100 dark:border-slate-800/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#64B5DD]" />
              <CardTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                Pipeline size (Tamanho do Pipeline Aberto)
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-500 mt-1">
              Estoque nominal das oportunidades com status aberto em cada instante temporal.
            </CardDescription>
          </div>

          {/* Metric Switch (Útil para Mobile & Foco) */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs self-start md:self-auto">
            <button
              type="button"
              onClick={() => setActiveMetric('both')}
              className={`px-2.5 py-1 rounded font-semibold transition-all ${
                activeMetric === 'both'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Ambos
            </button>
            <button
              type="button"
              onClick={() => setActiveMetric('value')}
              className={`px-2.5 py-1 rounded font-semibold transition-all flex items-center gap-1 ${
                activeMetric === 'value'
                  ? 'bg-white dark:bg-slate-900 text-[#64B5DD] shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <DollarSign className="w-3 h-3" /> Valor
            </button>
            <button
              type="button"
              onClick={() => setActiveMetric('count')}
              className={`px-2.5 py-1 rounded font-semibold transition-all flex items-center gap-1 ${
                activeMetric === 'count'
                  ? 'bg-white dark:bg-slate-900 text-[#FA8248] shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Hash className="w-3 h-3" /> Qtd
            </button>
          </div>
        </div>

        {/* Coverage Alert if Partial */}
        {meta.coverage === 'partial' && meta.historical_coverage_from && (
          <div className="mt-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-2.5 flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
            <Info className="w-4 h-4 shrink-0 text-amber-600" />
            <span>
              Histórico diário persistido disponível a partir de{' '}
              <strong>{fmtDateLabel(meta.historical_coverage_from)}</strong>. Dias anteriores são
              indicados sem interpolação fictícia.
            </span>
          </div>
        )}

        {/* KPIs Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
          {/* KPI Valor Médio */}
          <div className="bg-slate-50/80 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200/60 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Valor Médio Diário em Aberto
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                {fmtCurrency(summary.avg_open_value_cents)}
              </span>
              {valueDelta !== null && (
                <span
                  className={`inline-flex items-center text-xs font-bold ${
                    valueDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {valueDelta >= 0 ? (
                    <TrendingUp className="w-3 h-3 mr-0.5" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-0.5" />
                  )}
                  {valueDelta > 0 ? `+${valueDelta}%` : `${valueDelta}%`}
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Média baseada em {summary.valid_snapshots_count} medições válidas
            </span>
          </div>

          {/* KPI Quantidade Média */}
          <div className="bg-slate-50/80 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200/60 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Volume Médio de Oportunidades Abertas
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                {summary.avg_open_count !== null ? `${summary.avg_open_count} deals` : '—'}
              </span>
              {countDelta !== null && (
                <span
                  className={`inline-flex items-center text-xs font-bold ${
                    countDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {countDelta >= 0 ? (
                    <TrendingUp className="w-3 h-3 mr-0.5" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-0.5" />
                  )}
                  {countDelta > 0 ? `+${countDelta}%` : `${countDelta}%`}
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Total de negócios simultâneos em andamento
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-6 pt-4">
        <div className="h-[260px] sm:h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="pipelineValueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#64B5DD" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#64B5DD" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
              <XAxis
                dataKey="label"
                tickLine={false}
                stroke="#94A3B8"
                fontSize={11}
                tickMargin={6}
              />

              {/* Y Axis Left: Valor Nominal (R$) */}
              {(activeMetric === 'both' || activeMetric === 'value') && (
                <YAxis
                  yAxisId="left"
                  tickLine={false}
                  stroke="#64B5DD"
                  fontSize={10}
                  tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
                />
              )}

              {/* Y Axis Right: Quantidade */}
              {(activeMetric === 'both' || activeMetric === 'count') && (
                <YAxis
                  yAxisId={activeMetric === 'both' ? 'right' : 'left'}
                  orientation={activeMetric === 'both' ? 'right' : 'left'}
                  tickLine={false}
                  stroke="#FA8248"
                  fontSize={10}
                  tickFormatter={(v) => `${v}`}
                />
              )}

              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const item = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white rounded-lg p-2.5 shadow-lg text-xs font-sans space-y-1">
                      <p className="font-bold text-slate-300 border-b border-slate-700 pb-1">
                        Data: {item.date} {item.isLive && '(Em tempo real)'}
                      </p>
                      {!item.hasSnapshot ? (
                        <p className="text-amber-400 italic">Sem snapshot nesta data</p>
                      ) : (
                        <>
                          <p className="flex items-center justify-between gap-4">
                            <span className="text-[#64B5DD]">Valor Aberto:</span>
                            <strong className="font-bold">
                              {item.value !== null
                                ? item.value.toLocaleString('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                  })
                                : '—'}
                            </strong>
                          </p>
                          <p className="flex items-center justify-between gap-4">
                            <span className="text-[#FA8248]">Deals Abertos:</span>
                            <strong className="font-bold">{item.count ?? '—'}</strong>
                          </p>
                        </>
                      )}
                    </div>
                  );
                }}
              />

              <Legend
                verticalAlign="bottom"
                height={32}
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
              />

              {/* Série 1: Valor em Aberto (Área Azul Suave) */}
              {(activeMetric === 'both' || activeMetric === 'value') && (
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="value"
                  name="Valor do Pipeline (R$)"
                  stroke="#64B5DD"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#pipelineValueGrad)"
                  connectNulls={false}
                />
              )}

              {/* Série 2: Quantidade de Oportunidades (Barras Laranja) */}
              {(activeMetric === 'both' || activeMetric === 'count') && (
                <Bar
                  yAxisId={activeMetric === 'both' ? 'right' : 'left'}
                  dataKey="count"
                  name="Quantidade de Deals"
                  fill="#FA8248"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={28}
                  opacity={0.85}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
