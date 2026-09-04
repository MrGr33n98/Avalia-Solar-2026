'use client';

import React from 'react';
import { User, UserCheck } from 'lucide-react';
import { PipelineCardDTO } from './OpportunityCard.types';

interface ContactProps {
  card: PipelineCardDTO;
}

export const OpportunityCardContact: React.FC<ContactProps> = ({ card }) => {
  const contactName = card.primary_contact?.name || 'Sem contato principal';
  const ownerName = card.owner?.name;

  return (
    <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 gap-1 truncate">
      <div className="flex items-center gap-1.5 truncate">
        <User className="h-3 w-3 shrink-0 text-slate-400" />
        <span className="truncate font-medium">{contactName}</span>
      </div>
      {ownerName && (
        <span className="shrink-0 text-[10px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 rounded px-1 dark:bg-slate-800 dark:border-slate-700">
          {ownerName.split(' ')[0]}
        </span>
      )}
    </div>
  );
};
