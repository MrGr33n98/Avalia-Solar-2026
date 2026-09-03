'use client';

import { useState } from 'react';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SalesAccessAssignPage() {
  const [userId, setUserId] = useState('');
  const [roleId, setRoleId] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const assign = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch('/api/v1/sales/rbac/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ user_id: userId, role_id: roleId }),
      });
      if (!response.ok) throw new Error();
      setMessage('Role atribuído com sucesso.');
      setUserId('');
      setRoleId('');
    } catch {
      setMessage('Erro ao atribuir role.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SalesLayoutWrapper>
      <main className="mx-auto w-full max-w-3xl space-y-6">
        <header>
          <p className="text-xs font-bold uppercase tracking-wider text-blue-800">Acesso</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Atribuir role</h1>
        </header>
        <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <Input value={userId} onChange={(event) => setUserId(event.target.value)} placeholder="ID do usuário" inputMode="numeric" />
          <Input value={roleId} onChange={(event) => setRoleId(event.target.value)} placeholder="ID do role" inputMode="numeric" />
          <Button onClick={assign} disabled={saving || !userId || !roleId}>
            {saving ? 'Salvando…' : 'Atribuir role'}
          </Button>
          {message && <p className="text-sm text-slate-700 font-semibold">{message}</p>}
        </section>
      </main>
    </SalesLayoutWrapper>
  );
}
