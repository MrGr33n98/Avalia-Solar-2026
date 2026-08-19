'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { getFeed } from '@/lib/api/feed';
import { FeedItem } from '@/types/feed';
import { FeedItemRenderer } from './FeedItemRenderer';
import { Loader2, Sparkles } from 'lucide-react';

interface InfiniteFeedProps {
  view: string;
}

export function InfiniteFeed({ view }: InfiniteFeedProps) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getFeed({ view, limit: 15 });
      setItems(res.data || []);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar o feed');
    } finally {
      setLoading(false);
    }
  }, [view]);

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
    return (
      <div className="bg-card text-card-foreground rounded-xl border border-border p-8 text-center space-y-3">
        <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto font-bold">
          <Sparkles className="h-6 w-6" />
        </div>
        <h3 className="font-semibold text-base">Sem publicações no momento</h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Siga mais creators e empresas ou seja o primeiro a compartilhar uma nova análise na rede!
        </p>
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
