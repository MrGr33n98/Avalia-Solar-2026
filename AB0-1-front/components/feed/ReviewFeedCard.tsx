'use client';

import React from 'react';
import Link from 'next/link';
import { Star, Building2 } from 'lucide-react';
import { FeedItem } from '@/types/feed';
import { FollowButton } from './FollowButton';
import { FeedCardActions } from './FeedCardActions';
import { FeedItemMenu } from './FeedItemMenu';
import { FeedCardFrame } from './FeedCardFrame';
import { AuthorIdentity } from './AuthorIdentity';

interface ReviewFeedCardProps {
  item: FeedItem;
}

export function ReviewFeedCard({ item }: ReviewFeedCardProps) {
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
    </FeedCardFrame>
  );
}
