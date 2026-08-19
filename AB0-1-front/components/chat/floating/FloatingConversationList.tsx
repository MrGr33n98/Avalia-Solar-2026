'use client';

import React from 'react';
import { Inbox, FileText } from 'lucide-react';
import { ChatAvatar } from './ChatAvatar';
import { type Conversation } from '@/lib/api';
import { cn } from '@/lib/utils';

interface FloatingConversationListProps {
  conversations: Conversation[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  isUser: boolean;
  loading?: boolean;
  className?: string;
}

function formatConversationDate(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) {
    return 'Ontem';
  }

  return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export function FloatingConversationList({
  conversations,
  selectedId,
  onSelect,
  isUser,
  loading = false,
  className,
}: FloatingConversationListProps) {
  if (loading) {
    return (
      <div className="flex flex-1 flex-col p-3 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-2.5 w-3/4 rounded bg-slate-100 dark:bg-slate-850" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
          <Inbox className="h-6 w-6 stroke-[1.8]" />
        </div>
        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Nenhuma conversa</p>
        <p className="mt-1 text-xs text-slate-500 max-w-[220px]">
          Sua caixa de entrada está limpa. As mensagens de orçamentos e empresas aparecerão aqui.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-850/60', className)}>
      {conversations.map((conversation) => {
        const title = (isUser ? conversation.company_name : conversation.user_name) || 'Conversa';
        const avatarUrl = isUser
          ? conversation.company_logo_url || conversation.company_logo || conversation.company_avatar
          : conversation.user_avatar_url || conversation.user_avatar;
        const unreadCount = conversation.unread_count ?? 0;
        const isSelected = selectedId === conversation.id;
        const isBudget = conversation.status === 'pending_user' || conversation.status === 'pending_company';

        return (
          <button
            key={conversation.id}
            onClick={() => onSelect(conversation.id)}
            className={cn(
              'group w-full flex items-start gap-3 p-3 transition-colors text-left relative',
              isSelected
                ? 'bg-blue-50/70 dark:bg-blue-950/30'
                : 'hover:bg-slate-50 dark:hover:bg-slate-850/60'
            )}
          >
            {/* Barra indicadora esquerda de conversa selecionada */}
            {isSelected && (
              <span className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 dark:bg-blue-400 rounded-r" />
            )}

            <ChatAvatar
              name={title}
              src={avatarUrl}
              status="online"
              size="md"
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className={cn(
                  'text-xs truncate font-bold',
                  unreadCount > 0 ? 'text-slate-900 dark:text-slate-50 font-black' : 'text-slate-800 dark:text-slate-200'
                )}>
                  {title || 'Conversa'}
                </span>
                <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                  {formatConversationDate(conversation.last_message_at || conversation.updated_at)}
                </span>
              </div>

              <p className={cn(
                'text-xs truncate line-clamp-1',
                unreadCount > 0 ? 'font-semibold text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'
              )}>
                {typeof conversation.last_message === 'string'
                  ? conversation.last_message
                  : conversation.last_message?.body || 'Nova conversa iniciada'}
              </p>

              {isBudget && (
                <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                  <FileText className="h-3 w-3 shrink-0" />
                  <span>Orçamento pendente</span>
                </div>
              )}
            </div>

            {unreadCount > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-extrabold text-white shrink-0 self-center shadow-2xs">
                {unreadCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
