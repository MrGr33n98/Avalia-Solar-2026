'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Image as ImageIcon, FileText, Link2, MoreHorizontal, Sparkles, User, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { reviewerPublicationsApi } from '@/lib/api/reviewerPublications';
import { useFeedStore } from '@/store/feedStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UserAvatar } from '@/components/ui/UserAvatar';
import type { FeedItem } from '@/types/feed';

interface FeedComposerDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FeedComposerDialog({ isOpen, onClose }: FeedComposerDialogProps) {
  const { user, reviewerProfile } = useAuth();
  const prependPublication = useFeedStore((state) => state.prependPublication);

  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [body]);

  const isCreator = reviewerProfile?.creator_enabled === true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;

    setSubmitting(true);
    setError(null);

    // Derive title from first line
    const title = body.split('\n')[0].substring(0, 80).trim() || 'Nova publicação';

    try {
      // 1. Create publication (draft by default)
      const draft = await reviewerPublicationsApi.create({
        title,
        body,
        publication_type: 'tip',
      });

      // 2. Publish publication
      const published = await reviewerPublicationsApi.publish(draft.id);

      // 3. Map to FeedItem contract. Backend projection remains source of truth;
      // reload reconciles this optimistic item with GET /feed.
      const feedItem: FeedItem = {
        id: `feed_optimistic_reviewer_publication_${published.id}`,
        type: 'reviewer_publication',
        verb: 'publish',
        published_at: published.published_at || published.created_at || new Date().toISOString(),
        actor: {
          id: user?.id || 0,
          type: 'user',
          name: user?.name || 'Membro',
          avatar_url: user?.avatar_url || null,
          headline:
            reviewerProfile?.public_headline ||
            reviewerProfile?.profession ||
            'Creator Especialista',
          slug: reviewerProfile?.public_slug || null,
        },
        subject: {
          id: published.id,
          title: published.title,
          slug: published.slug,
          excerpt: published.excerpt || '',
          body: published.body,
          publication_type: published.publication_type,
          category: published.category,
          cover_image_url: published.cover_image?.url || undefined,
        },
        entities: [],
        engagement: {
          reactions_count: 0,
          comments_count: 0,
          viewer_reaction: null,
          saved: false,
        },
      };

      // 4. Prepend to feed
      prependPublication(feedItem);

      // 5. Success cleanup
      toast.success('Publicação criada. Seu conteúdo já está disponível para a comunidade.');
      setBody('');
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setError('Não foi possível publicar. Tentar novamente.');
      toast.error('Erro ao publicar');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full h-full sm:h-auto sm:max-w-[580px] p-0 flex flex-col justify-between sm:justify-start gap-0 translate-x-0 translate-y-0 left-0 top-0 sm:left-[50%] sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] rounded-none sm:rounded-2xl bg-white overflow-hidden shadow-2xl border border-slate-200">
        <DialogHeader className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <DialogTitle className="text-lg font-bold text-slate-900">
            {!user ? 'Entrar na conta' : !isCreator ? 'Torne-se Creator' : 'Criar publicação'}
          </DialogTitle>
        </DialogHeader>

        {/* Not authenticated state */}
        {!user && (
          <div className="flex-1 p-8 text-center space-y-4 flex flex-col justify-center items-center">
            <div className="h-14 w-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
              <User className="h-7 w-7" />
            </div>
            <div className="space-y-1.5 max-w-sm">
              <h3 className="font-bold text-lg text-slate-900">Entre na sua conta</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Você precisa estar conectado para poder publicar e interagir no feed da comunidade
                solar.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/login"
                onClick={onClose}
                className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm active:scale-95"
              >
                Entrar ou Registrar-se
              </Link>
            </div>
          </div>
        )}

        {/* Authenticated but not creator state */}
        {user && !isCreator && (
          <div className="flex-1 p-8 text-center space-y-4 flex flex-col justify-center items-center">
            <div className="h-14 w-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm">
              <Sparkles className="h-7 w-7" />
            </div>
            <div className="space-y-1.5 max-w-sm">
              <h3 className="font-bold text-lg text-slate-900">Torne-se um Creator</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Ative seu perfil de Creator para publicar artigos, novidades e compartilhar sua
                experiência técnica com toda a comunidade solar.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/review-dashboard/profile"
                onClick={onClose}
                className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm active:scale-95"
              >
                Ativar perfil de Creator
              </Link>
            </div>
          </div>
        )}

        {/* Regular composer state */}
        {user && isCreator && (
          <form
            onSubmit={handleSubmit}
            className="flex-1 flex flex-col justify-between sm:justify-start"
          >
            <div className="p-6 space-y-4 flex-1 overflow-y-auto max-h-[calc(100vh-220px)] sm:max-h-[380px]">
              {/* Identity Header */}
              <div className="flex items-center gap-3">
                <UserAvatar src={user.avatar_url} name={user.name} size="md" />
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-slate-900 truncate">{user.name}</h4>
                  <p className="text-xs text-muted-foreground truncate">
                    {reviewerProfile?.public_headline || reviewerProfile?.profession || 'Creator'}
                  </p>
                </div>
              </div>

              {/* Error messages */}
              {error && (
                <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-xl p-3 text-xs font-semibold">
                  {error}
                </div>
              )}

              {/* Text Input */}
              <textarea
                ref={textareaRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="No que você está pensando?"
                className="w-full text-slate-850 text-base placeholder-slate-400 border-0 focus:ring-0 p-0 outline-none resize-none min-h-[140px] focus:outline-none"
                disabled={submitting}
                aria-label="Conteúdo da publicação"
                autoFocus
              />
            </div>

            {/* Footer actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-1 text-slate-500">
                <button
                  type="button"
                  className="p-2 rounded-lg hover:bg-slate-100 hover:text-slate-700 transition-colors"
                  title="Adicionar imagem"
                  onClick={() =>
                    toast.info('Funcionalidade de imagem disponível no editor completo')
                  }
                >
                  <ImageIcon className="h-5 w-5 text-slate-500" />
                </button>
                <button
                  type="button"
                  className="p-2 rounded-lg hover:bg-slate-100 hover:text-slate-700 transition-colors"
                  title="Adicionar documento"
                  onClick={() =>
                    toast.info('Funcionalidade de documento disponível no editor completo')
                  }
                >
                  <FileText className="h-5 w-5 text-slate-500" />
                </button>
                <button
                  type="button"
                  className="p-2 rounded-lg hover:bg-slate-100 hover:text-slate-700 transition-colors"
                  title="Inserir link"
                  onClick={() => toast.info('Insira links diretamente na caixa de texto')}
                >
                  <Link2 className="h-5 w-5 text-slate-500" />
                </button>
                <button
                  type="button"
                  className="p-2 rounded-lg hover:bg-slate-100 hover:text-slate-700 transition-colors"
                  title="Mais opções"
                >
                  <MoreHorizontal className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              <button
                type="submit"
                disabled={submitting || !body.trim()}
                className="inline-flex min-h-10 items-center justify-center px-5 py-2 text-sm font-semibold rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                    <span>Publicando...</span>
                  </>
                ) : (
                  <span>Publicar</span>
                )}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
