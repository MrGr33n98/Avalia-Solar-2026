'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  PipelineBoardDTO,
  PipelineCardDTO,
} from './OpportunityCard/OpportunityCard.types';
import { PipelineColumn } from './PipelineColumn';
import { OpportunityCardSkeleton } from './OpportunityCard/OpportunityCardSkeleton';
import { salesApi } from '@/lib/api/sales/client';

interface PipelineBoardProps {
  boardData?: PipelineBoardDTO | null;
  loading: boolean;
  error?: Error | null;
  onRefresh: () => Promise<unknown> | void;
  selectedIds: number[];
  onToggleSelect: (id: number) => void;
  onOpenDetails: (card: PipelineCardDTO) => void;
  onAction?: (action: string, card: PipelineCardDTO) => void;
  onCreateTask?: (card: PipelineCardDTO) => void;
}

export const PipelineBoard: React.FC<PipelineBoardProps> = ({
  boardData,
  loading,
  error,
  onRefresh,
  selectedIds,
  onToggleSelect,
  onOpenDetails,
  onAction,
  onCreateTask,
}) => {
  const handleDropCard = async (card: PipelineCardDTO, targetStageKey: string) => {
    try {
      await salesApi.updateOpportunity(card.id, { stage_key: targetStageKey });
      await onRefresh();
    } catch {
      alert('Não foi possível alterar o estágio da oportunidade.');
    }
  };

  const handleCardAction = async (action: string, card: PipelineCardDTO) => {
    if (onAction) {
      onAction(action, card);
      return;
    }
    if (action === 'delete') {
      if (!window.confirm(`Tem certeza que deseja excluir "${card.name}"?`)) return;
      try {
        await salesApi.deleteOpportunity(card.id);
        await onRefresh();
      } catch (err: any) {
        alert(err.message || 'Erro ao excluir oportunidade.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex w-max min-w-full gap-4 overflow-x-auto p-2">
        {[1, 2, 3, 4].map((idx) => (
          <div key={idx} className="w-[19rem] space-y-3">
            <div className="h-10 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
            <OpportunityCardSkeleton />
            <OpportunityCardSkeleton />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <AlertCircle className="h-10 w-10 text-red-600" />
        <p className="font-semibold text-slate-800 dark:text-slate-200">{error.message}</p>
        <Button onClick={() => void onRefresh()} variant="outline" className="font-bold">
          <RefreshCw className="mr-2 h-4 w-4" /> Tentar Novamente
        </Button>
      </div>
    );
  }

  if (!boardData) return null;

  return (
    <div className="w-full min-w-0 overflow-x-auto overscroll-x-contain pb-3 [scrollbar-color:#94a3b8_transparent] [scrollbar-width:thin]">
      <section
        data-testid="sales-pipeline-board"
        className="flex w-max min-w-full select-none gap-3 pb-1 pt-1 sm:gap-4"
      >
        {boardData.stages.map((stage) => {
          const columnCards = boardData.cards.filter(
            (card) => (card.stage?.key || 'prospect') === stage.key
          );

          return (
            <PipelineColumn
              key={stage.key}
              stage={stage}
              cards={columnCards}
              selectedIds={selectedIds}
              onToggleSelect={onToggleSelect}
              onOpenDetails={onOpenDetails}
              onDropCard={handleDropCard}
              onAction={handleCardAction}
              onCreateTask={onCreateTask}
            />
          );
        })}
      </section>
    </div>
  );
};
