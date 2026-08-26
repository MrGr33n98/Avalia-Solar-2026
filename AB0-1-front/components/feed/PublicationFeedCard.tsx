'use client';

import React from 'react';
import Link from 'next/link';
import {
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { FeedItem } from '@/types/feed';

import { UserAvatar } from '@/components/ui/UserAvatar';
import { FollowButton } from './FollowButton';
import { FeedCardActions } from './FeedCardActions';
import { FeedItemMenu } from './FeedItemMenu';

interface PublicationFeedCardProps {
  item: FeedItem;
}

export function PublicationFeedCard({ item }: PublicationFeedCardProps) {
  const { actor, subject, engagement } = item;

  return (
    <article className="bg-card text-card-foreground rounded-xl border border-border p-4 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {actor.type !== 'company' && actor.slug ? (
            <Link href={`/creators/${actor.slug}`}>
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
              {actor.type !== 'company' && actor.slug ? (
                <Link
                  href={`/creators/${actor.slug}`}
                  className="hover:underline hover:text-primary transition-colors"
                >
                  {actor.name}
                </Link>
              ) : (
                <span>{actor.name}</span>
              )}
              {actor.verified && (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 fill-emerald-500/20" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {actor.headline || 'Creator Especialista'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <FollowButton target={actor.followable} initialFollowing={engagement.viewer_following} />
          <FeedItemMenu item={item} />
        </div>
      </div>

      {/* Title & Body Excerpt */}
      <div className="space-y-2">
        {subject.title && (
          <h2 className="font-bold text-base hover:text-primary transition-colors leading-snug">
            <Link href={`/posts/${subject.slug || subject.id}`}>{subject.title}</Link>
          </h2>
        )}
        <p className="text-sm text-foreground/90 leading-relaxed line-clamp-3">
          {subject.excerpt || subject.body?.substring(0, 200)}
        </p>
      </div>

      {/* Entity Card Badge if present */}
      {item.entities && item.entities.length > 0 && (
        <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50 flex items-center gap-2 text-xs">
          <Building2 className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">Empresa citada:</span>
          <span className="font-semibold text-foreground">{item.entities[0].entity.name}</span>
        </div>
      )}

      <FeedCardActions item={item} />
    </article>
  );
}
