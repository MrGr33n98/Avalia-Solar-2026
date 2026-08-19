'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ThumbsUp, MessageSquare, Bookmark, Share2, Building2, CheckCircle2, UserPlus, UserCheck } from 'lucide-react';
import { FeedItem } from '@/types/feed';
import { toggleReaction, toggleSave, toggleFollow } from '@/lib/api/feed';

interface PublicationFeedCardProps {
  item: FeedItem;
}

export function PublicationFeedCard({ item }: PublicationFeedCardProps) {
  const { actor, subject, engagement } = item;

  const [usefulCount, setUsefulCount] = useState(engagement.reactions_count || 0);
  const [isUseful, setIsUseful] = useState(engagement.viewer_reaction === 'useful');
  const [isSaved, setIsSaved] = useState(engagement.saved);
  const [isFollowing, setIsFollowing] = useState(false);

  const handleUseful = async () => {
    const nextUseful = !isUseful;
    setIsUseful(nextUseful);
    setUsefulCount((prev) => (nextUseful ? prev + 1 : Math.max(0, prev - 1)));

    try {
      await toggleReaction('ReviewerPublication', subject.id, isUseful);
    } catch {
      setIsUseful(isUseful);
      setUsefulCount(engagement.reactions_count || 0);
    }
  };

  const handleSave = async () => {
    const nextSave = !isSaved;
    setIsSaved(nextSave);

    try {
      await toggleSave('ReviewerPublication', subject.id, isSaved);
    } catch {
      setIsSaved(isSaved);
    }
  };

  const handleFollow = async () => {
    if (!actor.id) return;
    const nextFollow = !isFollowing;
    setIsFollowing(nextFollow);

    try {
      await toggleFollow(actor.type === 'user' ? 'ReviewerProfile' : 'Company', actor.id, isFollowing);
    } catch {
      setIsFollowing(isFollowing);
    }
  };

  return (
    <article className="bg-card text-card-foreground rounded-xl border border-border p-4 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary border border-primary/20 flex-shrink-0">
            {actor.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-semibold text-sm">
              <span>{actor.name}</span>
              {actor.verified && <CheckCircle2 className="h-4 w-4 text-emerald-500 fill-emerald-500/20" />}
            </div>
            <p className="text-xs text-muted-foreground">{actor.headline || 'Creator Especialista'}</p>
          </div>
        </div>

        <button
          onClick={handleFollow}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
            isFollowing
              ? 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
              : 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20'
          }`}
        >
          {isFollowing ? <UserCheck className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
          <span>{isFollowing ? 'Seguindo' : 'Seguir'}</span>
        </button>
      </div>

      {/* Title & Body Excerpt */}
      <div className="space-y-2">
        {subject.title && (
          <h2 className="font-bold text-base hover:text-primary transition-colors leading-snug">
            <Link href={`/posts/${subject.slug || subject.id}`}>{subject.title}</Link>
          </h2>
        )}
        <p className="text-sm text-foreground/90 leading-relaxed line-clamp-3">
          {subject.excerpt || subject.body?.substring(0, 200)}
        </p>
      </div>

      {/* Entity Card Badge if present */}
      {item.entities && item.entities.length > 0 && (
        <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50 flex items-center gap-2 text-xs">
          <Building2 className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">Empresa citada:</span>
          <span className="font-semibold text-foreground">{item.entities[0].entity.name}</span>
        </div>
      )}

      {/* Engagement Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs font-medium text-muted-foreground">
        <button
          onClick={handleUseful}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors ${
            isUseful ? 'text-primary bg-primary/10 font-bold' : 'hover:bg-muted hover:text-foreground'
          }`}
        >
          <ThumbsUp className="h-4 w-4" />
          <span>Útil ({usefulCount})</span>
        </button>

        <Link
          href={`/posts/${subject.slug || subject.id}`}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-muted hover:text-foreground transition-colors"
        >
          <MessageSquare className="h-4 w-4" />
          <span>Comentários ({engagement.comments_count || 0})</span>
        </Link>

        <button
          onClick={handleSave}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors ${
            isSaved ? 'text-amber-600 bg-amber-500/10 font-bold' : 'hover:bg-muted hover:text-foreground'
          }`}
        >
          <Bookmark className="h-4 w-4" />
          <span>{isSaved ? 'Salvo' : 'Salvar'}</span>
        </button>
      </div>
    </article>
  );
}
