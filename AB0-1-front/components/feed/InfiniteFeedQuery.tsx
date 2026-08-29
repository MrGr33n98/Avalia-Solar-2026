'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { getFeed } from '@/lib/api/feed';
import { FeedItemRenderer } from './FeedItemRenderer';
import { FeedCardSkeleton } from './FeedCardSkeleton';
import { useFeedStore } from '@/store/feedStore';
import { track } from '@/lib/analytics/lazy';

export function InfiniteFeedQuery({ view, type, initialFeed }: { view: string; type?: string; initialFeed?: import('@/types/feed').FeedResponse | null }) {
  const optimisticItems = useFeedStore((state) => state.items.filter((item) => item.id.startsWith('feed_optimistic_')));
  const setTrendingTopics = useFeedStore((state) => state.setTrendingTopics);
  const setSuggestions = useFeedStore((state) => state.setSuggestions);
  const suggestedCreators = useFeedStore((state) => state.suggestedCreators);
  const suggestedCompanies = useFeedStore((state) => state.suggestedCompanies);
  const suggestedGroups = useFeedStore((state) => state.suggestedGroups);
  const sentinel = useRef<HTMLDivElement>(null);
  const query = useInfiniteQuery({
    queryKey: ['feed', view, type],
    initialPageParam: null as string | null,
    initialData: initialFeed ? { pages: [initialFeed], pageParams: [null] } : undefined,
    queryFn: ({ pageParam }) => getFeed({ view, type, cursor: pageParam || undefined, limit: 15 }),
    getNextPageParam: (lastPage) => lastPage.meta?.has_more ? lastPage.meta.next_cursor : undefined,
  });

  const trendingTopics = query.data?.pages[0]?.meta?.trending_topics;
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query;
  useEffect(() => {
    if (trendingTopics) setTrendingTopics(trendingTopics);
  }, [trendingTopics, setTrendingTopics]);
  useEffect(() => {
    const meta = query.data?.pages[0]?.meta;
    if (meta) setSuggestions(meta.suggested_creators || [], meta.suggested_companies || [], meta.suggested_groups || []);
  }, [query.data, setSuggestions]);

  useEffect(() => {
    if (!sentinel.current || !hasNextPage) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !isFetchingNextPage) void fetchNextPage();
    }, { rootMargin: '600px', threshold: 0 });
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const items = useMemo(() => {
    const all = query.data?.pages.flatMap((page) => page.data || []) || [];
    const seen = new Set<string>();
    return [...optimisticItems, ...all].filter((item) => !seen.has(item.id) && seen.add(item.id));
  }, [optimisticItems, query.data]);

  if (query.isPending) return <FeedCardSkeleton />;
  if (query.isError) return <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-center text-sm text-destructive"><p>Erro ao carregar o feed.</p><button type="button" onClick={() => void query.refetch()} className="mx-auto mt-3 flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-primary-foreground"><RefreshCw className="h-4 w-4" />Tentar novamente</button></div>;
  if (!items.length) return <div className="rounded-xl border border-border bg-card p-8 text-center"><Sparkles className="mx-auto mb-3 h-6 w-6 text-primary" /><p className="text-sm font-semibold">{view === 'following' ? 'Siga pessoas e empresas para montar seu feed.' : 'Sem publicações no momento.'}</p><div className="mt-4 flex flex-wrap justify-center gap-2">{suggestedCreators.slice(0, 3).map((item) => <Link key={`creator-${item.id}`} href={`/creators/${item.slug || item.id}`} className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-primary">{item.name}</Link>)}{suggestedCompanies.slice(0, 3).map((item) => <Link key={`company-${item.id}`} href={`/companies/${item.slug || item.id}`} className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-primary">{item.name}</Link>)}{suggestedGroups.slice(0, 3).map((item) => <Link key={`group-${item.id}`} href={`/groups/${item.slug || item.id}`} className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-primary">{item.name}</Link>)}</div><Link href="/companies" className="mt-4 inline-block text-sm font-semibold text-primary">Explorar empresas</Link></div>;

  const recommendations = [...suggestedCreators.slice(0, 1).map((item) => ({ label: 'Creator sugerido', name: item.name, href: `/creators/${item.slug || item.id}`, id: item.id })), ...suggestedCompanies.slice(0, 1).map((item) => ({ label: 'Empresa sugerida', name: item.name, href: `/companies/${item.slug || item.id}`, id: item.id }))];
  return <div className="space-y-4">{items.map((item, index) => <React.Fragment key={item.id}><FeedItemRenderer item={item} />{(index + 1) % 10 === 0 && recommendations.length > 0 && <RecommendationBlock recommendation={recommendations[0]} />}</React.Fragment>)}<div ref={sentinel} className="flex min-h-12 justify-center py-4">{query.isFetchingNextPage && <Loader2 className="h-4 w-4 animate-spin text-primary" />}</div></div>;
}

function RecommendationBlock({ recommendation }: { recommendation: { label: string; name: string; href: string; id: number } }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        track('feed_recommendation_impression', { recommendation_id: recommendation.id });
        observer.disconnect();
      }
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [recommendation.id]);
  return <div ref={ref} className="rounded-xl border border-primary/20 bg-primary/5 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-primary">{recommendation.label}</p><Link href={recommendation.href} onClick={() => track('feed_recommendation_clicked', { recommendation_id: recommendation.id })} className="mt-1 block text-sm font-bold hover:underline">{recommendation.name}</Link></div>;
}
