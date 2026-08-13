'use client';

import { useState } from 'react';
import { ReviewerPageHeader } from '@/components/review-dashboard/layout/ReviewerPageHeader';
import { MetricCard } from '@/components/review-dashboard/cards/MetricCard';
import { EmptyStateCard } from '@/components/review-dashboard/cards/EmptyStateCard';
import { TipCard } from '@/components/review-dashboard/cards/TipCard';
import { DashboardSkeleton } from '@/components/review-dashboard/DashboardSkeleton';
import { useDashboardContext } from '../DashboardLayoutClient';
import { cn } from '@/lib/utils';
import { Gift, Wallet, Zap } from 'lucide-react';

const tabs = [
  { id: 'all', label: 'Disponíveis' },
  { id: 'claimed', label: 'Resgatadas' },
] as const;

type TabId = (typeof tabs)[number]['id'];

export default function RecompensasPage() {
  const { loading, summary } = useDashboardContext();
  const [activeTab, setActiveTab] = useState<TabId>('all');

  if (loading) return <DashboardSkeleton variant="page" />;

  const greenScore = summary?.gamification?.green_score;
  const totalPoints = null;
  const claimedCount = null;

  interface RewardItem {
    id: string;
    partner: string;
    points: number;
    title: string;
    description: string;
    available: boolean;
  }

  const rewards: RewardItem[] = [];

  const filtered = activeTab === 'all' ? rewards : [];

  return (
    <div className="space-y-6">
      <ReviewerPageHeader
        title="Recompensas"
        description="Troque seus pontos acumulados por cupons, descontos e prêmios."
        breadcrumbs={[{ label: 'Dashboard', href: '/review-dashboard' }, { label: 'Recompensas' }]}
      />

      {/* KPIs */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4">
        <MetricCard
          label="Pontos disponíveis"
          value={greenScore == null ? null : totalPoints}
          unavailable={greenScore === null || greenScore === undefined}
          caption="Pontos para resgate"
          icon={Zap}
          iconColor="text-amber-500"
          iconBgColor="bg-amber-50"
          highlight
        />
        <MetricCard
          label="Resgates efetuados"
          value={claimedCount}
          unavailable={claimedCount === null || claimedCount === undefined}
          caption="Total de prêmios resgatados"
          icon={Gift}
          iconColor="text-green-600"
          iconBgColor="bg-green-50"
        />
        <MetricCard
          label="Próximo prêmio"
          value="Em breve"
          unavailable
          caption="Ledger de recompensas ainda não disponível"
          icon={Gift}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-50"
        />
        <MetricCard
          label="Pontos expirando"
          value="Em breve"
          unavailable
          caption="Nenhum ponto expira nos próximos 30 dias"
          icon={Wallet}
          iconColor="text-slate-500"
          iconBgColor="bg-slate-50"
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
                  'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Grid de recompensas */}
          {filtered.length === 0 ? (
            <EmptyStateCard
              icon={Gift}
              title="Programa de recompensas em desenvolvimento"
              description="Resgates e parceiros serão exibidos quando existir um ledger auditável."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col justify-between hover:border-blue-200 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                      <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                        {r.partner}
                      </span>
                      <span className="text-sm font-bold text-amber-600">{r.points} pontos</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">{r.title}</h3>
                    <p className="mt-1 text-xs text-slate-500 leading-4">{r.description}</p>
                  </div>

                  <button
                    disabled={!r.available}
                    className={cn(
                      'mt-4 w-full rounded-lg py-2 text-xs font-semibold transition-colors',
                      r.available
                        ? 'bg-amber-400 text-slate-900 hover:bg-amber-500'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    )}
                  >
                    {r.available ? 'Resgatar prêmio' : 'Pontos insuficientes'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rail lateral */}
        <div className="space-y-6">
          <TipCard title="Como ganhar pontos?">
            Cada 1 ponto de Green Score equivale a 2 pontos de resgate. Quanto mais avaliações e
            soluções você cadastrar, mais prêmios poderá obter.
          </TipCard>
        </div>
      </div>
    </div>
  );
}
