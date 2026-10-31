'use client';

import React from 'react';
import type { LeadsAnalyticsSummary } from '@/lib/api/sales/types';

interface LeadsKpiSummaryBarProps {
  summary: LeadsAnalyticsSummary;
  isLoading?: boolean;
}

export function LeadsKpiSummaryBar({ summary, isLoading }: LeadsKpiSummaryBarProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-sm animate-pulse">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex flex-col gap-2 p-2">
            <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded w-28" />
            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-20" />
          </div>
        ))}
      </div>
    );
  }

  const items = [
    {
      label: 'Total de leads',
      value: `${summary.total_leads}`,
      helper: summary.total_leads === 1 ? 'oportunidade' : 'oportunidades',
    },
    {
      label: 'Valor total',
      value: summary.total_value_formatted || 'R$ 0,00',
      helper: 'Pipeline ativo',
    },
    {
      label: 'Ticket médio',
      value: summary.avg_value_formatted || 'R$ 0,00',
      helper: 'Por oportunidade',
    },
    {
      label: 'Tempo médio',
      value: `${summary.avg_time_open_days.toFixed(1)} dias`,
      helper: 'Até desfecho/atual',
    },
    {
      label: 'Taxa de vitória',
      value: `${summary.win_rate_percentage.toFixed(1)}%`,
      helper:
        summary.closed_deals !== undefined && summary.closed_deals === 0
          ? 'Sem negócios fechados'
          : summary.closed_deals !== undefined
          ? `${summary.won_deals ?? 0} de ${summary.closed_deals} fechados`
          : 'Ganhos / Fechados',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800 shadow-sm">
      {items.map((item, index) => (
        <div key={index} className="p-4 flex flex-col justify-center">
          <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {item.value}
          </span>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">
            {item.label}
          </span>
          {item.helper && (
            <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
              {item.helper}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
