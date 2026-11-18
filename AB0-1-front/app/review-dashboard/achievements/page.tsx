'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Trophy,
  RotateCcw,
  PlusCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { track } from '@/lib/analytics/lazy';
import { getReviewerAchievements, type AchievementItem } from '@/lib/api/achievements';
import { AchievementCard } from '@/components/review-dashboard/achievements/AchievementCard';
import { AchievementDetailModal } from '@/components/review-dashboard/achievements/AchievementDetailModal';
import { AchievementSummaryHeader } from '@/components/review-dashboard/achievements/AchievementSummaryHeader';
import { AchievementFaqAccordion } from '@/components/review-dashboard/achievements/AchievementFaqAccordion';

const TABS = [
  { id: 'all', label: 'Todas' },
  { id: 'unlocked', label: 'Conquistadas' },
  { id: 'locked', label: 'Bloqueadas' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function AchievementsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [selectedAchievement, setSelectedAchievement] = useState<AchievementItem | null>(null);

  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['reviewer-achievements'],
    queryFn: getReviewerAchievements,
    staleTime: 30 * 1000,
    retry: 2,
  });

  useEffect(() => {
    track('achievement_tab_viewed', {
      surface: 'tab',
      unlocked_count: data?.summary?.unlocked_count,
      total_count: data?.summary?.total_count,
    });
  }, [data?.summary]);

  const achievements = useMemo(() => data?.achievements || [], [data?.achievements]);

  const filteredAchievements = useMemo(() => {
    return achievements.filter((achievement) => {
      if (activeTab === 'unlocked') return achievement.state === 'unlocked';
      if (activeTab === 'locked') return achievement.state !== 'unlocked';
      return true;
    });
  }, [achievements, activeTab]);

  const handleSelectAchievement = (achievement: AchievementItem) => {
    setSelectedAchievement(achievement);
    track('achievement_detail_opened', {
      badge_id: achievement.id,
      state: achievement.state,
      category: achievement.category,
    });
  };

  const handleShareAchievement = (achievement: AchievementItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedAchievement(achievement);
    track('achievement_share_started', {
      badge_id: achievement.id,
      method: 'modal_prompt',
    });
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-3 sm:px-6 py-4 sm:py-6">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Navegação estrutural" className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
        <Link href="/review-dashboard" className="hover:text-blue-600 transition-colors">
          Central do Avaliador
        </Link>
        <span className="text-slate-300">›</span>
        <span className="text-slate-800 dark:text-slate-200 font-medium">Conquistas & Badges</span>
      </nav>

      {/* Loading State Skeleton */}
      {isLoading && (
        <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Carregando conquistas">
          <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          <div className="h-10 w-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-60 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
            ))}
          </div>
        </div>
      )}

      {/* Error State with Retry Button */}
      {isError && (
        <div className="my-8 p-8 rounded-3xl border border-red-200 bg-red-50/70 dark:bg-red-950/20 text-center">
          <h2 className="text-lg font-bold text-red-800 dark:text-red-300">
            Não foi possível carregar as conquistas
          </h2>
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            Ocorreu um erro temporário na comunicação com o servidor.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Tentar novamente</span>
          </button>
        </div>
      )}

      {/* Loaded Content */}
      {!isLoading && !isError && data && (
        <>
          {/* Summary Banner Header */}
          <AchievementSummaryHeader summary={data.summary} />

          {/* Filter Tabs */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 mb-6 pb-2">
            <div className="flex items-center gap-2 sm:gap-4" role="tablist" aria-label="Filtrar por status">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                const count =
                  tab.id === 'all'
                    ? achievements.length
                    : tab.id === 'unlocked'
                    ? data.summary.unlocked_count
                    : data.summary.total_count - data.summary.unlocked_count;

                return (
                  <button
                    key={tab.id}
                    role="tab"
                    id={`tab-${tab.id}`}
                    aria-selected={isActive}
                    aria-controls={`tabpanel-${tab.id}`}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'px-3.5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all min-h-[44px] flex items-center gap-1.5',
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    )}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={cn(
                        'text-[11px] px-1.5 py-0.2 rounded-full',
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {isFetching && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <RotateCcw className="w-3 h-3 animate-spin" />
                Atualizando...
              </span>
            )}
          </div>

          {/* Achievements Grid: 2 cols on mobile (<640px), 3 cols on tablet, 4 cols on desktop */}
          <section
            id={`tabpanel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`tab-${activeTab}`}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5"
          >
            {filteredAchievements.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                onSelect={handleSelectAchievement}
                onShare={handleShareAchievement}
              />
            ))}
          </section>

          {/* Empty State when tab has 0 items */}
          {filteredAchievements.length === 0 && (
            <div className="py-12 px-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center my-6">
              <Trophy className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Nenhum selo encontrado nesta aba
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {activeTab === 'unlocked'
                  ? 'Você ainda não possui conquistas desbloqueadas. Comece avaliando uma empresa solar!'
                  : 'Parabéns! Você já desbloqueou todas as conquistas disponíveis nesta categoria.'}
              </p>
            </div>
          )}

          {/* Contextual Solar Solutions Upsell Banner */}
          <section
            aria-label="Equipamentos e Soluções em Uso"
            className="mt-12 p-6 rounded-3xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm"
          >
            <div>
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block mb-1">
                Equipamentos em Uso
              </span>
              <h3 className="text-lg font-bold">
                Cadastre seus Inversores e Módulos Solares
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Compartilhe as marcas do seu gerador fotovoltaico para desbloquear os selos de Usina Completa e Especialista Solar.
              </p>
            </div>
            <Link
              href="/review-dashboard/solutions"
              className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 transition-colors shadow-sm min-h-[44px]"
            >
              <PlusCircle className="w-4 h-4 text-blue-600" />
              <span>Gerenciar Soluções</span>
            </Link>
          </section>

          {/* FAQ Accordion Section */}
          <AchievementFaqAccordion faq={data.faq} />
        </>
      )}

      {/* Detail Dialog Modal */}
      <AchievementDetailModal
        achievement={selectedAchievement}
        isOpen={Boolean(selectedAchievement)}
        onClose={() => setSelectedAchievement(null)}
      />
    </div>
  );
}
