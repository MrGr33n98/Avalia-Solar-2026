'use client';

import { useState } from 'react';
import { ReviewerPageHeader } from '@/components/review-dashboard/layout/ReviewerPageHeader';
import { MetricCard } from '@/components/review-dashboard/cards/MetricCard';
import { EmptyStateCard } from '@/components/review-dashboard/cards/EmptyStateCard';
import { FilterBar } from '@/components/review-dashboard/FilterBar';
import { TipCard } from '@/components/review-dashboard/cards/TipCard';
import { SectionHeader } from '@/components/review-dashboard/SectionHeader';
import { DashboardSkeleton } from '@/components/review-dashboard/DashboardSkeleton';
import { useDashboardContext } from '../DashboardLayoutClient';
import { cn } from '@/lib/utils';
import {
  PenLine,
  FileText,
  CalendarClock,
  Eye,
  Heart,
  Plus,
  TrendingUp,
  Users,
} from 'lucide-react';

const tabs = [
  { id: 'published', label: 'Minhas publicações', icon: PenLine },
  { id: 'drafts', label: 'Rascunhos', icon: FileText },
  { id: 'scheduled', label: 'Agendadas', icon: CalendarClock },
] as const;

type TabId = (typeof tabs)[number]['id'];

export default function PublicacoesPage() {
  const { loading } = useDashboardContext();
  const [activeTab, setActiveTab] = useState<TabId>('published');

  if (loading) return <DashboardSkeleton variant="page" />;

  return (
    <div className="space-y-6">
      <ReviewerPageHeader
        title="Publicações"
        description="Compartilhe sua experiência com energia solar e ajude a comunidade."
        breadcrumbs={[
          { label: 'Dashboard', href: '/review-dashboard' },
          { label: 'Publicações' },
        ]}
        action={
          <a href="/conteudo" className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-amber-500 transition-colors">
            <Plus className="h-4 w-4" />
            Ver conteúdos
          </a>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4">
        <MetricCard
          label="Publicações"
          value="Em breve"
          unavailable
          caption="Total publicadas"
          icon={PenLine}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-50"
        />
        <MetricCard
          label="Visualizações"
          value="Em breve"
          unavailable
          caption="Total de views"
          icon={Eye}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-50"
        />
        <MetricCard
          label="Curtidas"
          value="Em breve"
          unavailable
          caption="Reações recebidas"
          icon={Heart}
          iconColor="text-pink-600"
          iconBgColor="bg-pink-50"
        />
        <MetricCard
          label="Rascunhos"
          value="Em breve"
          unavailable
          caption="Aguardando publicação"
          icon={FileText}
          iconColor="text-amber-600"
          iconBgColor="bg-amber-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Main content */}
        <div className="space-y-4">
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

          {/* Filter */}
          <FilterBar searchPlaceholder="Buscar publicações..." />

          {/* Empty state */}
          <EmptyStateCard
            icon={PenLine}
            title="Publicações em breve"
            description="O módulo de publicações ainda não está disponível para este perfil."

          />
        </div>

        {/* Rail lateral */}
        <div className="space-y-6">
          {/* Dicas de conteúdo */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <SectionHeader title="Dicas de conteúdo" />
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <TrendingUp className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                Compartilhe economia real — dados reais geram mais engajamento.
              </li>
              <li className="flex items-start gap-2">
                <Users className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                Responda perguntas da comunidade — ajuda com Green Score.
              </li>
            </ul>
          </div>

          <TipCard title="Dica para publicações">
            Publicações com fotos e dados reais de economia recebem até 5x mais visualizações.
          </TipCard>

          {/* Conteúdos da comunidade */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <SectionHeader title="Conteúdos da comunidade" />
            <p className="text-sm text-slate-500">
              Explore publicações de outros membros da comunidade solar.
            </p>
            <a
              href="/conteudo"
              className="mt-3 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Ver conteúdos →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
