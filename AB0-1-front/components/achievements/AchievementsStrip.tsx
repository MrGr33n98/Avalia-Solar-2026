'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { ACHIEVEMENTS, type UserAchievementStatus } from '@/config/achievements';
import { AchievementCard } from './AchievementCard';

interface AchievementsStripProps {
  statuses: UserAchievementStatus[];
  /** Quantas conquistas exibir na faixa (padrão: 4) */
  visibleCount?: number;
}

export function AchievementsStrip({ statuses, visibleCount = 4 }: AchievementsStripProps) {
  // Prioriza conquistas desbloqueadas, depois as mais próximas de desbloquear
  const sorted = [...ACHIEVEMENTS].sort((a, b) => {
    const sA = statuses.find((s) => s.achievementId === a.id);
    const sB = statuses.find((s) => s.achievementId === b.id);
    const unlockedA = sA?.unlocked ? 1 : 0;
    const unlockedB = sB?.unlocked ? 1 : 0;
    if (unlockedA !== unlockedB) return unlockedB - unlockedA;
    const progressA = sA ? sA.progressCurrent / Math.max(sA.progressTarget, 1) : 0;
    const progressB = sB ? sB.progressCurrent / Math.max(sB.progressTarget, 1) : 0;
    return progressB - progressA;
  });

  const visible = sorted.slice(0, visibleCount);
  const remaining = ACHIEVEMENTS.length - visibleCount;
  const unlockedCount = statuses.filter((s) => s.unlocked).length;

  return (
    <div id="achievements" className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-800">Conquistas sustentáveis</h3>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
            {unlockedCount}/{ACHIEVEMENTS.length}
          </span>
        </div>
        <Link
          href="/review-dashboard/achievements"
          className="flex items-center gap-0.5 text-xs font-medium text-emerald-600 hover:text-emerald-700"
        >
          Ver todas
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Grid desktop / scroll mobile */}
      <div className="overflow-x-auto scrollbar-none">
        <div
          className="flex gap-3 pb-1"
          style={{ minWidth: `${(visibleCount + 1) * 100}px` }}
        >
          {visible.map((achievement) => {
            const status = statuses.find((s) => s.achievementId === achievement.id) ?? {
              achievementId: achievement.id,
              unlocked: false,
              progressCurrent: 0,
              progressTarget: 1,
            };
            return (
              <div key={achievement.id} className="w-[88px] flex-shrink-0 sm:w-[96px]">
                <AchievementCard
                  achievement={achievement}
                  status={status}
                  compact
                />
              </div>
            );
          })}

          {/* +N card */}
          {remaining > 0 && (
            <Link
              href="/review-dashboard/achievements"
              className="flex w-[88px] flex-shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-emerald-200 bg-emerald-50/50 p-3 text-center transition-colors hover:bg-emerald-50 sm:w-[96px]"
            >
              <span className="text-lg font-bold text-emerald-600">+{remaining}</span>
              <span className="text-[10px] leading-tight text-emerald-500">Ver todas</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
