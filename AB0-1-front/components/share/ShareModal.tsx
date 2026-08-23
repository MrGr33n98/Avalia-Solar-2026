'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SharePreview } from './SharePreview';
import { SharePlatformGrid } from './SharePlatformGrid';
import { buildAttributedUrl, buildPlatformShareUrl } from '@/lib/share/buildShareUrl';
import { trackShare } from '@/lib/share/shareAnalytics';
import type { ShareContext, SharePlatform, ShareResource } from '@/lib/share/shareTypes';
import type { ShareFormat } from '@/lib/share/shareTypes';
import { SocialFormatSelector } from './SocialFormatSelector';
import { InstagramFeedTemplate } from '@/components/social-templates/InstagramFeedTemplate';
import { InstagramStoryTemplate } from '@/components/social-templates/InstagramStoryTemplate';
import { LinkedInTemplate } from '@/components/social-templates/LinkedInTemplate';
import { XTemplate } from '@/components/social-templates/XTemplate';
import { OpenGraphTemplate } from '@/components/social-templates/OpenGraphTemplate';
import { CopyLinkRow } from './CopyLinkRow';

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource: ShareResource;
  context: ShareContext;
}

const SHARE_ASSET_FORMATS = new Set(['feed', 'story', 'card', 'og']);

export function ShareModal({ open, onOpenChange, resource, context }: ShareModalProps) {
  const [completed, setCompleted] = useState<SharePlatform | null>(null);
  const [working, setWorking] = useState(false);
  const [format, setFormat] = useState<ShareFormat>(context.format || 'link');

  const template = (() => {
    switch (format) {
      case 'feed': return <InstagramFeedTemplate resource={resource} />;
      case 'story': return <InstagramStoryTemplate resource={resource} />;
      case 'card': return <LinkedInTemplate resource={resource} />;
      case 'og': return <OpenGraphTemplate resource={resource} />;
      default: return null;
    }
  })();

  const selectPlatform = async (platform: SharePlatform) => {
    if (working) return;
    setWorking(true);
    const shareUrl = buildAttributedUrl(resource, platform, format);
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
      trackShare(resource, trackedPlatform, { ...context, format });
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
        <CopyLinkRow url={buildAttributedUrl(resource, 'copy', format)} />
        <SocialFormatSelector value={format} onChange={setFormat} />
        {SHARE_ASSET_FORMATS.has(format) && template ? <div className="max-w-full overflow-auto rounded-xl bg-slate-100 p-2">{template}</div> : null}
        <SharePlatformGrid onSelect={(target) => void selectPlatform(target.platform)} completed={completed} />
      </DialogContent>
    </Dialog>
  );
}
