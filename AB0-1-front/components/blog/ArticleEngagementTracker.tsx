'use client';

import * as React from 'react';
import { track } from '@/lib/analytics/lazy';

interface ArticleEngagementTrackerProps {
  articleId: number | string;
  articleSlug: string;
  articleTitle: string;
  categoryId?: number | string;
  categoryName?: string;
}

export function ArticleEngagementTracker({
  articleId,
  articleSlug,
  articleTitle,
  categoryId,
  categoryName
}: ArticleEngagementTrackerProps) {
  const startTime = React.useRef<number>(Date.now());
  const maxScroll = React.useRef<number>(0);
  const engaged = React.useRef<boolean>(false);
  const completed = React.useRef<boolean>(false);

  React.useEffect(() => {
    startTime.current = Date.now();
    maxScroll.current = 0;
    engaged.current = false;
    completed.current = false;

    const updateScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const scrollPercent = Math.min(100, Math.max(0, (window.scrollY / docHeight) * 100));
      if (scrollPercent > maxScroll.current) {
        maxScroll.current = scrollPercent;
      }

      if (!engaged.current && scrollPercent >= 50) {
        engaged.current = true;
        track('blog_engaged', {
          post_id: articleId,
          post_slug: articleSlug,
          post_title: articleTitle,
          category_id: categoryId,
          category_name: categoryName,
          engagement_type: 'scroll_50'
        });
      }

      if (!completed.current && scrollPercent >= 90) {
        completed.current = true;
        track('blog_read_complete', {
          post_id: articleId,
          post_slug: articleSlug,
          post_title: articleTitle,
          category_id: categoryId,
          category_name: categoryName,
          scroll_percentage: Math.round(scrollPercent)
        });
      }
    };

    const finalize = () => {
      const timeSeconds = Math.floor((Date.now() - startTime.current) / 1000);
      const bounce = !engaged.current && timeSeconds < 15 && maxScroll.current < 25;

      track('blog_session_end', {
        post_id: articleId,
        post_slug: articleSlug,
        post_title: articleTitle,
        category_id: categoryId,
        category_name: categoryName,
        time_seconds: timeSeconds,
        max_scroll_percentage: Math.round(maxScroll.current)
      });

      if (bounce) {
        track('blog_bounce', {
          post_id: articleId,
          post_slug: articleSlug,
          post_title: articleTitle,
          category_id: categoryId,
          category_name: categoryName,
          time_seconds: timeSeconds,
          max_scroll_percentage: Math.round(maxScroll.current)
        });
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') finalize();
    };

    const engagementTimer = window.setTimeout(() => {
      if (!engaged.current) {
        engaged.current = true;
        track('blog_engaged', {
          post_id: articleId,
          post_slug: articleSlug,
          post_title: articleTitle,
          category_id: categoryId,
          category_name: categoryName,
          engagement_type: 'time_30s'
        });
      }
    }, 30000);

    window.addEventListener('scroll', updateScroll, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', finalize);

    return () => {
      window.removeEventListener('scroll', updateScroll);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', finalize);
      window.clearTimeout(engagementTimer);
      finalize();
    };
  }, [articleId, articleSlug, articleTitle, categoryId, categoryName]);

  return null;
}
