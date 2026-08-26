'use client';

import React from 'react';
import { MoreHorizontal, Link as LinkIcon, Flag, EyeOff, UserMinus } from 'lucide-react';
import { FeedItem } from '@/types/feed';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FeedItemMenuProps {
  item: FeedItem;
}

export function FeedItemMenu({ item }: FeedItemMenuProps) {
  const handleCopyLink = () => {
    let url = `${window.location.origin}/posts/${item.subject.id}`;
    if (item.type === 'reviewer_publication' && item.actor.slug && item.subject.slug) {
      url = `${window.location.origin}/creators/${item.actor.slug}/posts/${item.subject.slug}`;
    } else if (item.type === 'review' && item.subject.company?.slug) {
      url = `${window.location.origin}/companies/${item.subject.company.slug}`;
    } else if (item.type === 'group_post' && item.subject.group?.slug) {
      url = `${window.location.origin}/groups/${item.subject.group.slug}/posts/${item.subject.id}`;
    }
    
    navigator.clipboard.writeText(url);
    toast.success('Link copiado para a área de transferência!');
  };

  const handleReport = () => {
    toast.info('Conteúdo reportado. Nossa equipe analisará em breve.');
  };

  const handleNotInterested = () => {
    toast.success('Ocultaremos conteúdos semelhantes a este.');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="p-2 -mr-2 rounded-full hover:bg-muted transition-colors text-muted-foreground focus:outline-none">
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 text-sm">
        <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
          <LinkIcon className="h-4 w-4 mr-2" />
          Copiar link
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleNotInterested} className="cursor-pointer">
          <EyeOff className="h-4 w-4 mr-2" />
          Não tenho interesse
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleReport} className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
          <Flag className="h-4 w-4 mr-2" />
          Reportar conteúdo
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
