'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, ArrowDownRight, Shield, Zap, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PositioningPoint, PositioningThresholds } from '@/lib/api';
import {
  AUTHORITY_FACTORS,
  EXECUTION_FACTORS,
  formatScore,
  formatDiff,
} from './positioning-formatters';

interface Props {
  point?: PositioningPoint | null;
  thresholds?: PositioningThresholds;
  currentCompanyMeta?: {
    city?: string | null;
    state?: string | null;
    sector?: string | null;
    slug?: string | null;
  };
  onOpenMethodology?: () => void;
}

function getCompanyInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function PositioningCompanyInspector({
  point,
  thresholds,
  currentCompanyMeta,
  onOpenMethodology,
}: Props) {
  if (!point) {
    return (
      <div className="flex h-full min-h-[460px] flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-6 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-medium text-muted-foreground">
          Selecione uma empresa no mapa para inspecionar os detalhes de pontuação.
        </p>
      </div>
    );
  }

  const xScore = point.x_score ?? point.completeness_of_vision ?? 0;
  const yScore = point.y_score ?? point.ability_to_execute ?? 0;
  const xThreshold = thresholds?.x_threshold ?? 50;
  const diffX = xScore - xThreshold;
  const isAboveMedianX = diffX >= 0;

  // Localização ou contexto real
  const locationText = point.is_current_company
    ? [currentCompanyMeta?.city, currentCompanyMeta?.state].filter(Boolean).join(', ') +
      (currentCompanyMeta?.sector ? ` • ${currentCompanyMeta.sector}` : '')
    : point.ranking_position
      ? `#${point.ranking_position} no ranking oficial`
      : 'Empresa comparada';

  // URL canônica de perfil
  const companyHref = point.is_current_company && currentCompanyMeta?.slug
    ? `/companies/${currentCompanyMeta.slug}`
    : `/companies/${point.id}`;

  return (
    <aside
      className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all dark:border-slate-800 dark:bg-slate-900/90"
      aria-label={`Detalhes de posicionamento de ${point.name}`}
    >
      <div className="space-y-4">
        {/* HEADER DA EMPRESA */}
        <div className="flex items-start gap-3 border-b border-slate-100 pb-4 dark:border-slate-800/80">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200/70 bg-slate-50 p-1.5 shadow-2xs dark:border-slate-800 dark:bg-slate-800">
            {point.logo_url ? (
              <Image
                src={point.logo_url}
                alt={point.name}
                width={40}
                height={40}
                className="h-full w-full object-contain"
              />
            ) : (
              <span className="text-xs font-black text-slate-500 dark:text-slate-400">
                {getCompanyInitials(point.name)}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-bold tracking-tight text-slate-900 dark:text-white">
                {point.name}
              </h3>
              {point.is_current_company ? (
                <span className="inline-flex items-center rounded-full border border-emerald-200/80 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-300">
                  Posição atual
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400">
                  Comparada
                </span>
              )}
            </div>
            {locationText && (
              <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                {locationText}
              </p>
            )}
          </div>
        </div>

        {/* METRIC CARDS (AUTORIDADE / EXECUÇÃO) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800/60 dark:bg-slate-800/30">
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Autoridade de Confiança
            </p>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                {formatScore(xScore)}
              </span>
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">/ 100</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/70 dark:bg-slate-700">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, xScore))}%` }}
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800/60 dark:bg-slate-800/30">
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Poder de Execução
            </p>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                {formatScore(yScore)}
              </span>
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">/ 100</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/70 dark:bg-slate-700">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, yScore))}%` }}
              />
            </div>
          </div>
        </div>

        {/* INSIGHT CARD VS MEDIANA */}
        <div
          className={cn(
            'flex items-start gap-2.5 rounded-xl border p-3 transition-colors',
            isAboveMedianX
              ? 'border-emerald-200/80 bg-emerald-50/70 text-emerald-950 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-100'
              : 'border-slate-200 bg-slate-50/70 text-slate-900 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-200'
          )}
        >
          <div
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
              isAboveMedianX
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                : 'bg-slate-200/70 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
            )}
          >
            {isAboveMedianX ? (
              <ArrowUpRight className="h-4 w-4" />
            ) : (
              <ArrowDownRight className="h-4 w-4" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold leading-tight">
              {isAboveMedianX
                ? 'Acima da mediana em Autoridade'
                : 'Abaixo da mediana em Autoridade'}
            </p>
            <p
              className={cn(
                'mt-0.5 text-[11px] leading-tight',
                isAboveMedianX
                  ? 'text-emerald-700 dark:text-emerald-300/90'
                  : 'text-slate-500 dark:text-slate-400'
              )}
            >
              {formatDiff(diffX)} pontos vs. mediana da população
            </p>
          </div>
        </div>

        {/* COMPONENTES DO SCORE (BREAKDOWN) */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-900 dark:text-white">
              Componentes do score
            </p>
            {onOpenMethodology && (
              <button
                type="button"
                onClick={onOpenMethodology}
                className="text-[11px] font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                Ver metodologia
              </button>
            )}
          </div>

          {/* SEÇÃO 1: AUTORIDADE */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/40 p-3 dark:border-slate-800/70 dark:bg-slate-800/20">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Shield className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                Autoridade de Confiança
              </span>
              <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                {formatScore(xScore)}
              </span>
            </div>
            <div className="space-y-1.5">
              {AUTHORITY_FACTORS.map((factor) => {
                const Icon = factor.icon;
                const rawVal = point.x_breakdown?.[factor.key] ?? 0;
                const pct = Math.min(100, Math.max(0, (rawVal / factor.maxScore) * 100));
                return (
                  <div
                    key={factor.key}
                    className="flex items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-300"
                  >
                    <span className="flex items-center gap-1.5 truncate text-slate-600 dark:text-slate-400">
                      <Icon className="h-3 w-3 shrink-0 text-slate-400 dark:text-slate-500" />
                      <span className="truncate">{factor.label}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-12 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-700">
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-7 text-right font-mono text-[10px] font-medium text-slate-700 dark:text-slate-300">
                        {rawVal.toFixed(1)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SEÇÃO 2: EXECUÇÃO */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/40 p-3 dark:border-slate-800/70 dark:bg-slate-800/20">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Zap className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                Poder de Execução
              </span>
              <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                {formatScore(yScore)}
              </span>
            </div>
            <div className="space-y-1.5">
              {EXECUTION_FACTORS.map((factor) => {
                const Icon = factor.icon;
                const rawVal = point.y_breakdown?.[factor.key] ?? 0;
                const pct = Math.min(100, Math.max(0, (rawVal / factor.maxScore) * 100));
                return (
                  <div
                    key={factor.key}
                    className="flex items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-300"
                  >
                    <span className="flex items-center gap-1.5 truncate text-slate-600 dark:text-slate-400">
                      <Icon className="h-3 w-3 shrink-0 text-slate-400 dark:text-slate-500" />
                      <span className="truncate">{factor.label}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-12 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-700">
                        <div
                          className="h-full rounded-full bg-indigo-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-7 text-right font-mono text-[10px] font-medium text-slate-700 dark:text-slate-300">
                        {rawVal.toFixed(1)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* CTA INFERIOR */}
      <div className="mt-5 pt-3">
        <Link
          href={companyHref}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-center text-xs font-semibold text-white shadow-xs transition-all hover:bg-blue-700 active:scale-[0.99] dark:bg-blue-600 dark:hover:bg-blue-500"
        >
          <span>Ver perfil completo da empresa</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
    </aside>
  );
}
