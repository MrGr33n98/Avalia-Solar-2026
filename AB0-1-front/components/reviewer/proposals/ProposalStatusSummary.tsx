'use client';

import React from 'react';
import { FileText, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ProposalFilter = 'all' | 'active' | 'received' | 'completed' | 'awaiting';

interface ProposalStatusSummaryProps {
  stats: {
    active: number;
    received: number;
    pending: number;
  };
  currentFilter: ProposalFilter;
  onSelectFilter: (filter: ProposalFilter) => void;
}

export function ProposalStatusSummary({
  stats,
  currentFilter,
  onSelectFilter,
}: ProposalStatusSummaryProps) {
  const items = [
    {
      key: 'active' as const,
      label: 'Ativas',
      accessibleLabel: `${stats.active} propostas ativas`,
      count: stats.active,
      isActive: currentFilter === 'active',
      icon: FileText,
      iconBg: 'bg-blue-50 text-blue-600',
      activeRing: 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/10',
    },
    {
      key: 'received' as const,
      label: 'Recebidas',
      accessibleLabel: `${stats.received} propostas recebidas`,
      count: stats.received,
      isActive: currentFilter === 'received',
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 text-emerald-600',
      activeRing: 'border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/10',
    },
    {
      key: 'awaiting' as const,
      label: 'Aguardando',
      desktopSuffix: ' retorno',
      accessibleLabel: `${stats.pending} propostas aguardando retorno da empresa`,
      count: stats.pending,
      isActive: currentFilter === 'awaiting',
      icon: Clock,
      iconBg: 'bg-amber-50 text-amber-600',
      activeRing: 'border-amber-600 ring-2 ring-amber-500/20 bg-amber-50/10',
    },
  ];

  return (
    <section
      aria-label="Resumo de status"
      className="grid w-full grid-cols-3 gap-2 sm:gap-3"
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onSelectFilter(item.isActive ? 'all' : item.key)}
            aria-label={item.accessibleLabel}
            aria-pressed={item.isActive}
            className={cn(
              'flex min-w-0 min-h-[76px] sm:min-h-[84px] flex-col justify-center rounded-2xl border bg-white px-2.5 py-2 sm:px-3 sm:py-2.5 text-left shadow-2xs transition-all hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
              item.isActive ? item.activeRing : 'border-slate-200/90'
            )}
          >
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div
                className={cn(
                  'flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg sm:rounded-xl',
                  item.iconBg
                )}
                aria-hidden="true"
              >
                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[2]" />
              </div>
              <strong className="text-xl sm:text-2xl font-bold tabular-nums leading-none text-slate-900">
                {item.count}
              </strong>
            </div>
            <span className="mt-1.5 min-w-0 text-[11px] sm:text-xs font-semibold leading-tight text-slate-600 truncate">
              {item.label}
              {item.desktopSuffix && (
                <span className="hidden sm:inline">{item.desktopSuffix}</span>
              )}
            </span>
          </button>
        );
      })}
    </section>
  );
}
