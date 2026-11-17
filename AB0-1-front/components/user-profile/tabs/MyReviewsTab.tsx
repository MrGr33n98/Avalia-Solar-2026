'use client';

import React, { useState } from 'react';
import { Star, MessageSquarePlus, Bookmark, FileEdit, ExternalLink } from 'lucide-react';
import { UserProfileStats } from '../types';

interface MyReviewsTabProps {
  stats: UserProfileStats;
  onWriteReview?: () => void;
}

export function MyReviewsTab({ stats, onWriteReview }: MyReviewsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'published' | 'saved' | 'drafts'>('published');

  return (
    <div className="space-y-6" data-testid="my-reviews-tab">
      {/* Cabeçalho */}
      <div className="border-b border-slate-100 dark:border-slate-800 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Minhas Avaliações
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Histórico das avaliações que você publicou, salvou ou deixou como rascunho.
          </p>
        </div>

        <button
          type="button"
          onClick={onWriteReview}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all self-start sm:self-auto"
          data-testid="write-review-button"
        >
          <MessageSquarePlus className="w-4 h-4" />
          <span>Escrever Nova Avaliação</span>
        </button>
      </div>

      {/* Sub-abas */}
      <div className="flex gap-6 border-b border-slate-200 dark:border-slate-800 -mb-px">
        <button
          type="button"
          onClick={() => setActiveSubTab('published')}
          className={`py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === 'published'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Star className="w-4 h-4" />
          <span>Publicadas ({stats.reviews_count})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('saved')}
          className={`py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === 'saved'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>Salvas ({stats.saved_reviews_count})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('drafts')}
          className={`py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === 'drafts'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <FileEdit className="w-4 h-4" />
          <span>Rascunhos ({stats.drafts_count})</span>
        </button>
      </div>

      {/* Conteúdo da Aba */}
      {activeSubTab === 'published' && stats.reviews_count === 0 && (
        <div
          className="text-center py-16 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30"
          data-testid="reviews-empty-state"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-900 flex items-center justify-center text-amber-500 shadow-xs">
            <Star className="w-8 h-8 fill-amber-400" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            Parece que você ainda não escreveu nenhuma avaliação!
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
            Compartilhe sua experiência real com integradores solares e ajude a comunidade a tomar decisões mais seguras.
          </p>
          <button
            type="button"
            onClick={onWriteReview}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>Escrever Primeira Avaliação</span>
          </button>
        </div>
      )}

      {activeSubTab === 'saved' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            Você possui {stats.saved_reviews_count} avaliações salvas como referência para seus projetos solares.
          </p>
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Avaliação: WEG Solar &mdash; Instalação Industrial 75kWp
              </span>
              <span className="text-xs text-slate-400">Salvo há 3 dias</span>
            </div>
            <button className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1">
              <span>Ler</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {activeSubTab === 'drafts' && (
        <div className="space-y-3">
          <div className="p-4 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/40 dark:bg-slate-900 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Rascunho: Avaliação da empresa SolarPrime
              </span>
              <span className="text-xs text-slate-500">Última edição há 2 dias &bull; 60% concluído</span>
            </div>
            <button
              onClick={onWriteReview}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-all"
            >
              Continuar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

