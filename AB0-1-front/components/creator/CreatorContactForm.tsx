'use client';

import { useState } from 'react';
import { buildApiUrl } from '@/lib/api-config';
import { ExternalLink, Globe, Instagram, Linkedin } from 'lucide-react';
import { normalizeSocialUrl, type SocialUrlKind } from '@/lib/socialUrl';
import { track } from '@/lib/analytics/lazy';
import Link from 'next/link';

export function CreatorContactForm({
  creatorSlug,
  whatsappUrl,
  treeUrl,
  socialLinks = [],
}: {
  creatorSlug: string;
  whatsappUrl?: string;
  treeUrl?: string;
  socialLinks?: Array<{ label: string; value: string; icon: 'linkedin' | 'instagram' | 'website' }>;
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
          onClick={() => track('whatsapp_click', {
            company_id: 'creator',
            company_name: creatorSlug,
            cta_location: 'creator_profile',
          })}
          className="mt-3 flex min-h-10 items-center justify-center rounded-md bg-emerald-500 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
        >
          Falar no WhatsApp
        </a>
      )}
      {socialLinks.length > 0 && (
        <div className="mt-4 border-t border-slate-200/70 pt-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Conecte-se
          </p>
          {socialLinks.map(({ label, value, icon }) => {
            const Icon = icon === 'linkedin' ? Linkedin : icon === 'instagram' ? Instagram : Globe;
            const kind: SocialUrlKind = icon === 'linkedin' ? 'linkedin' : icon === 'instagram' ? 'instagram' : 'website';
            return (
              <a
                key={label}
                href={normalizeSocialUrl(value, kind)}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-2 border-b border-slate-100 px-1 py-2 text-xs font-semibold text-slate-700 last:border-0 hover:bg-slate-50"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 text-blue-700">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">{label}</span>
                <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
              </a>
            );
          })}
        </div>
      )}
      {treeUrl && (
        <Link
          href={treeUrl}
          className="group relative mt-3 flex min-h-10 items-center justify-center overflow-hidden rounded-md p-[1.5px] transition-transform hover:scale-[1.02]"
        >
          <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#e2e8f0_0%,#3b82f6_50%,#e2e8f0_100%)] group-hover:bg-[conic-gradient(from_90deg_at_50%_50%,#3b82f6_0%,#a855f7_50%,#3b82f6_100%)]" />
          <span className="relative z-10 inline-flex h-full w-full items-center justify-center rounded-[4.5px] bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors group-hover:bg-slate-50 group-hover:text-blue-700">
            Meu Tree ↗
          </span>
        </Link>
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
