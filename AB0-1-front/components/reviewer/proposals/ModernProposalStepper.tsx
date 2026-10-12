'use client';

import { useState } from 'react';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import type { MarketplaceProposal } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  JOURNEY_STAGES,
  ProposalJourneyStageId,
  Screen,
  getActiveJourneyStage,
  getProposalProcessStage,
  isStageAccessible,
} from './proposal-journey-config';

export type { Screen, ProposalJourneyStageId };
export { JOURNEY_STAGES as journeySteps };

export function getActiveStepIndex(
  proposal: MarketplaceProposal | undefined,
  screen: Screen
): number {
  return getActiveJourneyStage(proposal, screen);
}

export function ModernProposalStepper({
  proposal,
  screen,
  onNavigate,
  onList,
  onChoose,
  canCompare,
}: {
  proposal?: MarketplaceProposal;
  screen: Screen;
  onNavigate: (view: Screen) => void;
  onList: () => void;
  onChoose: () => void;
  canCompare: boolean;
}) {
  const activeStageId = getActiveJourneyStage(proposal, screen);
  const processStageId = getProposalProcessStage(proposal);
  const activeStageObj =
    JOURNEY_STAGES.find((s) => s.id === activeStageId) || JOURNEY_STAGES[0];
  const [mobileExpanded, setMobileExpanded] = useState(false);

  const handleStageClick = (stageId: ProposalJourneyStageId) => {
    if (stageId === 1) {
      onList();
      return;
    }
    if (stageId === 4) {
      onChoose();
      return;
    }
    const stage = JOURNEY_STAGES.find((s) => s.id === stageId);
    if (stage?.defaultView) {
      onNavigate(stage.defaultView);
    }
  };

  const totalStages = JOURNEY_STAGES.length; // 5

  return (
    <nav
      aria-label="Fluxo da proposta"
      className="mb-6 w-full rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-5 shadow-2xs"
    >
      {/* ── VERSÃO MOBILE / PWA (COMPACTA, 5 ETAPAS) ── */}
      <div className="md:hidden">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                Etapa {activeStageId} de {totalStages}
              </span>
              {activeStageObj.isOptional && (
                <span className="rounded bg-slate-100 px-1 py-0.2 text-[10px] font-medium text-slate-500">
                  Opcional
                </span>
              )}
            </div>
            <h3 className="text-sm font-bold text-slate-900 truncate">
              {activeStageObj.label}
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setMobileExpanded(!mobileExpanded)}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-expanded={mobileExpanded}
          >
            <span>{mobileExpanded ? 'Ocultar etapas' : 'Ver 5 etapas'}</span>
            {mobileExpanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        {/* Barra fina de progresso no mobile com 5 etapas */}
        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full bg-blue-600 transition-all duration-300 rounded-full"
            style={{ width: `${Math.min(100, Math.max(20, (activeStageId / totalStages) * 100))}%` }}
          />
        </div>

        {/* Menu expansível de etapas no mobile */}
        {mobileExpanded && (
          <div className="mt-3.5 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2 animate-in fade-in-50">
            {JOURNEY_STAGES.map((stage) => {
              const isActive = stage.id === activeStageId;
              const isDone = stage.id < processStageId;
              const canOpen = isStageAccessible(stage.id, proposal, canCompare);

              return (
                <button
                  key={stage.id}
                  type="button"
                  disabled={!canOpen && !isActive}
                  onClick={() => {
                    handleStageClick(stage.id);
                    setMobileExpanded(false);
                  }}
                  className={cn(
                    'flex items-center justify-between rounded-xl p-2.5 text-left text-xs transition-all border',
                    isActive
                      ? 'border-blue-600 bg-blue-50/70 font-bold text-blue-700 ring-1 ring-blue-600/30'
                      : isDone
                      ? 'border-slate-200 bg-slate-50 font-medium text-slate-700 hover:bg-slate-100'
                      : canOpen
                      ? 'border-slate-200 bg-white font-medium text-slate-600 hover:bg-slate-50'
                      : 'border-transparent text-slate-400 opacity-60 cursor-not-allowed'
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                        isActive || isDone ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                      )}
                    >
                      {isDone ? <Check className="h-3 w-3 stroke-[3]" /> : stage.id}
                    </span>
                    <span className="truncate">{stage.label}</span>
                  </div>
                  {stage.isOptional && (
                    <span className="shrink-0 text-[10px] text-slate-400 font-normal">
                      Opcional
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── VERSÃO DESKTOP (5 ETAPAS EM LINHA ÚNICA, SEM SCROLL HORIZONTAL) ── */}
      <div className="hidden md:block w-full">
        <div className="flex items-center justify-between relative px-2 py-1">
          {/* Linha de progresso de fundo */}
          <div className="absolute left-8 right-8 top-4 h-0.5 bg-slate-200 -z-0" aria-hidden="true" />

          {/* Linha preenchida azul conforme estágio */}
          <div
            className="absolute left-8 top-4 h-0.5 bg-blue-600 transition-all duration-300 -z-0"
            style={{
              width: `${Math.min(
                100,
                Math.max(0, ((Math.min(activeStageId, totalStages) - 1) / (totalStages - 1)) * 100)
              )}%`,
            }}
            aria-hidden="true"
          />

          {JOURNEY_STAGES.map((stage) => {
            const isActive = stage.id === activeStageId;
            const isDone = stage.id < processStageId;
            const canOpen = isStageAccessible(stage.id, proposal, canCompare);

            return (
              <div key={stage.id} className="relative z-10 flex flex-col items-center text-center px-1">
                <button
                  type="button"
                  disabled={!canOpen && !isActive}
                  onClick={() => handleStageClick(stage.id)}
                  aria-current={isActive ? 'step' : undefined}
                  className={cn(
                    'group flex flex-col items-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg p-1',
                    canOpen || isActive ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all shadow-xs ring-4 ring-white',
                      isActive
                        ? 'bg-blue-600 text-white ring-blue-100 shadow-sm'
                        : isDone
                        ? 'bg-blue-600 text-white'
                        : 'border-2 border-slate-300 bg-white text-slate-400 group-hover:border-slate-400'
                    )}
                  >
                    {isDone ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : stage.id}
                  </div>
                  <div className="mt-2 flex flex-col items-center">
                    <span
                      className={cn(
                        'text-xs transition-colors whitespace-nowrap',
                        isActive
                          ? 'text-blue-600 font-extrabold'
                          : isDone
                          ? 'text-slate-800 font-bold'
                          : 'text-slate-400 font-semibold'
                      )}
                    >
                      {stage.label}
                    </span>
                    {stage.isOptional && (
                      <span className="text-[10px] text-slate-400 font-normal">
                        (opcional)
                      </span>
                    )}
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
