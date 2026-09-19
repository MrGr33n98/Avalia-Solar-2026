'use client';

import { useState } from 'react';
import { CheckCircle2, CircleAlert, RefreshCw, ShieldAlert } from 'lucide-react';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';
import {
  FounderInboxStatus,
  useFounderInbox,
  useRefreshFounderInbox,
  useUpdateFounderInboxItem,
} from '@/lib/api/sales/founder-inbox';

const statusLabels: Record<FounderInboxStatus | 'active', string> = {
  active: 'Em análise',
  open: 'Abertos',
  acknowledged: 'Reconhecidos',
  resolved: 'Resolvidos',
  dismissed: 'Descartados',
};

export default function FounderInboxPage() {
  const [status, setStatus] = useState<FounderInboxStatus | 'active'>('active');
  const { data, isLoading, error } = useFounderInbox(status === 'active' ? undefined : status);
  const refresh = useRefreshFounderInbox();
  const update = useUpdateFounderInboxItem();
  const records =
    status === 'active'
      ? (data?.records || []).filter(
          (item) => item.status === 'open' || item.status === 'acknowledged'
        )
      : data?.records || [];

  return (
    <SalesLayoutWrapper>
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-950">Founder Inbox</h1>
            <p className="mt-1 text-sm text-slate-600">
              Prioridades com evidência, risco e próxima ação disponível.
            </p>
          </div>
          <button
            type="button"
            onClick={() => refresh.mutate()}
            disabled={refresh.isPending}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-slate-900 px-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={refresh.isPending ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            Atualizar fila
          </button>
        </header>

        <nav className="mt-5 flex gap-2 overflow-x-auto" aria-label="Status do Founder Inbox">
          {(Object.keys(statusLabels) as Array<FounderInboxStatus | 'active'>).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatus(value)}
              className={`h-8 shrink-0 rounded-md px-3 text-sm ${status === value ? 'bg-slate-900 text-white' : 'border border-slate-300 bg-white text-slate-700'}`}
            >
              {statusLabels[value]}
            </button>
          ))}
        </nav>

        {isLoading && <p className="py-12 text-sm text-slate-500">Carregando prioridades...</p>}
        {error && (
          <p className="py-12 text-sm text-rose-700">
            Não foi possível carregar a fila operacional.
          </p>
        )}
        {!isLoading && !error && records.length === 0 && (
          <div className="py-16 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
            <p className="mt-3 text-sm font-medium text-slate-900">
              Nenhum item requer revisão neste momento.
            </p>
          </div>
        )}

        <section className="mt-5 divide-y divide-slate-200 border-y border-slate-200">
          {records.map((item) => (
            <article
              key={item.id}
              className="grid gap-4 py-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-start"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold text-slate-950">{item.title}</h2>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium uppercase text-slate-700">
                    {item.risk_tier}
                  </span>
                  {item.approval_required && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-800">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      Aprovação necessária
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-slate-700">{item.why}</p>
                <p className="mt-2 text-sm font-medium text-slate-900">{item.recommended_action}</p>
                <p className="mt-2 text-xs text-slate-500">
                  Evidências registradas: {item.evidence.length}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {item.status === 'open' && (
                  <button
                    type="button"
                    onClick={() => update.mutate({ id: item.id, status: 'acknowledged' })}
                    className="h-8 rounded-md border border-slate-300 px-3 text-sm text-slate-700"
                  >
                    Reconhecer
                  </button>
                )}
                {item.status !== 'resolved' && (
                  <button
                    type="button"
                    onClick={() => update.mutate({ id: item.id, status: 'resolved' })}
                    className="inline-flex h-8 items-center gap-1 rounded-md bg-emerald-700 px-3 text-sm font-medium text-white"
                  >
                    <CircleAlert className="h-3.5 w-3.5" />
                    Resolver
                  </button>
                )}
              </div>
            </article>
          ))}
        </section>
      </main>
    </SalesLayoutWrapper>
  );
}
