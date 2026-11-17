'use client';

import { useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BuyerProjectStep {
  id: number;
  label: string;
  shortLabel: string;
  done: boolean;
  active: boolean;
}

interface ProjectJourneyStepperProps {
  steps: BuyerProjectStep[];
}

/**
 * Faixa de etapas: 320–389px usa rolagem local; a partir de 390px
 * mostra as cinco etapas resumidas sem cortar o texto.
 * Mantém o nome completo na árvore de acessibilidade.
 */
export function ProjectJourneyStepper({ steps }: ProjectJourneyStepperProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLLIElement>(null);
  const activeStep = steps.find((step) => step.active)?.id;

  useEffect(() => {
    const rail = railRef.current;
    const current = activeRef.current;
    if (!rail || !current || rail.scrollWidth <= rail.clientWidth) return;
    if (typeof rail.scrollTo === 'function') {
      rail.scrollTo({
        left: Math.max(0, current.offsetLeft - rail.offsetLeft - 12),
        behavior: 'auto',
      });
    }
  }, [activeStep]);

  return (
    <div
      ref={railRef}
      role="region"
      aria-label="Etapas do projeto"
      data-testid="buyer-project-stepper"
      tabIndex={0}
      className="w-full overflow-x-auto overscroll-x-contain pb-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 min-[390px]:overflow-x-visible"
    >
      <ol className="flex w-max gap-1.5 min-[390px]:grid min-[390px]:w-full min-[390px]:grid-cols-5 sm:gap-2">
        {steps.map((step) => (
          <li
            key={step.id}
            ref={step.active ? activeRef : null}
            aria-current={step.active ? 'step' : undefined}
            aria-label={`${step.label} — ${step.done ? 'concluída' : step.active ? 'etapa atual' : 'pendente'}`}
            className={cn(
              'flex min-h-[58px] w-[82px] shrink-0 snap-start flex-col items-center justify-center gap-1 rounded-lg border px-1.5 py-1.5 text-center min-[390px]:w-auto min-[390px]:min-w-0 sm:min-h-[64px]',
              step.active
                ? 'border-blue-600 bg-blue-50/70 text-blue-700'
                : step.done
                  ? 'border-emerald-200 bg-emerald-50/60 text-emerald-800'
                  : 'border-slate-200 bg-slate-50/60 text-slate-600'
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold leading-none sm:h-6 sm:w-6',
                step.active
                  ? 'bg-blue-600 text-white'
                  : step.done
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-600'
              )}
            >
              {step.done ? <Check className="h-3 w-3" strokeWidth={2.5} /> : step.id}
            </span>
            <span className="block w-full text-[10px] font-semibold leading-3.5 [overflow-wrap:anywhere] sm:hidden">
              {step.shortLabel}
            </span>
            <span className="hidden w-full text-xs font-medium leading-4 [overflow-wrap:anywhere] sm:block">
              {step.label}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
