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
import {
  CheckCircle2,
  Lock,
  Share2,
  Linkedin,
  Copy,
  Check,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
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
    (typeof window !== 'undefined'
      ? `${window.location.origin}/conquistas/verificar/${achievement.share?.token || ''}`
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
        className="sm:max-w-md p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800"
        aria-describedby="achievement-modal-description"
      >
        <DialogHeader className="items-center text-center pb-2">
          {/* Top Badge Tier & Points */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 uppercase tracking-wider">
              {achievement.category}
            </span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              +{achievement.xp > 0 ? achievement.xp : achievement.points || 50} XP
            </span>
          </div>

          {/* Large Image */}
          <div className="relative my-3 w-32 h-32 flex items-center justify-center">
            <Image
              src={assetSrc}
              alt={`Selo ${achievement.name}`}
              width={128}
              height={128}
              className={cn(
                'object-contain drop-shadow-md',
                !isUnlocked && 'grayscale opacity-60 contrast-125'
              )}
            />
          </div>

          <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white mt-2">
            {achievement.name}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Detalhes e requisitos para desbloquear a conquista {achievement.name}
          </DialogDescription>

          {/* Status Label */}
          <div className="mt-1 flex items-center justify-center gap-1.5 text-xs">
            {isUnlocked ? (
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                Desbloqueado em {formatDate(achievement.unlocked_at)}
              </span>
            ) : isInProgress ? (
              <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                Progresso: {achievement.progress} de {achievement.threshold}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-medium text-slate-500 dark:text-slate-400">
                <Lock className="w-3.5 h-3.5" />
                Bloqueado — Conclua o requisito abaixo
              </span>
            )}
          </div>
        </DialogHeader>

        {/* Description & Requirement */}
        <div id="achievement-modal-description" className="my-3 space-y-3 text-sm text-slate-600 dark:text-slate-300 text-center">
          <p className="leading-relaxed">{achievement.description}</p>

          {!isUnlocked && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs text-left">
              <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-1">
                Como desbloquear:
              </span>
              <p className="text-slate-600 dark:text-slate-400">
                {achievement.subtitle || achievement.description}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
          {isUnlocked ? (
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleLinkedInShare}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-[#0A66C2] hover:bg-[#084e96] transition-colors shadow-sm"
              >
                <Linkedin className="w-4 h-4" />
                <span>Compartilhar no LinkedIn</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70 ml-1" />
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Outros apps</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600 font-semibold">Link copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar link</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <Link
              href={resolveActionUrl(achievement.action)}
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
            >
              <span>{resolveActionLabel(achievement.action)}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
