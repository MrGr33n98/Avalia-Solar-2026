'use client';

import { useState } from 'react';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import type { MarketplaceProposal } from '@/lib/api';
import { canDecide, isProjectComplete } from '@/lib/marketplace-proposals';
import { cn } from '@/lib/utils';

export type Screen =
  | 'summary'
  | 'complete'
  | 'meeting'
  | 'negotiation'
  | 'project'
  | 'compare'
  | 'conversation'
  | 'choose'
  | 'completed'
  | 'review';

export const journeySteps: { id: number; label: string; view?: Screen }[] = [
  { id: 1, label: 'Minhas propostas' },
  { id: 2, label: 'Detalhes', view: 'summary' },
  { id: 3, label: 'Proposta completa', view: 'complete' },
  { id: 4, label: 'Comparar', view: 'compare' },
  { id: 5, label: 'Conversa', view: 'conversation' },
  { id: 6, label: 'Reunião', view: 'meeting' },
  { id: 7, label: 'Negociação', view: 'negotiation' },
  { id: 8, label: 'Escolher', view: 'choose' },
  { id: 9, label: 'Projeto', view: 'project' },
  { id: 10, label: 'Conclusão & Avaliação', view: 'completed' },
];

export function getActiveStepIndex(proposal: MarketplaceProposal | undefined, screen: Screen): number {
  if (screen === 'compare') return 4;
  if (!proposal) return 1;
  if (screen === 'review') return 10;
  if (screen === 'completed' || isProjectComplete(proposal.project)) return 10;
  if (screen === 'project' || proposal.status === 'accepted') return 9;
  if (screen === 'choose') return 8;
  if (screen === 'negotiation') return 7;
  if (screen === 'meeting') return 6;
  if (screen === 'conversation') return 5;
  if (screen === 'complete') return 3;
  return 2;
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
  const activeStep = getActiveStepIndex(proposal, screen);
  const activeStepObj = journeySteps.find((s) => s.id === activeStep) || journeySteps[0];
  const [mobileExpanded, setMobileExpanded] = useState(false);

  const handleStepClick = (step: (typeof journeySteps)[number]) => {
    if (step.id === 1) onList();
    else if (step.id === 8) onChoose();
    else if (step.view) onNavigate(step.view);
  };

  return (
    <nav
      aria-label="Fluxo da proposta"
      className="mb-6 w-full rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-5 shadow-2xs"
    >
      {/* ── VERSÃO MOBILE / PWA (COMPACTA, SEM OVERFLOW 760PX) ── */}
      <div className="md:hidden">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
              Etapa {activeStep} de 10
            </span>
            <h3 className="text-sm font-bold text-slate-900 truncate">
              {activeStepObj.label}
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setMobileExpanded(!mobileExpanded)}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            aria-expanded={mobileExpanded}
          >
            <span>{mobileExpanded ? 'Ocultar etapas' : 'Ver etapas'}</span>
            {mobileExpanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        {/* Barra fina de progresso no mobile */}
        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full bg-blue-600 transition-all duration-300 rounded-full"
            style={{ width: `${Math.min(100, Math.max(10, (activeStep / 10) * 100))}%` }}
          />
        </div>

        {/* Menu expansível de etapas no mobile */}
        {mobileExpanded && (
          <div className="mt-3.5 pt-3 border-t border-slate-100 grid grid-cols-2 gap-1.5 animate-in fade-in-50">
            {journeySteps.map((step) => {
              const isActive = step.id === activeStep;
              const isDone = step.id < activeStep;
              const canOpen =
                Boolean(proposal) &&
                step.id !== 1 &&
                (step.id !== 8 || canDecide(proposal!)) &&
                (step.id !== 4 || canCompare);

              return (
                <button
                  key={step.id}
                  type="button"
                  disabled={!canOpen && step.id !== 1 && !isActive}
                  onClick={() => {
                    handleStepClick(step);
                    setMobileExpanded(false);
                  }}
                  className={cn(
                    'flex items-center gap-2 rounded-xl p-2 text-left text-xs transition-all border',
                    isActive
                      ? 'border-blue-600 bg-blue-50/60 font-bold text-blue-700'
                      : isDone
                      ? 'border-slate-200 bg-slate-50 font-medium text-slate-700 hover:bg-slate-100'
                      : canOpen || step.id === 1
                      ? 'border-slate-200 bg-white font-medium text-slate-600 hover:bg-slate-50'
                      : 'border-transparent text-slate-400 opacity-60 cursor-not-allowed'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                      isActive || isDone ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                    )}
                  >
                    {isDone ? <Check className="h-3 w-3 stroke-[3]" /> : step.id}
                  </span>
                  <span className="truncate">{step.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── VERSÃO DESKTOP (TIMELINE HORIZONTAL COM ESPAÇO AMPLO) ── */}
      <div className="hidden md:block overflow-x-auto">
        <div className="flex items-center justify-between min-w-[720px] relative px-2 py-1">
          {/* Linha de progresso de fundo */}
          <div className="absolute left-6 right-6 top-4 h-0.5 bg-slate-200 -z-0" aria-hidden="true" />

          {/* Linha preenchida azul conforme activeStep */}
          <div
            className="absolute left-6 top-4 h-0.5 bg-blue-600 transition-all duration-300 -z-0"
            style={{ width: `${Math.min(100, Math.max(0, ((activeStep - 1) / 9) * 100))}%` }}
            aria-hidden="true"
          />

          {journeySteps.map((step) => {
            const isActive = step.id === activeStep;
            const isDone = step.id < activeStep;
            const canOpen =
              Boolean(proposal) &&
              step.id !== 1 &&
              (step.id !== 8 || canDecide(proposal!)) &&
              (step.id !== 4 || canCompare);

            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center text-center px-1">
                <button
                  type="button"
                  disabled={!canOpen && step.id !== 1 && !isActive}
                  onClick={() => handleStepClick(step)}
                  className={cn(
                    'group flex flex-col items-center transition-all focus:outline-none',
                    canOpen || step.id === 1 || isActive ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
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
                    {isDone ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : step.id}
                  </div>
                  <span
                    className={cn(
                      'mt-2 text-xs font-bold transition-colors whitespace-nowrap',
                      isActive ? 'text-blue-600 font-extrabold' : isDone ? 'text-slate-800' : 'text-slate-400'
                    )}
                  >
                    {step.label}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
