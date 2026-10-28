'use client';

import React from 'react';
import { ArrowDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FunnelStageConnectorProps {
  fromStageName: string;
  toStageName: string;
  advancedCount: number;
  conversionRate: number;
  onClick?: () => void;
  isSelected?: boolean;
}

export default function FunnelStageConnector({
  fromStageName,
  toStageName,
  advancedCount,
  conversionRate,
  onClick,
  isSelected = false,
}: FunnelStageConnectorProps) {
  return (
    <div className="flex flex-col items-center justify-center my-1 select-none">
      {/* Top micro line */}
      <div className="w-[1px] h-2 bg-slate-300 dark:bg-slate-700" />

      {/* Interactive Chevron Badge */}
      <button
        type="button"
        onClick={onClick}
        title={`Clique para ver as ${advancedCount} oportunidades que avançaram de ${fromStageName} para ${toStageName}`}
        className={cn(
          'group relative flex items-center justify-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md border transition-all cursor-pointer shadow-2xs',
          isSelected
            ? 'bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-500/30'
            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 hover:border-emerald-300'
        )}
      >
        <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
        <span className="font-bold tabular-nums tracking-tight">
          {conversionRate}%
        </span>
        <span className="font-normal opacity-90">
          {advancedCount} {advancedCount === 1 ? 'avançou' : 'avançaram'}
        </span>
        <ArrowDown className="w-3 h-3 opacity-60 ml-0.5" />
      </button>

      {/* Bottom micro line */}
      <div className="w-[1px] h-2 bg-slate-300 dark:bg-slate-700" />
    </div>
  );
}
