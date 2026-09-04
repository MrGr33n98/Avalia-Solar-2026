'use client';

import React from 'react';
import { PipelineCardDTO } from './OpportunityCard.types';

interface FooterProps {
  card: PipelineCardDTO;
}

export const OpportunityCardFooter: React.FC<FooterProps> = ({ card }) => {
  const agingDays = `${card.aging.days_in_stage}d`;
  const qualSummary = card.qualification?.bant_summary || card.qualification?.spin_summary || (card.qualification?.score ? `SPIN ${card.qualification.score}%` : null);
  const sourceName = card.source;

  return (
    <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1 text-[11px] text-slate-500">
      <div className="flex items-center gap-1 min-w-0 flex-1 overflow-hidden">
        {card.tags.length > 0 ? (
          card.tags.slice(0, 2).map((tag) => (
            <span
              key={tag.id}
              className="inline-block shrink-0 rounded px-1 py-0.2 text-[10px] font-bold text-white"
              style={{ backgroundColor: tag.color || '#1e3a8a' }}
            >
              {tag.name}
            </span>
          ))
        ) : (
          card.priority === 'urgent' || card.priority === 'high' ? (
            <span className="shrink-0 rounded bg-red-100 px-1 text-[10px] font-bold text-red-700">
              {card.priority.toUpperCase()}
            </span>
          ) : null
        )}

        {qualSummary && (
          <span className="shrink-0 rounded bg-slate-100 px-1 text-[10px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {qualSummary}
          </span>
        )}

        {sourceName && (
          <span className="truncate text-[10px] font-medium text-slate-400">
            {sourceName}
          </span>
        )}
      </div>

      <span
        className={`shrink-0 font-mono text-[10px] font-bold px-1 rounded ${
          card.aging.stale
            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
            : 'text-slate-400'
        }`}
        title={`Tempo no estágio atual: ${card.aging.days_in_stage} dias`}
      >
        {agingDays}
      </span>
    </div>
  );
};
