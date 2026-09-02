'use client';

import { useState } from 'react';
import DashboardLayout from '@/app/dashboard/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AssignSalesRolePage() {
  const [userId, setUserId] = useState('');
  const [roleId, setRoleId] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const assign = async () => {
    if (!userId || !roleId) return;
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/v1/sales/users/${userId}/roles/${roleId}`, { method: 'POST', credentials: 'include' });
      if (!response.ok) throw new Error('Não foi possível atribuir role.');
      setMessage('Role atribuído com sucesso.');
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : 'Erro ao atribuir role.');
    } finally {
      setSaving(false);
    }
  };

  return <DashboardLayout className="bg-slate-50/70"><main className="mx-auto w-full max-w-3xl space-y-6 p-6"><header><p className="text-xs font-bold uppercase tracking-wider text-blue-800">Acesso</p><h1 className="mt-2 text-3xl font-bold text-slate-900">Atribuir role</h1></header><section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><Input value={userId} onChange={(event) => setUserId(event.target.value)} placeholder="ID do usuário" inputMode="numeric" /><Input value={roleId} onChange={(event) => setRoleId(event.target.value)} placeholder="ID do role" inputMode="numeric" /><Button onClick={assign} disabled={saving || !userId || !roleId}>{saving ? 'Salvando…' : 'Atribuir role'}</Button>{message && <p className="text-sm text-slate-700">{message}</p>}</section></main></DashboardLayout>;
}
