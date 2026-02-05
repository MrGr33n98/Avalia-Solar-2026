'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Facebook, Linkedin, Twitter, Share2, Link as LinkIcon, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { track } from '@/lib/analytics/lazy';

interface ShareButtonsProps {
  title: string;
  slug: string;
}

export default function ShareButtons({ title, slug }: ShareButtonsProps) {
  const [url, setUrl] = React.useState('');

  React.useEffect(() => {
    setUrl(`${window.location.origin}/blog/${slug}`);
  }, [slug]);

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(title + ' ' + url)}`
  };

  const handleShare = (platform: string) => {
    track('blog_share_click', {
      post_id: slug,
      post_title: title,
      platform: platform,
      element_type: 'button',
      action_type: 'click'
    });

    if (platform === 'copy') {
      navigator.clipboard.writeText(url);
      toast.success('Link copiado para a área de transferência!');
      return;
    }

    const shareUrl = shareLinks[platform as keyof typeof shareLinks];
    if (shareUrl) {
      window.open(shareUrl, '_blank');
    }
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
