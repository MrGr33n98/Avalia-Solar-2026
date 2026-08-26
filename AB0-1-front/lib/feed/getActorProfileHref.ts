import { FeedItem } from '@/types/feed';

export function getActorProfileHref(actor: FeedItem['actor']): string | null {
  if (!actor.slug) return null;
  
  if (actor.type === 'company') {
    return `/companies/${actor.slug}`;
  }
  
  return `/creators/${actor.slug}`;
}
