'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/app/dashboard/components/DashboardLayout';

type Taxonomy = { id: number; kind: string; name: string; slug: string };

export default function SalesSettingsPage() {
  const [items, setItems] = useState<Taxonomy[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    fetch('/api/v1/sales/taxonomies', { credentials: 'include' })
      .then((response) => {
        if (!response.ok) throw new Error('Falha ao carregar taxonomias.');
        return response.json();
      })
      .then((data) => {
        setItems(data.taxonomies ?? []);
        setState('ready');
      })
      .catch(() => setState('error'));
  }, []);

  return (
    <DashboardLayout className="bg-slate-50/70">
      <main className="mx-auto w-full max-w-6xl space-y-6 p-6">
        <header>
          <p className="text-xs font-bold uppercase tracking-wider text-blue-800">Avalia Solar CRM</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Configurações comerciais</h1>
          <p className="mt-1 text-sm text-slate-600">Taxonomias canônicas carregadas da API Sales.</p>
        </header>
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-slate-900">Taxonomias</h2>
          {state === 'loading' && <p className="mt-4 text-sm text-slate-500">Carregando…</p>}
          {state === 'error' && <p className="mt-4 text-sm text-red-700">Não foi possível carregar configurações.</p>}
          {state === 'ready' && items.length === 0 && <p className="mt-4 text-sm text-slate-500">Nenhuma taxonomia cadastrada.</p>}
          {state === 'ready' && items.length > 0 && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-200 p-3">
                  <p className="text-[10px] font-bold uppercase text-slate-500">{item.kind}</p>
                  <p className="mt-1 font-semibold text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.slug}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </DashboardLayout>
  );
}
