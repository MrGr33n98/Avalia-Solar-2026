'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewPublicationPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  async function submit(event: React.FormEvent<HTMLFormElement>, status: 'draft' | 'published') {
    event.preventDefault(); setSaving(true); setError('');
    const form = new FormData(event.currentTarget);
    const title = String(form.get('title') || '');
    const slug = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const response = await fetch('/api/v1/reviewer/publications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ publication: { title, slug, excerpt: form.get('excerpt'), body: form.get('body'), category: form.get('category'), status } }) });
    if (!response.ok) { setError('Não foi possível salvar publicação.'); setSaving(false); return; }
    router.push('/review-dashboard/publications');
  }
  return <main className="mx-auto max-w-3xl space-y-6"><h1 className="text-2xl font-bold">Nova publicação</h1><form ref={formRef} className="space-y-4" onSubmit={(event) => submit(event, 'draft')}><input name="title" required placeholder="Título" className="w-full rounded-lg border p-3" /><input name="category" placeholder="Categoria" className="w-full rounded-lg border p-3" /><textarea name="excerpt" placeholder="Resumo" rows={3} className="w-full rounded-lg border p-3" /><textarea name="body" required placeholder="Conteúdo" rows={14} className="w-full rounded-lg border p-3" />{error && <p className="text-sm text-red-600">{error}</p>}<div className="flex gap-3"><button disabled={saving} className="rounded-lg border px-4 py-3">Salvar rascunho</button><button type="button" disabled={saving} onClick={() => formRef.current && submit({ preventDefault: () => undefined, currentTarget: formRef.current } as React.FormEvent<HTMLFormElement>, 'published')} className="rounded-lg bg-amber-400 px-4 py-3 font-semibold">Publicar</button></div></form></main>;
}
