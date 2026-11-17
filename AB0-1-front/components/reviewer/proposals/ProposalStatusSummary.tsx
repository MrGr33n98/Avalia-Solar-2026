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
              'flex min-h-[64px] min-w-0 flex-col justify-center rounded-xl border bg-white p-2 text-left shadow-none transition-colors hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 sm:min-h-[72px] sm:p-3',
              item.isActive ? item.activeRing : 'border-slate-200/90'
            )}
          >
            <div className="flex min-w-0 items-center gap-2">
              <div
                aria-hidden="true"
                className={cn(
                  'hidden h-6 w-6 shrink-0 items-center justify-center rounded-md min-[430px]:flex sm:h-7 sm:w-7',
                  item.iconBg
                )}
              >
                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
              <div className="flex min-w-0 flex-col justify-center gap-0.5">
                <span className="text-[11px] font-medium leading-4 text-slate-600 sm:text-xs">
                  {item.label}
                  {item.desktopSuffix && <span className="hidden lg:inline">{item.desktopSuffix}</span>}
                </span>
                <strong className="text-xl font-bold leading-6 tabular-nums text-slate-900 sm:text-2xl">
                  {item.count}
                </strong>
              </div>
            </div>
          </button>
        );
      })}
    </section>
  );
}
