'use client';

import React from 'react';
import Link from 'next/link';
import { User, Bookmark, ThumbsUp, MessageSquare, Building2, Users, FileText, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function FeedLeftRail() {
  const { user } = useAuth();

  return (
    <aside className="space-y-4">
      {/* Profile Card */}
      <div className="bg-card text-card-foreground rounded-xl border border-border p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg border border-primary/20">
            {user?.name?.[0]?.toUpperCase() || <User className="h-6 w-6" />}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm truncate">{user?.name || 'Visitante'}</h3>
            <p className="text-xs text-muted-foreground truncate">{user?.email || 'Membro Avalia Solar'}</p>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-border/60 grid grid-cols-2 text-center text-xs">
          <div>
            <span className="block font-semibold text-sm">0</span>
            <span className="text-muted-foreground">Seguidores</span>
          </div>
          <div>
            <span className="block font-semibold text-sm">0</span>
            <span className="text-muted-foreground">Seguindo</span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="bg-card text-card-foreground rounded-xl border border-border p-2 shadow-sm space-y-1 text-sm font-medium">
        <Link href="/feed" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary font-semibold">
          <FileText className="h-4 w-4" />
          <span>Feed Principal</span>
        </Link>
        <Link href="/review-dashboard/publications" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <Building2 className="h-4 w-4" />
          <span>Minhas Publicações</span>
        </Link>
        <Link href="/feed?view=saved" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <Bookmark className="h-4 w-4" />
          <span>Itens Salvos</span>
        </Link>
        <Link href="/creators" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <Users className="h-4 w-4" />
          <span>Creators da Rede</span>
        </Link>
      </nav>
    </aside>
  );
}
