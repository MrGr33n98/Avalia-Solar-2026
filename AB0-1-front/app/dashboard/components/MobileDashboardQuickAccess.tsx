'use client';

import { Eye, QrCode, ShieldCheck, Star, TrendingUp, UsersRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MobileDashboardQuickAccessProps {
  activeTab: string;
  company: { verified?: boolean } | null;
  stats: {
    profileViews: number;
    leadsReceived: number;
    reviewsCount: number;
    averageRating: number;
    conversionRate: number;
  } | null;
  onTabChange: (tabId: string) => void;
  onOpenNavigation: () => void;
  visibleTabIds?: string[];
}

const KPI_LIST = [
  { id: 'views', label: 'Visitas', icon: Eye, tab: 'analytics' },
  { id: 'reviews', label: 'Avaliações', icon: Star, tab: 'reviews' },
  { id: 'leads', label: 'Leads', icon: UsersRound, tab: 'leads' },
  { id: 'conversion', label: 'Conversão', icon: TrendingUp, tab: 'analytics' },
] as const;

export default function MobileDashboardQuickAccess(props: MobileDashboardQuickAccessProps) {
  const { company, stats, onTabChange } = props;
  const hasReputationData =
    Number(stats?.reviewsCount || 0) > 0 || Number(stats?.averageRating || 0) > 0;

  if (!hasReputationData) {
    return (
      <section
        className="mb-4 flex min-h-[88px] max-h-[120px] items-center gap-3 rounded-xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] p-3 text-[hsl(var(--dashboard-ink))] lg:hidden"
        aria-label="Resumo de reputação sem avaliações"
        data-testid="reputation-empty-state"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[hsl(var(--dashboard-accent)/0.1)] text-[hsl(var(--dashboard-accent))]">
          <Star className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Sua reputação começa aqui</p>
          <p className="mt-0.5 text-xs text-[hsl(var(--dashboard-muted))]">
            Convide clientes para publicar a primeira avaliação.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          className="shrink-0"
          onClick={() => onTabChange('review-forms')}
        >
          <QrCode className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Coletar
        </Button>
      </section>
    );
  }

  const values = {
    views: Number(stats?.profileViews || 0).toLocaleString('pt-BR'),
    reviews: Number(stats?.reviewsCount || 0).toLocaleString('pt-BR'),
    leads: Number(stats?.leadsReceived || 0).toLocaleString('pt-BR'),
    conversion: `${Number(stats?.conversionRate || 0)
      .toFixed(1)
      .replace('.', ',')}%`,
  };

  return (
    <section
      className="mb-4 rounded-xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] p-3 text-[hsl(var(--dashboard-ink))] lg:hidden"
      aria-label="Faixa de reputação"
      data-testid="reputation-summary"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Star
            className="h-4 w-4 fill-current text-[hsl(var(--dashboard-warning))]"
            aria-hidden="true"
          />
          <strong className="text-sm">
            Nota{' '}
            {Number(stats?.averageRating || 0)
              .toFixed(1)
              .replace('.', ',')}
          </strong>
          <span className="truncate text-xs text-[hsl(var(--dashboard-muted))]">
            · {values.reviews} avaliações
          </span>
        </div>
        {company?.verified && (
          <span className="inline-flex shrink-0 items-center gap-1 text-xs text-[hsl(var(--dashboard-positive))]">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Verificada
          </span>
        )}
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {KPI_LIST.map(({ id, label, icon: Icon, tab }) => {
          const active = props.activeTab === tab;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(tab)}
              className={cn(
                'min-w-0 rounded-lg border px-1.5 py-2 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--dashboard-ring))]',
                active
                  ? 'border-[hsl(var(--dashboard-accent))] bg-[hsl(var(--dashboard-accent)/0.1)]'
                  : 'border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-surface))]'
              )}
              aria-current={active ? 'page' : undefined}
              aria-label={`${label}: ${values[id]}`}
            >
              <Icon
                className="mx-auto h-3.5 w-3.5 text-[hsl(var(--dashboard-muted))]"
                aria-hidden="true"
              />
              <span className="mt-1 block truncate text-[10px] text-[hsl(var(--dashboard-muted))]">
                {label}
              </span>
              <strong className="block truncate text-xs tabular-nums">{values[id]}</strong>
            </button>
          );
        })}
      </div>
    </section>
  );
}
