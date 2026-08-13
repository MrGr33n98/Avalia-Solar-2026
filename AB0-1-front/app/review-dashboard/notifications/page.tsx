'use client';

import { useState } from 'react';
import { ReviewerPageHeader } from '@/components/review-dashboard/layout/ReviewerPageHeader';
import { MetricCard } from '@/components/review-dashboard/cards/MetricCard';
import { EmptyStateCard } from '@/components/review-dashboard/cards/EmptyStateCard';
import { StatusBadge } from '@/components/review-dashboard/StatusBadge';
import { SectionHeader } from '@/components/review-dashboard/SectionHeader';
import { TipCard } from '@/components/review-dashboard/cards/TipCard';
import { DashboardSkeleton } from '@/components/review-dashboard/DashboardSkeleton';
import { useDashboardContext } from '../DashboardLayoutClient';
import { cn } from '@/lib/utils';
import { Bell, CheckSquare, BellOff, ArrowRight, MessageSquare, Trophy, Shield } from 'lucide-react';

const tabs = [
  { id: 'all', label: 'Todas', badge: 3 },
  { id: 'unread', label: 'Não lidas', badge: 2 },
  { id: 'system', label: 'Sistema' },
  { id: 'replies', label: 'Respostas' },
] as const;

type TabId = (typeof tabs)[number]['id'];

export default function NotificacoesPage() {
  const { loading } = useDashboardContext();
  const [activeTab, setActiveTab] = useState<TabId>('all');

  if (loading) return <DashboardSkeleton variant="page" />;

  const mockNotifications = [
    {
      id: 'n1',
      title: 'Nova resposta na sua avaliação',
      description: 'A empresa WEG Solar respondeu ao seu comentário na página deles.',
      time: 'Há 10 minutos',
      unread: true,
      category: 'replies',
      icon: MessageSquare,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      id: 'n2',
      title: 'Solução verificada com sucesso!',
      description: 'Sua solução de painel solar fotovoltaico foi validada pela equipe técnica.',
      time: 'Há 2 horas',
      unread: true,
      category: 'system',
      icon: Shield,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      id: 'n3',
      title: 'Nova conquista desbloqueada!',
      description: 'Parabéns! Você desbloqueou a conquista "Primeira avaliação".',
      time: '1 dia atrás',
      unread: false,
      category: 'system',
      icon: Trophy,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
  ];

  const filtered = mockNotifications.filter((n) => {
    if (activeTab === 'unread') return n.unread;
    if (activeTab === 'system') return n.category === 'system';
    if (activeTab === 'replies') return n.category === 'replies';
    return true;
  });

  return (
    <div className="space-y-6">
      <ReviewerPageHeader
        title="Notificações"
        description="Fique por dentro de tudo o que acontece na plataforma Avalia Solar."
        breadcrumbs={[
          { label: 'Dashboard', href: '/review-dashboard' },
          { label: 'Notificações' },
        ]}
        action={
          <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
            <CheckSquare className="h-4 w-4" />
            Marcar todas como lidas
          </button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Notificações"
          value={mockNotifications.length}
          caption="Total recebido"
          icon={Bell}
          iconColor="text-slate-500"
          iconBgColor="bg-slate-50"
        />
        <MetricCard
          label="Não lidas"
          value={mockNotifications.filter((n) => n.unread).length}
          caption="Aguardando leitura"
          icon={Bell}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-50"
          highlight
        />
        <MetricCard
          label="Lidas"
          value={mockNotifications.filter((n) => !n.unread).length}
          caption="Histórico de leitura"
          icon={CheckSquare}
          iconColor="text-green-600"
          iconBgColor="bg-green-50"
        />
        <MetricCard
          label="Preferências"
          value="E-mail / Push"
          caption="Configuração activa"
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
                {(tab as any).badge && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {(tab as any).badge}
                  </span>
                )}
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
                const Icon = n.icon;
                return (
                  <div
                    key={n.id}
                    className={cn(
                      'p-4 flex items-start gap-4 transition-colors',
                      n.unread ? 'bg-blue-50/10' : 'bg-white'
                    )}
                  >
                    {/* Unread indicator */}
                    <div className="pt-2 shrink-0">
                      <span
                        className={cn(
                          'block h-2 w-2 rounded-full',
                          n.unread ? 'bg-blue-600 animate-pulse' : 'bg-transparent'
                        )}
                      />
                    </div>

                    <div className={cn('rounded-xl p-2.5 shrink-0', n.iconBg)}>
                      <Icon className={cn('h-5 w-5', n.iconColor)} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 leading-5">{n.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500 leading-4">{n.description}</p>
                      <span className="mt-1.5 inline-block text-[11px] text-slate-400">
                        {n.time}
                      </span>
                    </div>

                    <button className="shrink-0 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
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
                <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                Respostas de empresas
              </label>
              <label className="flex items-center gap-3 text-xs text-slate-600">
                <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                Novas conquistas
              </label>
              <label className="flex items-center gap-3 text-xs text-slate-600">
                <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
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
