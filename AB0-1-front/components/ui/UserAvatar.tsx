'use client';

import * as React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from './avatar';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | number;
}

export function UserAvatar({ src, name, className, size = 'md' }: UserAvatarProps) {
  const getInitials = (fullName: string | null | undefined) => {
    if (!fullName) return '';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 0) return '';
    const firstLetter = parts[0][0]?.toUpperCase() || '';
    if (parts.length === 1) return firstLetter;
    const lastLetter = parts[parts.length - 1][0]?.toUpperCase() || '';
    return firstLetter + lastLetter;
  };

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm font-semibold',
    lg: 'h-12 w-12 text-base font-bold',
  };

  const finalSizeClass = typeof size === 'string' ? sizeClasses[size] : '';
  const style = typeof size === 'number' ? { width: size, height: size } : undefined;

  return (
    <Avatar className={cn(finalSizeClass, 'border border-primary/20 shrink-0 shadow-none ring-0', className)} style={style}>
      {src ? (
        <AvatarImage
          src={src}
          alt={name || 'Avatar'}
          className="aspect-square object-cover"
        />
      ) : null}
      <AvatarFallback className="bg-primary/10 text-primary flex items-center justify-center font-bold">
        {name ? getInitials(name) : <User className="h-1/2 w-1/2 text-primary" />}
      </AvatarFallback>
    </Avatar>
  );
}
