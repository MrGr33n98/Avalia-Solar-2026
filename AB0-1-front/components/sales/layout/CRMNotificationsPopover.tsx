'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CheckCheck,
  Inbox,
  Mail,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  CalendarClock,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { salesApi } from '@/lib/api/sales/client';

interface ApiNotificationItem {
  id: string | number;
  type: string;
  category: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
  cta_label?: string;
  destination_url?: string;
  source?: 'backend' | 'crm_live';
}

export default function CRMNotificationsPopover() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<ApiNotificationItem[]>([]);
  const [dismissedLiveIds, setDismissedLiveIds] = useState<string[]>([]);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const items: ApiNotificationItem[] = [];

      // 1. Notificações persistidas em /api/v1/notifications
      try {
        const res = await fetch('/api/v1/notifications?per_page=15', {
          credentials: 'include',
        });
        if (res.ok) {
          const json = await res.json();
          const data: any[] = json.data ?? [];
          data.forEach((n) => {
            items.push({
              id: n.id,
              type: n.type || 'system_update',
              category: n.category || 'system',
              title: n.title || 'Notificação do Sistema',
              body: n.body || '',
              read: Boolean(n.read),
              created_at: n.created_at || new Date().toISOString(),
              cta_label: n.cta_label || 'Abrir',
              destination_url: n.destination_url || '/dashboard/sales/emails',
              source: 'backend',
            });
          });
        }
      } catch {
        // Ignora silenciosamente se endpoint geral indisponível
      }

      // 2. Estado vivo das caixas Zoho Mail e conversas não lidas do Sales Inbox
      try {
        const accounts = await salesApi.getEmailConnections();
        for (const acc of accounts) {
          if (acc.sync_status === 'error' || acc.connection_status === 'needs_reconnect') {
            const liveId = `zoho-err-${acc.id}`;
            if (!dismissedLiveIds.includes(liveId)) {
              items.unshift({
                id: liveId,
                type: 'sync_alert',
                category: 'messages',
                title: `Atenção na caixa ${acc.email}`,
                body: acc.sync_error || 'Falha na sincronização Zoho Mail. Clique para revisar e sincronizar.',
                read: false,
                created_at: acc.last_synced_at || new Date().toISOString(),
                cta_label: 'Abrir Sales Inbox',
                destination_url: '/dashboard/sales/emails',
                source: 'crm_live',
              });
            }
          } else if (!acc.last_synced_at) {
            const liveId = `zoho-initial-${acc.id}`;
            if (!dismissedLiveIds.includes(liveId)) {
              items.unshift({
                id: liveId,
                type: 'sync_pending',
                category: 'messages',
                title: `Caixa ${acc.email} conectada`,
                body: 'Clique para executar a sincronização inicial das suas mensagens Zoho Mail.',
                read: false,
                created_at: acc.created_at || new Date().toISOString(),
                cta_label: 'Sincronizar Caixa',
                destination_url: '/dashboard/sales/emails',
                source: 'crm_live',
              });
            }
          }
        }

        const threadsRes = await salesApi.getInboxThreads({ folder: 'inbox', per_page: 5 });
        const unreadCount = threadsRes.counts?.unread ?? 0;
        if (unreadCount > 0) {
          const liveId = `inbox-unread-${unreadCount}`;
          if (!dismissedLiveIds.includes(liveId)) {
            items.unshift({
              id: liveId,
              type: 'new_message',
              category: 'messages',
              title: `${unreadCount} conversa(s) não lida(s) no Sales Inbox`,
              body: threadsRes.threads?.[0]
                ? `Última: ${threadsRes.threads[0].subject} (${threadsRes.threads[0].sender_email || ''})`
                : 'Novas mensagens aguardando resposta na Caixa de Entrada.',
              read: false,
              created_at: threadsRes.threads?.[0]?.last_message_at || new Date().toISOString(),
              cta_label: 'Responder agora',
              destination_url: '/dashboard/sales/emails',
              source: 'crm_live',
            });
          }
        }
      } catch {
        // Fallback silencioso
      }

      setNotifications(items);
    } finally {
      setLoading(false);
    }
  }, [dismissedLiveIds]);

  useEffect(() => {
    loadNotifications();
    const timer = setInterval(loadNotifications, 60000);
    return () => clearInterval(timer);
  }, [loadNotifications]);

  useEffect(() => {
    if (open) {
      loadNotifications();
    }
  }, [open, loadNotifications]);

  const unreadTotal = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = async (item: ApiNotificationItem) => {
    if (item.source === 'backend') {
      try {
        await fetch(`/api/v1/notifications/${item.id}/mark_as_read`, {
          method: 'POST',
          credentials: 'include',
        });
      } catch {
        // ignore
      }
    } else {
      setDismissedLiveIds((prev) => [...prev, String(item.id)]);
    }

    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch('/api/v1/notifications/mark_all_as_read', {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // ignore
    }

    const liveIds = notifications
      .filter((n) => n.source === 'crm_live')
      .map((n) => String(n.id));
    setDismissedLiveIds((prev) => Array.from(new Set([...prev, ...liveIds])));
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleItemClick = async (item: ApiNotificationItem) => {
    await handleMarkAsRead(item);
    setOpen(false);
    if (item.destination_url) {
      router.push(item.destination_url);
    }
  };

  const visibleItems =
    filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  const formatRelativeTime = (iso: string) => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return 'Agora';
    const diffMin = Math.max(Math.round((Date.now() - date.getTime()) / 60000), 0);
    if (diffMin < 1) return 'Agora';
    if (diffMin < 60) return `há ${diffMin} min`;
    const diffHours = Math.round(diffMin / 60);
    if (diffHours < 24) return `há ${diffHours}h`;
    const diffDays = Math.round(diffHours / 24);
    return `há ${diffDays}d`;
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Notificações do sistema"
          className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-md hover:bg-slate-800/60 relative focus:outline-none"
        >
          <Bell className="w-4 h-4" />
          {unreadTotal > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-blue-500 text-[10px] font-bold text-white flex items-center justify-center leading-none shadow-xs">
              {unreadTotal > 9 ? '9+' : unreadTotal}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 sm:w-96 p-0 bg-slate-900 border border-slate-800 text-slate-100 shadow-2xl rounded-xl overflow-hidden z-50"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-sky-400" />
            <span className="font-semibold text-xs text-white">Notificações do CRM</span>
            {unreadTotal > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                {unreadTotal} nova(s)
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => loadNotifications()}
              title="Atualizar notificações"
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-400' : ''}`} />
            </button>
            {unreadTotal > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-[11px] text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-slate-800 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Ler todas</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-4 py-2 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/90 text-[11px]">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Todas ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Não lidas ({unreadTotal})
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              router.push('/dashboard/sales/emails');
            }}
            className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
          >
            <Inbox className="w-3 h-3 text-sky-400" />
            <span>Sales Inbox</span>
          </button>
        </div>

        {/* Notification List */}
        <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/70">
          {visibleItems.length === 0 ? (
            <div className="py-10 px-6 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400/80 mx-auto stroke-[1.5]" />
              <p className="text-xs font-semibold text-slate-200">Tudo em dia por aqui!</p>
              <p className="text-[11px] text-slate-400">
                Novos e-mails recebidos no Zoho Mail, respostas de clientes e alertas comerciais aparecerão aqui.
              </p>
            </div>
          ) : (
            visibleItems.map((item) => {
              const isAlert = item.type === 'sync_alert';
              const isEmail = item.category === 'messages' || item.type === 'new_message' || item.type === 'reply_received';

              return (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`px-4 py-3 flex items-start gap-3 cursor-pointer transition-colors hover:bg-slate-800/70 ${
                    !item.read ? 'bg-slate-800/40' : ''
                  }`}
                >
                  <div
                    className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isAlert
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : isEmail
                        ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                        : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                    }`}
                  >
                    {isAlert ? (
                      <AlertCircle className="w-3.5 h-3.5" />
                    ) : isEmail ? (
                      <Mail className="w-3.5 h-3.5" />
                    ) : (
                      <CalendarClock className="w-3.5 h-3.5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs truncate ${!item.read ? 'font-bold text-white' : 'font-medium text-slate-300'}`}>
                        {item.title}
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatRelativeTime(item.created_at)}
                      </span>
                    </div>
                    {item.body && (
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                        {item.body}
                      </p>
                    )}
                    {item.cta_label && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-400 mt-1">
                        {item.cta_label} <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>

                  {!item.read && (
                    <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0 mt-1.5" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

