'use client';

import React from 'react';
import Link from 'next/link';
import { PenSquare, Image, FileText, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function FeedComposer() {
  const { user } = useAuth();

  return (
    <div className="bg-card text-card-foreground rounded-xl border border-border p-4 shadow-sm space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary border border-primary/20 flex-shrink-0">
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <Link
          href="/review-dashboard/publications"
          className="flex-1 bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground text-sm font-medium px-4 py-2.5 rounded-full text-left transition-colors border border-border/40"
        >
          Compartilhe um artigo, análise ou novidade com a rede...
        </Link>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs font-medium text-muted-foreground">
        <Link href="/review-dashboard/publications" className="flex items-center gap-2 hover:text-primary transition-colors py-1 px-2 rounded-lg hover:bg-muted/50">
          <PenSquare className="h-4 w-4 text-emerald-500" />
          <span>Escrever Artigo</span>
        </Link>
        <Link href="/reviews/new" className="flex items-center gap-2 hover:text-primary transition-colors py-1 px-2 rounded-lg hover:bg-muted/50">
          <Star className="h-4 w-4 text-amber-500" />
          <span>Avaliar Empresa</span>
        </Link>
        <Link href="/review-dashboard/publications" className="flex items-center gap-2 hover:text-primary transition-colors py-1 px-2 rounded-lg hover:bg-muted/50">
          <FileText className="h-4 w-4 text-blue-500" />
          <span>Publicação Rápida</span>
        </Link>
      </div>
    </div>
  );
}
