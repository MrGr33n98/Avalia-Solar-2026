'use client';

import { useCallback, useEffect, useState } from 'react';
import QuoteBuilder from '@/components/sales/QuoteBuilder';
import QuoteItemsBuilder from '@/components/sales/QuoteItemsBuilder';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Quote = { id: number; number: string; status: string; total_cents: number; currency: string };

export default function SalesQuotesPage() {
  const [opportunityId, setOpportunityId] = useState('');
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const url = opportunityId
      ? `/api/v1/sales/quotes?opportunity_id=${encodeURIComponent(opportunityId)}`
      : '/api/v1/sales/quotes';
    fetch(url, { credentials: 'include' })
      .then((response) => {
        if (!response.ok) throw new Error('Não foi possível carregar propostas.');
        return response.json();
      })
      .then((data) => setQuotes(data.quotes ?? []))
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Erro ao buscar propostas.'))
      .finally(() => setLoading(false));
  }, [opportunityId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SalesLayoutWrapper>
      <main className="mx-auto w-full max-w-6xl space-y-6 p-6">
        <header>
          <p className="text-xs font-bold uppercase tracking-wider text-blue-800">Revenue</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Propostas comerciais</h1>
          <p className="mt-1 text-sm text-slate-600">Ciclo de vida persistente conectado ao backend Sales.</p>
        </header>
        <QuoteBuilder onCreated={load} />
        <section className="flex max-w-lg gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <Input value={opportunityId} onChange={(event) => setOpportunityId(event.target.value)} placeholder="Filtrar por ID da oportunidade" inputMode="numeric" />
          <Button onClick={load} disabled={loading}>Buscar</Button>
        </section>
        {error && <p className="rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</p>}
        {!loading && !error && quotes.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">Nenhuma proposta encontrada.</p>}
        <section className="grid gap-3 md:grid-cols-2">
          {quotes.map((quote) => (
            <article key={quote.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between"><h2 className="font-bold text-slate-900">{quote.number}</h2><span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-800">{quote.status}</span></div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: quote.currency }).format(quote.total_cents / 100)}</p>
              <QuoteItemsBuilder quoteId={quote.id} onChanged={load} />
              <a className="mt-3 inline-flex text-sm font-semibold text-blue-800 underline" href={`/api/v1/sales/quotes/${quote.id}/document`} target="_blank" rel="noreferrer">Abrir proposta para impressão/PDF</a>
            </article>
          ))}
        </section>
      </main>
    </SalesLayoutWrapper>
  );
}
