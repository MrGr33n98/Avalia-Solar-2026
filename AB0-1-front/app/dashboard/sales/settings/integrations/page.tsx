'use client';

import { useEffect, useState } from 'react';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';

type Integration = { id: number; name: string; provider: string; status: string };
type Webhook = { id: number; url: string; events: string[]; active: boolean };

export default function SalesIntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/sales/integrations', { credentials: 'include' }).then((r) => r.json()),
      fetch('/api/v1/sales/webhooks', { credentials: 'include' }).then((r) => r.json()),
    ])
      .then(([intData, webData]) => {
        setIntegrations(intData.integrations ?? []);
        setWebhooks(webData.webhooks ?? []);
        setState('ready');
      })
      .catch(() => setState('error'));
  }, []);

  return (
    <SalesLayoutWrapper>
      <main className="mx-auto w-full max-w-6xl space-y-6">
        <header>
          <p className="text-xs font-bold uppercase tracking-wider text-blue-800">Settings</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Integrações e webhooks</h1>
          <p className="mt-1 text-sm text-slate-600">Conexões operacionais do CRM carregadas da API.</p>
        </header>

        {state === 'loading' && <p className="text-sm text-slate-500">Carregando conexões…</p>}
        {state === 'error' && <p className="rounded-lg bg-red-50 p-4 text-sm text-red-800">Não foi possível carregar integrações.</p>}

        {state === 'ready' && (
          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <h2 className="font-bold text-slate-900">Integrações</h2>
              {integrations.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">Nenhuma integração configurada.</p>
              ) : (
                <div className="mt-4 space-y-2">
                  {integrations.map((item) => (
                    <div key={item.id} className="rounded-lg border border-slate-200 p-3">
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">{item.provider} · {item.status}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <h2 className="font-bold text-slate-900">Webhooks</h2>
              {webhooks.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">Nenhum webhook configurado.</p>
              ) : (
                <div className="mt-4 space-y-2">
                  {webhooks.map((item) => (
                    <div key={item.id} className="rounded-lg border border-slate-200 p-3">
                      <p className="break-all text-sm font-semibold text-slate-900">{item.url}</p>
                      <p className="text-xs text-slate-500">{item.active ? 'Ativo' : 'Inativo'} · {item.events.join(', ') || 'Todos os eventos'}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </SalesLayoutWrapper>
  );
}
