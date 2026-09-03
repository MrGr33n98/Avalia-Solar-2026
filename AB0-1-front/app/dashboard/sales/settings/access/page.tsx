'use client';

import { useEffect, useState } from 'react';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';

type Role = { id: number; name: string; key: string };
type User = { id: number; email: string; roles: string[] };

export default function SalesAccessPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    fetch('/api/v1/sales/rbac', { credentials: 'include' })
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then((data) => {
        setRoles(data.roles ?? []);
        setUsers(data.users ?? []);
        setState('ready');
      })
      .catch(() => setState('error'));
  }, []);

  return (
    <SalesLayoutWrapper>
      <main className="mx-auto w-full max-w-6xl space-y-6">
        <header>
          <p className="text-xs font-bold uppercase tracking-wider text-blue-800">Settings</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Perfis de acesso e permissões</h1>
          <p className="mt-1 text-sm text-slate-600">Configurações de papéis (RBAC) do CRM.</p>
        </header>

        {state === 'loading' && <p className="text-sm text-slate-500">Carregando permissões…</p>}
        {state === 'error' && <p className="rounded-lg bg-red-50 p-4 text-sm text-red-800">Não foi possível carregar o RBAC.</p>}

        {state === 'ready' && (
          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <h2 className="font-bold text-slate-900">Roles cadastrados ({roles.length})</h2>
              <div className="mt-4 space-y-2">
                {roles.map((role) => (
                  <div key={role.id} className="rounded-lg border border-slate-200 p-3">
                    <p className="font-semibold text-slate-900">{role.name}</p>
                    <p className="text-xs text-slate-500 font-mono">{role.key}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <h2 className="font-bold text-slate-900">Usuários e Permissões ({users.length})</h2>
              <div className="mt-4 space-y-2">
                {users.map((u) => (
                  <div key={u.id} className="rounded-lg border border-slate-200 p-3">
                    <p className="font-semibold text-slate-900">{u.email}</p>
                    <p className="text-xs text-slate-500">{u.roles.join(', ') || 'Nenhum role associado'}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>
    </SalesLayoutWrapper>
  );
}
