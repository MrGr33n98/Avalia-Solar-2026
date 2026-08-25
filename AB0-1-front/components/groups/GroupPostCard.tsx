'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Pin,
  PinOff,
  UserRound,
  MoreHorizontal,
  MessageSquare,
  ShieldAlert,
  Trash2,
  EyeOff,
  Lock,
  Unlock,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { GroupReactionButton } from './reactions/GroupReactionButton';
import { GroupComments } from './comments/GroupComments';
import { createReport } from '@/lib/api/feed';
import {
  pinGroupPost,
  unpinGroupPost,
  closeGroupPostComments,
  openGroupPostComments,
  hideGroupPost,
  deleteGroupPost,
} from '@/lib/api/groups';
import type { GroupPost } from '@/types/groups';

export function GroupPostCard({ post }: { post: GroupPost }) {
  const params = useParams();
  const slug = params.slug as string;
  const { user: currentUser, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showComments, setShowComments] = useState(false);

  const authorName = post.author.name || 'Membro da comunidade';
  const date = new Date(post.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const isAuthor = currentUser?.id === post.author.id;
  const canModerate = post.permissions.can_moderate;

  // Post Actions Mutations
  const pinMutation = useMutation({
    mutationFn: () => (post.pinned ? unpinGroupPost(slug, post.id) : pinGroupPost(slug, post.id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-posts', slug] });
      toast({
        title: post.pinned ? 'Discussão desafixada' : 'Discussão fixada',
        description: post.pinned
          ? 'A publicação não aparecerá mais no topo.'
          : 'A publicação agora está fixada no topo do feed.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro ao processar',
        description: 'Não foi possível alterar o status de fixação.',
        variant: 'destructive',
      });
    },
  });

  const commentsToggleMutation = useMutation({
    mutationFn: () =>
      post.comments_enabled ? closeGroupPostComments(slug, post.id) : openGroupPostComments(slug, post.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-posts', slug] });
      toast({
        title: post.comments_enabled ? 'Comentários desativados' : 'Comentários ativados',
        description: post.comments_enabled
          ? 'Nenhum membro poderá enviar novos comentários nesta publicação.'
          : 'Os membros agora podem comentar nesta publicação.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro ao processar',
        description: 'Não foi possível alterar a configuração de comentários.',
        variant: 'destructive',
      });
    },
  });

  const hideMutation = useMutation({
    mutationFn: () => hideGroupPost(slug, post.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-posts', slug] });
      toast({
        title: 'Publicação ocultada',
        description: 'A publicação foi ocultada com sucesso do feed.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro ao ocultar',
        description: 'Não foi possível ocultar a publicação.',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteGroupPost(slug, post.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-posts', slug] });
      toast({
        title: 'Publicação excluída',
        description: 'A publicação foi removida com sucesso.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível remover a publicação.',
        variant: 'destructive',
      });
    },
  });

  const reportMutation = useMutation({
    mutationFn: (reason: string) => createReport('GroupPost', post.id, reason),
    onSuccess: () => {
      toast({
        title: 'Denúncia enviada',
        description: 'Agradecemos sua colaboração. A moderação irá analisar a publicação.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro ao denunciar',
        description: 'Não foi possível enviar a denúncia. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  return (
    <article
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4"
      aria-labelledby={post.title ? `post-${post.id}-title` : undefined}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-slate-500">
            {post.author.avatar_url ? (
              <Image
                src={post.author.avatar_url}
                alt=""
                width={40}
                height={40}
                className="h-full w-full object-cover"
              />
            ) : (
              <UserRound className="h-5 w-5" aria-hidden="true" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-slate-900">
              <span>{authorName}</span>
              {post.pinned && (
                <Pin className="h-3.5 w-3.5 text-blue-700 fill-blue-50 shrink-0" aria-label="Publicação fixada" />
              )}
            </p>
            <p className="text-xs text-slate-500">
              {date}
              {post.topic && (
                <>
                  {' '}
                  ·{' '}
                  <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full text-[10px]">
                    {post.topic.name}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Dropdown context menu for actions */}
        {(canModerate || isAuthor || (isAuthenticated && !isAuthor)) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 rounded-xl">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-xs w-48">
              {canModerate && (
                <>
                  <DropdownMenuItem onClick={() => pinMutation.mutate()} className="cursor-pointer font-medium">
                    {post.pinned ? (
                      <>
                        <PinOff className="h-3.5 w-3.5 mr-2 text-slate-500" />
                        Desafixar do topo
                      </>
                    ) : (
                      <>
                        <Pin className="h-3.5 w-3.5 mr-2 text-slate-500" />
                        Fixar no topo
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => commentsToggleMutation.mutate()} className="cursor-pointer font-medium">
                    {post.comments_enabled ? (
                      <>
                        <Lock className="h-3.5 w-3.5 mr-2 text-slate-500" />
                        Desativar comentários
                      </>
                    ) : (
                      <>
                        <Unlock className="h-3.5 w-3.5 mr-2 text-slate-500" />
                        Ativar comentários
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => hideMutation.mutate()} className="cursor-pointer font-medium">
                    <EyeOff className="h-3.5 w-3.5 mr-2 text-slate-500" />
                    Ocultar publicação
                  </DropdownMenuItem>
                  <hr className="my-1 border-slate-100" />
                </>
              )}

              {(isAuthor || canModerate) && (
                <DropdownMenuItem onClick={() => deleteMutation.mutate()} className="text-destructive font-semibold cursor-pointer">
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  Excluir publicação
                </DropdownMenuItem>
              )}

              {isAuthenticated && !isAuthor && (
                <DropdownMenuItem onClick={() => reportMutation.mutate('inappropriate')} className="cursor-pointer font-medium">
                  <ShieldAlert className="h-3.5 w-3.5 mr-2 text-slate-500" />
                  Denunciar publicação
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </header>

      <div>
        {post.title && <h3 id={`post-${post.id}-title`} className="text-base font-bold text-slate-950">{post.title}</h3>}
        <p className="mt-2.5 whitespace-pre-wrap text-sm leading-6 text-slate-700">{post.body}</p>
      </div>

      {/* Engagement Stats summary */}
      <div className="flex items-center justify-between text-slate-400 text-[11px] font-medium py-1 px-0.5 border-b border-slate-50">
        <span>{post.stats?.reactions_count || 0} curtidas</span>
        <button onClick={() => setShowComments(!showComments)} className="hover:underline hover:text-slate-600 transition-colors">
          {post.stats?.comments_count || 0} comentários
        </button>
      </div>

      {/* Engagement Actions Row */}
      <div className="flex items-center gap-3">
        <GroupReactionButton
          postId={post.id}
          initialReacted={post.viewer?.reacted || false}
          initialReactionsCount={post.stats?.reactions_count || 0}
        />
        <button
          onClick={() => setShowComments(!showComments)}
          disabled={!post.comments_enabled && (post.stats?.comments_count || 0) === 0}
          className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-all min-h-[44px] min-w-[100px]"
        >
          <MessageSquare className="h-4 w-4 shrink-0" />
          <span>Comentar</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <GroupComments postId={post.id} canModerateGroup={canModerate} />
      )}
    </article>
  );
}

export function GroupPostSkeleton() {
  return (
    <div className="h-48 animate-pulse rounded-2xl border border-slate-200 bg-white p-5">
      <div className="h-10 w-10 rounded-full bg-slate-200" />
      <div className="mt-5 h-4 w-1/3 rounded bg-slate-200" />
      <div className="mt-4 space-y-2">
        <div className="h-3 rounded bg-slate-100" />
        <div className="h-3 w-5/6 rounded bg-slate-100" />
      </div>
    </div>
  );
}

export function GroupPostEmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <h3 className="text-lg font-bold text-slate-950">Nenhuma discussão publicada</h3>
      <p className="mt-2 text-sm text-slate-600">Seja o primeiro a compartilhar uma ideia com a comunidade.</p>
    </div>
  );
}