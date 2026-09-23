'use client';

import React from 'react';
import {
  ArrowRight,
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

  // Identificar maior força e maior oportunidade
  const sortedDrivers = [...drivers].sort((a, b) => b.value - a.value);
  const topStrength = sortedDrivers[0];
  const topOpportunity = sortedDrivers[sortedDrivers.length - 1];

  // Benchmarks e Opportunity Gap
  const median = benchmarks?.median_score != null ? Number(benchmarks.median_score) : null;
  const p75 = benchmarks?.p75_score != null ? Number(benchmarks.p75_score) : null;
  const p90 = benchmarks?.p90_score != null ? Number(benchmarks.p90_score) : null;

  // Determinar próximo patamar
  let nextTierName = 'Top 50% (Mediana)';
  let nextTierScore = median;
  let gap: number | null = null;
  let currentTier = 'Base da População';

  if (currentScore != null) {
    if (p90 != null && currentScore >= p90) {
      currentTier = 'Top 10% (Líderes de Mercado)';
      nextTierName = 'Liderança Absoluta';
      nextTierScore = null;
      gap = 0;
    } else if (p75 != null && currentScore >= p75) {
      currentTier = 'Top 25% (Alta Performance)';
      nextTierName = 'Top 10%';
      nextTierScore = p90;
      gap = p90 != null ? +(p90 - currentScore).toFixed(1) : null;
    } else if (median != null && currentScore >= median) {
      currentTier = 'Top 50% (Acima da Média)';
      nextTierName = 'Top 25%';
      nextTierScore = p75;
      gap = p75 != null ? +(p75 - currentScore).toFixed(1) : null;
    } else {
      currentTier = 'Em Consolidação';
      nextTierName = 'Top 50% (Mediana)';
      nextTierScore = median;
      gap = median != null ? +(median - currentScore).toFixed(1) : null;
    }
  }

  return (
    <section className="grid gap-5 lg:grid-cols-12" aria-label="Explicabilidade e Próximo Patamar">
      {/* 1. Por que estou nesta posição? */}
      <Card className="lg:col-span-7 border-slate-200/80 dark:border-slate-800">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <HelpCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              Por que sua empresa está em #{currentPosition ?? '—'}?
            </CardTitle>
            <Badge variant="outline" className="text-[10px]">
              {data?.score_drivers?.source === 'official_snapshot' ? 'Snapshot Oficial' : 'Tempo Real'}
            </Badge>
          </div>
          <CardDescription>
            Composição auditável dos fatores orgânicos que determinam sua nota e posicionamento.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {drivers.length > 0 ? (
            <div className="grid gap-2.5 sm:grid-cols-2">
              {drivers.map((driver) => {
                const isStrong = driver.value >= 70;
                const isModerate = driver.value >= 50 && driver.value < 70;

                return (
                  <div
                    key={driver.code}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-sm dark:border-slate-800/80 dark:bg-slate-900/40"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{driver.label}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {driver.value.toFixed(1)} / 100 pts
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs font-semibold ${
                        isStrong
                          ? 'border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : isModerate
                            ? 'border-blue-500/30 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                            : 'border-amber-500/30 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                      }`}
                    >
                      {isStrong ? 'Forte' : isModerate ? 'Médio' : 'Oportunidade'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Composição detalhada dos fatores em formação.
            </p>
          )}

          {/* Destaque de Fator Positivo e Maior Oportunidade */}
          {topStrength && (
            <div className="mt-3 grid gap-2.5 sm:grid-cols-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-start gap-2 text-xs">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Pilar mais forte:
                  </span>{' '}
                  <span className="text-slate-600 dark:text-slate-400">
                    {topStrength.label} ({topStrength.value.toFixed(1)} pts)
                  </span>
                </div>
              </div>

              {topOpportunity && topOpportunity.code !== topStrength.code && (
                <div className="flex items-start gap-2 text-xs">
                  <TrendingUp className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Maior alavanca:
                    </span>{' '}
                    <span className="text-slate-600 dark:text-slate-400">
                      {topOpportunity.label} ({topOpportunity.value.toFixed(1)} pts)
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Opportunity Gap & Próximo Patamar */}
      <Card className="lg:col-span-5 border-slate-200/80 dark:border-slate-800 bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <Target className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Opportunity Gap & Patamares
          </CardTitle>
          <CardDescription>
            Distância observada para os marcos competitivos da população elegível.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Régua de Patamares */}
          <div className="space-y-2 rounded-xl border border-slate-100 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900/80 text-xs">
            <div className="flex justify-between items-center text-slate-500">
              <span>Sua Pontuação Atual</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                {currentScore != null ? `${currentScore.toFixed(1)} pontos` : '—'}
              </span>
            </div>

            <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-2 font-mono">
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>Top 50% (Mediana)</span>
                <span className="font-semibold">{median != null ? `${median.toFixed(1)} pts` : '—'}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>Top 25% (P75)</span>
                <span className="font-semibold">{p75 != null ? `${p75.toFixed(1)} pts` : '—'}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>Top 10% (P90)</span>
                <span className="font-semibold">{p90 != null ? `${p90.toFixed(1)} pts` : '—'}</span>
              </div>
            </div>
          </div>

          {/* Gap para o Próximo Patamar */}
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
              <p className="mt-1.5 text-xs text-blue-700/80 dark:text-blue-300/80">
                Alavancar{' '}
                <strong className="text-blue-900 dark:text-blue-100">
                  {topOpportunity?.label || 'o engajamento e avaliações'}
                </strong>{' '}
                é a forma mais direta de fechar este gap.
              </p>
            </div>
          ) : gap === 0 ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 dark:border-emerald-900/50 dark:bg-emerald-950/30">
              <p className="text-xs font-bold text-emerald-800 dark:text-emerald-200">
                🌟 Sua empresa já está no Top 10% do mercado!
              </p>
              <p className="mt-1 text-xs text-emerald-700/80 dark:text-emerald-300/80">
                Mantenha avaliações recentes ativas e verificação em dia para sustentar sua liderança.
              </p>
            </div>
          ) : null}

          {/* Next Best Action recomendada */}
          {nextAction && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-900/40 text-xs">
              <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
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
