'use client';

import React from 'react';
import Link from 'next/link';
import { Building2 } from 'lucide-react';
import { FeedItem } from '@/types/feed';

import { FollowButton } from './FollowButton';
import { FeedCardActions } from './FeedCardActions';
import { FeedItemMenu } from './FeedItemMenu';
import { FeedCardFrame } from './FeedCardFrame';
import { AuthorIdentity } from './AuthorIdentity';

interface PublicationFeedCardProps {
  item: FeedItem;
}

export function PublicationFeedCard({ item }: PublicationFeedCardProps) {
  const { actor, subject, engagement } = item;

  return (
    <FeedCardFrame reason={item.recommendation_reason?.label} itemId={item.id} itemType={item.type}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <AuthorIdentity actor={actor} />

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
    </FeedCardFrame>
  );
}
