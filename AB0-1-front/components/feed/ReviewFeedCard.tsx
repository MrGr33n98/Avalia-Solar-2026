'use client';

import React from 'react';
import Link from 'next/link';
import { Star, Building2, CheckCircle2 } from 'lucide-react';
import { FeedItem } from '@/types/feed';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { FollowButton } from './FollowButton';
import { FeedCardActions } from './FeedCardActions';
import { FeedItemMenu } from './FeedItemMenu';
import { getActorProfileHref } from '@/lib/feed/getActorProfileHref';

interface ReviewFeedCardProps {
  item: FeedItem;
}

export function ReviewFeedCard({ item }: ReviewFeedCardProps) {
  const { actor, subject, engagement } = item;
  const actorHref = getActorProfileHref(actor);

  return (
    <article className="bg-card text-card-foreground rounded-xl border border-border p-4 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {actorHref ? (
            <Link href={actorHref}>
              <UserAvatar
                src={actor.avatar_url}
                name={actor.name}
                size="md"
                className="cursor-pointer hover:opacity-90 transition-opacity"
              />
            </Link>
          ) : (
            <UserAvatar src={actor.avatar_url} name={actor.name} size="md" />
          )}
          <div>
            <div className="flex items-center gap-1.5 font-semibold text-sm text-foreground">
              {actorHref ? (
                <Link
                  href={actorHref}
                  className="hover:underline hover:text-primary transition-colors"
                >
                  {actor.name}
                </Link>
              ) : (
                <span>{actor.name}</span>
              )}
              {actor.verified && (
                <CheckCircle2 className="h-4 w-4 text-primary fill-primary/10 flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">{actor.headline || 'Membro'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <FollowButton target={actor.followable} initialFollowing={engagement.viewer_following} />
          <FeedItemMenu item={item} />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <div className="flex items-center gap-1 text-amber-500">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < Math.floor(subject.rating || 0) ? 'fill-amber-500' : 'text-border'
              }`}
            />
          ))}
          <span className="text-xs text-muted-foreground ml-1">{subject.rating} de 5</span>
        </div>

        {subject.headline && (
          <h3 className="font-semibold text-base text-foreground leading-snug">
            &ldquo;{subject.headline}&rdquo;
          </h3>
        )}

        <p className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed">
          {subject.comment}
        </p>
      </div>

      {/* Company Reference Panel */}
      {subject.company && (
        <Link
          href={`/companies/${subject.company.slug || ''}`}
          className="bg-muted/40 rounded-lg p-3 flex items-center justify-between border border-border/40 hover:bg-muted/60 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded bg-white flex items-center justify-center border border-border flex-shrink-0 overflow-hidden">
              {subject.company.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={subject.company.logo_url}
                  alt={subject.company.name}
                  className="h-full w-full object-contain"
                />
              ) : (
                <Building2 className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <h4 className="font-semibold text-sm">{subject.company.name}</h4>
              <p className="text-xs text-muted-foreground">
                {subject.company.category_name || 'Empresa avaliada'}
              </p>
            </div>
          </div>
          {subject.company.rating && (
            <div className="flex items-center gap-1 text-amber-500 font-semibold text-sm">
              <Star className="h-4 w-4 fill-amber-500" />
              <span>{Number(subject.company.rating).toFixed(1)}</span>
            </div>
          )}
        </Link>
      )}
      
      <FeedCardActions item={item} />
    </article>
  );
}
