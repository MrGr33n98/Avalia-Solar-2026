'use client';

import React from 'react';
import { PipelineCardDTO } from './OpportunityCard.types';
import { OpportunityCardHeader } from './OpportunityCardHeader';
import { OpportunityCardValue } from './OpportunityCardValue';
import { OpportunityCardContact } from './OpportunityCardContact';
import { OpportunityCardActivity } from './OpportunityCardActivity';
import { OpportunityCardNextAction } from './OpportunityCardNextAction';
import { OpportunityCardFooter } from './OpportunityCardFooter';
import { OpportunityCardMenu } from './OpportunityCardMenu';

export interface OpportunityCardProps {
  card: PipelineCardDTO;
  selected?: boolean;
  onToggleSelect?: (id: number) => void;
  onOpenDetails: (card: PipelineCardDTO) => void;
  onDragStart?: (e: React.DragEvent, card: PipelineCardDTO) => void;
  onAction?: (action: string, card: PipelineCardDTO) => void;
  onCreateTask?: (card: PipelineCardDTO) => void;
}

export const OpportunityCard: React.FC<OpportunityCardProps> = ({
  card,
  selected = false,
  onToggleSelect,
  onOpenDetails,
  onDragStart,
  onAction,
  onCreateTask,
}) => {
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

  return (
    <div
      tabIndex={0}
      role="button"
      aria-label={`Oportunidade ${card.name} - R$ ${card.value_cents / 100}`}
      draggable
      onDragStart={(e) => onDragStart?.(e, card)}
      onClick={() => onOpenDetails(card)}
      onKeyDown={handleKeyDown}
      className={`group relative flex flex-col rounded-lg border p-3 shadow-xs transition-all duration-150 cursor-grab active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${borderClasses} ${bgClasses}`}
      data-testid={`opportunity-card-${card.id}`}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="flex-1 min-w-0">
          <OpportunityCardHeader
            card={card}
            selected={selected}
            onToggleSelect={() => onToggleSelect?.(card.id)}
          />
        </div>
        <OpportunityCardMenu
          card={card}
          onOpenDetails={onOpenDetails}
          onAction={onAction}
        />
      </div>

      <OpportunityCardContact card={card} />
      <OpportunityCardValue card={card} />
      <OpportunityCardActivity card={card} />
      <OpportunityCardNextAction card={card} onCreateTask={onCreateTask} />
      <OpportunityCardFooter card={card} />
    </div>
  );
};
