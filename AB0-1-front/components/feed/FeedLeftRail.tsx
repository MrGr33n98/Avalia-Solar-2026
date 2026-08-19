'use client';

import React from 'react';
import Link from 'next/link';
import { User, Bookmark, ThumbsUp, MessageSquare, Building2, Users, FileText, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

import { UserAvatar } from '@/components/ui/UserAvatar';

export function FeedLeftRail() {
  const { user, reviewerProfile } = useAuth();

  const isCreator = reviewerProfile?.creator_enabled;
  const headline = reviewerProfile?.public_headline || reviewerProfile?.profession || (reviewerProfile?.public_slug ? `@${reviewerProfile.public_slug}` : null);
  const displaySubtitle = isCreator ? headline : (user?.email || 'Membro Avalia Solar');

  return (
    <aside className="space-y-4">
      {/* Profile Card */}
      <div className="bg-card text-card-foreground rounded-xl border border-border p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <UserAvatar
            src={user?.avatar_url}
            name={user?.name}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm truncate flex items-center gap-1">
              <span>{user?.name || 'Visitante'}</span>
              {isCreator && <CheckCircle2 className="h-4 w-4 text-emerald-500 fill-emerald-500/10 flex-shrink-0" />}
            </h3>
            <p className="text-xs text-muted-foreground truncate">{displaySubtitle}</p>
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

        {isCreator && reviewerProfile?.public_slug && (
          <div className="mt-3 pt-2.5 border-t border-border/60">
            <Link
              href={`/creators/${reviewerProfile.public_slug}`}
              className="block text-center text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              Ver meu perfil
            </Link>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="bg-card text-card-foreground rounded-xl border border-border p-2 shadow-sm space-y-1 text-sm font-medium">
        <Link href="/feed" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary font-semibold">
          <FileText className="h-4 w-4" />
          <span>Feed Principal</span>
        </Link>
        <Link href="/creator-studio/publications" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
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
