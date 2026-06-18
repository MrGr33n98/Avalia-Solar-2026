'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Clock, MessageCircle, Star, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface KpiCardsProps {
  data?: {
    estimated_savings?: number;
    quotes_total: number;
    quotes_open: number;
    quotes_replied: number;
    reviews_published: number;
  };
  loading?: boolean;
}

const kpiConfig = [
  {
    key: 'estimated_savings',
    label: 'Economia',
    desktopLabel: 'Economia estimada',
    icon: TrendingUp,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    key: 'quotes_open',
    label: 'em aberto',
    desktopLabel: 'Em aberto',
    icon: Clock,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    key: 'quotes_replied',
    label: 'respondidos',
    desktopLabel: 'Respondidos',
    icon: MessageCircle,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
  },
  {
    key: 'reviews_published',
    label: 'avaliações',
    desktopLabel: 'Avaliações',
    icon: Star,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
];

function formatMetricValue(key: string, value: number) {
  if (key === 'estimated_savings') return `R$ ${value.toLocaleString('pt-BR')},00`;
  return value.toLocaleString('pt-BR');
}

export function KpiCards({ data, loading }: KpiCardsProps) {
  if (loading) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible md:gap-5 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card
            key={i}
            className="min-w-[148px] shrink-0 overflow-hidden rounded-2xl border-slate-100 shadow-sm sm:min-w-0"
          >
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-9 w-9 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-5 w-12" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible md:gap-5 lg:grid-cols-4 [&::-webkit-scrollbar]:hidden">
      {kpiConfig.map((kpi) => {
        const Icon = kpi.icon;
        const value = data?.[kpi.key as keyof typeof data] ?? 0;
        const hasActivity = value > 0 && kpi.key !== 'estimated_savings';

        return (
          <Card
            key={kpi.key}
            className={cn(
              'relative min-w-fit shrink-0 rounded-2xl border border-slate-200 bg-white shadow-sm transition-colors sm:min-w-0',
              hasActivity && 'border-blue-200 bg-blue-50/30'
            )}
          >
            <CardContent className="p-2.5 sm:p-4">
              <div className="flex h-10 items-center gap-2 whitespace-nowrap sm:h-auto sm:gap-3">
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10',
                    kpi.bg
                  )}
                >
                  <Icon className={cn('h-4 w-4 sm:h-5 sm:w-5', kpi.color)} />
                </div>
                <div className="min-w-0">
                  <p className="hidden text-[11px] font-medium text-slate-500 sm:block">
                    {kpi.desktopLabel}
                  </p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-semibold tracking-tight text-slate-950 sm:text-2xl">
                      {formatMetricValue(kpi.key, value)}
                    </span>
                    <span className="text-xs font-medium text-slate-500 sm:hidden">
                      {kpi.label}
                    </span>
                  </div>
                  <p className="hidden text-xs font-medium text-slate-400 sm:block">
                    {kpi.key === 'estimated_savings' ? 'estimada' : 'orçamentos'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
