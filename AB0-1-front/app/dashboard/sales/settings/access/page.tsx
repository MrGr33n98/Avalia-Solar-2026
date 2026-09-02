'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/app/dashboard/components/DashboardLayout';

type Role = { id: number; name: string; slug: string; permissions: string[] };

export default function SalesAccessSettingsPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    fetch('/api/v1/sales/roles', { credentials: 'include' })
      .then((response) => {
        if (!response.ok) throw new Error('Falha ao carregar roles.');
        return response.json();
      })
      .then((data) => {
        setRoles(data.roles ?? []);
        setState('ready');
      })
      .catch(() => setState('error'));
  }, []);

  return (
    <DashboardLayout className="bg-slate-50/70">
      <main className="mx-auto w-full max-w-6xl space-y-6 p-6">
        <header><p className="text-xs font-bold uppercase tracking-wider text-blue-800">Acesso</p><h1 className="mt-2 text-3xl font-bold text-slate-900">Permissões do CRM</h1><p className="mt-1 text-sm text-slate-600">Roles e permissões carregados da API Sales.</p></header>
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-slate-900">Roles cadastrados</h2>
          {state === 'loading' && <p className="mt-4 text-sm text-slate-500">Carregando…</p>}
          {state === 'error' && <p className="mt-4 text-sm text-red-700">Não foi possível carregar permissões.</p>}
          {state === 'ready' && roles.length === 0 && <p className="mt-4 text-sm text-slate-500">Nenhum role cadastrado.</p>}
          {state === 'ready' && roles.length > 0 && <div className="mt-4 grid gap-3 md:grid-cols-2">{roles.map((role) => <article key={role.id} className="rounded-lg border border-slate-200 p-4"><h3 className="font-semibold text-slate-900">{role.name}</h3><p className="text-xs text-slate-500">{role.slug}</p><div className="mt-3 flex flex-wrap gap-1">{role.permissions.map((permission) => <span key={permission} className="rounded bg-blue-50 px-2 py-1 text-[11px] text-blue-800">{permission}</span>)}</div></article>)}</div>}
        </section>
      </main>
    </DashboardLayout>
  );
}
