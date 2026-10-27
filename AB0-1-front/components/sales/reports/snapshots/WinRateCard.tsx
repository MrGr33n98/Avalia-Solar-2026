'use client';

import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  WinRateSnapshotSummary,
  WinRateSnapshotPoint,
  SnapshotsMeta,
} from '@/lib/api/sales/types';

interface WinRateCardProps {
  summary: WinRateSnapshotSummary;
  series: WinRateSnapshotPoint[];
  meta: SnapshotsMeta;
}

function fmtDateLabel(dateStr: string): string {
  try {
    const [, m, d] = dateStr.split('-');
    return `${d}/${m}`;
  } catch {
    return dateStr;
  }
}

export function WinRateCard({ summary, series }: WinRateCardProps) {
  const chartData = series.map((s) => ({
    date: s.date,
    label: fmtDateLabel(s.date),
    won: s.won_count,
    lost: s.lost_count,
    closed: s.closed_count,
    winRate: s.win_rate_pct,
  }));

  const winRate = summary.win_rate_pct;
  const deltaPp = summary.win_rate_delta_pp;

  return (
    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs rounded-xl overflow-hidden font-sans">
      <CardHeader className="p-4 sm:p-6 pb-2 border-b border-slate-100 dark:border-slate-800/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#40C779]" />
              <CardTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                Win rate (Taxa de Ganho de Negócios Encerrados)
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-500 mt-1">
              Proporção de negócios ganhos calculada sobre o total de negócios encerrados (won + lost) por data efetiva.
            </CardDescription>
          </div>
        </div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3">
          {/* Taxa Global de Ganho */}
          <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-lg border border-emerald-200/60 dark:border-emerald-800/60 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block">
              Taxa Geral de Ganho
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-extrabold text-emerald-900 dark:text-emerald-100">
                {winRate !== null ? `${winRate.toFixed(1)}%` : '—'}
              </span>
              {deltaPp !== null && (
                <span
                  className={`inline-flex items-center text-xs font-bold ${
                    deltaPp >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                  title="Variação em relação ao período anterior de mesma duração"
                >
                  {deltaPp >= 0 ? (
                    <TrendingUp className="w-3 h-3 mr-0.5" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-0.5" />
                  )}
                  {deltaPp > 0 ? `+${deltaPp} p.p.` : `${deltaPp} p.p.`}
                </span>
              )}
            </div>
            <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5 block">
              Ganhos sobre encerrados
            </span>
          </div>

          {/* Negócios Ganhos */}
          <div className="bg-slate-50/80 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200/60 dark:border-slate-800">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Ganhos
            </span>
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1 block">
              {summary.won_count} deals
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Status Won</span>
          </div>

          {/* Negócios Perdidos */}
          <div className="bg-slate-50/80 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200/60 dark:border-slate-800">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block flex items-center gap-1">
              <XCircle className="w-3 h-3 text-rose-500" /> Perdidos
            </span>
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1 block">
              {summary.lost_count} deals
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Status Lost</span>
          </div>

          {/* Total Encerrados */}
          <div className="bg-slate-50/80 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200/60 dark:border-slate-800">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Encerrados
            </span>
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1 block">
              {summary.closed_count} deals
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Base amostral</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-6 pt-4">
        <div className="h-[260px] sm:h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
              <XAxis
                dataKey="label"
                tickLine={false}
                stroke="#94A3B8"
                fontSize={11}
                tickMargin={6}
              />
              {/* Eixo Esquerdo: Contagem de Deals */}
              <YAxis
                yAxisId="left"
                tickLine={false}
                stroke="#94A3B8"
                fontSize={10}
                tickFormatter={(v) => `${v}`}
              />
              {/* Eixo Direito: Taxa Percentual */}
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 100]}
                tickLine={false}
                stroke="#40C779"
                fontSize={10}
                tickFormatter={(v) => `${v}%`}
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const item = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white rounded-lg p-2.5 shadow-lg text-xs font-sans space-y-1">
                      <p className="font-bold text-slate-300 border-b border-slate-700 pb-1">
                        Período: {item.date}
                      </p>
                      <p className="flex items-center justify-between gap-4">
                        <span className="text-emerald-400">Ganhos (Won):</span>
                        <strong className="font-bold">{item.won}</strong>
                      </p>
                      <p className="flex items-center justify-between gap-4">
                        <span className="text-slate-400">Perdidos (Lost):</span>
                        <strong className="font-bold">{item.lost}</strong>
                      </p>
                      <p className="flex items-center justify-between gap-4">
                        <span className="text-slate-300">Total Encerrados:</span>
                        <strong className="font-bold">{item.closed}</strong>
                      </p>
                      <p className="flex items-center justify-between gap-4 border-t border-slate-700 pt-1">
                        <span className="text-[#40C779] font-bold">Taxa de Ganho:</span>
                        <strong className="font-bold text-[#40C779]">
                          {item.winRate !== null ? `${item.winRate}%` : '— (Sem amostra)'}
                        </strong>
                      </p>
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

              {/* Barra: Negócios Ganhos */}
              <Bar
                yAxisId="left"
                dataKey="won"
                name="Ganhos (Won)"
                fill="#40C779"
                stackId="deals"
                radius={[0, 0, 0, 0]}
                maxBarSize={28}
              />

              {/* Barra: Negócios Perdidos */}
              <Bar
                yAxisId="left"
                dataKey="lost"
                name="Perdidos (Lost)"
                fill="#94A3B8"
                stackId="deals"
                radius={[3, 3, 0, 0]}
                maxBarSize={28}
              />

              {/* Linha: Taxa de Conversão */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="winRate"
                name="Win Rate (%)"
                stroke="#2563EB"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#2563EB' }}
                activeDot={{ r: 5 }}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
