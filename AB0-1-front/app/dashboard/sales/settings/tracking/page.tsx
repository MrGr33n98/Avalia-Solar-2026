'use client';

import { useState } from 'react';
import DashboardLayout from '@/app/dashboard/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SalesTrackingSettingsPage() {
  const [sessionId, setSessionId] = useState('');
  const [contactId, setContactId] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const identify = async () => {
    if (!sessionId || !contactId) return;
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch('/api/v1/sales/tracking/identify', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, contact_id: Number(contactId) }),
      });
      if (!response.ok) throw new Error('Não foi possível identificar sessão.');
      setMessage('Sessão associada ao contato.');
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : 'Erro ao identificar sessão.');
    } finally {
      setSaving(false);
    }
  };

  return <DashboardLayout className="bg-slate-50/70"><main className="mx-auto w-full max-w-3xl space-y-6 p-6"><header><p className="text-xs font-bold uppercase tracking-wider text-blue-800">Attribution</p><h1 className="mt-2 text-3xl font-bold text-slate-900">Identificar sessão</h1><p className="mt-1 text-sm text-slate-600">Associe navegação anônima a contato conhecido.</p></header><section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><Input value={sessionId} onChange={(event) => setSessionId(event.target.value)} placeholder="ID da sessão" /><Input value={contactId} onChange={(event) => setContactId(event.target.value)} placeholder="ID do contato" inputMode="numeric" /><Button onClick={identify} disabled={saving || !sessionId || !contactId}>{saving ? 'Associando…' : 'Associar contato'}</Button>{message && <p className="text-sm text-slate-700">{message}</p>}</section></main></DashboardLayout>;
}
