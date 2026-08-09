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
  Bell,
  AlertTriangle,
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
    switch (notification.category) {
      case 'quotes':
        return <div className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0"><FileText className="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="currentColor" fillOpacity={0.2} /></div>;
      case 'reviews':
        return <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center shrink-0"><Star className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="currentColor" /></div>;
      case 'messages':
        return <div className="h-12 w-12 rounded-xl bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center shrink-0"><MessageSquare className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="currentColor" fillOpacity={0.2} /></div>;
      case 'companies':
        return <div className="h-12 w-12 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0"><Building2 className="h-6 w-6 text-amber-600 dark:text-amber-400" /></div>;
      case 'system':
        return <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0"><ShieldAlert className="h-6 w-6 text-slate-600 dark:text-slate-400" fill="currentColor" /></div>;
      default:
        return <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0"><Bell className="h-6 w-6 text-slate-500 dark:text-slate-400" fill="currentColor" fillOpacity={0.2} /></div>;
    }
  };

  const formatRelativeTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `(há ${diffMins} min)`;
    if (diffHours < 24) return `(há ${diffHours} h)`;
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
        'group relative flex items-center gap-4 p-4 transition-all duration-200 border-none rounded-2xl shadow-sm hover:shadow-md cursor-pointer',
        !notification.read ? 'bg-slate-50 dark:bg-slate-800/50 ring-1 ring-blue-500/20' : 'bg-slate-100/50 dark:bg-slate-900/50'
      )}
      onClick={handleCtaClick}
    >
      {/* Category Icon */}
      {getCategoryIcon()}

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center gap-2">
          <h3
            className={cn(
              'text-base leading-snug',
              !notification.read ? 'font-bold text-slate-900 dark:text-slate-100' : 'font-semibold text-slate-800 dark:text-slate-200'
            )}
          >
            {notification.title}
          </h3>
          {!notification.read && (
            <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0" title="Não lida" />
          )}
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-1 mt-0.5">
          {notification.body}
        </p>
      </div>

      <span className="text-sm text-slate-500 dark:text-slate-400 shrink-0 ml-4">
        {formatRelativeTime(notification.created_at)}
      </span>

      {/* Contextual CTA Button is hidden for this specific list design, 
          as clicking the card handles navigation, but kept in code logic */}

      {/* 3-Dots Action Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-slate-700 rounded-lg shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="rounded-xl text-sm w-52 shadow-lg border-slate-200 dark:border-slate-800">
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }}>
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
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleArchive(e); }}>
            <Archive className="mr-2 h-4 w-4 text-slate-500" /> Arquivar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); alert(`Notificações do tipo ${notification.category} pausadas.`); }}>
            <BellOff className="mr-2 h-4 w-4 text-slate-500" /> Desativar deste tipo
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); alert('Reportado ao time de suporte.'); }}>
            <Flag className="mr-2 h-4 w-4 text-slate-500" /> Reportar problema
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </article>
  );
};
