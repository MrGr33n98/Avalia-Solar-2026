'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { getFeed } from '@/lib/api/feed';
import { FeedItem } from '@/types/feed';
import { FeedItemRenderer } from './FeedItemRenderer';
import { Loader2, Sparkles } from 'lucide-react';

import { useFeedStore } from '@/store/feedStore';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface InfiniteFeedProps {
  view: string;
}

export function InfiniteFeed({ view }: InfiniteFeedProps) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { reviewerProfile } = useAuth();
  const setTrendingTopics = useFeedStore((state) => state.setTrendingTopics);

  const isCreator = reviewerProfile?.creator_enabled;

  const fetchInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getFeed({ view, limit: 15 });
      setItems(res.data || []);
      if (res.meta?.trending_topics) {
        setTrendingTopics(res.meta.trending_topics);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar o feed');
    } finally {
      setLoading(false);
    }
  }, [view, setTrendingTopics]);

  useEffect(() => {
    fetchInitial();
  }, [fetchInitial]);

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
    const handleFocusComposer = () => {
      const el = document.getElementById('feed-composer-textarea');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
    };

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
              onClick={handleFocusComposer}
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
    </div>
  );
}
