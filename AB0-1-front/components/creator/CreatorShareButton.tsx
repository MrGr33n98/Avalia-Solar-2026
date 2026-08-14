'use client';

import { Share2 } from 'lucide-react';
import { toast } from 'sonner';

export function CreatorShareButton() {
  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: document.title, url });
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.success('Link do perfil copiado.');
  }
  return <button type="button" onClick={share} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" aria-label="Compartilhar perfil"><Share2 className="h-4 w-4" aria-hidden="true" />Compartilhar</button>;
}
