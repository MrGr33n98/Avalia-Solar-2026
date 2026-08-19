'use client';

import React from 'react';
import Link from 'next/link';
import { PenSquare, Star, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useFeedStore } from '@/store/feedStore';
import { UserAvatar } from '@/components/ui/UserAvatar';

export function FeedComposer() {
  const { user } = useAuth();
  const openComposer = useFeedStore((state) => state.openComposer);

  return (
    <div className="bg-card text-card-foreground rounded-xl border border-border p-4 shadow-sm space-y-3">
      <div className="flex items-center gap-3">
        <UserAvatar src={user?.avatar_url} name={user?.name} size="md" />
        <button
          id="feed-composer-textarea"
          type="button"
          onClick={openComposer}
          className="flex-1 bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground text-sm font-medium px-4 py-2.5 rounded-full text-left transition-colors border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          Compartilhe um artigo, análise ou novidade com a rede...
        </button>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs font-medium text-muted-foreground">
        <Link
          href="/creator-studio/publications/new"
          className="flex items-center gap-2 hover:text-primary transition-colors py-1 px-2 rounded-lg hover:bg-muted/50"
        >
          <PenSquare className="h-4 w-4 text-emerald-500" />
          <span>Escrever Artigo</span>
        </Link>
        <Link
          href="/reviews/my"
          className="flex items-center gap-2 hover:text-primary transition-colors py-1 px-2 rounded-lg hover:bg-muted/50"
        >
          <Star className="h-4 w-4 text-amber-500" />
          <span>Avaliar Empresa</span>
        </Link>
        <button
          type="button"
          onClick={openComposer}
          className="flex items-center gap-2 hover:text-primary transition-colors py-1 px-2 rounded-lg hover:bg-muted/50"
        >
          <FileText className="h-4 w-4 text-blue-500" />
          <span>Publicação Rápida</span>
        </button>
      </div>
    </div>
  );
}
