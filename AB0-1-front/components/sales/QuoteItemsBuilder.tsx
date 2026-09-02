'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function QuoteItemsBuilder({ quoteId, onChanged }: { quoteId: number; onChanged: () => void }) {
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const add = async () => {
    if (!description || !unitPrice) return;
    setSaving(true); setError(null);
    try {
      const response = await fetch(`/api/v1/sales/quotes/${quoteId}/items`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item: { description, quantity: Number(quantity), unit_price_cents: Math.round(Number(unitPrice) * 100) } }),
      });
      if (!response.ok) throw new Error('Falha ao adicionar item.');
      setDescription(''); setQuantity('1'); setUnitPrice(''); onChanged();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Erro ao adicionar item.');
    } finally { setSaving(false); }
  };

  return <div className="mt-4 space-y-2"><div className="grid gap-2 sm:grid-cols-4"><Input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Descrição do item" /><Input value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder="Qtd." inputMode="decimal" /><Input value={unitPrice} onChange={(event) => setUnitPrice(event.target.value)} placeholder="Preço unitário" inputMode="decimal" /><Button onClick={add} disabled={saving || !description || !unitPrice}>{saving ? 'Adicionando…' : 'Adicionar item'}</Button></div>{error && <p className="text-sm text-red-700">{error}</p>}</div>;
}
