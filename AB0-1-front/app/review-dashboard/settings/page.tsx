'use client';

import { useState } from 'react';
import { ReviewerPageHeader } from '@/components/review-dashboard/layout/ReviewerPageHeader';
import { SectionHeader } from '@/components/review-dashboard/SectionHeader';
import { TipCard } from '@/components/review-dashboard/cards/TipCard';
import { EmptyStateCard } from '@/components/review-dashboard/cards/EmptyStateCard';
import { useDashboardContext } from '../DashboardLayoutClient';
import { cn } from '@/lib/utils';
import { User, Shield, Bell, Lock, Globe } from 'lucide-react';

const tabs = [
  { id: 'profile', label: 'Perfil e conta', icon: User },
  { id: 'privacy', label: 'Privacidade', icon: Shield },
  { id: 'notifications', label: 'Notificações', icon: Bell },
  { id: 'security', label: 'Segurança', icon: Lock },
  { id: 'others', label: 'Outros', icon: Globe },
] as const;

type TabId = (typeof tabs)[number]['id'];

export default function ConfiguraçõesPage() {
  const { loading } = useDashboardContext();
  const [activeTab, setActiveTab] = useState<TabId>('profile');

  return (
    <div className="space-y-6">
      <ReviewerPageHeader
        title="Configurações"
        description="Gerencie suas preferências, conta e segurança."
        breadcrumbs={[
          { label: 'Dashboard', href: '/review-dashboard' },
          { label: 'Configurações' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Main content */}
        <div className="space-y-6">
          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
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
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab content: Profile and Account */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
                <SectionHeader title="Preferências da conta" />
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Idioma
                    </label>
                    <select className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300">
                      <option>Português (Brasil)</option>
                      <option>English</option>
                      <option>Español</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Fuso horário
                    </label>
                    <select className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300">
                      <option>(GMT-03:00) Brasília</option>
                      <option>(GMT-04:00) Manaus</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Compactar menu</p>
                      <p className="text-xs text-slate-500">
                        Deixar o menu lateral mais compacto por padrão.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Danger zone */}
              <div className="rounded-xl border border-red-200 bg-red-50/30 p-6 space-y-4">
                <SectionHeader title="Zona de perigo" className="text-red-950" />
                <p className="text-xs text-red-700 leading-4">
                  Ao excluir sua conta, todos os seus dados, avaliações e conquistas serão removidos
                  permanentemente. Esta ação não pode ser desfeita.
                </p>
                <button
                  type="button"
                  disabled
                  title="Exclusão de conta ainda não disponível"
                  className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg bg-slate-300 px-4 py-2 text-sm font-semibold text-slate-500"
                >
                  Excluir minha conta (em breve)
                </button>
              </div>
            </div>
          )}

          {activeTab !== 'profile' && (
            <EmptyStateCard
              icon={Shield}
              title="Ainda não disponível"
              description="Esta seção de configurações estará disponível em breve."
            />
          )}
        </div>

        {/* Rail lateral */}
        <div className="space-y-6">
          <TipCard title="Segurança da conta">
            Recomendamos o uso de senhas fortes e autenticação em duas etapas (2FA) para proteger
            sua conta.
          </TipCard>

          {/* Dica de progresso */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <SectionHeader title="Seu progresso" />
            <p className="text-xs text-slate-500">
              Conta verificada e segura. Suas preferências ajudam a personalizar sua experiência no
              marketplace.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
