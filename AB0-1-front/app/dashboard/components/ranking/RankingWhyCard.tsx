'use client';

import React from 'react';
import {
  CheckCircle2,
  HelpCircle,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { RankingData } from '@/lib/api';

interface Props {
  data?: RankingData;
}

export function RankingWhyCard({ data }: Props) {
  const drivers = data?.score_drivers?.items || [];
  const currentScore = data?.ranking?.score != null ? Number(data.ranking.score) : null;
  const currentPosition = data?.ranking?.position;
  const benchmarks = data?.benchmarks;
  const nextAction = data?.insights?.next_best_action;

  // Benchmarks e Opportunity Gap
  const median = benchmarks?.median_score != null ? Number(benchmarks.median_score) : null;
  const p75 = benchmarks?.p75_score != null ? Number(benchmarks.p75_score) : null;
  const p90 = benchmarks?.p90_score != null ? Number(benchmarks.p90_score) : null;

  // Separar fatores em Pontos Fortes (>= 60) e Oportunidades (< 60)
  const strengths = drivers.filter((d) => d.value >= 60).sort((a, b) => b.value - a.value);
  const opportunities = drivers.filter((d) => d.value < 60).sort((a, b) => a.value - b.value);

  // Determinar próximo patamar
  let nextTierName = 'Top 50% (Mediana)';
  let gap: number | null = null;
  let currentTier = 'Base da População';

  if (currentScore != null) {
    if (p90 != null && currentScore >= p90) {
      currentTier = 'Top 10% (Líderes de Mercado)';
      nextTierName = 'Liderança Consolidada';
      gap = 0;
    } else if (p75 != null && currentScore >= p75) {
      currentTier = 'Top 25% (Alta Performance)';
      nextTierName = 'Top 10% (Líderes)';
      gap = p90 != null ? +(p90 - currentScore).toFixed(1) : null;
    } else if (median != null && currentScore >= median) {
      currentTier = 'Top 50% (Acima da Mediana)';
      nextTierName = 'Top 25%';
      gap = p75 != null ? +(p75 - currentScore).toFixed(1) : null;
    } else {
      currentTier = 'Em Consolidação';
      nextTierName = 'Top 50% (Mediana)';
      gap = median != null ? +(median - currentScore).toFixed(1) : null;
    }
  }

  // Posição percentual na régua (0 a 100) com clamp de segurança (4% a 96%)
  const calculateMarkerPos = (val: number | null) => {
    if (val == null) return 0;
    return Math.min(96, Math.max(4, val));
  };

  return (
    <section id="modulo-insights" className="grid gap-5 lg:grid-cols-12" aria-label="Módulo 03: Insights e Opportunity Gap">
      {/* 1. Por que estou nesta posição? (Drivers em 2 Colunas) */}
      <Card className="lg:col-span-7 border-slate-200/80 dark:border-slate-800 shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
              <HelpCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              Por que sua empresa está em #{currentPosition ?? '—'}?
            </CardTitle>
            <Badge variant="outline" className="text-[10px] font-semibold border-slate-200 dark:border-slate-800">
              {data?.score_drivers?.source === 'official_snapshot' ? 'Snapshot Oficial' : 'Tempo Real'}
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Composição auditável dos fatores orgânicos que determinam sua pontuação e posição competitiva.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Coluna 1: Fatores Positivos (Pontos Fortes) */}
            <div className="space-y-3 rounded-xl border border-emerald-500/20 bg-emerald-50/30 p-3.5 dark:border-emerald-500/20 dark:bg-emerald-950/20">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Pontos Fortes</span>
              </div>

              {strengths.length > 0 ? (
                <div className="space-y-2.5">
                  {strengths.map((item) => (
                    <div key={item.code} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate pr-2">
                          {item.label}
                        </span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
                          {item.value.toFixed(1)} pts
                        </span>
                      </div>
                      <Progress value={item.value} className="h-1.5 bg-emerald-100 dark:bg-emerald-950" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Nenhum pilar atingiu 60+ pontos ainda.
                </p>
              )}
            </div>

            {/* Coluna 2: Principais Oportunidades de Melhoria */}
            <div className="space-y-3 rounded-xl border border-amber-500/20 bg-amber-50/30 p-3.5 dark:border-amber-500/20 dark:bg-amber-950/20">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                <TrendingUp className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <span>Oportunidades</span>
              </div>

              {opportunities.length > 0 ? (
                <div className="space-y-2.5">
                  {opportunities.map((item) => (
                    <div key={item.code} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate pr-2">
                          {item.label}
                        </span>
                        <span className="font-bold text-amber-700 dark:text-amber-400 shrink-0">
                          {item.value.toFixed(1)} pts
                        </span>
                      </div>
                      <Progress value={item.value} className="h-1.5 bg-amber-100 dark:bg-amber-950" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  Excelente! Todos os seus pilares estão com alta performance.
                </p>
              )}
            </div>
          </div>

          {/* Destaque Sintético no Rodapé */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
            <span className="font-semibold text-slate-900 dark:text-slate-200">Critério de Cálculo:</span> O IAS combina integridade e qualificação cadastral (TrustScore) com sinais operacionais recentes de conversão e atendimento ao cliente.
          </div>
        </CardContent>
      </Card>

      {/* 2. Opportunity Gap & Patamares (com Régua Gráfica Visual) */}
      <Card className="lg:col-span-5 border-slate-200/80 dark:border-slate-800 shadow-xs bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
              <Target className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Opportunity Gap & Patamares
            </CardTitle>
            {currentScore != null && (
              <Badge variant="outline" className="text-[10px] font-semibold border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
                {currentTier}
              </Badge>
            )}
          </div>
          <CardDescription className="text-xs">
            Distância matemática observada em relação aos marcos competitivos da população.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Régua Gráfica Horizontal de Patamares (Fiel ao Blueprint) */}
          <div className="space-y-3 rounded-xl border border-slate-200/70 bg-white p-3.5 sm:p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900/80">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-500 dark:text-slate-400">Régua Competitiva</span>
              <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                Sua nota: {currentScore != null ? `${currentScore.toFixed(1)} pts` : '—'}
              </span>
            </div>

            {/* Canvas Interno do Termômetro com Padding Seguro */}
            <div className="relative mt-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 px-3.5 py-6 sm:px-4 dark:border-slate-800 dark:bg-slate-950/40">
              <div className="relative h-2.5 w-full rounded-full bg-slate-200/70 dark:bg-slate-800 overflow-hidden">
                {/* Faixa até a mediana (0-50%) */}
                <div className="absolute left-0 top-0 bottom-0 bg-blue-500/20" style={{ width: `${calculateMarkerPos(median)}%` }} />
                {/* Faixa P75-P90 */}
                <div className="absolute top-0 bottom-0 bg-emerald-500/20" style={{ left: `${calculateMarkerPos(p75)}%`, right: `${100 - calculateMarkerPos(p90)}%` }} />
              </div>

              {/* Marcador da Mediana (P50) */}
              {median != null && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none"
                  style={{ left: `${calculateMarkerPos(median)}%` }}
                >
                  <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">P50</span>
                  <div className="h-4 w-0.5 bg-slate-400 dark:bg-slate-600 mt-0.5" />
                </div>
              )}

              {/* Marcador P75 */}
              {p75 != null && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none"
                  style={{ left: `${calculateMarkerPos(p75)}%` }}
                >
                  <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400">P75</span>
                  <div className="h-4 w-0.5 bg-blue-500 mt-0.5" />
                </div>
              )}

              {/* Marcador P90 */}
              {p90 != null && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none"
                  style={{ left: `${calculateMarkerPos(p90)}%` }}
                >
                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">P90</span>
                  <div className="h-4 w-0.5 bg-emerald-500 mt-0.5" />
                </div>
              )}

              {/* Pino "VOCÊ" */}
              {currentScore != null && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center z-10 pointer-events-none"
                  style={{ left: `${calculateMarkerPos(currentScore)}%` }}
                >
                  <div className="rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-bold text-white shadow-xs">
                    VOCÊ
                  </div>
                  <div className="h-3 w-3 rounded-full bg-emerald-600 ring-4 ring-emerald-100 dark:ring-emerald-950/60 mt-0.5" />
                </div>
              )}
            </div>

            {/* Badges de Distância para Patamares */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
              <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/50">
                <span className="block text-[10px] text-slate-500 dark:text-slate-400">Mediana (P50)</span>
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                  {median != null ? `${median.toFixed(1)} pts` : '—'}
                </span>
              </div>
              <div className="rounded-lg bg-blue-50/60 p-2 dark:bg-blue-950/40">
                <span className="block text-[10px] text-blue-700 dark:text-blue-300">Top 25% (P75)</span>
                <span className="font-bold text-xs text-blue-900 dark:text-blue-100">
                  {p75 != null ? `${p75.toFixed(1)} pts` : '—'}
                </span>
              </div>
              <div className="rounded-lg bg-emerald-50/60 p-2 dark:bg-emerald-950/40">
                <span className="block text-[10px] text-emerald-700 dark:text-emerald-300">Top 10% (P90)</span>
                <span className="font-bold text-xs text-emerald-900 dark:text-emerald-100">
                  {p90 != null ? `${p90.toFixed(1)} pts` : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Card de Status do Gap */}
          {gap != null && gap > 0 ? (
            <div className="rounded-xl border border-blue-200/70 bg-blue-50/60 p-3.5 dark:border-blue-900/50 dark:bg-blue-950/30">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-900 dark:text-blue-200">
                  Para alcançar o {nextTierName}:
                </span>
                <Badge className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs">
                  Faltam {gap} pts
                </Badge>
              </div>
              <p className="mt-1 text-xs text-blue-700/80 dark:text-blue-300/80">
                Alavancar engajamento e solicitar avaliações aos clientes recentes é a forma mais direta de fechar este gap.
              </p>
            </div>
          ) : gap === 0 ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 dark:border-emerald-900/50 dark:bg-emerald-950/30">
              <p className="text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                Sua empresa já está no Top 10% do mercado!
              </p>
              <p className="mt-1 text-xs text-emerald-700/80 dark:text-emerald-300/80">
                Mantenha avaliações recentes ativas e verificação em dia para sustentar sua liderança.
              </p>
            </div>
          ) : null}

          {/* Próxima Ação Recomendada (Next Best Action - Determinística) */}
          {nextAction && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/60 text-xs">
              <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                Próxima Ação Recomendada
              </p>
              <p className="mt-1 text-slate-600 dark:text-slate-400">
                {nextAction.title || nextAction.description || nextAction.message}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
