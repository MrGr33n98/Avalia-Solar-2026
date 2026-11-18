'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Lock, CheckCircle2, Share2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AchievementItem } from '@/lib/api/achievements';
import { resolveActionUrl, resolveActionLabel } from '@/lib/api/achievements';

interface AchievementCardProps {
  achievement: AchievementItem;
  onSelect: (achievement: AchievementItem) => void;
  onShare?: (achievement: AchievementItem, e: React.MouseEvent) => void;
}

export function AchievementCard({ achievement, onSelect, onShare }: AchievementCardProps) {
  const isUnlocked = achievement.state === 'unlocked';
  const isInProgress = achievement.state === 'in_progress';

  const assetSrc = isUnlocked ? achievement.asset.earned : achievement.asset.locked;

  const handleCardClick = () => {
    onSelect(achievement);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(achievement);
    }
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onShare) {
      onShare(achievement, e);
    } else {
      onSelect(achievement);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      aria-haspopup="dialog"
      aria-label={`Conquista: ${achievement.name}. Estado: ${
        isUnlocked ? 'Desbloqueado' : isInProgress ? 'Em progresso' : 'Bloqueado'
      }. Clique para ver detalhes.`}
      className={cn(
        'group relative flex flex-col items-center justify-between p-5 rounded-2xl transition-all duration-200 cursor-pointer select-none text-center',
        'min-h-[220px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2',
        isUnlocked
          ? 'bg-white dark:bg-slate-900 border-2 border-blue-100 dark:border-blue-900/40 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700'
          : isInProgress
          ? 'bg-slate-50/90 dark:bg-slate-900/60 border border-amber-200/70 dark:border-amber-900/40 hover:border-amber-300'
          : 'bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800/70 hover:border-slate-300 dark:hover:border-slate-700 opacity-90 hover:opacity-100'
      )}
      data-testid={`achievement-card-${achievement.id}`}
    >
      {/* Top badges (XP & status) */}
      <div className="w-full flex items-center justify-between mb-2">
        <span
          className={cn(
            'text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider',
            isUnlocked
              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
              : 'bg-slate-200/70 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
          )}
        >
          +{achievement.xp > 0 ? achievement.xp : achievement.points || 50} XP
        </span>

        <div className="flex items-center">
          {isUnlocked ? (
            <span
              className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
              title="Conquistado"
              aria-hidden="true"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
          ) : isInProgress ? (
            <span
              className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
              title="Em progresso"
            >
              {achievement.progress}/{achievement.threshold}
            </span>
          ) : (
            <span
              className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200/70 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
              title="Bloqueado"
              aria-hidden="true"
            >
              <Lock className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      </div>

      {/* Center Image / Badge */}
      <div className="relative my-2 w-20 h-20 flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
        <Image
          src={assetSrc}
          alt={`Selo ${achievement.name}`}
          width={80}
          height={80}
          className={cn(
            'object-contain drop-shadow-sm',
            !isUnlocked && 'grayscale opacity-60 contrast-125'
          )}
          priority={achievement.threshold === 1}
        />
      </div>

      {/* Badge Name */}
      <div className="w-full my-1">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight">
          {achievement.name}
        </h3>
      </div>

      {/* Bottom Action / CTA */}
      <div className="w-full mt-3">
        {isUnlocked ? (
          <button
            type="button"
            onClick={handleShareClick}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-full shadow-sm transition-colors min-h-[36px]"
            aria-label={`Compartilhar conquista ${achievement.name}`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Compartilhar</span>
          </button>
        ) : (
          <Link
            href={resolveActionUrl(achievement.action)}
            onClick={(e) => e.stopPropagation()}
            className="w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-200/60 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors min-h-[36px]"
            aria-label={`${resolveActionLabel(achievement.action)} para desbloquear ${achievement.name}`}
          >
            <span>{resolveActionLabel(achievement.action)}</span>
            <ArrowRight className="w-3 h-3 text-slate-400" />
          </Link>
        )}
      </div>
    </div>
  );
}
