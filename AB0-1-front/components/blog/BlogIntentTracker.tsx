'use client';

import { useBlogIntentTracking } from '@/lib/analytics/hooks/useIntentTracking';

interface BlogIntentTrackerProps {
  articleId?: number | string;
  articleSlug?: string;
}

/**
 * Tracker de intenção para páginas de blog.
 * Cobre: exit_intent, share_intent, idle_return.
 * Renderiza null — apenas efeitos colaterais.
 *
 * Uso:
 *   - Artigo: <BlogIntentTracker articleId={article.id} articleSlug={articleSlug} />
 *   - Listagem: <BlogIntentTracker /> (sem props — usa 'blog' como id)
 */
export function BlogIntentTracker({ articleId, articleSlug }: BlogIntentTrackerProps) {
  // O hook ativa os listeners automaticamente na montagem
  useBlogIntentTracking(articleId, {
    metadata: { article_slug: articleSlug },
  });

  return null;
}
