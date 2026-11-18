'use client';

import { useState, useCallback } from 'react';
import { ReviewerPageHeader } from '@/components/review-dashboard/layout/ReviewerPageHeader';
import { SectionHeader } from '@/components/review-dashboard/SectionHeader';
import { TipCard } from '@/components/review-dashboard/cards/TipCard';
import { EmptyStateCard } from '@/components/review-dashboard/cards/EmptyStateCard';
import { useDashboardContext } from '../DashboardLayoutClient';
import { cn } from '@/lib/utils';
import { User, Shield, Bell, Lock, Globe, EyeOff, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { fetchReviewerBrandUsages, updateReviewerBrandUsage } from '@/lib/api/reviewer-brand-usages';

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
  const [revoking, setRevoking] = useState(false);
  const [revokeSuccess, setRevokeSuccess] = useState<string | null>(null);

  const handleRevokeAllPublicBrands = async () => {
    const confirmed = window.confirm(
      'Deseja realmente revogar a visibilidade pública de todas as marcas? Elas permanecerão salvas na sua conta como privadas.'
    );
    if (!confirmed) return;

    setRevoking(true);
    setRevokeSuccess(null);
    try {
      const resp = await fetchReviewerBrandUsages({ status: 'active', limit: 100 });
      const publicBrands = resp.data.filter((b) => b.visibility === 'public');
      for (const brand of publicBrands) {
        await updateReviewerBrandUsage(brand.id, {
          visibility: 'private',
          lock_version: brand.lock_version,
        });
      }
      setRevokeSuccess(`Visibilidade pública revogada com sucesso para ${publicBrands.length} marcas.`);
    } catch {
      alert('Falha ao revogar visibilidade pública. Tente novamente.');
    } finally {
      setRevoking(false);
    }
  };

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

          {activeTab === 'privacy' && (
            <div className="space-y-4" data-testid="settings-privacy-tab">
              <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
                <SectionHeader title="Privacidade e Consentimento de Marcas (LGPD)" />
                <p className="text-xs text-slate-500 leading-relaxed">
                  Por padrão, todas as marcas e projetos que você cadastra na Central do Avaliador são <strong>privados</strong>. Eles só se tornam visíveis no seu perfil público de Creator mediante sua autorização explícita.
                </p>

                {revokeSuccess && (
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{revokeSuccess}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">Revogação Global de Visibilidade</h4>
                    <p className="text-xs text-slate-500">
                      Torna todas as marcas ativas privadas imediatamente, removendo-as do perfil público do Creator.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRevokeAllPublicBrands}
                    disabled={revoking}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors whitespace-nowrap"
                    data-testid="revoke-public-brands-button"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>{revoking ? 'Revogando...' : 'Tornar todas as marcas privadas'}</span>
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-3">
                <SectionHeader title="Seus Direitos como Titular de Dados" />
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-50/50 border border-blue-100 text-xs text-[#17468D]">
                  <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>
                    Em conformidade com a LGPD (Lei 13.709/2018), você possui total controle sobre suas autodeclarações de marcas, projetos e dados pessoais. Você pode editar, alternar visibilidade ou excluir qualquer declaração factual a qualquer momento.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4" data-testid="settings-notifications-tab">
              <SectionHeader title="Preferências de Notificação" />
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Status de Verificação Técnica</p>
                    <p className="text-xs text-slate-500">Receba notificações quando uma marca ou projeto for homologado com evidência documental.</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Atualizações de Fabricantes Parceiros</p>
                    <p className="text-xs text-slate-500">Avisos quando novas marcas ou equipamentos do catálogo forem associados à sua região.</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                </div>
              </div>
            </div>
          )}

          {activeTab !== 'profile' && activeTab !== 'privacy' && activeTab !== 'notifications' && (
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
