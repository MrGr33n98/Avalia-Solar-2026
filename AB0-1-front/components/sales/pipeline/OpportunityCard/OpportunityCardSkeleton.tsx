'use client';

import React from 'react';
import { OpportunityCardDensity } from './OpportunityCard.types';

interface OpportunityCardSkeletonProps {
  density?: OpportunityCardDensity;
}

export const OpportunityCardSkeleton: React.FC<OpportunityCardSkeletonProps> = ({ density = 'compact' }) => {
  if (density === 'expanded') {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-xs animate-pulse dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div className="h-4 w-3/4 bg-slate-200 rounded dark:bg-slate-700" />
          <div className="h-4 w-10 bg-slate-200 rounded dark:bg-slate-700" />
        </div>
        <div className="h-5 w-1/2 bg-slate-200 rounded my-1 dark:bg-slate-700" />
        <div className="h-3 w-2/3 bg-slate-200 rounded dark:bg-slate-700" />
        <div className="h-3 w-4/5 bg-slate-200 rounded dark:bg-slate-700" />
        <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between dark:border-slate-800">
          <div className="h-3 w-1/3 bg-slate-200 rounded dark:bg-slate-700" />
          <div className="h-3 w-8 bg-slate-200 rounded dark:bg-slate-700" />
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="opportunity-card-skeleton"
      className="flex flex-col gap-1.5 rounded-lg border border-slate-200 bg-white p-2.5 shadow-xs animate-pulse dark:border-slate-800 dark:bg-slate-900"
    >
      {/* Linha 1: Checkbox + Empresa + Badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1">
          <div className="h-3.5 w-3.5 rounded bg-slate-200 shrink-0 dark:bg-slate-700" />
          <div className="h-3.5 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="h-4 w-10 rounded bg-slate-200 shrink-0 dark:bg-slate-700" />
      </div>

      {/* Linha 2: Contato */}
      <div className="pl-5">
        <div className="h-3 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
      </div>

      {/* Linha 3: Valor + Probabilidade + Aging + Controles */}
      <div className="flex items-center justify-between pt-1 mt-0.5 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-1.5">
          <div className="h-4 w-14 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-3 w-7 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-3 w-5 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="flex items-center gap-1">
          <div className="h-4 w-4 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-4 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
    </div>
  );
};
