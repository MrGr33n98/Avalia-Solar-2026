'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PipelineBoardDTO, PipelineCardDTO, PipelineStageDTO } from './OpportunityCard/OpportunityCard.types';
import { PipelineColumn } from './PipelineColumn';
import { OpportunityCardSkeleton } from './OpportunityCard/OpportunityCardSkeleton';
import { salesApi } from '@/lib/api/sales/client';

interface PipelineBoardProps {
  pipelineId?: string | number;
  search?: string;
  selectedIds: number[];
  onToggleSelect: (id: number) => void;
  onOpenDetails: (card: PipelineCardDTO) => void;
  onAction?: (action: string, card: PipelineCardDTO) => void;
  onCreateTask?: (card: PipelineCardDTO) => void;
}

export const PipelineBoard: React.FC<PipelineBoardProps> = ({
  pipelineId = 'default',
  search = '',
  selectedIds,
  onToggleSelect,
  onOpenDetails,
  onAction,
  onCreateTask,
}) => {
  const [boardData, setBoardData] = useState<PipelineBoardDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBoard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/v1/sales/pipelines/${pipelineId}/board${search ? `?search=${encodeURIComponent(search)}` : ''}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        // Fallback to fetching legacy opportunities endpoint if custom board endpoint not mounted
        const opps = await salesApi.getOpportunities();
        const defaultStages: PipelineStageDTO[] = [
          { id: 1, key: 'prospect', name: 'Prospect', position: 1, probability: 10, total_cards: 0, total_value_cents: 0 },
          { id: 2, key: 'contacted', name: 'Contacted', position: 2, probability: 20, total_cards: 0, total_value_cents: 0 },
          { id: 3, key: 'qualified', name: 'Qualified', position: 3, probability: 35, total_cards: 0, total_value_cents: 0 },
          { id: 4, key: 'discovery', name: 'Discovery', position: 4, probability: 50, total_cards: 0, total_value_cents: 0 },
          { id: 5, key: 'proposal', name: 'Proposal', position: 5, probability: 70, total_cards: 0, total_value_cents: 0 },
          { id: 6, key: 'negotiation', name: 'Negotiation', position: 6, probability: 85, total_cards: 0, total_value_cents: 0 },
          { id: 7, key: 'won', name: 'Closed Won', position: 7, probability: 100, total_cards: 0, total_value_cents: 0 },
          { id: 8, key: 'lost', name: 'Closed Lost', position: 8, probability: 0, total_cards: 0, total_value_cents: 0 },
        ];

        const cards: PipelineCardDTO[] = opps.map((item) => {
          const key = item.stage_key || item.stage?.key || 'prospect';
          const stageObj = defaultStages.find((s) => s.key === key) || defaultStages[0];
          return {
            id: item.id,
            name: item.name,
            status: item.status || 'open',
            account: item.account ? { id: item.account.id, name: item.account.name } : null,
            primary_contact: item.contact_name ? { id: item.primary_contact_id || 0, name: item.contact_name } : null,
            owner: item.owner_id ? { id: item.owner_id, name: 'Responsável' } : null,
            stage: { id: stageObj.id, key: stageObj.key, name: stageObj.name, position: stageObj.position, probability: stageObj.probability },
            value_cents: item.value_cents || 0,
            currency: 'BRL',
            probability: item.probability || stageObj.probability,
            weighted_value_cents: Math.round((item.value_cents || 0) * (item.probability || stageObj.probability) / 100),
            priority: item.priority || 'medium',
            temperature: 'warm',
            source: item.source || null,
            aging: { days_in_stage: 0, stage_entered_at: item.stage_entered_at || item.created_at || new Date().toISOString(), stale: false },
            flags: { overdue: false, due_today: false, stale: false, hot: false, no_contact: !item.primary_contact_id, no_owner: !item.owner_id },
            tags: [],
          };
        });

        setBoardData({
          pipeline: { id: 1, name: 'Avalia Solar B2B Sales', key: 'b2b_sales' },
          stages: defaultStages,
          cards: cards,
          totals: {
            total_cards: cards.length,
            total_value_cents: cards.reduce((s, c) => s + c.value_cents, 0),
            total_weighted_value_cents: cards.reduce((s, c) => s + c.weighted_value_cents, 0),
          },
        });
        return;
      }

      const data: PipelineBoardDTO = await res.json();
      setBoardData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar o pipeline');
    } finally {
      setLoading(false);
    }
  }, [pipelineId, search]);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  const handleDropCard = async (card: PipelineCardDTO, targetStageKey: string) => {
    if (!boardData) return;

    const previousCards = [...boardData.cards];
    const targetStage = boardData.stages.find((s) => s.key === targetStageKey);

    // Optimistic Update
    setBoardData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        cards: prev.cards.map((c) => (c.id === card.id ? { ...c, stage: targetStage ? { id: targetStage.id, key: targetStage.key, name: targetStage.name, position: targetStage.position, probability: targetStage.probability } : c.stage } : c)),
      };
    });

    try {
      await salesApi.updateOpportunity(card.id, { stage_key: targetStageKey });
    } catch (err) {
      // Rollback on error
      setBoardData((prev) => (prev ? { ...prev, cards: previousCards } : prev));
      alert('Não foi possível alterar o estágio da oportunidade. Alteração revertida.');
    }
  };

  if (loading) {
    return (
      <div className="flex w-max min-w-full gap-4 p-2 overflow-x-auto">
        {[1, 2, 3, 4].map((idx) => (
          <div key={idx} className="w-[19rem] space-y-3">
            <div className="h-10 bg-slate-200 rounded-xl animate-pulse dark:bg-slate-800" />
            <OpportunityCardSkeleton />
            <OpportunityCardSkeleton />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <AlertCircle className="h-10 w-10 text-red-600" />
        <p className="font-semibold text-slate-800 dark:text-slate-200">{error}</p>
        <Button onClick={fetchBoard} variant="outline" className="font-bold">
          <RefreshCw className="mr-2 h-4 w-4" /> Tentar Novamente
        </Button>
      </div>
    );
  }

  if (!boardData) return null;

  return (
    <div className="w-full min-w-0 overflow-x-auto overscroll-x-contain pb-3 [scrollbar-color:#94a3b8_transparent] [scrollbar-width:thin]">
      <section data-testid="sales-pipeline-board" className="flex w-max min-w-full gap-3 pb-1 pt-1 select-none sm:gap-4">
        {boardData.stages.map((stage) => {
          const columnCards = boardData.cards.filter((c) => (c.stage?.key || 'prospect') === stage.key);
          if (search) {
            const term = search.toLowerCase();
            const filtered = columnCards.filter(
              (c) => c.name.toLowerCase().includes(term) || (c.account?.name || '').toLowerCase().includes(term) || (c.primary_contact?.name || '').toLowerCase().includes(term)
            );
            return (
              <PipelineColumn
                key={stage.key}
                stage={stage}
                cards={filtered}
                selectedIds={selectedIds}
                onToggleSelect={onToggleSelect}
                onOpenDetails={onOpenDetails}
                onDropCard={handleDropCard}
                onAction={onAction}
                onCreateTask={onCreateTask}
              />
            );
          }

          return (
            <PipelineColumn
              key={stage.key}
              stage={stage}
              cards={columnCards}
              selectedIds={selectedIds}
              onToggleSelect={onToggleSelect}
              onOpenDetails={onOpenDetails}
              onDropCard={handleDropCard}
              onAction={onAction}
              onCreateTask={onCreateTask}
            />
          );
        })}
      </section>
    </div>
  );
};
