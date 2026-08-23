'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { getFeed } from '@/lib/api/feed';
import { FeedItemRenderer } from './FeedItemRenderer';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { useFeedStore } from '@/store/feedStore';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface InfiniteFeedProps {
  view: string;
}

export function InfiniteFeed({ view }: InfiniteFeedProps) {
  const items = useFeedStore((state) => state.items);
  const setItems = useFeedStore((state) => state.setItems);
  const openComposer = useFeedStore((state) => state.openComposer);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { reviewerProfile } = useAuth();
  const setTrendingTopics = useFeedStore((state) => state.setTrendingTopics);

  const isCreator = reviewerProfile?.creator_enabled;

  const fetchInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNextCursor(null);
    setHasMore(false);
    try {
      const res = await getFeed({ view, limit: 15 });
      const incomingItems = res.data || [];
      const existingItems = useFeedStore.getState().items;
      const incomingIds = new Set(incomingItems.map((item) => item.id));
      const incomingSubjectIds = new Set(
        incomingItems
          .filter((item) => item.type === 'reviewer_publication')
          .map((item) => item.subject.id)
      );
      const optimisticItems = existingItems.filter(
        (item) =>
          item.id.startsWith('feed_optimistic_') &&
          !incomingIds.has(item.id) &&
          !incomingSubjectIds.has(item.subject.id)
      );
      setItems([...optimisticItems, ...incomingItems]);
      setNextCursor(res.meta?.next_cursor || null);
      setHasMore(!!res.meta?.has_more);
      if (res.meta?.trending_topics) {
        setTrendingTopics(res.meta.trending_topics);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar o feed');
    } finally {
      setLoading(false);
    }
  }, [view, setTrendingTopics, setItems]);

  const fetchMore = useCallback(async () => {
    if (loadingMore || !hasMore || !nextCursor) return;
    setLoadingMore(true);
    try {
      const res = await getFeed({ view, cursor: nextCursor, limit: 15 });
      const newItems = res.data || [];
      
      // Update store items by appending and deduplicating
      const currentItems = useFeedStore.getState().items;
      const existingIds = new Set(currentItems.map((item) => item.id));
      const uniqueNewItems = newItems.filter((item) => !existingIds.has(item.id));
      setItems([...currentItems, ...uniqueNewItems]);
      
      setNextCursor(res.meta?.next_cursor || null);
      setHasMore(!!res.meta?.has_more);
    } catch {
      toast.error('Erro ao carregar mais publicações');
    } finally {
      setLoadingMore(false);
    }
  }, [view, nextCursor, hasMore, loadingMore, setItems]);

  useEffect(() => {
    fetchInitial();
  }, [fetchInitial]);

  // IntersectionObserver for infinite scrolling
  useEffect(() => {
    if (!hasMore || loading || loadingMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          void fetchMore();
        }
      },
      { threshold: 0.1 }
    );
    const target = document.getElementById('feed-infinite-scroll-anchor');
    if (target) observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, fetchMore]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="text-sm font-medium">Carregando feed de conhecimento...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-xl p-4 text-center text-sm font-medium">
        {error}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-card text-card-foreground rounded-xl border border-border p-8 text-center space-y-4 shadow-sm">
        <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto font-bold">
          <Sparkles className="h-6 w-6" />
        </div>
        <div className="space-y-1.5">
          <h3 className="font-semibold text-base">Sem publicações no momento</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            {isCreator
              ? 'Ainda não há conteúdo no seu feed. Compartilhe suas análises de mercado, novidades ou dicas de energia solar com a comunidade!'
              : 'Seu feed está vazio. Siga mais creators, empresas do setor solar ou comece avaliando uma empresa que você conhece!'}
          </p>
        </div>
        <div className="pt-2">
          {isCreator ? (
            <button
              onClick={openComposer}
              className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary/95 rounded-lg transition-colors shadow-sm"
            >
              Criar minha primeira publicação
            </button>
          ) : (
            <Link
              href="/companies"
              className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary/95 rounded-lg transition-colors shadow-sm"
            >
              Explorar e Avaliar Empresas
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <FeedItemRenderer key={item.id} item={item} />
      ))}
      {hasMore && (
        <div id="feed-infinite-scroll-anchor" className="flex justify-center py-6">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>Carregando mais conteúdo...</span>
          </div>
        </div>
      )}
    </div>
  );
}
