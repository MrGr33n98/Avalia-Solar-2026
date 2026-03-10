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
      <div className="rounded-[28px] border border-border/60 bg-card p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Mobile first
            </p>
            <h2 className="mt-1 text-lg font-semibold text-foreground">Ações prioritárias</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Leads, avaliações e performance ficam acima da dobra.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 rounded-full"
            onClick={props.onOpenNavigation}
          >
            Mais
            <ChevronRight className="ml-1 h-4 w-4" />
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
                  'h-auto min-h-[132px] flex-col items-start justify-start gap-3 rounded-2xl px-4 py-4 text-left',
                  isActive && 'border-primary bg-primary/5 text-primary'
                )}
                onClick={() => props.onTabChange(item.id)}
              >
                <div className="flex w-full items-start justify-between gap-3">
                  <div
                    className={cn(
                      'flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-muted-foreground',
                      isActive && 'bg-primary/10 text-primary'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  {isActive && <Badge className="rounded-full">Atual</Badge>}
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {copy.eyebrow}
                  </p>
                  <p className="text-sm font-semibold text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{copy.getMetric(props)}</p>
                  <p className="text-xs leading-5 text-muted-foreground">{copy.getDescription(props)}</p>
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
