'use client';

import React, { useState } from 'react';
import { AlertCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  const [movingCard, setMovingCard] = useState<PipelineCardDTO | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleDropCard = async (card: PipelineCardDTO, targetStageKey: string) => {
    try {
      await salesApi.updateOpportunity(card.id, { stage_key: targetStageKey });
      await onRefresh();
    } catch {
      alert('Não foi possível alterar o estágio da oportunidade.');
    }
  };

  const handleSelectStage = async (stageKey: string) => {
    if (!movingCard) return;
    setIsTransitioning(true);
    try {
      await salesApi.updateOpportunityStage(movingCard.id, stageKey);
      setMovingCard(null);
      await onRefresh();
    } catch (err: any) {
      alert(err?.message || 'Não foi possível mover a oportunidade.');
    } finally {
      setIsTransitioning(false);
    }
  };

  const handleCardAction = async (action: string, card: PipelineCardDTO) => {
    if (onAction) {
      onAction(action, card);
      return;
    }
    if (action === 'move') {
      setMovingCard(card);
      return;
    }
    if (action === 'won') {
      if (!window.confirm(`Confirmar que a oportunidade "${card.name}" foi ganha?`)) return;
      try {
        await salesApi.markOpportunityWon(card.id);
        await onRefresh();
      } catch (err: any) {
        alert(err?.message || 'Erro ao marcar oportunidade como ganha.');
      }
      return;
    }
    if (action === 'lost') {
      const reason = window.prompt(`Motivo da perda para "${card.name}":`, 'Perda comercial / Preço');
      if (reason === null) return;
      try {
        await salesApi.markOpportunityLost(card.id, reason);
        await onRefresh();
      } catch (err: any) {
        alert(err?.message || 'Erro ao marcar oportunidade como perdida.');
      }
      return;
    }
    if (action === 'task') {
      onCreateTask?.(card);
      return;
    }
    if (action === 'delete') {
      if (!window.confirm(`Tem certeza que deseja excluir "${card.name}"?`)) return;
      try {
        await salesApi.deleteOpportunity(card.id);
        await onRefresh();
      } catch (err: any) {
        alert(err?.message || 'Erro ao excluir oportunidade.');
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
    <>
      <div className="w-full min-w-0 overflow-x-auto overscroll-x-contain pb-3 snap-x snap-mandatory [scrollbar-color:#94a3b8_transparent] [scrollbar-width:thin]">
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

      {/* Touch-Friendly Move Stage Dialog */}
      <Dialog
        open={Boolean(movingCard)}
        onOpenChange={(open) => {
          if (!open) setMovingCard(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mover Oportunidade</DialogTitle>
            <DialogDescription>
              Selecione o estágio de destino para a oportunidade &quot;{movingCard?.name}&quot;:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {boardData.stages.map((stage) => {
              const isCurrent = (movingCard?.stage?.key || 'prospect') === stage.key;
              return (
                <button
                  key={stage.key}
                  type="button"
                  disabled={isCurrent || isTransitioning}
                  onClick={() => handleSelectStage(stage.key)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                    isCurrent
                      ? 'bg-slate-100 border-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-white border-slate-200 text-slate-800 hover:border-indigo-600 hover:bg-indigo-50/50 active:scale-[0.99]'
                  }`}
                >
                  <span className="font-bold">{stage.name}</span>
                  {isCurrent ? (
                    <span className="text-[10px] text-slate-400 font-normal">Estágio atual</span>
                  ) : (
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  )}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
