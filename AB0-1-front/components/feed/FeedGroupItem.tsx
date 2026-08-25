import React from 'react';
import Link from 'next/link';
import { BadgeCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Group } from '@/types/groups';

interface FeedGroupItemProps {
  group: Group;
  onClick?: () => void;
}

export function FeedGroupItem({ group, onClick }: FeedGroupItemProps) {
  const name = group.name || 'Comunidade';
  
  // Resolve initials fallback
  const getInitials = (str: string) => {
    return str
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const initials = getInitials(name);
  const avatarUrl = group.avatar_url || group.hero_preview_url;

  return (
    <Link
      href={`/groups/${encodeURIComponent(group.slug)}`}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors group active:bg-blue-50/50"
    >
      <Avatar className="h-9 w-9 shrink-0 border border-slate-200/50">
        <AvatarImage src={avatarUrl || undefined} alt="" />
        <AvatarFallback className="bg-gradient-to-br from-slate-50 to-slate-100 text-slate-700 text-xs font-bold">
          {initials || 'AS'}
        </AvatarFallback>
      </Avatar>
      
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-slate-800 group-hover:text-slate-900 truncate">
            {name}
          </span>
          {group.official && (
            <BadgeCheck className="h-4 w-4 text-blue-600 fill-blue-50 shrink-0" aria-label="Comunidade Oficial" />
          )}
        </div>
        <p className="text-[10px] text-slate-500 font-medium tracking-wide">
          {group.official ? 'Comunidade oficial' : 'Comunidade'}
        </p>
      </div>
    </Link>
  );
}
