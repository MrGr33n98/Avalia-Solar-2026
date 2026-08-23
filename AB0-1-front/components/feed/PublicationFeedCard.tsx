'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ThumbsUp,
  MessageSquare,
  Bookmark,
  Share2,
  Building2,
  CheckCircle2,
  UserPlus,
  UserCheck,
  Loader2,
} from 'lucide-react';
import { FeedItem, CommentItem } from '@/types/feed';
import { toggleReaction, toggleSave, toggleFollow, getComments, postComment } from '@/lib/api/feed';
import { toast } from 'sonner';

import { UserAvatar } from '@/components/ui/UserAvatar';

interface PublicationFeedCardProps {
  item: FeedItem;
}

export function PublicationFeedCard({ item }: PublicationFeedCardProps) {
  const { actor, subject, engagement } = item;

  const [usefulCount, setUsefulCount] = useState(engagement.reactions_count || 0);
  const [isUseful, setIsUseful] = useState(engagement.viewer_reaction === 'useful');
  const [isSaved, setIsSaved] = useState(engagement.saved);
  const [isFollowing, setIsFollowing] = useState(false);

  // Comments states
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newCommentBody, setNewCommentBody] = useState('');
  const [commentsCount, setCommentsCount] = useState(engagement.comments_count || 0);
  const [submittingComment, setSubmittingComment] = useState(false);

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

  const handleShare = async () => {
    const url = actor.slug
      ? `${window.location.origin}/creators/${actor.slug}/posts/${subject.slug || subject.id}`
      : `${window.location.origin}/posts/${subject.slug || subject.id}`;
    if (navigator.share) {
      await navigator.share({ title: subject.title || 'Publicação Avalia Solar', url });
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.success('Link copiado.');
  };

  const handleFollow = async () => {
    if (!actor.id) return;
    const nextFollow = !isFollowing;
    setIsFollowing(nextFollow);

    try {
      await toggleFollow(
        actor.type === 'user' ? 'ReviewerProfile' : 'Company',
        actor.id,
        isFollowing
      );
    } catch {
      setIsFollowing(isFollowing);
    }
  };

  const toggleComments = async () => {
    const nextShow = !showComments;
    setShowComments(nextShow);
    if (nextShow && comments.length === 0) {
      setCommentsLoading(true);
      try {
        const data = await getComments('ReviewerPublication', subject.id);
        setComments(data || []);
      } catch {
        toast.error('Erro ao carregar comentários');
      } finally {
        setCommentsLoading(false);
      }
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentBody.trim() || submittingComment) return;
    setSubmittingComment(true);
    try {
      const created = await postComment('ReviewerPublication', subject.id, newCommentBody.trim());
      setComments((prev) => [created, ...prev]);
      setCommentsCount((prev) => prev + 1);
      setNewCommentBody('');
      toast.success('Comentário publicado com sucesso!');
    } catch {
      toast.error('Erro ao publicar comentário');
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <article className="bg-card text-card-foreground rounded-xl border border-border p-4 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {actor.type === 'user' && actor.slug ? (
            <Link href={`/creators/${actor.slug}`}>
              <UserAvatar
                src={actor.avatar_url}
                name={actor.name}
                size="md"
                className="cursor-pointer hover:opacity-90 transition-opacity"
              />
            </Link>
          ) : (
            <UserAvatar src={actor.avatar_url} name={actor.name} size="md" />
          )}
          <div>
            <div className="flex items-center gap-1.5 font-semibold text-sm text-foreground">
              {actor.type === 'user' && actor.slug ? (
                <Link
                  href={`/creators/${actor.slug}`}
                  className="hover:underline hover:text-primary transition-colors"
                >
                  {actor.name}
                </Link>
              ) : (
                <span>{actor.name}</span>
              )}
              {actor.verified && (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 fill-emerald-500/20" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {actor.headline || 'Creator Especialista'}
            </p>
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
          {isFollowing ? (
            <UserCheck className="h-3.5 w-3.5" />
          ) : (
            <UserPlus className="h-3.5 w-3.5" />
          )}
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
            isUseful
              ? 'text-primary bg-primary/10 font-bold'
              : 'hover:bg-muted hover:text-foreground'
          }`}
        >
          <ThumbsUp className="h-4 w-4" />
          <span>Útil ({usefulCount})</span>
        </button>

        <button
          onClick={toggleComments}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors ${
            showComments
              ? 'text-primary bg-primary/10 font-bold'
              : 'hover:bg-muted hover:text-foreground'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          <span>Comentários ({commentsCount})</span>
        </button>

        <button
          onClick={handleSave}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors ${
            isSaved
              ? 'text-amber-600 bg-amber-500/10 font-bold'
              : 'hover:bg-muted hover:text-foreground'
          }`}
        >
          <Bookmark className="h-4 w-4" />
          <span>{isSaved ? 'Salvo' : 'Salvar'}</span>
        </button>
        <button
          onClick={() => void handleShare()}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-colors hover:bg-muted hover:text-foreground"
        >
          <Share2 className="h-4 w-4" />
          <span>Compartilhar</span>
        </button>
      </div>

      {/* Inline Comments Section */}
      {showComments && (
        <div className="pt-3 border-t border-border/60 space-y-4">
          {/* New Comment Input Form */}
          <form onSubmit={handleSubmitComment} className="flex gap-2 items-start">
            <div className="flex-1">
              <textarea
                value={newCommentBody}
                onChange={(e) => setNewCommentBody(e.target.value)}
                placeholder="Escreva um comentário ou análise..."
                disabled={submittingComment}
                rows={2}
                className="w-full text-xs p-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none placeholder:text-muted-foreground/75"
              />
            </div>
            <button
              type="submit"
              disabled={submittingComment || !newCommentBody.trim()}
              className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary/95 disabled:bg-muted disabled:text-muted-foreground rounded-lg transition-colors shadow-sm h-[40px] shrink-0"
            >
              {submittingComment ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                'Publicar'
              )}
            </button>
          </form>

          {/* Comments List */}
          <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
            {commentsLoading ? (
              <div className="flex items-center justify-center py-6 text-muted-foreground text-xs gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                <span>Carregando comentários...</span>
              </div>
            ) : comments.length === 0 ? (
              <p className="text-center py-6 text-xs text-muted-foreground leading-relaxed">
                Nenhum comentário ainda. Seja o primeiro a opinar!
              </p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-2.5 text-xs bg-muted/30 p-2.5 rounded-lg border border-border/40">
                  <UserAvatar name={comment.user.name} size="sm" className="mt-0.5 shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground text-xs">{comment.user.name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(comment.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed text-xs">{comment.body}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </article>
  );
}
