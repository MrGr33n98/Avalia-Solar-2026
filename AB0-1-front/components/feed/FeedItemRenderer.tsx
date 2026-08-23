'use client';

import React from 'react';
import { PublicationFeedCard } from './PublicationFeedCard';
import { ReviewFeedCard } from './ReviewFeedCard';
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
    default:
      return null;
  }
}
