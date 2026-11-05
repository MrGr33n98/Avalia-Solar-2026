'use client';

import { useState } from 'react';
import { track } from '@/lib/analytics/lazy';
import { ReviewCollectionIcon, type ReviewCollectionIconName } from '@/components/reviews/ReviewCollectionIcon';
import {
  REVIEW_MILESTONES,
  completedMilestones,
  milestoneState,
  normalizedApprovedCount,
  type ReviewMilestoneId,
} from '@/lib/review-collection/milestones';

interface ReputationMilestonesProps {
  approvedReviewsCount: number | null;
}

/** Posições G2-inspired: os ícones menores ficam SOBRE a régua, e não em cards. */
const SATELLITES: Record<ReviewMilestoneId, readonly { hintIndex: number; offset: number }[]> = {
  first_review: [
    { hintIndex: 0, offset: -112 },
    { hintIndex: 1, offset: -64 },
    { hintIndex: 2, offset: 72 },
  ],
  ranking_ready: [
    { hintIndex: 0, offset: -72 },
    { hintIndex: 2, offset: 72 },
  ],
  community_milestone: [
    { hintIndex: 0, offset: -72 },
    { hintIndex: 2, offset: 72 },
    { hintIndex: 3, offset: 118 },
  ],
};

/** Metas de engajamento: NÃO representam concessões de badges oficiais. */
export function ReputationMilestones({ approvedReviewsCount }: ReputationMilestonesProps) {
  const count = normalizedApprovedCount(approvedReviewsCount);
  const completed = completedMilestones(count);
  const current = REVIEW_MILESTONES.find((item) => count !== null && count < item.target);
  const defaultId = current?.id ?? REVIEW_MILESTONES[count === null ? 0 : REVIEW_MILESTONES.length - 1].id;

  const [selectedId, setSelectedId] = useState<ReviewMilestoneId | null>(null);
  const [selectedHint, setSelectedHint] = useState<number | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const activeId = selectedId ?? defaultId;
  const active = REVIEW_MILESTONES.find((item) => item.id === activeId) ?? REVIEW_MILESTONES[0];
  const activeHint = selectedHint === null ? null : active.hints[selectedHint];

  // A barra une os três marcos centrais (1/6, 1/2, 5/6), não simula reviews extras.
  const railCompletion = completed === 0 ? 0 : completed === 1 ? 14.91 : completed === 2 ? 50 : 85.09;

  const selectMilestone = (id: ReviewMilestoneId, hintIndex: number | null = null) => {
    setSelectedId(id);
    setSelectedHint(hintIndex);
    setDetailsOpen(true);
    track('review_collection_milestone_opened', {
      milestone_id: id,
      hint_index: hintIndex,
      approved_reviews_count: count,
      ui_version: 'collection_journey_v4',
    });
  };

  return (
    <section
      aria-labelledby="review-journey-title"
      data-testid="review-journey"
      className="relative rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="px-4 pb-5 pt-5 sm:px-7 sm:pb-6 sm:pt-6">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-700">
              Avalia Solar / Engajamento
            </p>
            <h2 id="review-journey-title" className="text-xl font-bold tracking-tight text-[#0A1F44] sm:text-2xl">
              Seu caminho para mais avaliações
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-600 sm:text-sm">
              Cada marco aproxima sua empresa de um histórico público mais completo.
            </p>
          </div>

          <details className="group relative z-40 w-full sm:w-auto sm:max-w-[350px]">
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-full border border-[#DEE5F5] bg-[#F7F9FF] px-3 text-xs font-semibold text-[#0A1F44] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 [&::-webkit-details-marker]:hidden">
              <ReviewCollectionIcon name="01_estrelas_ia" size={18} />
              <span>Como o Avalia Solar ajuda a coletar avaliações?</span>
              <span className="ml-auto text-blue-600 motion-safe:transition-transform group-open:rotate-90" aria-hidden="true">›</span>
            </summary>
            <div className="absolute right-0 top-full z-50 mt-2 w-full rounded-xl border border-slate-200 bg-white p-4 text-xs leading-relaxed text-slate-700 shadow-xl sm:w-[340px]">
              Gere um link público e compartilhe por e-mail, WhatsApp ou QR Code.
              Acompanhe visualizações, envios e aprovações. As avaliações são voluntárias;
              selos e rankings seguem critérios próprios e não dependem da contratação de um plano.
            </div>
          </details>
        </div>

        {/* No PWA, somente esta régua rola horizontalmente; a página não ultrapassa a viewport.
            Mini-ícones abrem o detalhe ao toque. Os tooltips flutuam apenas quando há espaço. */}
        <div className="mt-4" data-testid="milestone-timeline">
          <div
            tabIndex={0}
            role="region"
            aria-label="Régua de marcos de avaliações. Deslize horizontalmente para conhecer os três marcos."
            className="overflow-x-auto overscroll-x-contain pb-1 touch-pan-x lg:overflow-visible [scrollbar-width:thin]"
          >
            <div className="relative h-[132px] min-w-[840px]">
              <div
                role="progressbar"
                aria-label="Avaliações aprovadas para a meta de vinte"
                aria-valuemin={0}
                aria-valuemax={20}
                aria-valuenow={count === null ? undefined : Math.min(count, 20)}
                aria-valuetext={count === null ? 'Dados indisponíveis' : count + ' avaliações aprovadas; ' + completed + ' de 3 marcos concluídos'}
                className="absolute left-[2.5%] right-[2.5%] top-[27px] z-0 h-[2px] bg-slate-200"
              >
                <span
                  data-testid="milestone-progress"
                  className="block h-full bg-[#0B5FFF] motion-safe:transition-[width] motion-safe:duration-500 motion-reduce:transition-none"
                  style={{ width: railCompletion + '%' }}
                />
              </div>

              <div className="relative z-10 grid h-full grid-cols-3">
                {REVIEW_MILESTONES.map((item) => {
                  const state = milestoneState(item.target, count);
                  const achieved = state === 'achieved';
                  const selected = item.id === activeId;
                  const expanded = detailsOpen && selected;

                  return (
                    <div key={item.id} className="relative flex min-w-0 flex-col items-center text-center">
                      <button
                        type="button"
                        data-testid={'milestone-' + item.id}
                        aria-label={item.title + '. ' + (achieved ? 'Concluído' : state === 'current' ? 'Próximo marco' : state === 'unavailable' ? 'Sem dados' : 'A conquistar')}
                        aria-expanded={expanded}
                        aria-controls={expanded ? "milestone-info-panel" : undefined}
                        onClick={() => selectMilestone(item.id)}
                        className={[
                          'group relative z-20 inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 bg-white shadow-sm',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2',
                          'motion-safe:transition-[border-color,box-shadow,transform] motion-safe:duration-200',
                          'motion-safe:hover:-translate-y-0.5 motion-reduce:transform-none',
                          selected ? 'border-[#0B5FFF] ring-[3px] ring-blue-100' : 'border-slate-200 hover:border-blue-300',
                        ].join(' ')}
                      >
                        <ReviewCollectionIcon name={item.icon} size={30} />
                        {achieved && (
                          <span aria-hidden="true" className="absolute -right-1 -top-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">✓</span>
                        )}
                      </button>

                      {SATELLITES[item.id].map(({ hintIndex, offset }) => {
                        const hint = item.hints[hintIndex];
                        const nearLeftEdge = item.id === 'first_review' && offset < -100;
                        const nearRightEdge = item.id === 'community_milestone' && offset > 100;
                        return (
                          <button
                            type="button"
                            key={item.id + '-' + hintIndex}
                            data-testid={'milestone-hint-' + item.id + '-' + hintIndex}
                            aria-label={hint.label + ': ' + hint.text}
                            aria-controls={expanded && selectedHint === hintIndex ? "milestone-info-panel" : undefined}
                            aria-expanded={expanded && selectedHint === hintIndex}
                            onClick={() => selectMilestone(item.id, hintIndex)}
                            style={{ left: 'calc(50% + ' + offset + 'px)' }}
                            className="group absolute top-[6px] z-30 inline-flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                          >
                            <span className={[
                              'inline-flex h-8 w-8 items-center justify-center rounded-full border bg-white shadow-[0_2px_7px_rgba(10,31,68,0.12)]',
                              'motion-safe:transition-[transform,border-color] motion-safe:duration-200 motion-safe:group-hover:scale-110',
                              'motion-reduce:transform-none',
                              expanded && selectedHint === hintIndex ? 'border-blue-600' : 'border-slate-200',
                            ].join(' ')}>
                              <ReviewCollectionIcon name={hint.icon as ReviewCollectionIconName} size={19} />
                            </span>
                            {/* Desktop: tooltip ligado a mouse e teclado. Mobile: painel após toque. */}
                            <span
                              aria-hidden="true"
                              className={[
                                'pointer-events-none absolute bottom-[calc(100%+8px)] z-50 hidden w-60 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left text-xs font-normal leading-4 text-slate-700 shadow-lg opacity-0',
                                'lg:block lg:group-hover:opacity-100 lg:group-focus-visible:opacity-100',
                                'motion-safe:transition-opacity motion-safe:duration-200',
                                nearLeftEdge ? 'left-0' : nearRightEdge ? 'right-0' : 'left-1/2 -translate-x-1/2',
                              ].join(' ')}
                            >
                              <strong className="mb-1 block text-xs font-semibold text-[#0A1F44]">{hint.label}</strong>
                              {hint.text}
                              <span aria-hidden="true" className="absolute -bottom-1 left-5 h-2 w-2 rotate-45 border-b border-r border-slate-200 bg-white" />
                            </span>
                          </button>
                        );
                      })}

                      <div className="mt-3 max-w-[220px] px-1">
                        <p className={['text-xs font-semibold leading-4', selected ? 'text-[#0B5FFF]' : 'text-[#0A1F44]'].join(' ')}>
                          {item.title}
                        </p>
                        <p className="mt-1 text-[11px] leading-4 text-slate-500">
                          {achieved ? 'Concluído' : state === 'current' ? 'Próximo passo' : state === 'unavailable' ? 'Sem dados' : 'A conquistar'}
                          {' · '}{item.target} {item.target === 1 ? 'avaliação' : 'avaliações'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
            <span
              data-testid="milestone-completed-count"
              aria-live="polite"
              className="text-xs font-medium tabular-nums text-slate-600"
            >
              {count === null ? 'Progresso indisponível' : completed + '/3 marcos concluídos'}
            </span>
            <span className="text-[11px] text-slate-500 lg:hidden">Deslize a régua para explorar →</span>
          </div>
        </div>

        {/* Em vez do card extenso sempre aberto, exibir detalhes somente após interação. */}
        {detailsOpen && (
          <div
            id="milestone-info-panel"
            data-testid="milestone-info-panel"
            role="region"
            aria-label={'Detalhes: ' + active.title}
            className="mt-3 rounded-xl border border-blue-100 bg-[#F7F9FF] px-3 py-3 sm:px-4"
          >
            <div className="flex items-start gap-3">
              <ReviewCollectionIcon name={active.icon} size={25} />
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-[#0A1F44]">{active.title}</h3>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{active.summary}</p>
                <p className="mt-1.5 text-xs font-medium text-slate-800">
                  <span aria-hidden="true" className="mr-1.5">{count !== null && count >= active.target ? '☑' : '☐'}</span>
                  {active.task}
                </p>
                {activeHint && (
                  <p className="mt-2 rounded-md border border-slate-200 bg-white p-2 text-xs leading-relaxed text-slate-700">
                    <strong className="mr-1 text-[#0A1F44]">{activeHint.label}:</strong>{activeHint.text}
                  </p>
                )}
              </div>
              <button type="button" onClick={() => setDetailsOpen(false)}
                aria-label="Fechar detalhes do marco"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-lg text-slate-500 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
                ×
              </button>
            </div>
          </div>
        )}

        <p className="mt-3 border-t border-slate-100 pt-3 text-[11px] leading-4 text-slate-500">
          Metas de engajamento não concedem automaticamente selos ou posições no Ranking Avalia Solar.
        </p>
      </div>
    </section>
  );
}
