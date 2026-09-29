'use client';

import React, { useState } from 'react';
import {
  Activity,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Equal,
  History,
  Info,
  LineChart,
  ShieldAlert,
  UsersRound,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { RankingData } from '@/lib/api';

interface Props {
  data?: RankingData;
  isPreview?: boolean;
  historyDays?: string;
}

export function RankingEvidenceTabs({ data, isPreview = false, historyDays = '90' }: Props) {
  const [historyMetric, setHistoryMetric] = useState<'position' | 'percentile' | 'score'>('position');

  const historyItems = data?.history?.items || [];
  const historyLabel = historyDays === '365' ? 'últimos 12 meses' : `últimos ${historyDays} dias`;

  const leaders = data?.leaders || [];
  const neighbors = data?.neighbors || [];
  const currentScore = data?.ranking?.score;
  const currentPosition = data?.ranking?.position;

  const nearbyRows = [...leaders, ...neighbors].filter(
    (point, index, all) => !point.is_current_company && all.findIndex((item) => item.id === point.id) === index
  );

  const changes = data?.changes;
  const gaps = data?.gaps || [];
  const quality = data?.quality;

  return (
    <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs">
      <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
              <Activity className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
              Evidências & Análise Competitiva
            </CardTitle>
            <CardDescription className="text-xs">
              Histórico persistido, concorrentes imediatos e trilha de integridade da sua pontuação.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-6">
        <Tabs defaultValue="competitors" className="space-y-4">
          <TabsList className="flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:inline-flex sm:w-auto sm:overflow-visible dark:bg-slate-800">
            <TabsTrigger value="competitors" className="h-9 shrink-0 whitespace-nowrap px-3 text-[11px] sm:text-xs flex items-center gap-1.5">
              <UsersRound className="h-3.5 w-3.5 shrink-0" />
              <span className="sm:hidden">Empresas ({nearbyRows.length})</span>
              <span className="hidden sm:inline">Empresas Próximas ({nearbyRows.length})</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="h-9 shrink-0 whitespace-nowrap px-3 text-[11px] sm:text-xs flex items-center gap-1.5">
              <History className="h-3.5 w-3.5 shrink-0" />
              <span className="sm:hidden">Evolução</span>
              <span className="hidden sm:inline">Evolução Temporal</span>
            </TabsTrigger>
            <TabsTrigger value="changes" className="h-9 shrink-0 whitespace-nowrap px-3 text-[11px] sm:text-xs flex items-center gap-1.5">
              <LineChart className="h-3.5 w-3.5 shrink-0" />
              <span className="sm:hidden">Mudanças</span>
              <span className="hidden sm:inline">O Que Mudou</span>
            </TabsTrigger>
            <TabsTrigger value="quality" className="h-9 shrink-0 whitespace-nowrap px-3 text-[11px] sm:text-xs flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 shrink-0" />
              <span className="sm:hidden">Integridade</span>
              <span className="hidden sm:inline">Qualidade & Integridade</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: EMPRESAS PRÓXIMAS */}
          <TabsContent value="competitors" className="space-y-3 pt-2">
            <div className="flex flex-col gap-1 text-[11px] text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:text-xs">
              <span>Vizinhos competitivos na mesma população elegível</span>
              <span>Posição e IAS Score</span>
            </div>

            {nearbyRows.length ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
                {nearbyRows.map((point) => {
                  const diff = currentScore != null && point.ranking_score != null ? point.ranking_score - currentScore : null;
                  const isAbove = currentPosition != null && point.ranking_position != null && point.ranking_position < currentPosition;

                  return (
                    <div key={point.id} className="flex items-center justify-between gap-2 px-2.5 py-2.5 text-xs sm:text-sm sm:gap-3 sm:p-3 hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-900 dark:text-slate-100">{point.name}</p>
                        {diff != null ? (
                          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                            {diff > 0 ? (
                              <span className="text-amber-600 dark:text-amber-400 font-medium">▲ {diff.toFixed(1)} pts à frente</span>
                            ) : diff < 0 ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">▼ {Math.abs(diff).toFixed(1)} pts atrás (sua vantagem)</span>
                            ) : (
                              <span>Empate em pontos</span>
                            )}
                          </p>
                        ) : currentPosition != null && point.ranking_position != null ? (
                          <p className="text-[11px] sm:text-xs text-slate-500">
                            {isAbove ? '▲ à sua frente no ranking' : '▼ atrás de você no ranking'}
                          </p>
                        ) : null}
                      </div>

                      <div className="w-[64px] sm:w-[72px] shrink-0 text-right">
                        <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                          #{point.ranking_position ?? '—'}
                        </span>
                        <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          {point.ranking_score != null ? `${Number(point.ranking_score).toFixed(1)} pts` : '—'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="py-8 text-center text-xs text-slate-500">
                Nenhum concorrente direto mapeado para o escopo selecionado.
              </p>
            )}
          </TabsContent>

          {/* TAB 2: EVOLUÇÃO TEMPORAL */}
          <TabsContent value="history" className="space-y-4 pt-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs text-slate-500">
                {isPreview
                  ? 'A comparação regional atual é calculada em tempo real; exibindo histórico oficial nacional.'
                  : `Snapshots oficiais persistidos · ${historyLabel}`}
              </span>

              <div className="flex gap-1.5 shrink-0">
                {(['position', 'percentile', 'score'] as const).map((metric) => (
                  <Button
                    key={metric}
                    variant={historyMetric === metric ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 text-xs px-2.5"
                    onClick={() => setHistoryMetric(metric)}
                  >
                    {metric === 'position' ? 'Posição' : metric === 'percentile' ? 'Percentil' : 'Pontuação'}
                  </Button>
                ))}
              </div>
            </div>

            {historyItems.length ? (
              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historyItems} margin={{ top: 12, right: 16, bottom: 8, left: -16 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                    <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                    <YAxis reversed={historyMetric === 'position'} tick={{ fontSize: 10 }} />
                    <RechartsTooltip />
                    <Area
                      type="monotone"
                      dataKey={historyMetric}
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary) / 0.15)"
                      name={historyMetric === 'position' ? 'Posição' : historyMetric === 'percentile' ? 'Percentil' : 'IAS Score'}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center text-xs text-slate-500">
                {data?.history?.status === 'forming'
                  ? `Histórico em formação: ${data.history.sample_size || historyItems.length} de ${data.history.minimum_snapshots || 7} snapshots necessários para traçar tendências com significância estatística.`
                  : 'Dados históricos insuficientes para este escopo territorial.'}
              </div>
            )}
          </TabsContent>

          {/* TAB 3: O QUE MUDOU */}
          <TabsContent value="changes" className="space-y-3 pt-2">
            {changes?.status === 'ready' ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  Comparação do último snapshot ({changes.from}) para o atual ({changes.to}):
                </p>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-900/40">
                    <span className="text-xs text-slate-500">Posição</span>
                    <div className="flex items-center gap-1.5 mt-1 font-bold text-base">
                      {changes.changes.position > 0 ? (
                        <ArrowUp className="h-4 w-4 text-emerald-600" />
                      ) : changes.changes.position < 0 ? (
                        <ArrowDown className="h-4 w-4 text-rose-600" />
                      ) : (
                        <Equal className="h-4 w-4 text-slate-400" />
                      )}
                      <span className={changes.changes.position > 0 ? 'text-emerald-600' : changes.changes.position < 0 ? 'text-rose-600' : 'text-slate-600'}>
                        {changes.changes.position > 0 ? `Subiu ${changes.changes.position}` : changes.changes.position < 0 ? `Caiu ${Math.abs(changes.changes.position)}` : 'Estável'}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-900/40">
                    <span className="text-xs text-slate-500">IAS Score</span>
                    <div className="flex items-center gap-1.5 mt-1 font-bold text-base">
                      <span className={changes.changes.score > 0 ? 'text-emerald-600' : changes.changes.score < 0 ? 'text-rose-600' : 'text-slate-600'}>
                        {changes.changes.score > 0 ? `+${changes.changes.score.toFixed(1)}` : changes.changes.score.toFixed(1)} pts
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-900/40">
                    <span className="text-xs text-slate-500">Percentil</span>
                    <div className="flex items-center gap-1.5 mt-1 font-bold text-base">
                      <span className={changes.changes.percentile > 0 ? 'text-emerald-600' : changes.changes.percentile < 0 ? 'text-rose-600' : 'text-slate-600'}>
                        {changes.changes.percentile > 0 ? `+${changes.changes.percentile.toFixed(1)}%` : `${changes.changes.percentile.toFixed(1)}%`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="py-8 text-center text-xs text-slate-500">
                O histórico oficial ainda está em formação para comparar deltas semanais.
              </p>
            )}
          </TabsContent>

          {/* TAB 4: QUALIDADE & INTEGRIDADE */}
          <TabsContent value="quality" className="space-y-4 pt-2">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/40 space-y-2">
                <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Flags de Qualidade de Dados
                </span>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Todos os cálculos obedecem à amostra mínima e proteção contra saturação artificial. Nenhum dado sintético ou patrocinado entra nas métricas.
                </p>
                {quality?.flags && quality.flags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {quality.flags.map((flag) => (
                      <Badge key={flag} variant="outline" className="text-[10px]">
                        {flag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/40 space-y-2">
                <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-blue-600" />
                  Lacunas de Cobertura / Sinais
                </span>
                {gaps.length > 0 ? (
                  <div className="space-y-2 pt-1">
                    {gaps.map((gap) => (
                      <div key={gap.code} className="text-xs">
                        <strong className="text-slate-800 dark:text-slate-200">{gap.title}:</strong>{' '}
                        <span className="text-slate-500">{gap.description}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 pt-1">
                    Nenhuma lacuna crítica de dados identificada para sua empresa neste momento.
                  </p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
