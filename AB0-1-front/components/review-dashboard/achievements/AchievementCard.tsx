'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { AchievementItem } from '@/lib/api/achievements';

interface AchievementCardProps {
  achievement: AchievementItem;
  onSelect: (achievement: AchievementItem) => void;
  onShare?: (achievement: AchievementItem, e: React.MouseEvent) => void;
}

export function AchievementCard({ achievement, onSelect, onShare }: AchievementCardProps) {
  const isUnlocked = achievement.state === 'unlocked';
  const isInProgress = achievement.state === 'in_progress';
  const assetSrc = isUnlocked ? achievement.asset.earned : achievement.asset.locked;
  const status = isUnlocked ? 'Conquistada' : isInProgress ? 'Em andamento' : 'Bloqueada';

  return (
    <article
      className="group flex min-w-0 flex-col rounded-lg border border-slate-200 bg-white p-2 shadow-sm transition-colors hover:border-blue-300 focus-within:border-blue-500 dark:border-slate-700 dark:bg-slate-900"
      data-testid={`achievement-card-${achievement.id}`}
    >
      <button
        type="button"
        onClick={() => onSelect(achievement)}
        aria-haspopup="dialog"
        aria-label={`${achievement.name}. ${status}. Ver requisitos e detalhes.`}
        className="flex min-w-0 flex-1 flex-col rounded-md text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
      >
        <span
          aria-hidden="true"
          className={cn(
            'flex h-[100px] w-full items-center justify-center rounded-md',
            isUnlocked ? 'bg-slate-50 dark:bg-slate-800' : 'bg-[#f3f4f6] dark:bg-slate-800/80'
          )}
        >
          <Image
            src={assetSrc}
            alt=""
            width={72}
            height={72}
            className={cn('h-[72px] w-[72px] object-contain', !isUnlocked && 'grayscale')}
          />
        </span>
        <span className="flex min-h-[38px] w-full items-center justify-center px-1 py-1.5">
          <span className={cn(
            'line-clamp-2 text-[12px] font-semibold leading-4',
            isUnlocked ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
          )}>
            {achievement.name}
          </span>
        </span>
      </button>
      <div className="flex h-[30px] items-center justify-center">
        {isUnlocked ? (
          <button
            type="button"
            onClick={(event) => onShare ? onShare(achievement, event) : onSelect(achievement)}
            className="inline-flex min-h-[28px] max-w-full items-center justify-center rounded-md bg-blue-600 px-3 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            aria-label={`Compartilhar conquista ${achievement.name}`}
          >
            Compartilhar no LinkedIn
          </button>
        ) : (
          <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
            {isInProgress ? `Em andamento · ${achievement.progress}/${achievement.threshold}` : 'A conquistar'}
          </span>
        )}
      </div>
    </article>
  );
}
