'use client';

import type { AchievementSummary } from '@/lib/api/achievements';

interface AchievementSummaryHeaderProps {
  summary: AchievementSummary;
}

export function AchievementSummaryHeader({ summary }: AchievementSummaryHeaderProps) {
  const completion = Math.min(100, Math.max(0, summary.completion_percentage));

  return (
    <section
      aria-labelledby="achievements-title"
      className="mb-4 rounded-lg border border-slate-200 bg-white px-4 py-4 sm:px-5 sm:py-5 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 max-w-2xl">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-blue-600 dark:text-blue-400">
            Programa de reconhecimento
          </p>
          <h1 id="achievements-title" className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
            Minhas conquistas
          </h1>
          <p className="mt-1.5 text-xs leading-5 text-slate-600 sm:text-[13px] dark:text-slate-300">
            Suas contribuições para a comunidade Avalia Solar geram reconhecimento.
            Descubra os requisitos de cada emblema e acompanhe os que já conquistou.
          </p>
        </div>
        <dl className="grid grid-cols-3 gap-2 sm:gap-3 lg:w-[334px] lg:shrink-0">
          <div className="min-w-0 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 dark:border-slate-700 dark:bg-slate-800">
            <dt className="truncate text-[10px] font-medium text-slate-500 dark:text-slate-400">Conquistadas</dt>
            <dd className="mt-1 whitespace-nowrap text-lg font-semibold tabular-nums text-slate-900 dark:text-white">
              {summary.unlocked_count}<span className="ml-0.5 text-xs font-normal text-slate-500">/{summary.total_count}</span>
            </dd>
          </div>
          <div className="min-w-0 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 dark:border-slate-700 dark:bg-slate-800">
            <dt className="truncate text-[10px] font-medium text-slate-500 dark:text-slate-400">Pontos XP</dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums text-slate-900 dark:text-white">{summary.xp_total}</dd>
          </div>
          <div className="min-w-0 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 dark:border-slate-700 dark:bg-slate-800">
            <dt className="truncate text-[10px] font-medium text-slate-500 dark:text-slate-400">Progresso</dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums text-slate-900 dark:text-white">{completion}%</dd>
          </div>
        </dl>
      </div>
      {summary.total_count > 0 && (
        <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
          <span className="shrink-0 text-[11px] text-slate-500 dark:text-slate-400">Progresso geral</span>
          <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
            <div
              className="h-full rounded-full bg-blue-600 transition-[width] duration-300 motion-reduce:transition-none"
              style={{ width: `${completion}%` }}
              role="progressbar"
              aria-label="Progresso geral de conquistas"
              aria-valuenow={completion}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <span className="shrink-0 text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
            {summary.unlocked_count} de {summary.total_count}
          </span>
        </div>
      )}
    </section>
  );
}
