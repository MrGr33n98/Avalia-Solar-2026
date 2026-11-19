'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { AchievementItem } from '@/lib/api/achievements';
import { resolveActionUrl, resolveActionLabel } from '@/lib/api/achievements';

interface AchievementDetailModalProps {
  achievement: AchievementItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AchievementDetailModal({
  achievement,
  isOpen,
  onClose,
}: AchievementDetailModalProps) {
  const [copied, setCopied] = useState(false);

  if (!achievement) return null;

  const isUnlocked = achievement.state === 'unlocked';
  const isInProgress = achievement.state === 'in_progress';
  const assetSrc = isUnlocked ? achievement.asset.earned : achievement.asset.locked;

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }).format(date);
    } catch {
      return '';
    }
  };

  const verifyUrl =
    achievement.share?.verify_url ||
    (achievement.share?.token && typeof window !== 'undefined'
      ? `${window.location.origin}/conquistas/verificar/${achievement.share.token}`
      : '');

  const handleCopyLink = async () => {
    if (!verifyUrl) return;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(verifyUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (err) {
      console.warn('Falha ao copiar link:', err);
    }
  };

  const handleLinkedInShare = () => {
    if (!verifyUrl) return;
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      verifyUrl
    )}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share && verifyUrl) {
      try {
        await navigator.share({
          title: `Conquista Avalia Solar: ${achievement.name}`,
          text: `Acabei de desbloquear o selo "${achievement.name}" no Avalia Solar!`,
          url: verifyUrl,
        });
      } catch {
        // Usuário cancelou ou navegador não suportou
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-[calc(100vw-24px)] rounded-lg border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-800 dark:bg-slate-900 sm:max-w-[440px] sm:p-5"
        aria-describedby="achievement-modal-description"
      >
        <DialogHeader className="items-center text-center">
          <div className="flex w-full items-center justify-between text-[10px] font-semibold uppercase tracking-wide">
            <span className="text-blue-600 dark:text-blue-400">{achievement.category}</span>
            <span className="text-slate-500 dark:text-slate-400">{achievement.points ?? 0} XP possíveis</span>
          </div>
          <div className="my-3 flex h-28 w-28 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
            <Image
              src={assetSrc}
              alt={`Emblema ${achievement.name}`}
              width={92}
              height={92}
              className={cn('h-[92px] w-[92px] object-contain', !isUnlocked && 'grayscale')}
            />
          </div>
          <DialogTitle className="text-base font-semibold text-slate-900 dark:text-white">
            {achievement.name}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Requisitos e estado da conquista {achievement.name}
          </DialogDescription>
          <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {isUnlocked
              ? `Conquistada em ${formatDate(achievement.unlocked_at)}`
              : isInProgress
                ? `Em andamento · ${achievement.progress} de ${achievement.threshold}`
                : 'Bloqueada · conclua o requisito abaixo'}
          </p>
        </DialogHeader>

        <div id="achievement-modal-description" className="mt-4 space-y-3 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-600 dark:border-slate-800 dark:text-slate-300">
          <p>{achievement.description}</p>
          {!isUnlocked && (
            <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-800/60">
              <p className="mb-1 font-semibold text-slate-800 dark:text-slate-100">Como desbloquear</p>
              <p>{achievement.subtitle || achievement.description}</p>
            </div>
          )}
        </div>

        <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
          {isUnlocked ? (
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleLinkedInShare}
                disabled={!verifyUrl}
                className="inline-flex min-h-[36px] w-full items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Compartilhar no LinkedIn
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleNativeShare}
                  disabled={!verifyUrl}
                  className="min-h-[36px] rounded-md border border-slate-200 px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Outros aplicativos
                </button>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  disabled={!verifyUrl}
                  className="min-h-[36px] rounded-md border border-slate-200 px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {copied ? 'Link copiado' : 'Copiar link'}
                </button>
              </div>
              {!verifyUrl && <p className="text-center text-[11px] text-slate-500">Link de verificação indisponível.</p>}
            </div>
          ) : (
            <Link
              href={resolveActionUrl(achievement.action)}
              onClick={onClose}
              className="inline-flex min-h-[36px] w-full items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
            >
              {resolveActionLabel(achievement.action)}
            </Link>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
