'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCheck,
  ExternalLink,
  ArrowRight,
  MoreVertical,
  Eye,
  Archive,
  Bell,
  Info,
} from 'lucide-react';
import { useNotificationStore, Notification } from '@/store/notificationStore';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface NotificationDropdownProps {
  onClose?: () => void;
  filterType?: string;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  onClose,
  filterType,
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const [tab, setTab] = useState<'all' | 'unread'>('all');
  const { notifications, unreadCount, markAsRead, markAllAsRead, archiveNotification, loading } =
    useNotificationStore();

  const targetNotificationsUrl =
    user?.role === 'review' ? '/review-dashboard/notifications' : '/dashboard/notifications';

  const filteredNotifications = notifications
    .filter((n) => {
      if (tab === 'unread') return !n.read;
      return true;
    })
    .slice(0, 6);

  const getCategoryDot = (n: Notification) => {
    switch (n.category) {
      case 'quotes':
        return <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 mt-1.5" />;
      case 'reviews':
        return <span className="h-2 w-2 rounded-full bg-purple-500 shrink-0 mt-1.5" />;
      case 'messages':
        return <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />;
      case 'companies':
        return <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0 mt-1.5" />;
      default:
        return <span className="h-2 w-2 rounded-full bg-slate-400 shrink-0 mt-1.5" />;
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
    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays === 1) return 'Ontem';
    return `${diffDays}d atrás`;
  };

  const handleItemClick = (n: Notification) => {
    if (!n.read) {
      markAsRead(n.id);
    }
    if (n.destination_url) {
      router.push(n.destination_url);
      if (onClose) onClose();
    }
  };

  return (
    <div className="w-[360px] md:w-[400px] bg-white border border-slate-200 shadow-2xl flex flex-col font-sans text-slate-900 rounded-none">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold tracking-tight text-slate-900">Notificações</h3>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllAsRead()}
            className="h-7 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 rounded-none"
          >
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border-b border-slate-100">
        <button
          onClick={() => setTab('all')}
          className={cn(
            'px-3 py-1 text-xs font-bold transition-all rounded-full flex items-center gap-1.5',
            tab === 'all'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-transparent text-slate-600 hover:bg-slate-200/60'
          )}
        >
          Todas
          <span
            className={cn(
              'px-1.5 py-0.2 text-[10px] rounded-full',
              tab === 'all' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
            )}
          >
            {notifications.length}
          </span>
        </button>

        <button
          onClick={() => setTab('unread')}
          className={cn(
            'px-3 py-1 text-xs font-bold transition-all rounded-full flex items-center gap-1.5',
            tab === 'unread'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-transparent text-slate-600 hover:bg-slate-200/60'
          )}
        >
          Não lidas
          <span
            className={cn(
              'px-1.5 py-0.2 text-[10px] rounded-full',
              tab === 'unread' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
            )}
          >
            {unreadCount}
          </span>
        </button>
      </div>

      {/* Content List */}
      <div className="flex-1 overflow-y-auto max-h-[360px] divide-y divide-slate-100">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Carregando notificações...</div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="mx-auto h-8 w-8 text-slate-300 mb-2" />
            <p className="text-xs font-bold text-slate-700">Você está em dia!</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Nenhuma notificação encontrada.</p>
          </div>
        ) : (
          filteredNotifications.map((n) => (
            <div
              key={n.id}
              className={cn(
                'group relative flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50 cursor-pointer',
                !n.read ? 'bg-white' : 'bg-white'
              )}
              onClick={() => handleItemClick(n)}
            >
              {/* Category Dot Indicator */}
              {getCategoryDot(n)}

              {/* Title & Body */}
              <div className="flex-1 min-w-0">
                <p className={cn('text-xs truncate', !n.read ? 'font-bold text-slate-900' : 'font-medium text-slate-700')}>
                  {n.title}
                </p>
                {n.body && (
                  <p className="text-[11px] text-slate-500 truncate mt-0.5 leading-snug">
                    {n.body}
                  </p>
                )}
              </div>

              {/* Time & Unread Indicator */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-slate-400 font-medium">
                  {formatRelativeTime(n.created_at)}
                </span>
                {!n.read && <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0" />}

                {/* More Action Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-slate-400 hover:text-slate-700 rounded-none opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-none text-xs w-44">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(n.id);
                      }}
                    >
                      <Eye className="mr-2 h-3.5 w-3.5" /> Marcar como lida
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        archiveNotification(n.id);
                      }}
                    >
                      <Archive className="mr-2 h-3.5 w-3.5" /> Arquivar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Link */}
      <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
        <button
          onClick={() => {
            router.push(targetNotificationsUrl);
            if (onClose) onClose();
          }}
          className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
        >
          Ver todas as notificações
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
