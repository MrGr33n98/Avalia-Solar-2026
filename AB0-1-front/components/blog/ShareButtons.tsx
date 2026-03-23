'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Facebook, Linkedin, Twitter, Share2, Link as LinkIcon, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { track } from '@/lib/analytics/lazy';
import { buildArticleLink } from '@/lib/blog/article-links';

interface ShareButtonsProps {
  title: string;
  slug: string;
}

export default function ShareButtons({ title, slug }: ShareButtonsProps) {
  const handleShare = (platform: string) => {
    const link = buildArticleLink({
      slugOrId: slug,
      placement: 'share_button',
      source: platform,
      medium: platform === 'copy' ? 'internal' : 'social',
      campaign: 'blog_share',
      content: platform,
      term: slug,
      absolute: true
    });

    track('blog_social_share', {
      post_id: slug,
      post_title: title,
      platform: platform,
      element_type: 'button',
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

    if (shareUrl) window.open(shareUrl, '_blank');
  };

  return (
    <div className="flex flex-wrap items-center gap-2 my-6">
      <span className="text-sm font-medium text-slate-500 mr-2 flex items-center">
        <Share2 className="w-4 h-4 mr-2" />
        Compartilhar:
      </span>
      
      <Button variant="outline" size="icon" className="h-9 w-9 rounded-full hover:text-[#0077b5] hover:border-[#0077b5]" onClick={() => handleShare('linkedin')}>
        <Linkedin className="h-4 w-4" />
        <span className="sr-only">LinkedIn</span>
      </Button>

      <Button variant="outline" size="icon" className="h-9 w-9 rounded-full hover:text-[#1877f2] hover:border-[#1877f2]" onClick={() => handleShare('facebook')}>
        <Facebook className="h-4 w-4" />
        <span className="sr-only">Facebook</span>
      </Button>

      <Button variant="outline" size="icon" className="h-9 w-9 rounded-full hover:text-[#1da1f2] hover:border-[#1da1f2]" onClick={() => handleShare('twitter')}>
        <Twitter className="h-4 w-4" />
        <span className="sr-only">Twitter</span>
      </Button>

      <Button variant="outline" size="icon" className="h-9 w-9 rounded-full hover:text-[#25d366] hover:border-[#25d366]" onClick={() => handleShare('whatsapp')}>
        <MessageCircle className="h-4 w-4" />
        <span className="sr-only">WhatsApp</span>
      </Button>

      <Button variant="outline" size="icon" className="h-9 w-9 rounded-full hover:bg-slate-100" onClick={() => handleShare('copy')}>
        <LinkIcon className="h-4 w-4" />
        <span className="sr-only">Copiar Link</span>
      </Button>
    </div>
  );
}
