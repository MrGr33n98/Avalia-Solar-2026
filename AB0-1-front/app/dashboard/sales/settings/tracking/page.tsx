'use client';

import { useState } from 'react';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SalesTrackingPage() {
  const [sessionId, setSessionId] = useState('');
  const [contactId, setContactId] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const identify = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch('/api/v1/sales/tracking/identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tracking_session_id: sessionId, sales_contact_id: contactId }),
      });
      if (!response.ok) throw new Error();
      setMessage('Identidade associada com sucesso.');
      setSessionId('');
      setContactId('');
    } catch {
      setMessage('Erro ao associar identidade.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SalesLayoutWrapper>
      <main className="mx-auto w-full max-w-3xl space-y-6">
        <header>
          <p className="text-xs font-bold uppercase tracking-wider text-blue-800">Attribution</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Identificar sessão</h1>
          <p className="mt-1 text-sm text-slate-600">Associe navegação anônima a contato conhecido.</p>
        </header>
        <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <Input value={sessionId} onChange={(event) => setSessionId(event.target.value)} placeholder="ID da sessão" />
          <Input value={contactId} onChange={(event) => setContactId(event.target.value)} placeholder="ID do contato" inputMode="numeric" />
          <Button onClick={identify} disabled={saving || !sessionId || !contactId}>
            {saving ? 'Associando…' : 'Associar contato'}
          </Button>
          {message && <p className="text-sm text-slate-700 font-semibold">{message}</p>}
        </section>
      </main>
    </SalesLayoutWrapper>
  );
}
