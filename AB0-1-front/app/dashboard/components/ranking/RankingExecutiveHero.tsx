'use client';

import React from 'react';
import {
  ArrowDown,
  ArrowUp,
  Award,
  Equal,
  Globe2,
  HelpCircle,
  MapPinned,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { RankingData } from '@/lib/api';

interface Props {
  data?: RankingData;
  isPreview?: boolean;
  comparisonLabel?: string | null;
  heroTitle?: string;
  onOpenMethodology?: () => void;
}

export function RankingExecutiveHero({
  data,
  isPreview = false,
  comparisonLabel,
  heroTitle,
  onOpenMethodology,
}: Props) {
  const currentMetric = data?.ranking;
  const officialMetric = data?.official_ranking || data?.ranking;

  const position = currentMetric?.position;
  const population = currentMetric?.population;
  const score = currentMetric?.score != null ? Number(currentMetric.score) : null;
  const percentile = currentMetric?.percentile != null ? Number(currentMetric.percentile) : null;

  const title =
    heroTitle ||
    (isPreview && comparisonLabel
      ? `Desempenho em ${comparisonLabel}`
      : 'Desempenho no Mercado');

  // Delta de posição nos últimos 30/90 dias
  const changes = data?.changes?.changes;
  const posChange = changes?.position; // backend computes previous - current (+ is improvement)

  // Posição no topo da população: posição / população total elegível
  // Ex: #1 de 81 empresas => 1 / 81 * 100 = 1.2% (e não 0.1% artificial)
  const topPercent =
    position != null && population != null && population > 0
      ? Math.max(0.1, +((position / population) * 100).toFixed(1))
      : percentile != null
        ? Math.max(0.1, +(100 - percentile).toFixed(1))
        : null;

  return (
    <Card className="relative overflow-hidden border-border bg-card text-card-foreground shadow-xs">
      {/* Decorative gradient overlay */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/5 blur-3xl" />

      <CardContent className="space-y-6 p-6 md:p-8">
        {/* Header do Hero */}
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/20">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Market Position Intelligence
                </h2>
                <Badge variant="outline" className="text-[10px] font-semibold border-blue-200 bg-blue-50/60 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300">
                  Oficial
                </Badge>
              </div>
              <h2 id="ranking-title" className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-xl">
                {title}
              </h2>
            </div>
          </div>

          <TooltipProvider>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-50/80 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Ranking Independente</span>
                    <HelpCircle className="h-3 w-3 opacity-60" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs text-xs">
                  <p className="font-semibold">Critério 100% Orgânico</p>
                  <p className="mt-1 text-slate-400">
                    Empresas patrocinadas, anúncios ou assinaturas não recebem vantagem de pontuação nem alteram posições.
                  </p>
                </TooltipContent>
              </Tooltip>

              {onOpenMethodology && (
                <button
                  type="button"
                  onClick={onOpenMethodology}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline"
                >
                  Metodologia
                </button>
              )}
            </div>
          </TooltipProvider>
        </div>

        {/* Núcleo Central: Destaque em 5 Segundos */}
        <div className="grid gap-6 md:grid-cols-12 md:items-center">
          {/* Posição Principal e Escopo */}
          <div className="space-y-2 md:col-span-5">
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-black tracking-tight text-slate-900 dark:text-white md:text-5xl">
                {position != null ? `#${position}` : '—'}
              </span>
              {population && (
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  de {population} empresas
                </span>
              )}
            </div>

            {/* Delta de Posição Recente */}
            {posChange != null && (
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={`flex items-center gap-1 text-xs font-semibold ${
                    posChange > 0
                      ? 'border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : posChange < 0
                        ? 'border-rose-500/30 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                        : 'border-slate-200 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {posChange > 0 ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : posChange < 0 ? (
                    <ArrowDown className="h-3 w-3" />
                  ) : (
                    <Equal className="h-3 w-3" />
                  )}
                  {posChange > 0
                    ? `Subiu ${posChange} ${posChange === 1 ? 'posição' : 'posições'}`
                    : posChange < 0
                      ? `Caiu ${Math.abs(posChange)} ${Math.abs(posChange) === 1 ? 'posição' : 'posições'}`
                      : 'Posição estável'}{' '}
                  nos últimos snapshots
                </Badge>
              </div>
            )}
          </div>

          {/* Score e Percentil */}
          <div className="space-y-3 rounded-xl border border-slate-100 bg-white/70 p-4 shadow-2xs dark:border-slate-800/80 dark:bg-slate-900/60 md:col-span-7">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Pontuação Orgânica
                </span>
                <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {score != null ? `${score.toFixed(1)} pontos` : '—'}
                </p>
              </div>

              {percentile != null && (
                <div className="text-right">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Posicionamento Relativo
                  </span>
                  <p className="flex items-center justify-end gap-1.5 text-sm font-bold text-blue-600 dark:text-blue-400">
                    <Sparkles className="h-4 w-4" />
                    Top {topPercent}% do mercado
                  </p>
                </div>
              )}
            </div>

            {/* Barra de Progresso do Percentil */}
            {percentile != null && (
              <div className="space-y-1">
                <Progress value={percentile} className="h-2.5 bg-slate-100 dark:bg-slate-800" />
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Base da População (0%)</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Percentil {percentile.toFixed(1)}%
                  </span>
                  <span>Top Líderes (100%)</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Comparação Selecionada vs Ranking Oficial (quando houver filtro regional ativo) */}
        {isPreview && officialMetric && (
          <div className="mt-4 grid gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-950 dark:bg-blue-950/20 sm:grid-cols-2">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <Globe2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Ranking Oficial · Brasil</span>
              </div>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                #{officialMetric.position ?? '—'} de {officialMetric.population ?? '—'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Snapshot auditável persistido · Percentil {officialMetric.percentile != null ? `${Number(officialMetric.percentile).toFixed(1)}%` : '—'}
              </p>
            </div>

            <div className="space-y-1 border-t border-blue-200/60 pt-3 dark:border-blue-900/60 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                <MapPinned className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span>Comparação Atual · {comparisonLabel || 'Filtro Regional'}</span>
              </div>
              <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                #{currentMetric?.position ?? '—'} de {currentMetric?.population ?? '—'}
              </p>
              <p className="text-xs text-blue-600/80 dark:text-blue-400/80">
                Comparação dinâmica em tempo real · Não altera o ranking oficial
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
