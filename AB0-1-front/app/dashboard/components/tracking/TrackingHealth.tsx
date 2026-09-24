'use client';

import { AlertTriangle, CheckCircle2, CircleOff, LoaderCircle, XCircle } from 'lucide-react';
import type { TrackingHealth as TrackingHealthData, TrackingHealthStatus } from '@/lib/api';

type Props = { health: TrackingHealthData };

const statusMeta: Record<
  TrackingHealthStatus,
  { label: string; tone: string; Icon: typeof CheckCircle2 }
> = {
  healthy: {
    label: 'Saudável',
    tone: 'text-emerald-700 dark:text-emerald-300',
    Icon: CheckCircle2,
  },
  attention: { label: 'Atenção', tone: 'text-amber-700 dark:text-amber-300', Icon: AlertTriangle },
  unavailable: {
    label: 'Indisponível',
    tone: 'text-slate-600 dark:text-slate-300',
    Icon: CircleOff,
  },
  not_configured: {
    label: 'Não configurado',
    tone: 'text-slate-600 dark:text-slate-300',
    Icon: CircleOff,
  },
  processing: {
    label: 'Processando',
    tone: 'text-blue-700 dark:text-blue-300',
    Icon: LoaderCircle,
  },
  error: { label: 'Erro', tone: 'text-red-700 dark:text-red-300', Icon: XCircle },
};

export default function TrackingHealth({ health }: Props) {
  const overall = statusMeta[health.status] || statusMeta.unavailable;
  const OverallIcon = overall.Icon;

  return (
    <section aria-labelledby="tracking-health-title" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[hsl(var(--dashboard-muted))]">
            Observabilidade
          </p>
          <h2
            id="tracking-health-title"
            className="text-xl font-semibold text-[hsl(var(--dashboard-text))]"
          >
            Saúde da mensuração
          </h2>
        </div>
        <div
          className={
            'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ' +
            overall.tone
          }
        >
          <OverallIcon className="h-4 w-4" aria-hidden="true" />
          <span>{overall.label}</span>
          <span className="text-[hsl(var(--dashboard-muted))]">
            {health.healthy}/{health.total}
          </span>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {health.items.map((item) => {
          const meta = statusMeta[item.status] || statusMeta.unavailable;
          const Icon = meta.Icon;
          return (
            <article
              key={item.key}
              className="rounded-xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium text-[hsl(var(--dashboard-text))]">{item.label}</h3>
                  <p className={'mt-1 text-xs font-medium ' + meta.tone}>{meta.label}</p>
                </div>
                <Icon className={'h-5 w-5 ' + meta.tone} aria-label={meta.label} />
              </div>
              <p className="mt-3 text-sm text-[hsl(var(--dashboard-muted))]">{item.detail}</p>
              <p className="mt-2 text-xs text-[hsl(var(--dashboard-muted))]">
                {item.observed} sinais observados
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
