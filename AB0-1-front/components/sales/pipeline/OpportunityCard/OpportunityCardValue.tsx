'use client';

import React from 'react';
import { PipelineCardDTO } from './OpportunityCard.types';

interface ValueProps {
  card: PipelineCardDTO;
}

export const OpportunityCardValue: React.FC<ValueProps> = ({ card }) => {
  const formattedValue = card.value_cents
    ? `R$ ${(card.value_cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    : 'R$ 0';

  return (
    <div className="flex items-center justify-between my-1.5">
      <span className="text-[14px] font-bold tracking-tight text-blue-950 dark:text-blue-200">
        {formattedValue}
      </span>
      <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
        {card.probability}%
      </span>
    </div>
  );
};
