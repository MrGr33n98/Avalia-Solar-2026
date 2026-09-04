'use client';

import React, { useState } from 'react';
import { PipelineStageDTO, PipelineCardDTO } from './OpportunityCard/OpportunityCard.types';
import { OpportunityCard } from './OpportunityCard/OpportunityCard';

interface PipelineColumnProps {
  stage: PipelineStageDTO;
  cards: PipelineCardDTO[];
  selectedIds: number[];
  onToggleSelect: (id: number) => void;
  onOpenDetails: (card: PipelineCardDTO) => void;
  onDropCard: (card: PipelineCardDTO, targetStageKey: string) => void;
  onAction?: (action: string, card: PipelineCardDTO) => void;
  onCreateTask?: (card: PipelineCardDTO) => void;
}

export const PipelineColumn: React.FC<PipelineColumnProps> = ({
  stage,
  cards,
  selectedIds,
  onToggleSelect,
  onOpenDetails,
  onDropCard,
  onAction,
  onCreateTask,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const stageTotalCents = cards.reduce((sum, c) => sum + (c.value_cents || 0), 0);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    try {
      const cardData = e.dataTransfer.getData('application/json');
      if (cardData) {
        const card: PipelineCardDTO = JSON.parse(cardData);
        if (card.stage?.key !== stage.key) {
          onDropCard(card, stage.key);
        }
      }
    } catch {
      // ignore invalid data
    }
  };

  return (
    <div
      data-testid={`stage-column-${stage.key}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex w-[clamp(18rem,82vw,20rem)] max-w-[calc(100vw-2rem)] flex-shrink-0 snap-start flex-col rounded-xl border transition-all ${
        isDragOver
          ? 'border-blue-700 bg-blue-50/50 shadow-md ring-2 ring-blue-700/20 dark:bg-blue-950/40'
          : 'border-slate-200 bg-slate-100/70 dark:border-slate-800 dark:bg-slate-900/60'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white p-3 rounded-t-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <span className="inline-block rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {stage.name}
          </span>
          <span className="text-xs font-bold text-slate-500">({cards.length})</span>
        </div>
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
          R$ {(stageTotalCents / 100).toLocaleString('pt-BR')}
        </span>
      </div>

      {/* Cards Container */}
      <div className="flex flex-1 flex-col gap-3 p-3 min-h-[420px]">
        {cards.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-slate-300 p-4 text-center dark:border-slate-800">
            <p className="text-xs font-medium text-slate-400">Arraste oportunidades aqui</p>
          </div>
        ) : (
          cards.map((card) => (
            <OpportunityCard
              key={card.id}
              card={card}
              selected={selectedIds.includes(card.id)}
              onToggleSelect={onToggleSelect}
              onOpenDetails={onOpenDetails}
              onDragStart={(e) => {
                e.dataTransfer.setData('application/json', JSON.stringify(card));
              }}
              onAction={onAction}
              onCreateTask={onCreateTask}
            />
          ))
        )}
      </div>
    </div>
  );
};
