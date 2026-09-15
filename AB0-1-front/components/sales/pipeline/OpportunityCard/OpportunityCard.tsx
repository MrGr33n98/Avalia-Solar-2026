'use client';

import React from 'react';
import { Building2, ChevronDown, ChevronUp, User } from 'lucide-react';
import { PipelineCardDTO, OpportunityCardDensity } from './OpportunityCard.types';
import { OpportunityCardHeader } from './OpportunityCardHeader';
import { OpportunityCardValue } from './OpportunityCardValue';
import { OpportunityCardContact } from './OpportunityCardContact';
import { OpportunityCardActivity } from './OpportunityCardActivity';
import { OpportunityCardNextAction } from './OpportunityCardNextAction';
import { OpportunityCardFooter } from './OpportunityCardFooter';
import { OpportunityCardMenu } from './OpportunityCardMenu';
import { OpportunityTemperatureBadge } from './OpportunityTemperatureBadge';

export interface OpportunityCardProps {
  card: PipelineCardDTO;
  density?: OpportunityCardDensity;
  selected?: boolean;
  onToggleSelect?: (id: number) => void;
  onToggleExpand?: () => void;
  onOpenDetails: (card: PipelineCardDTO) => void;
  onDragStart?: (e: React.DragEvent, card: PipelineCardDTO) => void;
  onAction?: (action: string, card: PipelineCardDTO) => void;
  onCreateTask?: (card: PipelineCardDTO) => void;
}

export const OpportunityCard: React.FC<OpportunityCardProps> = ({
  card,
  density = 'expanded',
  selected = false,
  onToggleSelect,
  onToggleExpand,
  onOpenDetails,
  onDragStart,
  onAction,
  onCreateTask,
}) => {
  const isCompact = density === 'compact';

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpenDetails(card);
    }
  };

  let borderClasses = 'border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600';
  let bgClasses = 'bg-white dark:bg-slate-900';

  if (selected) {
    borderClasses = 'border-blue-700 dark:border-blue-500 ring-2 ring-blue-700/20';
    bgClasses = 'bg-blue-50/40 dark:bg-blue-950/30';
  } else if (card.flags.overdue) {
    borderClasses = 'border-red-300 dark:border-red-800';
  } else if (card.flags.due_today) {
    borderClasses = 'border-amber-300 dark:border-amber-800';
  } else if (card.flags.stale) {
    bgClasses = 'bg-amber-50/30 dark:bg-slate-900';
  }

  const companyName = card.account?.name || card.name || 'Empresa não informada';
  const contactName = card.primary_contact?.name || 'Sem contato principal';
  const formattedValue = card.value_cents
    ? `R$ ${(card.value_cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    : 'R$ 0';
  const agingDays = `${card.aging.days_in_stage}d`;

  return (
    <div
      tabIndex={0}
      role="button"
      aria-label={`Oportunidade ${card.name} - R$ ${card.value_cents / 100}`}
      draggable
      onDragStart={(e) => onDragStart?.(e, card)}
      onClick={() => onOpenDetails(card)}
      onKeyDown={handleKeyDown}
      className={`group relative flex flex-col rounded-lg border shadow-xs transition-all duration-150 cursor-grab active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
        isCompact ? 'p-2.5 gap-1.5' : 'p-3'
      } ${borderClasses} ${bgClasses}`}
      data-testid={`opportunity-card-${card.id}`}
    >
      {isCompact ? (
        <div className="flex flex-col gap-1 min-w-0" data-testid={`opportunity-card-compact-${card.id}`}>
          {/* Linha 1: Checkbox + Empresa + Temperature */}
          <div className="flex items-center justify-between gap-1.5 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <input
                type="checkbox"
                checked={selected}
                onChange={(e) => {
                  e.stopPropagation();
                  onToggleSelect?.(card.id);
                }}
                onClick={(e) => e.stopPropagation()}
                className="h-3.5 w-3.5 shrink-0 rounded border-slate-300 text-blue-900 focus:ring-blue-800"
                aria-label={`Selecionar oportunidade ${companyName}`}
                data-testid={`opportunity-card-checkbox-${card.id}`}
              />
              <div className="flex items-center gap-1 min-w-0 flex-1">
                <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <h4
                  className="truncate text-[12px] font-semibold text-slate-900 dark:text-slate-100"
                  title={companyName}
                >
                  {companyName}
                </h4>
              </div>
            </div>
            <OpportunityTemperatureBadge temperature={card.temperature} />
          </div>

          {/* Linha 2: Contato principal */}
          <div className="flex items-center gap-1 min-w-0 text-[11px] text-slate-500 dark:text-slate-400 pl-5">
            <User className="h-3 w-3 shrink-0 text-slate-400" />
            <span className="truncate font-medium">{contactName}</span>
          </div>

          {/* Linha 3: Valor + Probabilidade + Aging + Expand + Menu */}
          <div className="flex items-center justify-between gap-1 pt-1 mt-0.5 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[13px] font-bold tracking-tight text-blue-950 dark:text-blue-200">
                {formattedValue}
              </span>
              <span className="inline-flex items-center rounded bg-slate-100 px-1 py-0.2 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {card.probability}%
              </span>
              <span
                className={`font-mono text-[10px] font-bold px-1 rounded ${
                  card.aging.stale
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                    : 'text-slate-400'
                }`}
                title={`Tempo no estágio atual: ${card.aging.days_in_stage} dias`}
              >
                {agingDays}
              </span>
            </div>

            <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                aria-expanded={false}
                aria-label="Expandir oportunidade"
                data-testid={`opportunity-card-expand-${card.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand?.();
                }}
                className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors outline-none focus-visible:ring-1 focus-visible:ring-blue-600"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>

              <OpportunityCardMenu
                card={card}
                onOpenDetails={onOpenDetails}
                onAction={onAction}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col min-w-0" data-testid={`opportunity-card-expanded-${card.id}`}>
          <div className="flex items-start justify-between gap-1">
            <div className="flex-1 min-w-0">
              <OpportunityCardHeader
                card={card}
                selected={selected}
                onToggleSelect={() => onToggleSelect?.(card.id)}
              />
            </div>
            <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                aria-expanded={true}
                aria-label="Recolher oportunidade"
                data-testid={`opportunity-card-expand-${card.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand?.();
                }}
                className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors outline-none focus-visible:ring-1 focus-visible:ring-blue-600"
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </button>

              <OpportunityCardMenu
                card={card}
                onOpenDetails={onOpenDetails}
                onAction={onAction}
              />
            </div>
          </div>

          <OpportunityCardContact card={card} />
          <OpportunityCardValue card={card} />
          <OpportunityCardActivity card={card} />
          <OpportunityCardNextAction card={card} onCreateTask={onCreateTask} />
          <OpportunityCardFooter card={card} />
        </div>
      )}
    </div>
  );
};
