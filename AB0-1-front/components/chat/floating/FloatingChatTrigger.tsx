'use client';

import React from 'react';
import { ChevronUp, MessageSquare } from 'lucide-react';
import { ChatAvatar } from './ChatAvatar';
import { getFloatingWidgetZIndex, getFloatingWidgetSizeClasses, WIDGET_POSITION_CLASSES } from '@/lib/floating-widgets-positioning';
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
        'fixed cursor-pointer items-center justify-between',
        'rounded-full border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl',
        'transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-850 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]',
        'flex h-12 px-4 min-w-[180px] max-w-[280px]',
        WIDGET_POSITION_CLASSES.chat,
        className
      )}
      style={{
        zIndex: getFloatingWidgetZIndex('chat')
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative shrink-0">
          <ChatAvatar
            name={user?.name || 'Usuário'}
            src={user?.avatar_url}
            status="online"
            size="sm"
          />
        </div>
        <span className="text-base font-bold text-slate-900 dark:text-slate-100 truncate tracking-tight">
          Mensagens
        </span>
      </div>

      {unreadCount > 0 && (
        <span className="ml-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1.5 text-[11px] font-extrabold text-white shadow-xs animate-pulse">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </div>
  );
}
