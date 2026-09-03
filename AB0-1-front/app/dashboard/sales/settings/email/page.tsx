'use client';

import { FormEvent, useEffect, useState } from 'react';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';

type Signature = {
  id: number;
  name: string;
  body_html: string;
  is_default: boolean;
};

export default function EmailSettingsPage() {
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [name, setName] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [error, setError] = useState('');

  const load = () =>
    fetch('/api/v1/sales/email_signatures', { credentials: 'include' })
      .then((response) =>
        response.ok ? response.json() : Promise.reject(new Error('Falha ao carregar assinaturas.'))
      )
      .then((data: { signatures?: Signature[] }) => setSignatures(data.signatures ?? []))
      .catch((reason: Error) => setError(reason.message));

  useEffect(() => {
    load();
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const response = await fetch('/api/v1/sales/email_signatures', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signature: { name, body_html: bodyHtml, is_default: true } }),
    });
    if (!response.ok) return setError('Não foi possível salvar a assinatura.');
    setName('');
    setBodyHtml('');
    setError('');
    load();
  };

  return (
    <SalesLayoutWrapper>
      <main className="mx-auto w-full max-w-4xl space-y-6 p-6">
        <header>
          <h1 className="text-2xl font-bold text-slate-900">E-mail e assinaturas</h1>
          <p className="text-sm text-slate-500">
            Assinaturas aplicadas automaticamente antes do envio.
          </p>
        </header>
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <form onSubmit={submit} className="space-y-3 rounded-xl border bg-white p-5 shadow-sm">
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nome da assinatura"
            className="w-full rounded-lg border p-3 text-sm"
          />
          <textarea
            required
            value={bodyHtml}
            onChange={(event) => setBodyHtml(event.target.value)}
            placeholder="Assinatura (HTML simples)"
            className="min-h-28 w-full rounded-lg border p-3 text-sm"
          />
          <button className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white">
            Salvar assinatura padrão
          </button>
        </form>
        <section className="space-y-2">
          {signatures.map((signature) => (
            <article key={signature.id} className="rounded-xl border bg-white p-4">
              <strong>{signature.name}</strong>
              <p className="mt-1 text-sm text-slate-600">{signature.body_html}</p>
            </article>
          ))}
        </section>
      </main>
    </SalesLayoutWrapper>
  );
}
