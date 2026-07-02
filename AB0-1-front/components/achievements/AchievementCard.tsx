'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Lock, CheckCircle2 } from 'lucide-react';
import type { Achievement, UserAchievementStatus } from '@/config/achievements';

interface AchievementCardProps {
  achievement: Achievement;
  status: UserAchievementStatus;
  selected?: boolean;
  compact?: boolean;
  onClick?: () => void;
}

export function AchievementCard({
  achievement,
  status,
  selected = false,
  compact = false,
  onClick,
}: AchievementCardProps) {
  const { unlocked, progressCurrent, progressTarget, unlockedAt } = status;
  const progressPercent =
    progressTarget > 0 ? Math.round((progressCurrent / progressTarget) * 100) : 0;

  const formattedDate = unlockedAt
    ? new Date(unlockedAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : null;

  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'group flex flex-col items-center gap-1.5 rounded-xl border bg-white p-3 text-center',
          'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
          selected
            ? 'border-emerald-500 shadow-emerald-100 shadow-sm ring-2 ring-emerald-500 ring-offset-1'
            : 'border-gray-100 hover:border-emerald-200',
          !unlocked && 'opacity-70'
        )}
      >
        <div className="relative h-12 w-12">
          <Image
            src={unlocked ? achievement.iconUnlocked : achievement.iconLocked}
            alt={achievement.title}
            width={48}
            height={48}
            className={cn('h-12 w-12 object-contain', !unlocked && 'grayscale')}
          />
          {unlocked && (
            <CheckCircle2 className="absolute -bottom-1 -right-1 h-4 w-4 fill-white text-emerald-500" />
          )}
        </div>
        <span
          className={cn(
            'line-clamp-2 text-[11px] font-semibold leading-tight',
            unlocked ? 'text-gray-800' : 'text-gray-400'
          )}
        >
          {achievement.title}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex flex-col items-center gap-3 rounded-2xl border bg-white p-5 text-center',
        'transition-all duration-200 hover:-translate-y-1 hover:shadow-lg',
        selected
          ? 'border-emerald-500 shadow-emerald-100 shadow-md ring-2 ring-emerald-500 ring-offset-2'
          : 'border-gray-100 hover:border-emerald-200 hover:shadow-emerald-50',
        !unlocked && 'opacity-80'
      )}
    >
      {/* Ícone */}
      <div className="relative">
        <div
          className={cn(
            'flex h-20 w-20 items-center justify-center rounded-full',
            unlocked
              ? 'bg-gradient-to-br from-emerald-50 to-teal-50'
              : 'bg-gray-50'
          )}
        >
          <Image
            src={unlocked ? achievement.iconUnlocked : achievement.iconLocked}
            alt={achievement.title}
            width={56}
            height={56}
            className={cn(
              'h-14 w-14 object-contain transition-transform duration-200 group-hover:scale-105',
              !unlocked && 'grayscale'
            )}
          />
        </div>
        {!unlocked && (
          <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-gray-200">
            <Lock className="h-3 w-3 text-gray-400" />
          </div>
        )}
        {unlocked && (
          <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-emerald-500">
            <CheckCircle2 className="h-3.5 w-3.5 fill-white text-white" />
          </div>
        )}
      </div>

      {/* Título */}
      <div className="flex flex-col gap-1">
        <span
          className={cn(
            'text-sm font-semibold leading-tight',
            unlocked ? 'text-gray-900' : 'text-gray-500'
          )}
        >
          {achievement.title}
        </span>
        <span className="line-clamp-2 text-xs leading-snug text-gray-400">
          {achievement.description}
        </span>
      </div>

      {/* Estado */}
      {unlocked ? (
        <div className="flex flex-col items-center gap-0.5">
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
            Desbloqueada
          </span>
          {formattedDate && (
            <span className="text-[10px] text-gray-400">em {formattedDate}</span>
          )}
          <span className="text-[10px] font-semibold text-amber-500">+{achievement.points} pts</span>
        </div>
      ) : (
        <div className="flex w-full flex-col gap-1.5">
          {/* Barra de progresso */}
          {progressTarget > 1 && (
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>Progresso</span>
                <span>
                  {progressCurrent}/{progressTarget}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
          <span className="text-[10px] leading-snug text-gray-400">
            Como desbloquear: {achievement.unlockCondition}
          </span>
        </div>
      )}
    </button>
  );
}
