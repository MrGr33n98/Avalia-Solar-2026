'use client';

import React, { useEffect, useState } from 'react';
import { CheckCheck, Settings2, Bell, RefreshCw } from 'lucide-react';
import { useNotificationStore, Notification } from '@/store/notificationStore';
import { NotificationFilters } from '@/components/notifications/NotificationFilters';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { PromotedCompanyCard } from '@/components/notifications/PromotedCompanyCard';
import { NotificationPreferencesCard } from '@/components/notifications/NotificationPreferencesCard';
import { Button } from '@/components/ui/button';

export default function NotificationsPage() {
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

  const handleUndoArchive = (id: number) => {
    setUndoToast({ id, title: 'Notificação arquivada.' });
    setTimeout(() => {
      setUndoToast(null);
    }, 5000);
  };

  const handleRestore = (id: number) => {
    unarchiveNotification(id);
    setUndoToast(null);
  };

  // Group real notifications by period
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
    <div className="space-y-6 font-sans text-slate-900">
      {/* Undo Toast */}
      {undoToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-4 py-3 border border-slate-800 shadow-2xl rounded-none animate-bounce">
          <span className="text-xs font-semibold">{undoToast.title}</span>
          <Button
            onClick={() => handleRestore(undoToast.id)}
            className="h-6 px-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-none"
          >
            Desfazer
          </Button>
        </div>
      )}

      {/* Grid Layout within Dashboard Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* Left/Center Main Content */}
        <div className="space-y-5 bg-white border border-slate-200 p-6 rounded-none shadow-sm">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Central de notificações
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Acompanhe respostas, orçamentos, avaliações e atualizações importantes.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                onClick={() => markAllAsRead()}
                disabled={unreadCount === 0}
                className="h-8 px-3 text-xs font-bold text-slate-700 border-slate-200 hover:bg-slate-50 rounded-none"
              >
                <CheckCheck className="mr-1.5 h-3.5 w-3.5 text-blue-600" />
                Marcar todas como lidas
              </Button>
              <Button
                onClick={() => {
                  const el = document.getElementById('preferences-card');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="h-8 px-3 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-none"
              >
                <Settings2 className="mr-1.5 h-3.5 w-3.5" />
                Configurar alertas
              </Button>
            </div>
          </div>

          {/* Filter Tabs */}
          <NotificationFilters />

          {/* Real Notification Groups */}
          <div className="space-y-6 pt-2">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-slate-100 animate-pulse border border-slate-200" />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-slate-200 bg-slate-50">
                <Bell className="mx-auto h-10 w-10 text-slate-300 mb-3" />
                <h3 className="text-sm font-bold text-slate-900">Você está em dia</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Não há notificações no momento. Continue comparando empresas ou acompanhe seus orçamentos.
                </p>
                <div className="mt-4 flex justify-center gap-3">
                  <Button
                    onClick={() => fetchNotifications()}
                    className="h-8 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-none"
                  >
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Atualizar
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Hoje */}
                {groups.today.length > 0 && (
                  <section className="space-y-3">
                    <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Hoje</h2>
                    <div className="space-y-3">
                      {groups.today.map((item) => (
                        <NotificationItem
                          key={item.id}
                          notification={item}
                          onUndoArchive={handleUndoArchive}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Ontem */}
                {groups.yesterday.length > 0 && (
                  <section className="space-y-3 pt-2">
                    <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Ontem</h2>
                    <div className="space-y-3">
                      {groups.yesterday.map((item) => (
                        <NotificationItem
                          key={item.id}
                          notification={item}
                          onUndoArchive={handleUndoArchive}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Últimos 7 dias */}
                {groups.last7Days.length > 0 && (
                  <section className="space-y-3 pt-2">
                    <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Últimos 7 dias
                    </h2>
                    <div className="space-y-3">
                      {groups.last7Days.map((item) => (
                        <NotificationItem
                          key={item.id}
                          notification={item}
                          onUndoArchive={handleUndoArchive}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Anteriores */}
                {groups.older.length > 0 && (
                  <section className="space-y-3 pt-2">
                    <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Anteriores
                    </h2>
                    <div className="space-y-3">
                      {groups.older.map((item) => (
                        <NotificationItem
                          key={item.id}
                          notification={item}
                          onUndoArchive={handleUndoArchive}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Paginação Incremental */}
                <div className="pt-4 text-center">
                  <Button
                    variant="outline"
                    onClick={() => fetchNotifications()}
                    className="h-9 px-6 text-xs font-bold text-blue-600 border-blue-200 hover:bg-blue-50 rounded-none uppercase tracking-wider"
                  >
                    Carregar mais
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Sidebar: Sponsor Promoted Card & Alert Preferences */}
        <div className="space-y-5">
          <PromotedCompanyCard />
          <div id="preferences-card">
            <NotificationPreferencesCard />
          </div>
        </div>
      </div>
    </div>
  );
}
