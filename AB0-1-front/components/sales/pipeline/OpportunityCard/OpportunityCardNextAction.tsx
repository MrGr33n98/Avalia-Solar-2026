'use client';

import React from 'react';
import { CheckSquare, Plus } from 'lucide-react';
import { PipelineCardDTO } from './OpportunityCard.types';

interface NextActionProps {
  card: PipelineCardDTO;
  onCreateTask?: (card: PipelineCardDTO) => void;
}

export const OpportunityCardNextAction: React.FC<NextActionProps> = ({ card, onCreateTask }) => {
  const nextAction = card.next_action;

  if (!nextAction) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onCreateTask?.(card);
        }}
        className="flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 my-1 transition-colors"
      >
        <Plus className="h-3 w-3 shrink-0" />
        <span>Criar próxima ação</span>
      </button>
    );
  }

  const isOverdue = card.flags.overdue;
  const isDueToday = card.flags.due_today;

  let badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300';
  if (isOverdue) {
    badgeColor = 'bg-red-50 text-red-800 border-red-200 font-bold dark:bg-red-950/50 dark:text-red-300';
  } else if (isDueToday) {
    badgeColor = 'bg-amber-50 text-amber-900 border-amber-200 font-bold dark:bg-amber-950/50 dark:text-amber-300';
  }

  const formattedTime = nextAction.due_at
    ? new Date(nextAction.due_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className={`flex items-center justify-between gap-1 rounded border px-1.5 py-0.5 my-1 text-[11px] ${badgeColor}`}>
      <div className="flex items-center gap-1 truncate">
        <CheckSquare className="h-3 w-3 shrink-0" />
        <span className="truncate">{nextAction.title}</span>
      </div>
      {formattedTime && <span className="shrink-0 text-[10px]">· {formattedTime}</span>}
    </div>
  );
};
