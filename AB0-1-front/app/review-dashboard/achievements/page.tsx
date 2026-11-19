'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
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
    <div className="mx-auto w-full max-w-[1320px] px-3 py-4 sm:px-5 sm:py-5">
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
        <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Carregando conquistas">
          <div className="h-36 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-9 w-64 bg-slate-200 dark:bg-slate-800 rounded-md" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-[180px] bg-slate-200 dark:bg-slate-800 rounded-lg" />
            ))}
          </div>
        </div>
      )}

      {/* Error State with Retry Button */}
      {isError && (
        <div className="my-5 rounded-lg border border-red-200 bg-red-50 p-5 dark:bg-red-950/20">
          <h2 className="text-lg font-bold text-red-800 dark:text-red-300">
            Não foi possível carregar as conquistas
          </h2>
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            Ocorreu um erro temporário na comunicação com o servidor.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 inline-flex min-h-[36px] items-center justify-center rounded-md bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
          >
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
          <div className="mb-4 flex min-w-0 items-center justify-between gap-2 border-b border-slate-200 pb-2 dark:border-slate-800">
            <div className="flex min-w-0 items-center gap-1 overflow-x-auto whitespace-nowrap" role="tablist" aria-label="Filtrar por status">
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
                      'flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors sm:px-3',
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    )}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={cn(
                        'text-[11px] px-1.5 py-0.5 rounded-md',
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
                Atualizando...
              </span>
            )}
          </div>

          {/* Achievements Grid: 2 cols on mobile (<640px), 3 cols on tablet, 4 cols on desktop */}
          <section
            id={`tabpanel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`tab-${activeTab}`}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3"
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

          {/* Distinguish an unpublished catalog from an empty filter result. */}
          {filteredAchievements.length === 0 && (
            <div
              role="status"
              className="my-4 rounded-lg border border-dashed border-slate-300 bg-white px-4 py-8 text-center dark:border-slate-700 dark:bg-slate-900"
            >
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {achievements.length === 0
                  ? 'Catálogo de conquistas temporariamente indisponível'
                  : activeTab === 'unlocked'
                    ? 'Você ainda não desbloqueou conquistas'
                    : activeTab === 'locked'
                      ? 'Não há conquistas bloqueadas'
                      : 'Nenhuma conquista encontrada'}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {achievements.length === 0
                  ? 'Os emblemas ainda não foram publicados nesta conta. Tente atualizar a página.'
                  : activeTab === 'unlocked'
                    ? 'Explore os emblemas na aba Todas para descobrir como conquistar o primeiro.'
                    : 'Confira os demais emblemas na aba Todas.'}
              </p>
            </div>
          )}

          {/* Compact contextual action, visually secondary to the badges. */}
          <section
            aria-label="Equipamentos e soluções em uso"
            className="mt-6 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="min-w-0">
              <h2 className="text-[13px] font-semibold text-slate-900 dark:text-white">
                Seus equipamentos também geram conquistas
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Cadastre inversores e módulos solares para acompanhar seus próximos emblemas.
              </p>
            </div>
            <Link
              href="/review-dashboard/solutions"
              className="inline-flex min-h-[36px] shrink-0 items-center justify-center rounded-md border border-blue-600 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950/40"
            >
              Gerenciar equipamentos
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
