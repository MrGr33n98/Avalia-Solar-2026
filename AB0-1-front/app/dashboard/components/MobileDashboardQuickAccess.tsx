'use client';

import { useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { CommandMenu } from './CommandMenu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getFlatNavigationByContext } from '@/config/navigation';

interface MobileDashboardQuickAccessProps {
  activeTab: string;
  company: any;
  stats: {
    profileViews: number;
    leadsReceived: number;
    reviewsCount: number;
    averageRating: number;
    conversionRate: number;
  } | null;
  onTabChange: (tabId: string) => void;
  onOpenNavigation: () => void;
}

const QUICK_ACTION_COPY: Record<
  string,
  {
    eyebrow: string;
    getMetric: (props: MobileDashboardQuickAccessProps) => string;
    getDescription: (props: MobileDashboardQuickAccessProps) => string;
  }
> = {
  overview: {
    eyebrow: 'Hoje',
    getMetric: ({ stats }) => `${formatMetric(stats?.profileViews ?? 0)} visitas`,
    getDescription: () => 'Acompanhe o resumo do dia e destrave as próximas ações.',
  },
  reviews: {
    eyebrow: 'Confiança',
    getMetric: ({ stats }) => `${formatMetric(stats?.reviewsCount ?? 0)} avaliações`,
    getDescription: ({ stats }) =>
      (stats?.averageRating ?? 0) > 0
        ? `Nota média ${Number(stats?.averageRating ?? 0).toFixed(1)}`
        : 'Veja feedbacks recentes e responda mais rápido.',
  },
  leads: {
    eyebrow: 'Pipeline',
    getMetric: ({ stats }) => `${formatMetric(stats?.leadsReceived ?? 0)} leads`,
    getDescription: () => 'Priorize novas oportunidades e avance negociações.',
  },
  'ranking-performance': {
    eyebrow: 'Ranking',
    getMetric: ({ stats }) => `${Number(stats?.conversionRate ?? 0).toFixed(1)}% conversão`,
    getDescription: () => 'Monitore visibilidade, cliques e posição da empresa.',
  },
  'trust-widget': {
    eyebrow: 'Distribuição',
    getMetric: ({ stats, company }) =>
      company?.verified ? 'Empresa verificada' : `${formatMetric(stats?.reviewsCount ?? 0)} provas sociais`,
    getDescription: () => 'Copie e compartilhe o selo de confiança sem sair do mobile.',
  },
};

export default function MobileDashboardQuickAccess(props: MobileDashboardQuickAccessProps) {
  const primaryActions = useMemo(
    () =>
      getFlatNavigationByContext('quick_access')
        .filter((item) => QUICK_ACTION_COPY[item.id])
        .slice(0, 5),
    []
  );

  return (
    <section className="lg:hidden mb-6" aria-label="Atalhos mobile do dashboard">
      <div className="rounded-2xl border-[0.5px] border-white/10 bg-[#002B4D] p-4 shadow-none">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-cyan">
              Mobile access
            </p>
            <h2 className="mt-1 text-lg font-bold text-white tracking-tight">Ações prioritárias</h2>
            <p className="mt-1 text-xs text-white/40 font-medium">
              Leads, avaliações e performance em tempo real.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 rounded-lg bg-white/5 border-white/10 text-white hover:bg-white/10"
            onClick={props.onOpenNavigation}
          >
            Menu
            <ChevronRight className="ml-1 h-[18px] w-[18px]" />
          </Button>
        </div>

        <div className="mt-4">
          <CommandMenu onSelectTab={props.onTabChange} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {primaryActions.map((item) => {
            const Icon = item.icon;
            const copy = QUICK_ACTION_COPY[item.id];
            const isActive = props.activeTab === item.id;

            return (
              <Button
                key={item.id}
                type="button"
                variant="outline"
                className={cn(
                  'h-auto min-h-[140px] flex-col items-start justify-start gap-3 rounded-xl px-4 py-4 text-left transition-all border-[0.5px]',
                  isActive 
                    ? 'border-brand-blue/40 bg-brand-blue/10' 
                    : 'border-white/5 bg-white/5 text-white/60 hover:bg-white/10'
                )}
                onClick={() => props.onTabChange(item.id)}
              >
                <div className="flex w-full items-start justify-between gap-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg border-[0.5px]',
                      isActive 
                        ? 'bg-brand-blue text-white border-white/20' 
                        : 'bg-black/20 text-white/40 border-white/5'
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </div>

                  {isActive && (
                    <Badge className="rounded-md bg-brand-blue text-white text-[9px] font-bold uppercase tracking-wider border-none px-1.5 h-4">
                      Active
                    </Badge>
                  )}
                </div>

                <div className="space-y-1">
                  <p className={cn(
                    "text-[10px] font-bold uppercase tracking-widest",
                    isActive ? "text-brand-cyan" : "text-white/30"
                  )}>
                    {copy.eyebrow}
                  </p>
                  <p className={cn(
                    "text-sm font-bold tracking-tight",
                    isActive ? "text-white" : "text-white/80"
                  )}>{item.label}</p>
                  <p className="text-[10px] font-bold text-white/40 font-mono tracking-tighter">{copy.getMetric(props)}</p>
                </div>
              </Button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function formatMetric(value: number): string {
  return Number(value || 0).toLocaleString('pt-BR');
}
