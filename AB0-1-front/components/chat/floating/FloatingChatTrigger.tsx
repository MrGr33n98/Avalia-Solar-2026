'use client';

import React from 'react';
import { ChevronUp, MessageSquare } from 'lucide-react';
import { ChatAvatar } from './ChatAvatar';
import { cn } from '@/lib/utils';

interface FloatingChatTriggerProps {
  user?: {
    name?: string | null;
    avatar_url?: string | null;
  } | null;
  unreadCount?: number;
  onExpand: () => void;
  className?: string;
}

export function FloatingChatTrigger({
  user,
  unreadCount = 0,
  onExpand,
  className,
}: FloatingChatTriggerProps) {
  return (
    <div
      onClick={onExpand}
      className={cn(
        'fixed bottom-[calc(4.5rem+var(--sab))] md:bottom-0 right-4 sm:right-8 z-[9000] flex h-14 w-14 md:w-[290px] sm:w-[320px] cursor-pointer items-center justify-center md:justify-between',
        'rounded-full md:rounded-t-2xl md:rounded-b-none border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 md:px-4 md:py-2.5 shadow-xl md:shadow-[0_-4px_20px_rgba(0,0,0,0.12)]',
        'transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-850 hover:shadow-[0_-6px_24px_rgba(0,0,0,0.16)]',
        className
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <ChatAvatar
          name={user?.name || 'Usuário'}
          src={user?.avatar_url}
          status="online"
          size="sm"
        />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 md:hidden flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1.5 text-[11px] font-extrabold text-white shadow-xs animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        <div className="hidden md:flex items-center gap-2 truncate">
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
            Mensagens
          </span>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-2 shrink-0">
        {unreadCount > 0 && (
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1.5 text-[11px] font-extrabold text-white shadow-xs animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        <div className="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
          <ChevronUp className="h-4 w-4 stroke-[2.5]" />
        </div>
      </div>
    </div>
  );
}
