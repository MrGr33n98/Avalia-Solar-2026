'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CheckCheck,
  MoreVertical,
  ExternalLink,
  FileText,
  MessageSquare,
  Star,
  Building2,
  ShieldAlert,
  Archive,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useNotificationStore, Notification } from '@/store/notificationStore';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface NotificationDropdownProps {
  onClose?: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onClose }) => {
  const router = useRouter();
  const [tab, setTab] = useState<'all' | 'unread'>('all');
  const { notifications, unreadCount, markAsRead, markAllAsRead, archiveNotification, loading } =
    useNotificationStore();

  const filteredNotifications = notifications.filter((n) => {
    if (tab === 'unread') return !n.read;
    return true;
  }).slice(0, 6);

  const getCategoryIcon = (n: Notification) => {
    if (n.company_logo_url) {
      return (
        <img
          src={n.company_logo_url}
          alt={n.company_name || 'Empresa'}
          className="h-8 w-8 rounded-none border border-slate-200 object-cover"
        />
      );
    }
    switch (n.category) {
      case 'quotes':
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-none bg-emerald-50 text-emerald-600 border border-emerald-200">
            <FileText className="h-4 w-4" />
          </div>
        );
      case 'reviews':
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-none bg-purple-50 text-purple-600 border border-purple-200">
            <Star className="h-4 w-4" />
          </div>
        );
      case 'messages':
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-none bg-blue-50 text-blue-600 border border-blue-200">
            <MessageSquare className="h-4 w-4" />
          </div>
        );
      case 'companies':
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-none bg-amber-50 text-amber-600 border border-amber-200">
            <Building2 className="h-4 w-4" />
          </div>
        );
      default:
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-none bg-slate-100 text-slate-600 border border-slate-200">
            <ShieldAlert className="h-4 w-4" />
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
    if (diffMins < 60) return `Há ${diffMins} min`;
    if (diffHours < 24) return `Há ${diffHours}h`;
    if (diffDays === 1) return 'Ontem';
    return `Há ${diffDays} dias`;
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
    <div className="w-[380px] md:w-[420px] max-h-[580px] bg-white border border-slate-200 shadow-xl flex flex-col font-sans text-slate-900 rounded-none">
      {/* Header Swiss Style */}
      <div className="flex items-center justify-between p-3 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold tracking-tight text-slate-900 uppercase">Notificações</h3>
          {unreadCount > 0 && (
            <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-none">
              {unreadCount} não lidas
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllAsRead()}
            className="h-7 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 rounded-none"
          >
            <CheckCheck className="mr-1 h-3.5 w-3.5" />
            Marcar todas lidas
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="px-3 pt-2 bg-slate-50 border-b border-slate-200">
        <Tabs value={tab} onValueChange={(v) => setTab(v as 'all' | 'unread')}>
          <TabsList className="h-8 bg-transparent p-0 gap-4">
            <TabsTrigger
              value="all"
              className="h-8 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 px-1 text-xs font-semibold text-slate-600"
            >
              Todas ({notifications.length})
            </TabsTrigger>
            <TabsTrigger
              value="unread"
              className="h-8 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 px-1 text-xs font-semibold text-slate-600"
            >
              Não lidas ({unreadCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content List */}
      <div className="flex-1 overflow-y-auto max-h-[380px] divide-y divide-slate-100">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">
            Carregando notificações...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="mx-auto h-8 w-8 text-slate-300 mb-2" />
            <p className="text-xs font-bold text-slate-700">Você está em dia!</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Nenhuma notificação encontrada nesta aba.</p>
          </div>
        ) : (
          filteredNotifications.map((n) => (
            <div
              key={n.id}
              className={cn(
                'group relative flex items-start gap-3 p-3 transition-colors hover:bg-slate-50 border-l-2',
                !n.read ? 'border-l-blue-600 bg-blue-50/40' : 'border-l-transparent bg-white'
              )}
            >
              <div className="mt-0.5 shrink-0">{getCategoryIcon(n)}</div>

              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleItemClick(n)}>
                <div className="flex items-center justify-between gap-2">
                  <p className={cn('text-xs truncate', !n.read ? 'font-bold text-slate-900' : 'font-medium text-slate-700')}>
                    {n.title}
                  </p>
                  <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                    {formatRelativeTime(n.created_at)}
                  </span>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2 mt-0.5 leading-snug">
                  {n.body}
                </p>

                {n.cta_label && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline">
                      {n.cta_label}
                      <ExternalLink className="h-3 w-3" />
                    </span>
                  </div>
                )}
              </div>

              {/* Action Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-slate-400 hover:text-slate-700 rounded-none shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-none text-xs w-44">
                  <DropdownMenuItem onClick={() => markAsRead(n.id)}>
                    {n.read ? (
                      <>
                        <EyeOff className="mr-2 h-3.5 w-3.5 text-slate-500" /> Marcar não lida
                      </>
                    ) : (
                      <>
                        <Eye className="mr-2 h-3.5 w-3.5 text-slate-500" /> Marcar como lida
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => archiveNotification(n.id)}>
                    <Archive className="mr-2 h-3.5 w-3.5 text-slate-500" /> Arquivar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))
        )}
      </div>

      {/* Footer Swiss Style */}
      <div className="p-2.5 border-t border-slate-200 bg-slate-50 text-center">
        <Link
          href="/review-dashboard/notifications"
          onClick={onClose}
          className="inline-flex items-center justify-center w-full py-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-white border border-blue-200 transition-colors uppercase tracking-wider rounded-none"
        >
          Ver todas as notificações
        </Link>
      </div>
    </div>
  );
};
