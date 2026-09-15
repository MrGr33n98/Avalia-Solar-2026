'use client';

import React from 'react';
import { Flame, ThermometerSnowflake, Zap } from 'lucide-react';

interface OpportunityTemperatureBadgeProps {
  temperature?: 'cold' | 'warm' | 'hot' | string;
}

export const OpportunityTemperatureBadge: React.FC<OpportunityTemperatureBadgeProps> = ({ temperature }) => {
  if (temperature === 'hot') {
    return (
      <span
        className="inline-flex items-center gap-1 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-950/50 dark:text-red-300 shrink-0"
        title="Lead Quente / Alta Temperatura"
      >
        <Flame className="h-3 w-3 fill-red-500 text-red-500" />
        HOT
      </span>
    );
  }

  if (temperature === 'warm') {
    return (
      <span
        className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 shrink-0"
        title="Lead Morno / Média Temperatura"
      >
        <Zap className="h-3 w-3 text-amber-600 fill-amber-500" />
        WARM
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400 shrink-0"
      title="Lead Frio"
    >
      <ThermometerSnowflake className="h-3 w-3 text-slate-400" />
      COLD
    </span>
  );
};
