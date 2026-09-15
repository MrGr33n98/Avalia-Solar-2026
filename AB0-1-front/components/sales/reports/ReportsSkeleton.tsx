'use client';

import React from 'react';

export const ReportsSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse" data-testid="analytics-loading">
      {/* Skeleton Insights */}
      <div className="grid gap-3.5 md:grid-cols-2">
        <div className="h-20 rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800" />
        <div className="h-20 rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800" />
      </div>

      {/* Skeleton KPIs Linha 1 (4 cards) */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-24 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-7 w-7 rounded-lg bg-slate-200 dark:bg-slate-700" />
            </div>
            <div className="h-7 w-32 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-3 w-28 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        ))}
      </div>

      {/* Skeleton KPIs Linha 2 (3 cards) */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-24 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-7 w-7 rounded-lg bg-slate-200 dark:bg-slate-700" />
            </div>
            <div className="h-7 w-32 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-3 w-28 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        ))}
      </div>

      {/* Skeleton Gráficos */}
      <div className="h-72 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5" />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-64 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5" />
        <div className="h-64 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5" />
      </div>

      {/* Skeleton Tabela */}
      <div className="h-60 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
    </div>
  );
};
