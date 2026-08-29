'use client';

import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import type { FeedActor } from '@/types/feed';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { getActorProfileHref } from '@/lib/feed/getActorProfileHref';

export function AuthorIdentity({ actor }: { actor: FeedActor }) {
  const href = getActorProfileHref(actor);
  const content = (
    <>
      <UserAvatar src={actor.avatar_url} name={actor.name} size="md" />
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 text-sm font-semibold">
          {actor.name}
          {actor.verified && <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />}
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {actor.headline || 'Membro'}
        </span>
      </span>
    </>
  );

  return href ? (
    <Link href={href} className="flex min-w-0 items-center gap-3 hover:opacity-90">
      {content}
    </Link>
  ) : (
    <div className="flex min-w-0 items-center gap-3">{content}</div>
  );
}
