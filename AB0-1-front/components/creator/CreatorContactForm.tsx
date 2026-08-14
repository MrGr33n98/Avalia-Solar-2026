'use client';

import { useState } from 'react';
import { buildApiUrl } from '@/lib/api-config';

export function CreatorContactForm({
  creatorSlug,
  whatsappUrl,
}: {
  creatorSlug: string;
  whatsappUrl?: string;
}) {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch(buildApiUrl(`creators/${encodeURIComponent(creatorSlug)}/leads`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead: Object.fromEntries(form) }),
    });
    setBusy(false);
    if (response.ok) {
      setSent(true);
      event.currentTarget.reset();
    }
  }
  if (sent)
    return (
      <section className="rounded-xl border border-green-200 bg-green-50 p-5">
        <h2 className="font-bold text-green-800">Mensagem enviada</h2>
        <p className="mt-2 text-sm text-green-700">{`Obrigado. ${'O creator'} receberá seu contato.`}</p>
      </section>
    );
  return (
    <section id="contato" className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-bold">Entre em contato</h2>
      {whatsappUrl && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 flex min-h-10 items-center justify-center rounded-md bg-emerald-500 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
        >
          Falar no WhatsApp
        </a>
      )}
      <p className="mt-2 text-sm text-slate-600">Tire dúvidas ou fale sobre seu projeto.</p>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <input
          required
          name="name"
          placeholder="Nome completo"
          className="w-full rounded-lg border p-3 text-sm"
        />
        <input
          required
          type="email"
          name="email"
          placeholder="E-mail"
          className="w-full rounded-lg border p-3 text-sm"
        />
        <input
          name="phone"
          placeholder="Telefone/WhatsApp"
          className="w-full rounded-lg border p-3 text-sm"
        />
        <textarea
          required
          name="message"
          placeholder="Conte um pouco sobre seu projeto..."
          rows={4}
          className="w-full rounded-lg border p-3 text-sm"
        />
        <input type="hidden" name="intent" value="contact_creator" />
        <label className="flex gap-2 text-xs text-slate-500">
          <input required type="checkbox" name="consent" value="true" /> Aceito receber contato
          sobre esta solicitação.
        </label>
        <button
          disabled={busy}
          className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white disabled:opacity-50"
        >
          {busy ? 'Enviando...' : 'Enviar mensagem'}
        </button>
      </form>
    </section>
  );
}
