'use client';

import React, { useState } from 'react';
import { MoreHorizontal, ShieldAlert, Trash2, ShieldX, Reply } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { UserAvatar } from '@/components/ui/UserAvatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { CommentItem } from '@/types/feed';

interface GroupCommentItemProps {
  comment: CommentItem;
  canModerateGroup?: boolean;
  onDelete: (id: number) => Promise<void>;
  onReport?: (id: number, reason: string) => Promise<void>;
  onReply?: (parentId: number, body: string) => Promise<void>;
}

export function GroupCommentItem({
  comment,
  canModerateGroup = false,
  onDelete,
  onReport,
  onReply,
}: GroupCommentItemProps) {
  const { user: currentUser } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const isOwnerOfComment = currentUser?.id === comment.user.id;
  const isDeleted = comment.status === 'deleted' || comment.status === 'hidden';

  const timeAgo = comment.created_at
    ? formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ptBR })
    : '';

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (replyBody.trim() === '' || !onReply) return;

    setIsSubmittingReply(true);
    try {
      await onReply(comment.id, replyBody);
      setReplyBody('');
      setShowReplyForm(false);
    } catch (error) {
      console.error('Failed to submit reply:', error);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  return (
    <div className="group/item flex gap-3 py-2.5">
      {/* User Avatar */}
      <UserAvatar
        name={isDeleted ? 'Membro' : comment.user.name}
        src={isDeleted ? null : null}
        className="h-8 w-8 shrink-0 border border-slate-200/50"
      />

      <div className="flex-1 min-w-0 space-y-1">
        {/* Comment Bubble & Header */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl px-3.5 py-2.5 relative">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold text-slate-800">
                {isDeleted ? 'Membro' : comment.user.name}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                {timeAgo}
              </span>
            </div>

            {/* Actions Menu */}
            {!isDeleted && (isOwnerOfComment || canModerateGroup || onReport) && (
              <div className="opacity-0 group-hover/item:opacity-100 focus-within:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-600 rounded-lg">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="text-xs">
                    {isOwnerOfComment && (
                      <DropdownMenuItem onClick={() => onDelete(comment.id)} className="text-destructive font-medium cursor-pointer">
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        Excluir comentário
                      </DropdownMenuItem>
                    )}
                    {canModerateGroup && !isOwnerOfComment && (
                      <DropdownMenuItem onClick={() => onDelete(comment.id)} className="text-destructive font-medium cursor-pointer">
                        <ShieldX className="h-3.5 w-3.5 mr-2" />
                        Remover comentário
                      </DropdownMenuItem>
                    )}
                    {onReport && !isOwnerOfComment && (
                      <DropdownMenuItem onClick={() => onReport(comment.id, 'inappropriate')} className="cursor-pointer">
                        <ShieldAlert className="h-3.5 w-3.5 mr-2 text-slate-500" />
                        Denunciar
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-700 leading-relaxed mt-1 whitespace-pre-wrap">
            {isDeleted ? '[Comentário removido pela moderação]' : comment.body}
          </p>
        </div>

        {/* Comment Action Links */}
        {!isDeleted && onReply && (
          <div className="flex items-center gap-3 pl-2">
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-blue-600 transition-colors"
            >
              <Reply className="h-3.5 w-3.5" />
              Responder
            </button>
          </div>
        )}

        {/* Reply Form */}
        {showReplyForm && (
          <form onSubmit={handleReplySubmit} className="flex gap-2 pl-2 mt-2">
            <input
              type="text"
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder="Escreva uma resposta..."
              className="flex-1 text-xs px-3 py-1.5 border border-slate-200 rounded-xl focus:border-slate-300 focus:outline-none"
            />
            <Button
              type="submit"
              size="sm"
              disabled={replyBody.trim() === '' || isSubmittingReply}
              className="text-[10px] font-bold bg-blue-600 text-white rounded-lg h-7 px-2.5"
            >
              {isSubmittingReply ? 'Enviando...' : 'Responder'}
            </Button>
          </form>
        )}

        {/* Replies List (Max 1 nesting level deep) */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="space-y-2 mt-2 pl-6 border-l-2 border-slate-100">
            {comment.replies.map((reply) => (
              <div key={reply.id} className="flex gap-2.5 py-1.5 group/reply">
                <UserAvatar
                  name={reply.status === 'deleted' ? 'Membro' : reply.user.name}
                  src={reply.status === 'deleted' ? null : null}
                  className="h-6 w-6 shrink-0 border border-slate-200/50"
                />
                <div className="flex-1 bg-slate-50/50 border border-slate-100 rounded-2xl px-3 py-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-slate-800">
                        {reply.status === 'deleted' ? 'Membro' : reply.user.name}
                      </span>
                      <span className="text-[9px] text-slate-400 font-medium">
                        {reply.created_at ? formatDistanceToNow(new Date(reply.created_at), { addSuffix: true, locale: ptBR }) : ''}
                      </span>
                    </div>

                    {reply.status !== 'deleted' && (currentUser?.id === reply.user.id || canModerateGroup) && (
                      <button
                        onClick={() => onDelete(reply.id)}
                        className="opacity-0 group-reply:opacity-100 text-destructive hover:text-red-700 transition-opacity"
                        aria-label="Excluir resposta"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">
                    {reply.status === 'deleted' ? '[Resposta removida]' : reply.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
