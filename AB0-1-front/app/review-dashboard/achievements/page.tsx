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
import { Trophy, Award, Lock, CheckCircle2, Star, Zap } from 'lucide-react';

const tabs = [
  { id: 'all', label: 'Todas' },
  { id: 'unlocked', label: 'Conquistadas' },
  { id: 'locked', label: 'Bloqueadas' },
] as const;

type TabId = (typeof tabs)[number]['id'];

export default function ConquistasPage() {
  const { loading, summary, reviews, solutions } = useDashboardContext();
  const [activeTab, setActiveTab] = useState<TabId>('all');

  if (loading) return <DashboardSkeleton variant="page" />;

  const greenScore = summary?.gamification?.green_score ?? 0;
  const reviewsCount = reviews.length;
  const solutionsCount = solutions.length;

  const mockAchievements = [
    {
      id: 'first_review',
      title: 'Primeira avaliação',
      description: 'Publique sua primeira avaliação na plataforma.',
      xp: 50,
      unlocked: reviewsCount > 0,
      icon: Star,
    },
    {
      id: 'conscious_reviewer',
      title: 'Avaliador consciente',
      description: 'Publique 5 avaliações sobre soluções sustentáveis.',
      xp: 150,
      unlocked: reviewsCount >= 5,
      icon: Trophy,
    },
    {
      id: 'first_solution',
      title: 'Primeira solução',
      description: 'Cadastre sua primeira solução sustentável em uso.',
      xp: 50,
      unlocked: solutionsCount > 0,
      icon: Zap,
    },
    {
      id: 'green_pioneer',
      title: 'Pioneiro verde',
      description: 'Alcance 500 pontos no seu Green Score.',
      xp: 200,
      unlocked: greenScore >= 500,
      icon: Award,
    },
  ];

  const filtered = mockAchievements.filter((a) => {
    if (activeTab === 'unlocked') return a.unlocked;
    if (activeTab === 'locked') return !a.unlocked;
    return true;
  });

  const unlockedCount = mockAchievements.filter((a) => a.unlocked).length;

  return (
    <div className="space-y-6">
      <ReviewerPageHeader
        title="Conquistas"
        description="Acompanhe suas conquistas e acumule pontos de experiência (XP)."
        breadcrumbs={[
          { label: 'Dashboard', href: '/review-dashboard' },
          { label: 'Conquistas' },
        ]}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Conquistas"
          value={`${unlockedCount}/${mockAchievements.length}`}
          caption="Desbloqueadas"
          icon={Trophy}
          iconColor="text-amber-500"
          iconBgColor="bg-amber-50"
        />
        <MetricCard
          label="Green Score"
          value={greenScore}
          caption="Pontuação atual"
          icon={Award}
          iconColor="text-green-600"
          iconBgColor="bg-green-50"
          highlight
        />
        <MetricCard
          label="XP Acumulado"
          value={unlockedCount * 50}
          caption="Pontos de experiência"
          icon={Zap}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-50"
        />
        <MetricCard
          label="Próximo nível"
          value={greenScore >= 500 ? 'Ouro' : 'Prata'}
          caption="Nível de avaliador"
          icon={Lock}
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

          {/* Grid de conquistas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((a) => {
              const Icon = a.icon;
              return (
                <div
                  key={a.id}
                  className={cn(
                    'rounded-xl border p-5 flex items-start gap-4 transition-colors bg-white',
                    a.unlocked ? 'border-slate-200' : 'border-slate-100 opacity-75'
                  )}
                >
                  <div
                    className={cn(
                      'rounded-xl p-3 shrink-0',
                      a.unlocked ? 'bg-amber-50' : 'bg-slate-50'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-6 w-6',
                        a.unlocked ? 'text-amber-500' : 'text-slate-400'
                      )}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-slate-900">{a.title}</h3>
                      {a.unlocked ? (
                        <StatusBadge status="approved" label="Desbloqueada" />
                      ) : (
                        <StatusBadge status="draft" label="Bloqueada" />
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-500 leading-4">{a.description}</p>
                    <span className="mt-2 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                      +{a.xp} XP
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rail lateral */}
        <div className="space-y-6">
          <TipCard title="Como ganhar XP?">
            Publique avaliações completas, cadastre novas soluções em uso, e faça publicações na
            plataforma para acumular XP e subir de nível.
          </TipCard>

          {/* Próximos desafios */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <SectionHeader title="Próximos desafios" />
            <div className="space-y-3">
              <ChallengeItem
                title="Avaliador engajado"
                description="Publique 3 avaliações em um mês."
                progress={reviewsCount}
                target={3}
              />
              <ChallengeItem
                title="Eco-líder"
                description="Alcance 1000 no Green Score."
                progress={greenScore}
                target={1000}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChallengeItem({
  title,
  description,
  progress,
  target,
}: {
  title: string;
  description: string;
  progress: number;
  target: number;
}) {
  const pct = Math.min(Math.round((progress / target) * 100), 100);

  return (
    <div>
      <div className="flex items-center justify-between text-xs font-medium mb-1">
        <span className="text-slate-700">{title}</span>
        <span className="text-slate-500">
          {progress}/{target}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full bg-blue-600" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-[10px] text-slate-400 leading-3">{description}</p>
    </div>
  );
}
