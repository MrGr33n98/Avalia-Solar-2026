'use client';

import { Eye, QrCode, ShieldCheck, Star, TrendingUp, UsersRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MobileDashboardQuickAccessProps {
  activeTab: string;
  company: {
    verified?: boolean;
  } | null;
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

const KPI_LIST: Array<{
  id: string;
  label: string;
  icon: typeof Eye;
  getValue: (props: MobileDashboardQuickAccessProps) => string;
  getHref: () => string;
}> = [
  {
    id: 'views',
    label: 'Visitas',
    icon: Eye,
    getValue: ({ stats }) => formatMetric(stats?.profileViews ?? 0),
    getHref: () => 'analytics',
  },
  {
    id: 'reviews',
    label: 'Avaliações',
    icon: Star,
    getValue: ({ stats }) => formatMetric(stats?.reviewsCount ?? 0),
    getHref: () => 'reviews',
  },
  {
    id: 'leads',
    label: 'Leads',
    icon: UsersRound,
    getValue: ({ stats }) => formatMetric(stats?.leadsReceived ?? 0),
    getHref: () => 'leads',
  },
  {
    id: 'conversion',
    label: 'Conversão',
    icon: TrendingUp,
    getValue: ({ stats }) => `${Number(stats?.conversionRate ?? 0).toFixed(1).replace('.', ',')}%`,
    getHref: () => 'analytics',
  },
];

export default function MobileDashboardQuickAccess(props: MobileDashboardQuickAccessProps) {
  const { company, stats, onTabChange } = props;
  const averageRating = Number(stats?.averageRating ?? 0);
  const verified = Boolean(company?.verified);

  return (
    <section
      className="mb-4 rounded-2xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] p-3 shadow-none sm:p-4 lg:hidden"
      aria-label="Ações prioritárias"
    >
      {/* Header */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-cyan">Resumo</p>
        <h2 className="mt-0.5 text-base font-bold text-white tracking-tight">Ações prioritárias</h2>
      </div>

      {/* KPIs 2×2 compactos */}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-3">
        {KPI_LIST.map((kpi) => {
          const Icon = kpi.icon;
          const isActive = props.activeTab === kpi.getHref();
          return (
            <button
              key={kpi.id}
              type="button"
              onClick={() => onTabChange(kpi.getHref())}
              className={cn(
                'flex min-h-[88px] flex-col items-start justify-between rounded-xl border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
                isActive
                  ? 'border-brand-cyan/40 bg-white/10'
                  : 'border-white/10 bg-white/5 hover:bg-white/[0.08]'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="flex w-full items-center justify-between gap-2">
                <span className={cn('text-[10px] font-semibold uppercase tracking-wider', isActive ? 'text-brand-cyan' : 'text-white/50')}>
                  {kpi.label}
                </span>
                <Icon className={cn('h-3.5 w-3.5 shrink-0', isActive ? 'text-brand-cyan' : 'text-white/30')} aria-hidden="true" />
              </div>
              <span className="text-lg font-bold tabular-nums tracking-tight text-white sm:text-xl">
                {kpi.getValue(props)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Linha de confiança */}
      <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
        {verified ? (
          <>
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
            <span className="min-w-0 flex-1 text-xs font-medium text-white/90">Empresa verificada</span>
          </>
        ) : (
          <>
            <Star className={cn('h-4 w-4 shrink-0', averageRating > 0 ? 'text-amber-400' : 'text-white/30')} aria-hidden="true" />
            <span className="min-w-0 flex-1 text-xs font-medium text-white/90">
              {averageRating > 0
                ? `Nota média ${averageRating.toFixed(1).replace('.', ',')} · ${formatMetric(stats?.reviewsCount ?? 0)} avaliações`
                : 'Ainda não há avaliações recebidas'}
            </span>
          </>
        )}
      </div>

      {/* CTA primário */}
      <Button
        type="button"
        className="mt-3 h-10 w-full gap-2 rounded-xl bg-brand-cyan text-sm font-bold text-slate-900 hover:bg-brand-cyan/90"
        onClick={() => onTabChange('review-forms')}
      >
        <QrCode className="h-4 w-4" aria-hidden="true" />
        Coletar avaliações
      </Button>
    </section>
  );
}

function formatMetric(value: number): string {
  return Number(value || 0).toLocaleString('pt-BR');
}
