'use client';

import React, { useState } from 'react';
import {
  ThumbsUp,
  MessageSquare,
  Bookmark,
  Share2,
  Loader2,
} from 'lucide-react';
import { FeedItem, CommentItem } from '@/types/feed';
import { toggleReaction, toggleSave, getComments, postComment } from '@/lib/api/feed';
import { toast } from 'sonner';

import { UserAvatar } from '@/components/ui/UserAvatar';
import { ShareModal } from '@/components/share/ShareModal';

interface FeedCardActionsProps {
  item: FeedItem;
}

export function FeedCardActions({ item }: FeedCardActionsProps) {
  const { actor, subject, engagement } = item;

  const [usefulCount, setUsefulCount] = useState(engagement.reactions_count || 0);
  const [isUseful, setIsUseful] = useState(engagement.viewer_reaction === 'useful');
  const [isSaved, setIsSaved] = useState(engagement.saved);

  // Comments states
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newCommentBody, setNewCommentBody] = useState('');
  const [commentsCount, setCommentsCount] = useState(engagement.comments_count || 0);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  // Infer the correct model name for API calls
  const getModelName = () => {
    switch (item.type) {
      case 'reviewer_publication':
        return 'ReviewerPublication';
      case 'review':
        return 'Review';
      case 'group_post':
        return 'GroupPost';
      default:
        return 'ReviewerPublication'; // fallback
    }
  };

  const handleUseful = async () => {
    const nextUseful = !isUseful;
    setIsUseful(nextUseful);
    setUsefulCount((prev) => (nextUseful ? prev + 1 : Math.max(0, prev - 1)));

    try {
      await toggleReaction(getModelName(), subject.id, isUseful);
    } catch {
      setIsUseful(isUseful);
      setUsefulCount(engagement.reactions_count || 0);
      toast.error('Não foi possível registrar como útil. Tentar novamente.', {
        action: { label: 'Tentar', onClick: handleUseful }
      });
    }
  };

  const handleSave = async () => {
    const nextSave = !isSaved;
    setIsSaved(nextSave);

    try {
      await toggleSave(getModelName(), subject.id, isSaved);
      if (nextSave) {
        toast.success('Salvo em "Itens salvos"');
      }
    } catch {
      setIsSaved(isSaved);
      toast.error('Erro ao salvar item.');
    }
  };

  const toggleComments = async () => {
    const nextShow = !showComments;
    setShowComments(nextShow);
    if (nextShow && comments.length === 0) {
      setCommentsLoading(true);
      try {
        const data = await getComments(getModelName(), subject.id);
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
      const created = await postComment(getModelName(), subject.id, newCommentBody.trim());
      setComments((prev) => [...prev, created]);
      setCommentsCount((prev) => prev + 1);
      setNewCommentBody('');
      toast.success('Comentário publicado com sucesso!');
    } catch {
      toast.error('Erro ao publicar comentário');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Determine canonical url for sharing
  const shareCanonicalUrl = () => {
    if (item.type === 'reviewer_publication' && actor.slug && subject.slug) {
      return `/creators/${actor.slug}/posts/${subject.slug}`;
    }
    if (item.type === 'review' && subject.company?.slug) {
      return `/companies/${subject.company.slug}`;
    }
    if (item.type === 'group_post' && subject.group?.slug) {
      return `/groups/${subject.group.slug}/posts/${subject.id}`;
    }
    return `/posts/${subject.id}`; // default
  };

  return (
    <>
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

        {subject.comments_enabled !== false && (
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
        )}

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
          onClick={() => setShareOpen(true)}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-colors hover:bg-muted hover:text-foreground"
        >
          <Share2 className="h-4 w-4" />
          <span>Compartilhar</span>
        </button>
      </div>

      <ShareModal
        open={shareOpen}
        onOpenChange={setShareOpen}
        resource={{
          resourceType: (item.type === 'reviewer_publication' ? 'publication' : item.type) as import('@/lib/share/shareTypes').ShareResourceType,
          resourceId: subject.id,
          title: subject.title || subject.headline || 'Conteúdo Avalia Solar',
          description: subject.excerpt || subject.comment || subject.body,
          imageUrl: subject.cover_image_url,
          canonicalUrl: shareCanonicalUrl(),
          author: { name: actor.name, avatarUrl: actor.avatar_url || undefined },
        }}
        context={{ placement: 'feed', format: 'feed' }}
      />

      {showComments && subject.comments_enabled !== false && (
        <div className="pt-3 border-t border-border/60 space-y-4">
          <form onSubmit={handleSubmitComment} className="flex flex-col sm:flex-row gap-2 items-start w-full">
            <div className="w-full flex-1">
              <textarea
                value={newCommentBody}
                onChange={(e) => setNewCommentBody(e.target.value)}
                placeholder="Escreva um comentário ou análise..."
                disabled={submittingComment}
                rows={2}
                className="w-full min-h-[44px] text-xs p-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none placeholder:text-muted-foreground/75"
              />
            </div>
            <button
              type="submit"
              disabled={submittingComment || !newCommentBody.trim()}
              className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary/95 disabled:bg-muted disabled:text-muted-foreground rounded-lg transition-colors shadow-sm h-[40px] w-full sm:w-auto shrink-0"
            >
              {submittingComment ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                'Publicar'
              )}
            </button>
          </form>

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
                  <UserAvatar src={comment.user.avatar_url} name={comment.user.name} size="sm" className="mt-0.5 shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground text-xs">{comment.user.name}</span>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            setNewCommentBody(`@${comment.user.name} `);
                            // Focus textarea would go here, maybe ref
                          }}
                          className="text-[10px] text-primary hover:underline"
                        >
                          Responder
                        </button>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(comment.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                    <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed text-xs">{comment.body}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}
