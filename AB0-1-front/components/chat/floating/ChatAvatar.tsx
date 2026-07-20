'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface ChatAvatarProps {
  name?: string | null;
  src?: string | null;
  status?: 'online' | 'offline' | 'away' | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function getInitials(name?: string | null): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ChatAvatar({
  name,
  src,
  status = 'online',
  size = 'md',
  className,
}: ChatAvatarProps) {
  const sizeClasses = {
    sm: 'h-7 w-7 text-[10px]',
    md: 'h-10 w-10 text-xs',
    lg: 'h-12 w-12 text-sm',
  };

  const statusDotSize = {
    sm: 'h-2 w-2 border',
    md: 'h-3 w-3 border-2',
    lg: 'h-3.5 w-3.5 border-2',
  };

  const initials = getInitials(name);

  return (
    <div className={cn('relative inline-flex shrink-0 items-center justify-center', className)}>
      <Avatar className={cn('border border-slate-200 dark:border-slate-800 shadow-xs', sizeClasses[size])}>
        {src ? <AvatarImage src={src} alt={name || 'User'} className="object-cover" /> : null}
        <AvatarFallback className="bg-blue-100 dark:bg-blue-950 font-bold text-blue-700 dark:text-blue-300">
          {initials}
        </AvatarFallback>
      </Avatar>

      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-white dark:border-slate-900',
            statusDotSize[size],
            status === 'online' && 'bg-emerald-500',
            status === 'away' && 'bg-amber-500',
            status === 'offline' && 'bg-slate-300 dark:bg-slate-600'
          )}
          title={status === 'online' ? 'Online' : status === 'away' ? 'Ausente' : 'Offline'}
        />
      )}
    </div>
  );
}
