'use client';

import React, { useRef, useEffect } from 'react';
import { CheckCheck, Paperclip, Loader2, MessageCircle, FileText } from 'lucide-react';
import { type DirectMessage } from '@/lib/api';
import { cn } from '@/lib/utils';

interface FloatingChatMessageAreaProps {
  messages: DirectMessage[];
  loading?: boolean;
  isUser: boolean;
  isTyping?: boolean;
  className?: string;
}

function formatMessageTime(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function FloatingChatMessageArea({
  messages,
  loading = false,
  isUser,
  isTyping = false,
  className,
}: FloatingChatMessageAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-400" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
          <MessageCircle className="h-6 w-6 stroke-[1.8]" />
        </div>
        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Inicie a conversa</p>
        <p className="mt-1 text-xs text-slate-500 max-w-[240px]">
          Tire dúvidas sobre orçamentos, envie documentos ou negocie propostas diretamente.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('flex-1 overflow-y-auto p-3.5 space-y-3 bg-slate-50/50 dark:bg-slate-950/40', className)}>
      {messages.map((message) => {
        const isSelf = isUser ? message.sender_type === 'User' : message.sender_type === 'Company';
        const attachmentList = (message.attachments || []).length > 0
          ? (message.attachments as any[])
          : message.attachment_url
          ? [{ url: message.attachment_url }]
          : [];

        return (
          <div key={message.id} className={cn('flex', isSelf ? 'justify-end' : 'justify-start')}>
            <div
              className={cn(
                'max-w-[85%] rounded-2xl px-3.5 py-2 shadow-xs text-xs sm:text-sm leading-relaxed',
                isSelf
                  ? 'bg-blue-600 text-white rounded-tr-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-xs'
              )}
            >
              {message.body && <p className="whitespace-pre-wrap font-normal">{message.body}</p>}

              {attachmentList.map((att, i) => (
                <a
                  key={i}
                  href={att.url}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    'flex items-center gap-2 mt-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                    isSelf
                      ? 'bg-black/15 hover:bg-black/25 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200'
                  )}
                >
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">Anexo do Orçamento</span>
                </a>
              ))}

              <div
                className={cn(
                  'flex items-center justify-end gap-1 mt-1 text-[10px] font-semibold',
                  isSelf ? 'text-blue-100' : 'text-slate-400'
                )}
              >
                <span>{formatMessageTime(message.created_at)}</span>
                {isSelf && (
                  <CheckCheck
                    className={cn('h-3 w-3', message.read_at ? 'text-white' : 'opacity-70')}
                  />
                )}
              </div>
            </div>
          </div>
        );
      })}
      {isTyping && (
        <div className="flex justify-start">
          <div className="rounded-2xl rounded-tl-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 shadow-xs flex items-center gap-1.5 text-xs text-slate-500">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Digitando</span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
