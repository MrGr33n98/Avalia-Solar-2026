'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function QuoteBuilder({ onCreated }: { onCreated: () => void }) {
  const [opportunityId, setOpportunityId] = useState('');
  const [number, setNumber] = useState('');
  const [total, setTotal] = useState('');
  const [state, setState] = useState<'idle' | 'saving' | 'error'>('idle');

  const create = async () => {
    if (!opportunityId || !number || !total) return;
    setState('saving');
    try {
      const response = await fetch('/api/v1/sales/quotes', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quote: { opportunity_id: Number(opportunityId), number, total_cents: Math.round(Number(total) * 100), currency: 'BRL' } }),
      });
      if (!response.ok) throw new Error('Falha ao criar proposta.');
      setOpportunityId('');
      setNumber('');
      setTotal('');
      setState('idle');
      onCreated();
    } catch {
      setState('error');
    }
  };

  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="font-bold text-slate-900">Nova proposta</h2>
      <div className="grid gap-2 sm:grid-cols-3">
        <Input value={opportunityId} onChange={(event) => setOpportunityId(event.target.value)} placeholder="ID oportunidade" inputMode="numeric" />
        <Input value={number} onChange={(event) => setNumber(event.target.value)} placeholder="Número da proposta" />
        <Input value={total} onChange={(event) => setTotal(event.target.value)} placeholder="Total (R$)" inputMode="decimal" />
      </div>
      <Button onClick={create} disabled={state === 'saving' || !opportunityId || !number || !total}>{state === 'saving' ? 'Salvando…' : 'Criar proposta'}</Button>
      {state === 'error' && <p className="text-sm text-red-700">Não foi possível criar proposta.</p>}
    </section>
  );
}
