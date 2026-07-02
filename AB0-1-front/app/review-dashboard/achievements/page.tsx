'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Star, Trophy, Zap, ChevronLeft, Info } from 'lucide-react';
import { useDashboardContext } from '../DashboardLayoutClient';
import { useAuth } from '@/contexts/AuthContext';
import {
  ACHIEVEMENTS,
  deriveAchievementStatuses,
  getReviewerLevel,
  type AchievementCategory,
} from '@/config/achievements';
import { AchievementCard } from '@/components/achievements/AchievementCard';
import { cn } from '@/lib/utils';

const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  avaliacao: 'Avaliações',
  perfil: 'Perfil',
  solar: 'Energia Solar',
  mobilidade: 'Mobilidade Elétrica',
  comunidade: 'Comunidade',
  especial: 'Especial',
};

const CATEGORY_ORDER: AchievementCategory[] = [
  'avaliacao',
  'perfil',
  'solar',
  'mobilidade',
  'comunidade',
  'especial',
];

export default function AchievementsPage() {
  const { user } = useAuth();
  const { summary, reviews } = useDashboardContext();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<AchievementCategory | 'all'>('all');

  // Derivar status das conquistas a partir dos dados existentes
  const helpfulVotes = summary?.impact?.helpful_votes ?? 0;
  const greenScore = summary?.gamification?.green_score ?? 0;
  const profileCompletion = summary?.profile?.completion_percent ?? 0;

  const hasSolarReview = reviews.some((r) =>
    (r.category_name || '').toLowerCase().includes('solar')
  );
  const hasMobilityReview = reviews.some(
    (r) =>
      (r.category_name || '').toLowerCase().includes('mobilidade') ||
      (r.category_name || '').toLowerCase().includes('elétric')
  );

  const statuses = deriveAchievementStatuses({
    reviewsCount: reviews.length,
    profileCompletionPercent: profileCompletion,
    helpfulVotes,
    greenScore,
    hasSolarReview,
    hasMobilityReview,
    hasEVSolution: false,
    isLinkedInVerified: false,
  });

  const unlockedCount = statuses.filter((s) => s.unlocked).length;
  const totalPoints = statuses
    .filter((s) => s.unlocked)
    .reduce((acc, s) => {
      const ach = ACHIEVEMENTS.find((a) => a.id === s.achievementId);
      return acc + (ach?.points ?? 0);
    }, 0);

  const { label: levelLabel } = getReviewerLevel(totalPoints);

  const nextAchievement = ACHIEVEMENTS.find((a) => {
    const s = statuses.find((st) => st.achievementId === a.id);
    return !s?.unlocked;
  });

  const filtered =
    activeCategory === 'all'
      ? ACHIEVEMENTS
      : ACHIEVEMENTS.filter((a) => a.category === activeCategory);

  const selected = selectedId ? ACHIEVEMENTS.find((a) => a.id === selectedId) : null;
  const selectedStatus = selectedId
    ? statuses.find((s) => s.achievementId === selectedId)
    : null;

  const firstName = user?.name?.split(' ')[0] || 'Avaliador';

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2">
          <Link
            href="/review-dashboard"
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-emerald-600"
          >
            <ChevronLeft className="h-4 w-4" />
            Central de Atividade
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-medium text-gray-700">Minhas Conquistas</span>
        </div>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Minhas Conquistas Sustentáveis
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Conquistas que reconhecem sua jornada no Avalia Solar. Quanto mais você avalia e contribui,
            mais distintivos você desbloqueia.
          </p>
        </div>

        {/* Summary cards */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-1 flex items-center gap-1.5">
              <Trophy className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-medium text-gray-500">Desbloqueadas</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {unlockedCount}
              <span className="text-sm font-normal text-gray-400">/{ACHIEVEMENTS.length}</span>
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-1 flex items-center gap-1.5">
              <Star className="h-4 w-4 text-emerald-500" />
              <span className="text-xs font-medium text-gray-500">Green Score</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalPoints}</p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-1 flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-teal-500" />
              <span className="text-xs font-medium text-gray-500">Nível</span>
            </div>
            <p className="text-sm font-bold text-gray-900 leading-tight">{levelLabel}</p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-1 flex items-center gap-1.5">
              <Info className="h-4 w-4 text-blue-400" />
              <span className="text-xs font-medium text-gray-500">Próxima</span>
            </div>
            <p className="text-sm font-bold leading-tight text-gray-900">
              {nextAchievement?.title ?? '🎉 Todas!'}
            </p>
          </div>
        </div>

        {/* Incentivo da próxima conquista */}
        {nextAchievement && (
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="text-xl">🌱</span>
              <div>
                <p className="text-sm font-semibold text-emerald-800">
                  {firstName}, você está perto de desbloquear{' '}
                  <span className="text-emerald-700">{nextAchievement.title}</span>!
                </p>
                <p className="text-xs text-emerald-600">{nextAchievement.unlockCondition}</p>
              </div>
            </div>
            <Link
              href={nextAchievement.ctaHref}
              className="flex-shrink-0 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              {nextAchievement.ctaLabel}
            </Link>
          </div>
        )}

        {/* Filtros por categoria */}
        <div className="mb-4 flex gap-2 overflow-x-auto scrollbar-none pb-1">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={cn(
              'flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors',
              activeCategory === 'all'
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            )}
          >
            Todas ({ACHIEVEMENTS.length})
          </button>
          {CATEGORY_ORDER.map((cat) => {
            const count = ACHIEVEMENTS.filter((a) => a.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors',
                  activeCategory === cat
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                )}
              >
                {CATEGORY_LABELS[cat]} ({count})
              </button>
            );
          })}
        </div>

        {/* Grid de conquistas */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white py-16 text-center">
            <p className="text-3xl">🔒</p>
            <p className="mt-3 text-sm font-semibold text-gray-700">
              Publique sua primeira avaliação e desbloqueie sua primeira conquista sustentável.
            </p>
            <Link
              href="/companies"
              className="mt-4 inline-block rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Avaliar empresa
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filtered.map((achievement) => {
              const status = statuses.find((s) => s.achievementId === achievement.id) ?? {
                achievementId: achievement.id,
                unlocked: false,
                progressCurrent: 0,
                progressTarget: 1,
              };
              return (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  status={status}
                  selected={selectedId === achievement.id}
                  onClick={() =>
                    setSelectedId(selectedId === achievement.id ? null : achievement.id)
                  }
                />
              );
            })}
          </div>
        )}

        {/* Painel de detalhe da conquista selecionada */}
        {selected && selectedStatus && (
          <div className="mt-6 rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <div className="flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedStatus.unlocked ? selected.iconUnlocked : selected.iconLocked}
                  alt={selected.title}
                  className={cn('h-16 w-16', !selectedStatus.unlocked && 'grayscale')}
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-900">{selected.title}</h2>
                  {selectedStatus.unlocked ? (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                      Desbloqueada ✓
                    </span>
                  ) : (
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                      Bloqueada
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-500">{selected.description}</p>
                {!selectedStatus.unlocked && (
                  <p className="mt-2 text-xs text-gray-400">
                    Como desbloquear: {selected.unlockCondition}
                  </p>
                )}
                {selectedStatus.unlocked && selectedStatus.unlockedAt && (
                  <p className="mt-1 text-xs text-gray-400">
                    Desbloqueada em{' '}
                    {new Date(selectedStatus.unlockedAt).toLocaleDateString('pt-BR')}
                  </p>
                )}
                <p className="mt-1 text-xs font-semibold text-amber-500">
                  Vale {selected.points} pontos Green Score
                </p>
              </div>
              {!selectedStatus.unlocked && (
                <Link
                  href={selected.ctaHref}
                  className="flex-shrink-0 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  {selected.ctaLabel}
                </Link>
              )}
            </div>
          </div>
        )}

        {/* FAQ */}
        <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-800">Perguntas frequentes</h2>
          <div className="space-y-4">
            {[
              {
                q: 'Como funciona o sistema de conquistas?',
                a: 'Conquistas são desbloqueadas automaticamente quando você completa ações como publicar avaliações, completar o perfil e receber votos úteis da comunidade.',
              },
              {
                q: 'Onde as conquistas aparecem?',
                a: 'Conquistas desbloqueadas aparecem no seu perfil público e na sua Central de Atividade, aumentando sua credibilidade junto às empresas.',
              },
              {
                q: 'O que é o Green Score?',
                a: 'Green Score é a pontuação acumulada de todas as suas conquistas. Quanto mais alto, maior é o seu nível de avaliador e sua visibilidade na plataforma.',
              },
              {
                q: 'Publiquei uma avaliação mas não desbloqueei a conquista. Por quê?',
                a: 'A conquista "1ª Avaliação" é desbloqueada após a avaliação ser aprovada pela equipe do Avalia Solar. Avaliações em análise não contam ainda.',
              },
            ].map(({ q, a }) => (
              <details key={q} className="group border-b border-gray-100 pb-4">
                <summary className="flex cursor-pointer items-center justify-between text-sm font-medium text-gray-700 hover:text-emerald-600">
                  {q}
                  <span className="ml-2 flex-shrink-0 text-gray-400 transition-transform group-open:rotate-180">
                    ▾
                  </span>
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
