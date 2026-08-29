'use client';

import React from 'react';
import { PublicationFeedCard } from './PublicationFeedCard';
import { ReviewFeedCard } from './ReviewFeedCard';
import { GroupPostFeedCard } from './GroupPostFeedCard';
import { FeedItem } from '@/types/feed';
import { FeedCardFrame } from './FeedCardFrame';
import { FeedCardActions } from './FeedCardActions';
import { NewsFeedCard } from './NewsFeedCard';
import { PollFeedCard } from './PollFeedCard';

interface FeedItemRendererProps {
  item: FeedItem;
}

export function FeedItemRenderer({ item }: FeedItemRendererProps) {
  switch (item.type) {
    case 'reviewer_publication':
      return <PublicationFeedCard item={item} />;
    case 'review':
      return <ReviewFeedCard item={item} />;
    case 'group_post':
      return <GroupPostFeedCard item={item} />;
    case 'news':
    case 'news_item':
      return <NewsFeedCard item={item} />;
    case 'poll':
      return <PollFeedCard item={item} />;
    case 'company_update':
      return <GenericFeedCard item={item} />;
    default:
      return null;
  }
}

function GenericFeedCard({ item }: FeedItemRendererProps) {
  const { subject, actor } = item;
  return (
    <FeedCardFrame reason={item.recommendation_reason?.label} itemId={item.id} itemType={item.type}>
      <header className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
          {(actor.name || actor.display_name || 'A').slice(0, 1).toUpperCase()}
        </div>
        <div><p className="text-sm font-semibold">{actor.name || actor.display_name || 'Avalia Solar'}</p><p className="text-xs text-muted-foreground">{item.type.replaceAll('_', ' ')}</p></div>
      </header>
      {subject.title && <h2 className="text-base font-bold">{subject.title}</h2>}
      {subject.body && <p className="whitespace-pre-line text-sm leading-relaxed">{subject.body}</p>}
      <FeedCardActions item={item} />
    </FeedCardFrame>
  );
}
