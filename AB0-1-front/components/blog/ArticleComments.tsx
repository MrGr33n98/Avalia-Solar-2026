'use client';

import React from 'react';
import { track } from '@/lib/analytics/lazy';

declare global {
  interface Window {
    HYVOR_TALK_WEBSITE?: string;
    HYVOR_TALK_CONFIG?: Record<string, any>;
    HYVOR_TALK?: { reset?: () => void };
  }
}

interface ArticleCommentsProps {
  articleId: string | number;
  articleSlug: string;
  articleTitle: string;
}

const HYVOR_SITE_ID = process.env.NEXT_PUBLIC_HYVOR_SITE_ID;

export function ArticleComments({ articleId, articleSlug, articleTitle }: ArticleCommentsProps) {
  React.useEffect(() => {
    if (!HYVOR_SITE_ID) return;

    window.HYVOR_TALK_WEBSITE = HYVOR_SITE_ID;
    window.HYVOR_TALK_CONFIG = {
      url: window.location.href,
      id: String(articleId || articleSlug),
      title: articleTitle,
    };

    const existingScript = document.getElementById('hyvor-talk-script');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'hyvor-talk-script';
      script.src = 'https://talk.hyvor.com/web-api/embed.js';
      script.async = true;
      document.body.appendChild(script);
    } else if (window.HYVOR_TALK?.reset) {
      window.HYVOR_TALK.reset();
    }

    track('blog_comments_view', {
      post_id: articleId,
      post_slug: articleSlug,
      post_title: articleTitle,
      provider: 'hyvor'
    });
  }, [articleId, articleSlug, articleTitle]);

  if (!HYVOR_SITE_ID) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
        Comentários desativados. Configure `NEXT_PUBLIC_HYVOR_SITE_ID` para habilitar.
      </div>
    );
  }

  return <div id="hyvor-talk-view" className="mt-10" />;
}
