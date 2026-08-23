'use client';

import { Check, Copy, Facebook, Instagram, Linkedin, MessageCircle, Share2 } from 'lucide-react';
import { SHARE_TARGETS, type ShareTarget } from '@/lib/share/shareTargets';
import type { SharePlatform } from '@/lib/share/shareTypes';

const icons: Record<SharePlatform, typeof Instagram> = {
  instagram: Instagram,
  whatsapp: MessageCircle,
  linkedin: Linkedin,
  x: MessageCircle,
  facebook: Facebook,
  copy: Copy,
  native_share: Share2,
};

export function SharePlatformGrid({ onSelect, completed }: { onSelect: (target: ShareTarget) => void; completed?: SharePlatform | null }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {SHARE_TARGETS.map((target) => {
        const Icon = icons[target.platform];
        return (
          <button
            key={target.platform}
            type="button"
            onClick={() => onSelect(target)}
            className="flex min-h-14 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left transition hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white ${target.color}`}>
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-slate-900">{target.label}</span>
              <span className="block truncate text-[11px] text-slate-500">{completed === target.platform ? 'Concluído' : target.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
