'use client';

import React from 'react';
import { PhoneCall, Clock } from 'lucide-react';
import { PipelineCardDTO } from './OpportunityCard.types';

interface ActivityProps {
  card: PipelineCardDTO;
}

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return 'Sem atividade';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'hoje';
  if (diffDays === 1) return 'ontem';
  if (diffDays > 0) return `há ${diffDays}d`;
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

export const OpportunityCardActivity: React.FC<ActivityProps> = ({ card }) => {
  const act = card.last_activity;

  if (!act) {
    return (
      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 italic my-1">
        <Clock className="h-3 w-3 shrink-0" />
        <span>Sem registro recente</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 my-1 truncate">
      <PhoneCall className="h-3 w-3 shrink-0 text-blue-600 dark:text-blue-400" />
      <span className="truncate">{act.description}</span>
      <span className="shrink-0 text-[10px] text-slate-400">· {formatRelativeTime(act.occurred_at)}</span>
    </div>
  );
};
