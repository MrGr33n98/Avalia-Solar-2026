'use client';

import React from 'react';
import { PublicationFeedCard } from './PublicationFeedCard';
import { ReviewFeedCard } from './ReviewFeedCard';
import { GroupPostFeedCard } from './GroupPostFeedCard';
import { FeedItem } from '@/types/feed';

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
    default:
      return null;
  }
}
