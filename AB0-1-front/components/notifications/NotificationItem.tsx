'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Star,
  MessageSquare,
  Building2,
  ShieldAlert,
  MoreVertical,
  Eye,
  EyeOff,
  Archive,
  BellOff,
  Flag,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotificationStore, Notification } from '@/store/notificationStore';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  notification: Notification;
  onUndoArchive?: (id: number) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onUndoArchive }) => {
  const router = useRouter();
  const { markAsRead, archiveNotification } = useNotificationStore();

  const getCategoryIcon = () => {
    if (notification.company_logo_url) {
      return (
        <img
          src={notification.company_logo_url}
          alt={notification.company_name || 'Empresa'}
          className="h-10 w-10 rounded-none border border-slate-200 object-cover"
        />
      );
    }
    switch (notification.category) {
      case 'quotes':
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-none bg-emerald-50 text-emerald-600 border border-emerald-200">
            <FileText className="h-5 w-5" />
          </div>
        );
      case 'reviews':
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-none bg-purple-50 text-purple-600 border border-purple-200">
            <Star className="h-5 w-5" />
          </div>
        );
      case 'messages':
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-none bg-blue-50 text-blue-600 border border-blue-200">
            <MessageSquare className="h-5 w-5" />
          </div>
        );
      case 'companies':
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-none bg-amber-50 text-amber-600 border border-amber-200">
            <Building2 className="h-5 w-5" />
          </div>
        );
      default:
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-none bg-slate-100 text-slate-600 border border-slate-200">
            <ShieldAlert className="h-5 w-5" />
          </div>
        );
    }
  };

  const formatRelativeTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `Há ${diffMins} min atrás`;
    if (diffHours < 24) return `Há ${diffHours} hora${diffHours > 1 ? 's' : ''} atrás`;
    if (diffDays === 1) return `Ontem, ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    return `${diffDays} dias atrás`;
  };

  const handleCtaClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.destination_url) {
      router.push(notification.destination_url);
    }
  };

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    archiveNotification(notification.id);
    if (onUndoArchive) {
      onUndoArchive(notification.id);
    }
  };

  return (
    <article
      aria-label={!notification.read ? 'Notificação não lida' : 'Notificação'}
      className={cn(
        'group relative flex items-start gap-4 p-4 transition-colors border border-slate-200 rounded-none bg-white hover:border-slate-300 shadow-none',
        !notification.read ? 'border-l-[3px] border-l-blue-600 bg-blue-50/20' : 'border-l-slate-200'
      )}
    >
      {/* Unread Blue Dot */}
      {!notification.read && (
        <span className="mt-2.5 h-2 w-2 rounded-full bg-blue-600 shrink-0" title="Não lida" />
      )}

      {/* Category or Company Icon */}
      <div className="shrink-0 mt-0.5">{getCategoryIcon()}</div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3
            className={cn(
              'text-sm text-slate-900 leading-snug',
              !notification.read ? 'font-bold' : 'font-semibold'
            )}
          >
            {notification.title}
          </h3>
          <span className="text-xs text-slate-400 font-mono shrink-0">
            {formatRelativeTime(notification.created_at)}
          </span>
        </div>

        <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">
          {notification.body}
        </p>

        {/* Company / Item Context Subline */}
        {notification.company_name && (
          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <Building2 className="h-3 w-3 text-slate-400" />
            <span className="font-semibold text-slate-700">{notification.company_name}</span>
          </p>
        )}

        {/* Contextual CTA Button */}
        {notification.cta_label && (
          <div className="mt-3">
            <Button
              onClick={handleCtaClick}
              className="h-8 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-none transition-colors"
            >
              {notification.cta_label}
            </Button>
          </div>
        )}
      </div>

      {/* 3-Dots Action Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-slate-700 rounded-none shrink-0"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="rounded-none text-xs w-52 shadow-md">
          <DropdownMenuItem onClick={() => markAsRead(notification.id)}>
            {notification.read ? (
              <>
                <EyeOff className="mr-2 h-4 w-4 text-slate-500" /> Marcar como não lida
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4 text-slate-500" /> Marcar como lida
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleArchive}>
            <Archive className="mr-2 h-4 w-4 text-slate-500" /> Arquivar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => alert(`Notificações do tipo ${notification.category} pausadas.`)}>
            <BellOff className="mr-2 h-4 w-4 text-slate-500" /> Desativar deste tipo
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => alert('Reportado ao time de suporte.')}>
            <Flag className="mr-2 h-4 w-4 text-slate-500" /> Reportar problema
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </article>
  );
};
