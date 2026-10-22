'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface QuoteBuilderProps {
  onCreated: () => void;
  defaultOpportunityId?: number;
}

export default function QuoteBuilder({ onCreated, defaultOpportunityId }: QuoteBuilderProps) {
  const [opportunityId, setOpportunityId] = useState(
    defaultOpportunityId ? String(defaultOpportunityId) : ''
  );
  const [number, setNumber] = useState(`PROP-${Date.now().toString().slice(-6)}`);
  const [total, setTotal] = useState('');
  const [state, setState] = useState<'idle' | 'saving' | 'error'>('idle');

  useEffect(() => {
    if (defaultOpportunityId) {
      setOpportunityId(String(defaultOpportunityId));
    }
  }, [defaultOpportunityId]);

  const create = async () => {
    if (!opportunityId || !number || !total) return;
    setState('saving');
    try {
      const response = await fetch('/api/v1/sales/quotes', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quote: {
            opportunity_id: Number(opportunityId),
            number: number.trim(),
            total_cents: Math.round(Number(total) * 100),
            currency: 'BRL',
          },
        }),
      });
      if (!response.ok) throw new Error('Falha ao criar proposta.');
      if (!defaultOpportunityId) setOpportunityId('');
      setNumber(`PROP-${Date.now().toString().slice(-6)}`);
      setTotal('');
      setState('idle');
      onCreated();
    } catch {
      setState('error');
    }
  };

  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="font-bold text-slate-900">Nova Proposta Comercial</h2>
      <div className="grid gap-2 sm:grid-cols-3">
        <Input
          value={opportunityId}
          onChange={(event) => setOpportunityId(event.target.value)}
          placeholder="ID da Oportunidade"
          inputMode="numeric"
          disabled={Boolean(defaultOpportunityId)}
        />
        <Input
          value={number}
          onChange={(event) => setNumber(event.target.value)}
          placeholder="Número da proposta (ex: PROP-10023)"
        />
        <Input
          value={total}
          onChange={(event) => setTotal(event.target.value)}
          placeholder="Valor Total em R$"
          inputMode="decimal"
        />
      </div>
      <Button
        onClick={create}
        disabled={state === 'saving' || !opportunityId || !number || !total}
        className="font-semibold"
      >
        {state === 'saving' ? 'Salvando…' : 'Criar Proposta'}
      </Button>
      {state === 'error' && (
        <p className="text-sm font-medium text-red-700">Não foi possível criar a proposta comercial.</p>
      )}
    </section>
  );
}
