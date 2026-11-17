'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Star, MessageSquarePlus, Bookmark, FileEdit, ExternalLink } from 'lucide-react';
import { UserProfileStats } from '../types';

interface MyReviewsTabProps {
  stats: UserProfileStats;
  onWriteReview?: () => void;
  /** Rota existente com a listagem completa das avaliações do usuário. */
  reviewsHref?: string;
}

const subTabClass = (active: boolean) =>
  `py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
    active
      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
  }`;

function Unavailable({ testId }: { testId: string }) {
  return (
    <div
      className="text-center py-16 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30"
      data-testid={testId}
    >
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Ainda não disponível</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
        Esta lista será exibida aqui em uma próxima versão.
      </p>
    </div>
  );
}

export function MyReviewsTab({
  stats,
  onWriteReview,
  reviewsHref = '/review-dashboard/reviews',
}: MyReviewsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'published' | 'saved' | 'drafts'>('published');
  const published = stats.reviews_count;

  return (
    <div className="space-y-6" data-testid="my-reviews-tab">
      {/* Cabeçalho */}
      <div className="border-b border-slate-100 dark:border-slate-800 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Minhas Avaliações</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Acompanhe as avaliações que você publicou.
          </p>
        </div>

        {onWriteReview && (
          <button
            type="button"
            onClick={onWriteReview}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all self-start sm:self-auto"
            data-testid="write-review-button"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>Escrever Nova Avaliação</span>
          </button>
        )}
      </div>

      {/* Sub-abas */}
      <div className="flex gap-6 border-b border-slate-200 dark:border-slate-800 -mb-px overflow-x-auto" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeSubTab === 'published'}
          onClick={() => setActiveSubTab('published')}
          className={subTabClass(activeSubTab === 'published')}
        >
          <Star className="w-4 h-4" />
          <span>Publicadas{typeof published === 'number' ? ` (${published})` : ''}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeSubTab === 'saved'}
          onClick={() => setActiveSubTab('saved')}
          className={subTabClass(activeSubTab === 'saved')}
        >
          <Bookmark className="w-4 h-4" />
          <span>Salvas</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeSubTab === 'drafts'}
          onClick={() => setActiveSubTab('drafts')}
          className={subTabClass(activeSubTab === 'drafts')}
        >
          <FileEdit className="w-4 h-4" />
          <span>Rascunhos</span>
        </button>
      </div>

      {/* Conteúdo da Aba */}
      {activeSubTab === 'published' && published === null && (
        <div
          role="alert"
          className="text-center py-16 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800"
          data-testid="reviews-unavailable"
        >
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Não foi possível carregar o resumo das suas avaliações.
          </p>
          <Link href={reviewsHref} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline">
            Abrir minhas avaliações <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      )}

      {activeSubTab === 'published' && published === 0 && (
        <div
          className="text-center py-16 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30"
          data-testid="reviews-empty-state"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-900 flex items-center justify-center text-amber-500 shadow-xs">
            <Star className="w-8 h-8 fill-amber-400" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            Parece que você ainda não publicou nenhuma avaliação!
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
            Compartilhe sua experiência real com integradores solares e ajude a comunidade a tomar decisões mais seguras.
          </p>
          {onWriteReview && (
            <button
              type="button"
              onClick={onWriteReview}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all"
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span>Escrever Primeira Avaliação</span>
            </button>
          )}
        </div>
      )}

      {activeSubTab === 'published' && typeof published === 'number' && published > 0 && (
        <div
          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          data-testid="reviews-published-summary"
        >
          <span className="text-sm text-slate-700 dark:text-slate-300">
            Você possui <strong>{published}</strong> {published === 1 ? 'avaliação publicada' : 'avaliações publicadas'}.
          </span>
          <Link href={reviewsHref} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline">
            Ver todas <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      )}

      {activeSubTab === 'saved' && <Unavailable testId="saved-reviews-unavailable" />}
      {activeSubTab === 'drafts' && <Unavailable testId="draft-reviews-unavailable" />}
    </div>
  );
}
