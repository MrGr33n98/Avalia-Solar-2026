'use client';

import { useState } from 'react';
import { AddUserSolutionModal } from '@/components/profile/AddUserSolutionModal';
import { ReviewerPageHeader } from '@/components/review-dashboard/layout/ReviewerPageHeader';
import { MetricCard } from '@/components/review-dashboard/cards/MetricCard';
import { EmptyStateCard } from '@/components/review-dashboard/cards/EmptyStateCard';
import { StatusBadge } from '@/components/review-dashboard/StatusBadge';
import { SectionHeader } from '@/components/review-dashboard/SectionHeader';
import { TipCard } from '@/components/review-dashboard/cards/TipCard';
import { DashboardSkeleton } from '@/components/review-dashboard/DashboardSkeleton';
import { useDashboardContext } from '../DashboardLayoutClient';
import { cn } from '@/lib/utils';
import {
  Zap,
  Sun,
  Battery,
  Leaf,
  Plus,
  CheckCircle2,
} from 'lucide-react';

const tabs = [
  { id: 'all', label: 'Todas' },
  { id: 'solar', label: 'Energia Solar' },
  { id: 'battery', label: 'Baterias' },
  { id: 'ev', label: 'Mobilidade' },
] as const;

type TabId = (typeof tabs)[number]['id'];

export default function SolucoesPage() {
  const { loading, solutions, solutionsLoading, solutionsError, addSolution, removeSolution, removingSolutionId } = useDashboardContext();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [modalOpen, setModalOpen] = useState(false);

  if (loading || solutionsLoading) return <DashboardSkeleton variant="page" />;

  const filtered =
    activeTab === 'all'
      ? solutions
      : solutions.filter((s) =>
          s.category.toLowerCase().includes(activeTab === 'solar' ? 'solar' : activeTab === 'battery' ? 'bateria' : 'mobilidade')
        );

  return (
    <div className="space-y-6">
      <AddUserSolutionModal open={modalOpen} onOpenChange={setModalOpen} onAdd={addSolution} />
      <ReviewerPageHeader
        title="Soluções que uso"
        description="Cadastre as soluções de energia sustentável que você utiliza."
        breadcrumbs={[
          { label: 'Dashboard', href: '/review-dashboard' },
          { label: 'Soluções que uso' },
        ]}
        action={
          <button onClick={() => setModalOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-amber-500 transition-colors">
            <Plus className="h-4 w-4" />
            Adicionar solução
          </button>
        }
      />

      {/* Banner motivacional */}
      <div className="rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-5 flex items-center gap-4">
        <div className="rounded-xl bg-green-100 p-3 shrink-0">
          <Leaf className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-green-900">
            Suas soluções impactam o futuro!
          </p>
          <p className="mt-0.5 text-xs text-green-700">
            Cadastre soluções que você realmente utiliza. Elas poderão ser revisadas pela equipe.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Soluções cadastradas"
          value={solutions.length}
          caption={`Meta: 5 soluções`}
          icon={Zap}
          iconColor="text-green-600"
          iconBgColor="bg-green-50"
        />
        <MetricCard
          label="Energia Solar"
          value={solutions.filter((s) => s.category.toLowerCase().includes('solar')).length}
          icon={Sun}
          iconColor="text-amber-500"
          iconBgColor="bg-amber-50"
        />
        <MetricCard
          label="Baterias"
          value={solutions.filter((s) => s.category.toLowerCase().includes('bateria')).length}
          icon={Battery}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-50"
        />
        <MetricCard
          label="Status de verificação"
          value={solutions.length > 0 ? 'Em análise' : 'Sem dados'}
          caption="Nenhuma pontuação é estimada localmente"
          icon={Leaf}
          iconColor="text-green-600"
          iconBgColor="bg-green-50"
          highlight
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
                {tab.id === 'all' && solutions.length > 0 && (
                  <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {solutions.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {solutionsError && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{solutionsError}</div>}

      {/* Solutions */}
          {filtered.length === 0 ? (
            <EmptyStateCard
              icon={Zap}
              title="Nenhuma solução cadastrada"
              description="Adicione uma solução real que você utiliza."
              ctaLabel="Adicionar primeira solução"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((solution) => (
                <div
                  key={solution.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 hover:border-blue-200 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-green-50 p-3 shrink-0">
                      <Zap className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-slate-900">
                          {solution.name || 'Solução'}
                        </h3>
                        <StatusBadge status="active" label={solution.category} />
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        Adicionado em{' '}
                        {solution.created_at ? new Date(solution.created_at).toLocaleDateString('pt-BR') : 'Data indisponível'}
                      </p>
                    </div>
                    <button
                      onClick={() => { if (window.confirm('Remover esta solução?')) void removeSolution(solution.id); }} disabled={removingSolutionId === solution.id}
                      className="shrink-0 text-xs text-slate-400 hover:text-red-500 transition-colors"
                    >
                      {removingSolutionId === solution.id ? 'Removendo...' : 'Remover'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rail lateral */}
        <div className="space-y-6">
          {/* Impacto ambiental */}
          <div className="rounded-xl border border-green-200 bg-green-50/50 p-5">
            <SectionHeader title="Seu impacto ambiental" />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">CO₂ evitado</span>
                <span className="text-sm font-bold text-slate-400">
                  Indisponível
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Energia limpa</span>
                <span className="text-sm font-bold text-slate-400">
                  Indisponível
                </span>
              </div>
            </div>
          </div>

          {/* Dica */}
          <TipCard title="Dica de impacto">
            Cadastre mais soluções para aumentar seu Green Score. Cada solução verificada contribui
            com +20 pontos para o seu Green Score.
          </TipCard>

          {/* Categorias */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <SectionHeader title="Categorias disponíveis" />
            <div className="space-y-2">
              {['Energia Solar Fotovoltaica', 'Bateria de Lítio', 'Veículo Elétrico', 'Aquecedor Solar', 'Bombeamento Solar'].map(
                (cat) => (
                  <div key={cat} className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    {cat}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
