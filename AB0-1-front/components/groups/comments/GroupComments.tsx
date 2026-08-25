'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getComments, postComment, deleteComment, createReport } from '@/lib/api/feed';
import { GroupCommentComposer } from './GroupCommentComposer';
import { GroupCommentItem } from './GroupCommentItem';
import { GroupCommentSkeleton } from './GroupCommentSkeleton';
import { GroupCommentsEmpty } from './GroupCommentsEmpty';
import { useToast } from '@/hooks/use-toast';
import { CommentItem } from '@/types/feed';

interface GroupCommentsProps {
  postId: number;
  canModerateGroup?: boolean;
}

export function GroupComments({ postId, canModerateGroup = false }: GroupCommentsProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const queryKey = ['comments', 'GroupPost', postId];

  // Fetch comments
  const { data: comments, isLoading, isError } = useQuery<CommentItem[]>({
    queryKey,
    queryFn: () => getComments('GroupPost', postId),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  // Post comment mutation
  const postCommentMutation = useMutation({
    mutationFn: ({ body, parentId }: { body: string; parentId?: number }) =>
      postComment('GroupPost', postId, body, parentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['groups'] }); // Invalidate feed caches
    },
    onError: () => {
      toast({
        title: 'Erro ao comentar',
        description: 'Não foi possível publicar seu comentário. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: number) => deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast({
        title: 'Comentário removido',
        description: 'O comentário foi removido com sucesso.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro ao remover',
        description: 'Não foi possível remover o comentário.',
        variant: 'destructive',
      });
    },
  });

  // Report comment mutation
  const reportCommentMutation = useMutation({
    mutationFn: ({ commentId, reason }: { commentId: number; reason: string }) =>
      createReport('Comment', commentId, reason),
    onSuccess: () => {
      toast({
        title: 'Denúncia enviada',
        description: 'Agradecemos sua colaboração. A moderação irá analisar o comentário.',
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

  const handleCreateComment = async (body: string) => {
    await postCommentMutation.mutateAsync({ body });
  };

  const handleCreateReply = async (parentId: number, body: string) => {
    await postCommentMutation.mutateAsync({ body, parentId });
  };

  const handleDelete = async (commentId: number) => {
    await deleteCommentMutation.mutateAsync(commentId);
  };

  const handleReport = async (commentId: number, reason: string) => {
    await reportCommentMutation.mutateAsync({ commentId, reason });
  };

  return (
    <div className="space-y-3 pt-3 border-t border-slate-100 mt-3">
      {/* List Comments */}
      {isLoading && <GroupCommentSkeleton />}

      {isError && (
        <p className="text-xs text-slate-500 font-medium text-center py-4">
          Não foi possível carregar os comentários. Tente novamente.
        </p>
      )}

      {!isLoading && !isError && (
        <>
          {comments && comments.length > 0 ? (
            <div className="divide-y divide-slate-100/50">
              {comments.map((comment) => (
                <GroupCommentItem
                  key={comment.id}
                  comment={comment}
                  canModerateGroup={canModerateGroup}
                  onDelete={handleDelete}
                  onReport={handleReport}
                  onReply={handleCreateReply}
                />
              ))}
            </div>
          ) : (
            <GroupCommentsEmpty />
          )}
        </>
      )}

      {/* Write Comment Composer */}
      <GroupCommentComposer
        onSubmit={handleCreateComment}
        isSubmitting={postCommentMutation.isPending}
      />
    </div>
  );
}
