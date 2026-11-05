'use client';

import { useState } from 'react';
import { track } from '@/lib/analytics/lazy';
import {
  REVIEW_MILESTONES,
  completedMilestones,
  milestoneProgress,
  milestoneState,
  normalizedApprovedCount,
  type ReviewMilestoneId,
} from '@/lib/review-collection/milestones';

const ICON_SPRITE = '/assets/icons/review-collection/avalia-solar-icons-sprite.svg';

interface ReputationMilestonesProps {
  approvedReviewsCount: number | null;
}

function JourneyIcon({ name, size = 30 }: { name: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false" className="shrink-0">
      <use href={ICON_SPRITE + '#' + name} />
    </svg>
  );
}

/** Marco visual de engajamento: nunca confundir com uma concessão oficial. */
export function ReputationMilestones({ approvedReviewsCount }: ReputationMilestonesProps) {
  const count = normalizedApprovedCount(approvedReviewsCount);
  const completed = completedMilestones(count);
  const [selectedId, setSelectedId] = useState<ReviewMilestoneId | null>(null);
  const currentMilestone = REVIEW_MILESTONES.find((item) => count !== null && count < item.target);
  const activeId = selectedId || currentMilestone?.id || REVIEW_MILESTONES[REVIEW_MILESTONES.length - 1].id;
  const active = REVIEW_MILESTONES.find((item) => item.id === activeId) || REVIEW_MILESTONES[0];
  const progress = milestoneProgress(count);

  const selectMilestone = (id: ReviewMilestoneId) => {
    setSelectedId(id);
    track('review_collection_milestone_opened', {
      milestone_id: id,
      approved_reviews_count: count,
      ui_version: 'collection_journey_v3',
    });
  };

  return (
    <section
      aria-labelledby="review-journey-title"
      data-testid="review-journey"
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="px-4 pb-5 pt-5 sm:px-6 sm:pt-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-700">
              Avalia Solar / Engajamento
            </p>
            <h2 id="review-journey-title" className="text-lg font-bold leading-tight tracking-tight text-[#0A1F44] sm:text-xl">
              Seu caminho para mais avaliações
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-600 sm:text-sm">
              Cada marco aproxima sua empresa de um histórico público mais completo.
            </p>
          </div>
          <span
            aria-live="polite"
            data-testid="milestone-completed-count"
            className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold tabular-nums text-slate-700"
          >
            {count === null ? 'Progresso indisponível' : completed + '/3 marcos concluídos'}
          </span>
        </div>

        <details className="group mt-3 rounded-lg border border-blue-100 bg-blue-50/40 text-xs text-slate-700">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-lg px-3 font-semibold text-[#0A1F44] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
            <JourneyIcon name="01_estrelas_ia" size={18} />
            <span>Como o Avalia Solar me ajuda a coletar avaliações?</span>
            <span aria-hidden="true" className="ml-auto text-blue-600 motion-safe:transition-transform group-open:rotate-90">›</span>
          </summary>
          <div className="border-t border-blue-100 px-3 py-3 leading-relaxed">
            Gere um link público para seu formulário, compartilhe por e-mail, WhatsApp ou QR Code
            e acompanhe visualizações, envios e aprovações. A coleta é voluntária, sem incentivo
            a avaliações positivas, e os selos oficiais são concedidos separadamente.
          </div>
        </details>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100" role="progressbar"
          aria-label="Progresso de avaliações aprovadas até a meta de 20"
          aria-valuemin={0} aria-valuemax={20} aria-valuenow={count === null ? undefined : Math.min(count, 20)}
          aria-valuetext={count === null ? 'Dados indisponíveis' : Math.min(count, 20) + ' de 20 avaliações aprovadas'}
        >
          <div data-testid="milestone-progress" className="h-full rounded-full bg-[#0B5FFF] motion-safe:transition-[width] motion-safe:duration-500 motion-reduce:transition-none"
            style={{ width: progress + '%' }} />
        </div>

        <div className="relative mt-5 grid grid-cols-1 gap-2.5 md:grid-cols-3 md:gap-4">
          <div aria-hidden="true" className="pointer-events-none absolute left-[16%] right-[16%] top-[27px] hidden h-0.5 bg-slate-200 md:block" />
          {REVIEW_MILESTONES.map((item, index) => {
            const state = milestoneState(item.target, count);
            const selected = activeId === item.id;
            const achieved = state === 'achieved';
            return (
              <button
                type="button"
                key={item.id}
                data-testid={'milestone-' + item.id}
                aria-expanded={selected}
                aria-controls="milestone-info-panel"
                aria-label={item.title + '. ' + (achieved ? 'Concluído' : state === 'current' ? 'Próximo marco' : 'A conquistar')}
                onClick={() => selectMilestone(item.id)}
                className={[
                  'relative z-10 flex w-full min-h-[68px] min-w-0 items-center gap-3 rounded-lg border bg-white p-3 text-left',
                  'outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2',
                  'motion-safe:transition-[border-color,background-color,transform] motion-safe:duration-200',
                  'motion-safe:hover:-translate-y-0.5 motion-reduce:transform-none',
                  'md:min-h-[140px] md:flex-col md:gap-2 md:py-3 md:text-center',
                  selected ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200 hover:border-slate-300',
                ].join(' ')}
              >
                <span className={[
                  'relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border bg-white shadow-sm',
                  'md:h-[54px] md:w-[54px]',
                  selected ? 'border-blue-600 ring-[3px] ring-blue-100' : 'border-slate-200',
                ].join(' ')}>
                  <JourneyIcon name={item.icon} size={30} />
                  {achieved && (
                    <span aria-hidden="true" className="absolute -right-1 -top-1 rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white">✓</span>
                  )}
                </span>
                <span className="min-w-0 flex-1 md:flex-none">
                  <span className="block text-xs font-bold leading-4 text-[#0A1F44] sm:text-sm">{item.title}</span>
                  <span className="mt-1 block text-[11px] text-slate-600">
                    {achieved ? 'Concluído' : state === 'current' ? 'Próximo passo' : state === 'unavailable' ? 'Sem dados' : 'A conquistar'}
                    <span aria-hidden="true" className="px-1 text-slate-300">·</span>
                    {item.target} {item.target === 1 ? 'avaliação' : 'avaliações'}
                  </span>
                </span>
                <span className="shrink-0 text-[11px] font-medium text-blue-700 md:hidden">{index + 1}/3</span>
              </button>
            );
          })}
        </div>

        <div id="milestone-info-panel" data-testid="milestone-info-panel"
          className="mt-4 rounded-lg border border-slate-200 bg-[#F8FAFE] p-3 sm:p-4">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white">
              <JourneyIcon name={active.icon} size={22} />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-[#0A1F44]">{active.title}</h3>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{active.summary}</p>
              <p className="mt-2 flex items-start gap-2 text-xs font-medium text-slate-800">
                <span role="checkbox" aria-checked={count !== null && count >= active.target} aria-readonly="true"
                  className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border border-slate-400 bg-white text-[11px] text-emerald-700">
                  {count !== null && count >= active.target ? '✓' : ''}
                </span>
                <span>{active.task}</span>
              </p>
            </div>
          </div>
          <ul className="mt-3 grid gap-2 border-t border-slate-200 pt-3 sm:grid-cols-2 lg:grid-cols-3">
            {active.hints.map((hint) => (
              <li key={hint.label} className="flex min-w-0 items-start gap-2 rounded-md p-1">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white">
                  <JourneyIcon name={hint.icon} size={20} />
                </span>
                <span className="min-w-0">
                  <strong className="block text-[11px] font-semibold text-[#0A1F44]">{hint.label}</strong>
                  <span className="block text-[11px] leading-4 text-slate-600">{hint.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-3 text-[11px] leading-4 text-slate-500">
          Os marcos são metas de engajamento. Rankings e selos oficiais exigem critérios próprios;
          alcançar um número de avaliações não garante premiação, posição ou visibilidade.
        </p>
      </div>
    </section>
  );
}
