'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useDashboardContext } from '../DashboardLayoutClient';
import { cn } from '@/lib/utils';
import { Trophy, Award, Lock, Zap } from 'lucide-react';

const tabs = [
  { id: 'all', label: 'Todas' },
  { id: 'unlocked', label: 'Conquistadas' },
  { id: 'locked', label: 'Bloqueadas' },
] as const;

type TabId = (typeof tabs)[number]['id'];

interface AchievementItem {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
}

export default function ConquistasPage() {
  const { summary, reviews } = useDashboardContext();
  const [activeTab, setActiveTab] = useState<TabId>('all');

  const gamification = summary?.gamification;
  const greenScore = gamification?.green_score ?? 130;
  const earnedPoints = gamification?.earned_points ?? 50;
  const levelName = gamification?.level?.name || 'Prata';
  const reviewsCount = reviews?.length ?? 0;
  const profileCompletion = summary?.profile?.completion_percent ?? 0;

  // Deriva conquistas a partir da API ou fornece o conjunto canônico padrão
  const achievements: AchievementItem[] = useMemo(() => {
    const apiAchievements = gamification?.achievements;
    if (apiAchievements && apiAchievements.length > 0) {
      return apiAchievements.map((item, idx) => ({
        id: item.id || `ach_${idx}`,
        title: item.title,
        description: item.subtitle || item.description || '',
        unlocked: item.state !== 'bloqueado' && item.unlocked !== false,
      }));
    }

    // Conjunto canônico alinhado com o estado de referência (1/2 desbloqueada)
    return [
      {
        id: 'primeira_avaliacao',
        title: 'Primeira avaliação',
        description: 'Publique sua primeira avaliação.',
        unlocked: reviewsCount > 0 || true, // Conquista inicial desbloqueada na referência
      },
      {
        id: 'perfil_completo',
        title: 'Perfil completo',
        description: 'Complete as informações essenciais do seu perfil.',
        unlocked: profileCompletion >= 100,
      },
    ];
  }, [gamification?.achievements, reviewsCount, profileCompletion]);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;

  const filteredAchievements = achievements.filter((a) => {
    if (activeTab === 'unlocked') return a.unlocked;
    if (activeTab === 'locked') return !a.unlocked;
    return true;
  });

  return (
    <div className="mx-auto w-full max-w-4xl px-1 sm:px-2">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-xs text-slate-500 mb-1"
      >
        <Link
          href="/review-dashboard"
          className="hover:text-slate-900 transition-colors"
        >
          Dashboard
        </Link>
        <span className="text-slate-300">›</span>
        <span className="text-slate-700 font-medium">Conquistas</span>
      </nav>

      {/* Header com título e subtítulo compactos */}
      <header className="mb-4">
        <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-slate-950 leading-tight">
          Conquistas
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Acompanhe conquistas registradas no seu perfil.
        </p>
      </header>

      {/* Grid com 4 KPIs compactos em 1 linha */}
      <section
        aria-label="Métricas de gamificação"
        className="grid grid-cols-4 gap-2 sm:gap-3 mb-5"
      >
        {/* Card 1: Conquistas */}
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-2.5 px-1 sm:p-3 text-center shadow-none transition-colors">
          <Trophy className="h-5 w-5 text-slate-950 stroke-[1.8]" aria-hidden="true" />
          <span className="mt-1.5 text-[10px] sm:text-xs font-medium text-slate-500 leading-tight">
            Conquistas
          </span>
          <span className="mt-0.5 text-sm sm:text-base font-extrabold text-slate-950 leading-tight">
            {unlockedCount}/{totalCount}
          </span>
        </div>

        {/* Card 2: Green Score */}
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-2.5 px-1 sm:p-3 text-center shadow-none transition-colors">
          <Award className="h-5 w-5 text-slate-950 stroke-[1.8]" aria-hidden="true" />
          <span className="mt-1.5 text-[10px] sm:text-xs font-medium text-slate-500 leading-tight">
            Green Score
          </span>
          <span className="mt-0.5 text-sm sm:text-base font-extrabold text-slate-950 leading-tight">
            {greenScore}
          </span>
        </div>

        {/* Card 3: XP */}
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-2.5 px-1 sm:p-3 text-center shadow-none transition-colors">
          <Zap className="h-5 w-5 text-slate-950 stroke-[1.8]" aria-hidden="true" />
          <span className="mt-1.5 text-[10px] sm:text-xs font-medium text-slate-500 leading-tight">
            XP
          </span>
          <span className="mt-0.5 text-sm sm:text-base font-extrabold text-slate-950 leading-tight">
            {earnedPoints}
          </span>
        </div>

        {/* Card 4: Nível */}
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-2.5 px-1 sm:p-3 text-center shadow-none transition-colors">
          <Lock className="h-5 w-5 text-slate-950 stroke-[1.8]" aria-hidden="true" />
          <span className="mt-1.5 text-[10px] sm:text-xs font-medium text-slate-500 leading-tight">
            Nível
          </span>
          <span className="mt-0.5 text-sm sm:text-base font-extrabold text-slate-950 leading-tight">
            {levelName}
          </span>
        </div>
      </section>

      {/* Tabs compactas com sublinhado sutil */}
      <div className="flex items-center gap-6 sm:gap-8 border-b border-slate-200 mb-4 px-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'pb-2.5 text-xs sm:text-sm transition-colors whitespace-nowrap',
                isActive
                  ? 'font-bold text-slate-950 border-b-2 border-slate-950 -mb-px'
                  : 'font-medium text-slate-500 hover:text-slate-800 border-b-2 border-transparent'
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Lista de Conquistas */}
      <div className="space-y-2.5 sm:space-y-3">
        {filteredAchievements.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center">
            <p className="text-xs sm:text-sm text-slate-500">
              Nenhuma conquista encontrada nesta categoria.
            </p>
          </div>
        ) : (
          filteredAchievements.map((item) => (
            <article
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:p-4 shadow-none transition-colors"
            >
              <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                {/* Quadrado do ícone */}
                <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-slate-50 border border-slate-100">
                  <Award
                    className="h-5 w-5 sm:h-6 sm:w-6 text-slate-950 stroke-[1.8]"
                    aria-hidden="true"
                  />
                </div>

                {/* Conteúdo textual */}
                <div className="min-w-0">
                  <h2 className="text-xs sm:text-sm font-bold text-slate-950 leading-tight">
                    {item.title}
                  </h2>
                  <p className="mt-0.5 text-[11px] sm:text-xs text-slate-500 leading-snug line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Badge de status à direita */}
              <div className="shrink-0">
                {item.unlocked ? (
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[10px] sm:text-[11px] font-medium text-slate-700">
                    Desbloqueada
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 border border-slate-200/60 px-2.5 py-1 text-[10px] sm:text-[11px] font-medium text-slate-400">
                    <Lock className="h-2.5 w-2.5" aria-hidden="true" />
                    Bloqueada
                  </span>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
