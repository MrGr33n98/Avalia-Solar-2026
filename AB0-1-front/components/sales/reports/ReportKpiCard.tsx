'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ReportIcon, ReportIconTone } from './ReportIcon';

export interface ReportKpiCardProps {
  label: string;
  value: string;
  detail?: string;
  iconSrc: string;
  iconTone?: ReportIconTone;
  highlight?: boolean;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  testId?: string;
}

export const ReportKpiCard: React.FC<ReportKpiCardProps> = ({
  label,
  value,
  detail,
  iconSrc,
  iconTone = 'blue',
  highlight = false,
  trend,
  trendDirection = 'neutral',
  testId,
}) => {
  let borderBgClasses =
    'border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900/80 hover:border-slate-300 dark:hover:border-slate-700';

  if (highlight) {
    borderBgClasses =
      'border-blue-200 bg-blue-50/25 dark:border-blue-800/80 dark:bg-blue-950/20 hover:border-blue-300 dark:hover:border-blue-700';
  }

  return (
    <Card
      className={`group relative overflow-hidden rounded-xl border shadow-2xs transition-all duration-150 ${borderBgClasses}`}
      data-testid={testId}
    >
      <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full gap-3">
        {/* Header do Card: Ícone + Label */}
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <ReportIcon src={iconSrc} tone={iconTone} size="md" />
            <span
              className="truncate text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
              title={label}
            >
              {label}
            </span>
          </div>

          {trend && (
            <span
              className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                trendDirection === 'up'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : trendDirection === 'down'
                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {trend}
            </span>
          )}
        </div>

        {/* Valor e Detalhe */}
        <div className="min-w-0">
          <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate">
            {value}
          </div>
          {detail && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate" title={detail}>
              {detail}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
