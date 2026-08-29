'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import type { FeedItem } from '@/types/feed';
import { FeedCardFrame } from './FeedCardFrame';
import { FeedCardActions } from './FeedCardActions';
import { track } from '@/lib/analytics/lazy';

export function NewsFeedCard({ item }: { item: FeedItem }) {
  const subject = item.subject;
  const cardRef = useRef<HTMLDivElement>(null);
  const open = () => track('news_open', { feed_item_id: item.id, subject_id: subject.id, subject_type: item.type, actor_id: item.actor.id, view: item.ranking_metadata?.mode });
  const impression = () => track('news_impression', { feed_item_id: item.id, subject_id: subject.id, subject_type: item.type, actor_id: item.actor.id, view: item.ranking_metadata?.mode });
  useEffect(() => {
    if (!cardRef.current) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { impression(); observer.disconnect(); } }, { threshold: 0.5 });
    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [item.id]);
  return <FeedCardFrame reason={item.recommendation_reason?.label} itemId={item.id} itemType={item.type}>
    <div ref={cardRef}>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Avalia Solar Notícias</p>
      <p className="mt-2 text-xs text-muted-foreground">{subject.category || 'Energia'} · {subject.reading_time_minutes || 3} min de leitura</p>
      <h2 className="mt-2 text-xl font-bold tracking-tight">{subject.title}</h2>
      {subject.excerpt && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{subject.excerpt}</p>}
      {subject.source_url && <Link href={subject.source_url} target="_blank" rel="noreferrer" onClick={open} className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline">Entenda o impacto →</Link>}
    </div>
    <FeedCardActions item={item} />
  </FeedCardFrame>;
}
