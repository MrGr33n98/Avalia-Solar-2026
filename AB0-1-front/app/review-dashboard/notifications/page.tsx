'use client';

import { useEffect, useState } from 'react';
import { ReviewerPageHeader } from '@/components/review-dashboard/layout/ReviewerPageHeader';
import { MetricCard } from '@/components/review-dashboard/cards/MetricCard';
import { EmptyStateCard } from '@/components/review-dashboard/cards/EmptyStateCard';
import { SectionHeader } from '@/components/review-dashboard/SectionHeader';
import { TipCard } from '@/components/review-dashboard/cards/TipCard';
import { useDashboardContext } from '../DashboardLayoutClient';
import { useNotificationStore } from '@/store/notificationStore';
import { cn } from '@/lib/utils';
import { track } from '@/lib/analytics/lazy';
import { Bell, CheckSquare, BellOff, ArrowRight, Shield } from 'lucide-react';

const tabs = [
  { id: 'all', label: 'Todas' },
  { id: 'unread', label: 'Não lidas' },
  { id: 'system', label: 'Sistema' },
  { id: 'replies', label: 'Respostas' },
] as const;

type TabId = (typeof tabs)[number]['id'];

export default function NotificacoesPage() {
  const { loading } = useDashboardContext();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const { notifications, unreadCount, fetchNotifications, markAllAsRead } = useNotificationStore();

  useEffect(() => {
    fetchNotifications(
      activeTab === 'replies' ? 'reviews' : activeTab === 'all' ? 'all' : activeTab
    );
  }, [activeTab, fetchNotifications]);

  const filtered = notifications;

  return (
    <div className="space-y-6">
      <ReviewerPageHeader
        title="Notificações"
        description="Fique por dentro de tudo o que acontece na plataforma Avalia Solar."
        breadcrumbs={[{ label: 'Dashboard', href: '/review-dashboard' }, { label: 'Notificações' }]}
        action={
          <button
            onClick={() => {
              track('reviewer_notifications_marked_all_read', {
                route: '/review-dashboard/notifications',
              });
              void markAllAsRead();
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <CheckSquare className="h-4 w-4" />
            Marcar todas como lidas
          </button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4">
        <MetricCard
          label="Notificações"
          value={notifications.length}
          caption="Total recebido"
          icon={Bell}
          iconColor="text-slate-500"
          iconBgColor="bg-slate-50"
        />
        <MetricCard
          label="Não lidas"
          value={unreadCount}
          caption="Aguardando leitura"
          icon={Bell}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-50"
          highlight
        />
        <MetricCard
          label="Lidas"
          value={notifications.filter((n) => n.read).length}
          caption="Histórico de leitura"
          icon={CheckSquare}
          iconColor="text-green-600"
          iconBgColor="bg-green-50"
        />
        <MetricCard
          label="Preferências"
          value="Ativas"
          caption="E-mail / Push ativado"
          icon={Shield}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Main content */}
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Feed de notificações */}
          {filtered.length === 0 ? (
            <EmptyStateCard
              icon={BellOff}
              title="Sem notificações por aqui"
              description="Nós avisaremos você quando receber novas respostas, conquistas ou novidades."
            />
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden divide-y divide-slate-100">
              {filtered.map((n) => {
                const Icon = Bell;
                return (
                  <div
                    key={n.id}
                    className={cn(
                      'p-4 flex items-start gap-4 transition-colors',
                      !n.read ? 'bg-blue-50/10' : 'bg-white'
                    )}
                  >
                    {/* Unread indicator */}
                    <div className="pt-2 shrink-0">
                      <span
                        className={cn(
                          'block h-2 w-2 rounded-full',
                          !n.read ? 'bg-blue-600 animate-pulse' : 'bg-transparent'
                        )}
                      />
                    </div>

                    <div className={cn('rounded-xl p-2.5 shrink-0', 'bg-blue-50')}>
                      <Icon className={cn('h-5 w-5', 'text-blue-600')} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 leading-5">{n.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500 leading-4">{n.body}</p>
                      <span className="mt-1.5 inline-block text-[11px] text-slate-400">
                        {new Date(n.created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        if (!n.read) {
                          track('reviewer_notification_opened', {
                            entity_id: n.id,
                            entity_type: 'notification',
                          });
                          void useNotificationStore.getState().markAsRead(n.id);
                        }
                      }}
                      className="shrink-0 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      Ver detalhe
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Rail lateral */}
        <div className="space-y-6">
          <TipCard title="Configurações de alerta">
            Ative notificações push no navegador ou por e-mail para receber alertas em tempo real.
          </TipCard>

          {/* Preferências rápidas */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <SectionHeader title="Notificações por e-mail" />
            <div className="space-y-3">
              <label className="flex items-center gap-3 text-xs text-slate-600">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Respostas de empresas
              </label>
              <label className="flex items-center gap-3 text-xs text-slate-600">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Novas conquistas
              </label>
              <label className="flex items-center gap-3 text-xs text-slate-600">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Atualizações de sistema
              </label>
            </div>
            <a
              href="/review-dashboard/settings"
              className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              Gerenciar preferências
              <ArrowRight className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
