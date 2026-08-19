import type { Review } from '@/lib/api';

export function getReviewAuthorHref(review: Review): string | null {
  const slug = review.user?.creator_slug?.trim();

  if (!slug) return null;

  return `/creators/${encodeURIComponent(slug)}`;
}
