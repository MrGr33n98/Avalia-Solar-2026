'use client';

import React from 'react';
import { track } from '@/lib/analytics/lazy';

declare global {
  interface Window {
    DISQUS?: {
      reset: (args: { reload: boolean; config: () => void }) => void;
    };
    disqus_config?: () => void;
  }
}

interface ArticleCommentsProps {
  articleId: string | number;
  articleSlug: string;
  articleTitle: string;
}

const DISQUS_SHORTNAME = process.env.NEXT_PUBLIC_DISQUS_SHORTNAME;

export function ArticleComments({ articleId, articleSlug, articleTitle }: ArticleCommentsProps) {
  React.useEffect(() => {
    if (!DISQUS_SHORTNAME) return;

    window.disqus_config = function (this: any) {
      this.page.url = window.location.href;
      this.page.identifier = String(articleId || articleSlug);
      this.page.title = articleTitle;
    };

    const scriptId = 'disqus-embed-script';
    const existingScript = document.getElementById(scriptId);

    if (!existingScript) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://${DISQUS_SHORTNAME}.disqus.com/embed.js`;
      script.setAttribute('data-timestamp', new Date().getTime().toString());
      document.body.appendChild(script);
    } else if (window.DISQUS) {
      // Refresh disqus safely if script already loaded
      window.DISQUS.reset({
        reload: true,
        config: window.disqus_config,
      });
    }

    track('blog_comments_view', {
      post_id: articleId,
      post_slug: articleSlug,
      post_title: articleTitle,
      provider: 'disqus'
    });
  }, [articleId, articleSlug, articleTitle]);

  if (!DISQUS_SHORTNAME) {
    return null;
  }

  return <div id="disqus_thread" className="mt-10" />;
}
