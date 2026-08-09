'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, Suspense } from 'react';
import { CheckCheck, Bell, RefreshCw } from 'lucide-react';
import { useNotificationStore, Notification } from '@/store/notificationStore';
import { NotificationFilters } from '@/components/notifications/NotificationFilters';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { Button } from '@/components/ui/button';
import RoleBasedDashboardLayout from '../components/RoleBasedDashboardLayout';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function DashboardNotificationsPage() {
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAllAsRead,
    unarchiveNotification,
  } = useNotificationStore();

  const [undoToast, setUndoToast] = useState<{ id: number; title: string } | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleRestore = (id: number) => {
    unarchiveNotification(id);
    setUndoToast(null);
  };

  // Group notifications by period
  const groupNotifications = (list: Notification[]) => {
    const today: Notification[] = [];
    const yesterday: Notification[] = [];
    const last7Days: Notification[] = [];
    const older: Notification[] = [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;
    const last7Start = todayStart - 6 * 86400000;

    list.forEach((item) => {
      const itemTime = new Date(item.created_at).getTime();
      if (itemTime >= todayStart) {
        today.push(item);
      } else if (itemTime >= yesterdayStart) {
        yesterday.push(item);
      } else if (itemTime >= last7Start) {
        last7Days.push(item);
      } else {
        older.push(item);
      }
    });

    return { today, yesterday, last7Days, older };
  };

  const groups = groupNotifications(notifications);

  return (
    <RoleBasedDashboardLayout activeTab="notifications">
      <div className="mx-auto max-w-5xl space-y-6 font-sans text-slate-900">
        
        {/* Breadcrumb / Back Button */}
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Link 
            href="/dashboard" 
            className="flex items-center gap-1 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Dashboard
          </Link>
          <span>/</span>
          <span className="font-medium text-slate-900 dark:text-slate-100">Notificações</span>
        </div>

        {/* Undo Toast */}
        {undoToast && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-4 py-3 shadow-2xl rounded-xl transition-all duration-300">
            <span className="text-sm font-medium">{undoToast.title}</span>
            <Button
              onClick={() => handleRestore(undoToast.id)}
              className="h-7 px-3 bg-white/20 hover:bg-white/30 text-white font-semibold text-xs rounded-lg"
            >
              Desfazer
            </Button>
          </div>
        )}

      {/* Main Content Area */}
      <div className="space-y-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Suas Notificações ({notifications.length})
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Acompanhe propostas, mensagens diretas, avaliações e alertas do sistema.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllAsRead()}
                className="h-8 text-xs font-bold text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 rounded-xl"
              >
                <CheckCheck className="mr-1.5 h-3.5 w-3.5 text-blue-600" />
                Marcar como lidas
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => fetchNotifications()}
              className="h-8 w-8 text-slate-500 rounded-xl"
              title="Atualizar"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Suspense fallback={<div className="h-9 w-full animate-pulse bg-slate-100 rounded-lg" />}>
          <NotificationFilters />
        </Suspense>

        {/* Notification List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <RefreshCw className="h-6 w-6 animate-spin mb-2 text-blue-600" />
            <p className="text-xs font-semibold">Carregando notificações...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
              <Bell className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Sua caixa está limpa</h3>
            <p className="text-xs text-slate-500 max-w-xs mt-1">
              Você não possui notificações pendentes no momento.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groups.today.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">Hoje</h3>
                <div className="space-y-3">
                  {groups.today.map((item) => (
                    <NotificationItem key={item.id} notification={item} />
                  ))}
                </div>
              </div>
            )}

            {groups.yesterday.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2 mt-4">Ontem</h3>
                <div className="space-y-3">
                  {groups.yesterday.map((item) => (
                    <NotificationItem key={item.id} notification={item} />
                  ))}
                </div>
              </div>
            )}

            {groups.last7Days.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2 mt-4">Últimos 7 dias</h3>
                <div className="space-y-3">
                  {groups.last7Days.map((item) => (
                    <NotificationItem key={item.id} notification={item} />
                  ))}
                </div>
              </div>
            )}

            {groups.older.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2 mt-4">Mais antigas</h3>
                <div className="space-y-3">
                  {groups.older.map((item) => (
                    <NotificationItem key={item.id} notification={item} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  </RoleBasedDashboardLayout>
  );
}
