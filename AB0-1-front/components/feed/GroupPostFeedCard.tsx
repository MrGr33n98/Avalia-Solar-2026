'use client';
import Link from 'next/link';
import { Users } from 'lucide-react';
import type { FeedItem } from '@/types/feed';
import { FollowButton } from './FollowButton';
import { FeedCardActions } from './FeedCardActions';
import { FeedItemMenu } from './FeedItemMenu';
import { FeedCardFrame } from './FeedCardFrame';
import { AuthorIdentity } from './AuthorIdentity';
import { getActorProfileHref } from '@/lib/feed/getActorProfileHref';

export function GroupPostFeedCard({ item }: { item: FeedItem }) {
  const { actor, subject, engagement } = item;
  const href = subject.group?.slug ? `/groups/${subject.group.slug}` : '/groups';
  const actorHref = getActorProfileHref(actor);

  return (
    <FeedCardFrame reason={item.recommendation_reason?.label} itemId={item.id} itemType={item.type}>
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <AuthorIdentity actor={actor} />
          <div>
            {actorHref ? (
              <Link href={actorHref} className="text-sm font-semibold hover:underline hover:text-primary transition-colors">
                {actor.name}
              </Link>
            ) : (
              <p className="text-sm font-semibold">{actor.name}</p>
            )}
            <Link href={href} className="flex items-center gap-1 text-xs text-primary hover:underline">
              <Users className="h-3.5 w-3.5" />
              {subject.group?.name || 'Comunidade'}
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <FollowButton target={actor.followable} initialFollowing={engagement.viewer_following} />
          <FeedItemMenu item={item} />
        </div>
      </header>
      
      <div className="space-y-2">
        {subject.title && <h2 className="text-base font-bold">{subject.title}</h2>}
        <p className="whitespace-pre-line text-sm leading-relaxed">{subject.body}</p>
        {subject.topic && <span className="inline-flex rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">{subject.topic.name}</span>}
      </div>
      
      <FeedCardActions item={item} />
    </FeedCardFrame>
  );
}
