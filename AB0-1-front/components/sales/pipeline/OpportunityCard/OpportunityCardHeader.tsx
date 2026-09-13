'use client';

import React from 'react';
import { Building2 } from 'lucide-react';
import { PipelineCardDTO } from './OpportunityCard.types';
import { OpportunityTemperatureBadge } from './OpportunityTemperatureBadge';

interface HeaderProps {
  card: PipelineCardDTO;
  selected: boolean;
  onToggleSelect: (e: React.MouseEvent | React.ChangeEvent<HTMLInputElement>) => void;
}

export const OpportunityCardHeader: React.FC<HeaderProps> = ({ card, selected, onToggleSelect }) => {
  const companyName = card.account?.name || card.name || 'Empresa não informada';

  return (
    <div className="flex items-start justify-between gap-2">
      <div className="flex items-start gap-2 min-w-0 flex-1">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => {
            e.stopPropagation();
            onToggleSelect(e);
          }}
          onClick={(e) => e.stopPropagation()}
          className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-blue-900 focus:ring-blue-800"
          aria-label={`Selecionar oportunidade ${companyName}`}
          data-testid={`opportunity-card-checkbox-${card.id}`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <h4
              className="truncate text-[13px] font-semibold text-slate-900 dark:text-slate-100"
              title={companyName}
            >
              {companyName}
            </h4>
          </div>
          {card.name && card.name !== companyName && (
            <p className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {card.name}
            </p>
          )}
        </div>
      </div>
      <div className="shrink-0">
        <OpportunityTemperatureBadge temperature={card.temperature} />
      </div>
    </div>
  );
};
