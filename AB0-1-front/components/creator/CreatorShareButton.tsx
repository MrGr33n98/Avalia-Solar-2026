'use client';

import { Share2 } from 'lucide-react';
import { useState } from 'react';
import { ShareModal } from '@/components/share/ShareModal';
import type { ShareContext, ShareResourceType } from '@/lib/share/shareTypes';

export function CreatorShareButton({
  creatorSlug,
  title = 'Perfil no Avalia Solar',
  resourceType = 'creator',
  canonicalUrl,
  context = { placement: 'creator_profile', format: 'link' },
}: {
  creatorSlug: string;
  title?: string;
  resourceType?: Extract<ShareResourceType, 'creator' | 'publication'>;
  canonicalUrl?: string;
  context?: ShareContext;
}) {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" onClick={() => setOpen(true)} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" aria-label="Compartilhar perfil"><Share2 className="h-4 w-4" aria-hidden="true" />Compartilhar</button>
    <ShareModal
      open={open}
      onOpenChange={setOpen}
      resource={{ resourceType, resourceId: creatorSlug, title, canonicalUrl: canonicalUrl || `/creators/${creatorSlug}` }}
      context={context}
    />
  </>;
}
