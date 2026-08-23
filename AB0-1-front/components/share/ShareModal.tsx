'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SharePreview } from './SharePreview';
import { SharePlatformGrid } from './SharePlatformGrid';
import { buildAttributedUrl, buildPlatformShareUrl } from '@/lib/share/buildShareUrl';
import { trackShare } from '@/lib/share/shareAnalytics';
import type { ShareContext, SharePlatform, ShareResource } from '@/lib/share/shareTypes';

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource: ShareResource;
  context: ShareContext;
}

export function ShareModal({ open, onOpenChange, resource, context }: ShareModalProps) {
  const [completed, setCompleted] = useState<SharePlatform | null>(null);
  const [working, setWorking] = useState(false);

  const selectPlatform = async (platform: SharePlatform) => {
    if (working) return;
    setWorking(true);
    const shareUrl = buildAttributedUrl(resource, platform, context.format);
    try {
      let trackedPlatform = platform;
      if (platform === 'copy') {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copiado.');
      } else if (platform === 'instagram') {
        await navigator.clipboard.writeText(shareUrl);
        window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
        toast.success('Link copiado. Abra o Instagram para compartilhar.');
      } else if (platform === 'native_share' && navigator.share) {
        await navigator.share({ title: resource.title, text: resource.description, url: shareUrl });
      } else if (platform === 'native_share') {
        await navigator.clipboard.writeText(shareUrl);
        trackedPlatform = 'copy';
        toast.success('Link copiado.');
      } else {
        const targetUrl = buildPlatformShareUrl(platform, shareUrl, resource.title);
        if (targetUrl) window.open(targetUrl, '_blank', 'noopener,noreferrer');
      }
      trackShare(resource, trackedPlatform, context);
      setCompleted(trackedPlatform);
    } catch (error) {
      if ((error as DOMException)?.name !== 'AbortError') toast.error('Não foi possível compartilhar agora.');
    } finally {
      setWorking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Compartilhar</DialogTitle>
          <DialogDescription>Escolha onde distribuir este conteúdo.</DialogDescription>
        </DialogHeader>
        <SharePreview resource={resource} />
        <SharePlatformGrid onSelect={(target) => void selectPlatform(target.platform)} completed={completed} />
      </DialogContent>
    </Dialog>
  );
}
