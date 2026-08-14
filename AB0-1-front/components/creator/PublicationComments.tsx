'use client';
import { useEffect, useState } from 'react';
import { buildApiUrl } from '@/lib/api-config';
type Comment = { id: number; name: string; body: string; created_at: string };
export function PublicationComments({
  creatorSlug,
  publicationSlug,
  enabled,
}: {
  creatorSlug: string;
  publicationSlug: string;
  enabled: boolean;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [form, setForm] = useState({ name: '', email: '', body: '', website: '' });
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const endpoint =
    '/api/v1/creators/' +
    encodeURIComponent(creatorSlug) +
    '/publications/' +
    encodeURIComponent(publicationSlug) +
    '/comments';
  useEffect(() => {
    if (enabled)
      fetch(buildApiUrl(endpoint))
        .then((r) => (r.ok ? r.json() : []))
        .then(setComments)
        .catch(() => undefined);
  }, [endpoint, enabled]);
  if (!enabled) return null;
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const response = await fetch(buildApiUrl(endpoint), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment: form }),
    });
    setBusy(false);
    if (response.ok) {
      const comment = await response.json();
      setComments((current) => [comment, ...current]);
      setForm({ name: '', email: '', body: '', website: '' });
      setMessage('Comentário enviado.');
    } else setMessage('Não foi possível enviar comentário.');
  }
  return (
    <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-bold">Comentários</h2>
      <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
        <input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Seu nome"
          className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
        />
        <input
          required
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="Seu e-mail"
          className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
        />
        <textarea
          required
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
          placeholder="Escreva um comentário útil..."
          rows={4}
          className="sm:col-span-2 rounded-xl border border-slate-200 p-3 text-sm"
        />
        <input
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={(e) => setForm({ ...form, website: e.target.value })}
          aria-hidden="true"
          className="hidden"
        />
        <button
          disabled={busy}
          className="min-h-11 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white sm:col-span-2"
        >
          {busy ? 'Enviando...' : 'Comentar'}
        </button>
      </form>
      {message && <p className="mt-3 text-sm text-slate-500">{message}</p>}
      <div className="mt-6 space-y-4">
        {comments.map((comment) => (
          <article key={comment.id} className="border-t border-slate-100 pt-4">
            <p className="text-sm font-semibold">{comment.name}</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{comment.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
