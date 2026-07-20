'use client';

import React from 'react';
import { ArrowLeft, Minus, MoreVertical, X } from 'lucide-react';
import { ChatAvatar } from './ChatAvatar';
import { cn } from '@/lib/utils';

interface FloatingChatHeaderProps {
  currentUser?: {
    name?: string | null;
    avatar_url?: string | null;
  } | null;
  activeConversation?: {
    id: number;
    title: string;
    avatar_url?: string | null;
    statusText?: string;
    isTyping?: boolean;
    companySlug?: string;
  } | null;
  onBack?: () => void;
  onMinimize: () => void;
  onClose: () => void;
  className?: string;
}

export function FloatingChatHeader({
  currentUser,
  activeConversation,
  onBack,
  onMinimize,
  onClose,
  className,
}: FloatingChatHeaderProps) {
  const isConversationActive = !!activeConversation;

  return (
    <div
      className={cn(
        'flex h-14 shrink-0 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 shadow-xs',
        className
      )}
    >
      {isConversationActive ? (
        // Header de Conversa Ativa
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {onBack && (
            <button
              onClick={onBack}
              className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Voltar para conversas"
            >
              <ArrowLeft className="h-5 w-5 stroke-[2.2]" />
            </button>
          )}

          <ChatAvatar
            name={activeConversation.title}
            src={activeConversation.avatar_url}
            status="online"
            size="sm"
          />

          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate line-clamp-1">
              {activeConversation.title}
            </span>
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 truncate">
              {activeConversation.isTyping ? (
                <span className="animate-pulse font-semibold text-blue-600 dark:text-blue-400">Digitando...</span>
              ) : (
                activeConversation.statusText || 'Online'
              )}
            </span>
          </div>
        </div>
      ) : (
        // Header de Lista de Mensagens
        <div className="flex items-center gap-2.5 min-w-0">
          <ChatAvatar
            name={currentUser?.name || 'Usuário'}
            src={currentUser?.avatar_url}
            status="online"
            size="sm"
          />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
            Mensagens
          </h3>
        </div>
      )}

      {/* Botões de Ação Direita */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onMinimize}
          className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Minimizar"
        >
          <Minus className="h-4 w-4 stroke-[2.5]" />
        </button>
        <button
          onClick={onClose}
          className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors sm:hidden"
          title="Fechar"
        >
          <X className="h-4 w-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
}
