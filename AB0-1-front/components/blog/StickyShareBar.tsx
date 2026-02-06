'use client';

import React from 'react';
import { Facebook, Linkedin, Twitter, Link as LinkIcon, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { track } from '@/lib/analytics/lazy';
import { buildArticleLink } from '@/lib/blog/article-links';

interface StickyShareBarProps {
  title: string;
  slug: string;
}

export function StickyShareBar({ title, slug }: StickyShareBarProps) {
  const handleShare = (platform: string) => {
    const link = buildArticleLink({
      slugOrId: slug,
      placement: 'sticky_share',
      source: platform,
      medium: platform === 'copy' ? 'internal' : 'social',
      campaign: 'blog_share',
      content: platform,
      term: slug,
      absolute: true
    });

    track('blog_share_click', {
      post_id: slug,
      post_title: title,
      platform: platform,
      element_type: 'sticky',
      action_type: 'click',
      link_url: link.url,
      ...link.utm
    });

    if (platform === 'copy') {
      navigator.clipboard.writeText(link.url);
      toast.success('Link copiado para a área de transferência!');
      return;
    }

    const shareUrl = (() => {
      switch (platform) {
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link.url)}`;
      case 'twitter':
        return `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(link.url)}`;
      case 'linkedin':
        return `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(link.url)}&title=${encodeURIComponent(title)}`;
      case 'whatsapp':
        return `https://api.whatsapp.com/send?text=${encodeURIComponent(title + ' ' + link.url)}`;
      default:
        return '';
      }
    })();

    if (shareUrl) {
      window.open(shareUrl, '_blank');
    }
  };

  return (
    <div className="hidden lg:flex flex-col gap-2 fixed left-6 top-1/2 -translate-y-1/2 z-40">
      <Button
        variant="outline"
        size="icon"
        className="h-10 w-10 rounded-full bg-white shadow-sm hover:text-[#0077b5] hover:border-[#0077b5]"
        onClick={() => handleShare('linkedin')}
        aria-label="Compartilhar no LinkedIn"
      >
        <Linkedin className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="h-10 w-10 rounded-full bg-white shadow-sm hover:text-[#1877f2] hover:border-[#1877f2]"
        onClick={() => handleShare('facebook')}
        aria-label="Compartilhar no Facebook"
      >
        <Facebook className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="h-10 w-10 rounded-full bg-white shadow-sm hover:text-[#1da1f2] hover:border-[#1da1f2]"
        onClick={() => handleShare('twitter')}
        aria-label="Compartilhar no X/Twitter"
      >
        <Twitter className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="h-10 w-10 rounded-full bg-white shadow-sm hover:text-[#25d366] hover:border-[#25d366]"
        onClick={() => handleShare('whatsapp')}
        aria-label="Compartilhar no WhatsApp"
      >
        <MessageCircle className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="h-10 w-10 rounded-full bg-white shadow-sm hover:bg-slate-50"
        onClick={() => handleShare('copy')}
        aria-label="Copiar link"
      >
        <LinkIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}
