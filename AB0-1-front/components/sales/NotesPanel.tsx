'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type Note = { id: number; title: string; body: string; pinned: boolean; created_at: string };

export default function NotesPanel({ accountId }: { accountId: number }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => fetch(`/api/v1/sales/notes?account_id=${accountId}`, { credentials: 'include' })
    .then((response) => { if (!response.ok) throw new Error('Não foi possível carregar notas.'); return response.json(); })
    .then((data) => setNotes(data.notes ?? []))
    .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Erro ao carregar notas.'))
    .finally(() => setLoading(false)), [accountId]);

  useEffect(() => { void load(); }, [load]);

  const save = async () => {
    if (!body.trim()) return;
    setSaving(true); setError(null);
    try {
      const response = await fetch('/api/v1/sales/notes', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: { account_id: accountId, title: title.trim() || 'Nota', body: body.trim() } }),
      });
      if (!response.ok) throw new Error('Não foi possível salvar a nota.');
      setTitle(''); setBody(''); await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Erro ao salvar nota.'); }
    finally { setSaving(false); }
  };

  return <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
    <h3 className="font-bold text-slate-900">Notas da conta</h3>
    <div className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]"><Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Título" /><Textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Registrar contexto, decisão ou próximo passo" rows={2} /><Button onClick={save} disabled={saving || !body.trim()}>{saving ? 'Salvando…' : 'Adicionar'}</Button></div>
    {error && <p className="text-sm text-red-700">{error}</p>}
    {loading ? <p className="text-sm text-slate-500">Carregando notas…</p> : notes.length === 0 ? <p className="text-sm text-slate-500">Nenhuma nota registrada.</p> : <div className="space-y-2">{notes.map((note) => <article key={note.id} className="rounded-lg bg-slate-50 p-3"><p className="font-semibold text-slate-900">{note.title}</p><p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{note.body}</p></article>)}</div>}
  </section>;
}
