'use client';

import React from 'react';
import { Building2 } from 'lucide-react';
import { PipelineCardDTO } from './OpportunityCard.types';
import { OpportunityTemperatureBadge } from './OpportunityTemperatureBadge';
import { OpportunityStatusDropdown } from '../OpportunityStatusDropdown';

interface HeaderProps {
  card: PipelineCardDTO;
  selected: boolean;
  onToggleSelect: (e: React.MouseEvent | React.ChangeEvent<HTMLInputElement>) => void;
  onStatusChange?: (newStatus: string) => void;
  onOpenLostDialog?: () => void;
}

export const OpportunityCardHeader: React.FC<HeaderProps> = ({
  card,
  selected,
  onToggleSelect,
  onStatusChange,
  onOpenLostDialog,
}) => {
  const companyName = card.account?.name || card.name || 'Empresa não informada';
  const isHot = card.temperature === 'hot' || Boolean(card.flags?.hot);

  return (
    <div className="flex items-start justify-between gap-2">
      <div className="flex items-start gap-1.5 min-w-0 flex-1">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => {
            e.stopPropagation();
            onToggleSelect(e);
          }}
          onClick={(e) => e.stopPropagation()}
          className="mt-1 h-3.5 w-3.5 shrink-0 rounded border-slate-300 text-blue-900 focus:ring-blue-800"
          aria-label={`Selecionar oportunidade ${companyName}`}
          data-testid={`opportunity-card-checkbox-${card.id}`}
        />
        <div className="shrink-0 -mt-0.5">
          <OpportunityStatusDropdown
            status={card.status}
            isHot={isHot}
            variant="card"
            opportunityId={card.id}
            opportunityName={card.name}
            onStatusChange={onStatusChange}
            onOpenLostDialog={onOpenLostDialog}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4
              className="truncate text-[13px] font-bold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              title={companyName}
            >
              {companyName}
            </h4>
            {isHot && (
              <span
                className="inline-flex items-center text-xs select-none animate-pulse"
                title="Lead Quente (Hot Deal)"
                aria-label="Lead Quente"
              >
                🔥
              </span>
            )}
          </div>
          {card.name && card.name !== companyName && (
            <p className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
              <Building2 className="h-3 w-3 shrink-0 text-slate-400" />
              <span>{card.name}</span>
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
