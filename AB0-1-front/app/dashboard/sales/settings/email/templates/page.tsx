'use client';

import { FormEvent, useEffect, useState } from 'react';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';

type Template = {
  id: number;
  name: string;
  subject_template: string;
  body_html?: string;
  shared: boolean;
};

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [editing, setEditing] = useState<Template | null>(null);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<{ subject: string; body_html: string } | null>(null);

  const load = () =>
    fetch('/api/v1/sales/email_templates', { credentials: 'include' })
      .then((response) =>
        response.ok ? response.json() : Promise.reject(new Error('Falha ao carregar templates.'))
      )
      .then((data) => setTemplates(data.templates ?? []))
      .catch((reason) => setError(reason.message));
  useEffect(() => {
    load();
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const url = editing
      ? `/api/v1/sales/email_templates/${editing.id}`
      : '/api/v1/sales/email_templates';
    const response = await fetch(url, {
      method: editing ? 'PATCH' : 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template: { name, subject_template: subject, body_html: body, private: false },
      }),
    });
    if (!response.ok) return setError('Não foi possível salvar o template.');
    setEditing(null);
    setName('');
    setSubject('');
    setBody('');
    setError('');
    load();
  };

  const remove = async (id: number) => {
    const response = await fetch(`/api/v1/sales/email_templates/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) setError('Não foi possível excluir o template.');
    else load();
  };

  const edit = (template: Template) => {
    setEditing(template);
    setName(template.name);
    setSubject(template.subject_template);
    setBody(template.body_html ?? '');
  };

  const showPreview = async (id: number) => {
    const response = await fetch(`/api/v1/sales/email_templates/${id}/preview`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context: {} }),
    });
    if (!response.ok) return setError('Não foi possível gerar o preview.');
    const data = await response.json();
    setPreview(data.preview);
  };

  return (
    <SalesLayoutWrapper>
      <main className="mx-auto w-full max-w-5xl space-y-6 p-6">
        <header>
          <h1 className="text-2xl font-bold text-slate-900">Modelos de e-mail</h1>
          <p className="text-sm text-slate-500">
            Templates compartilhados com variáveis como {'{{person.first_name}}'}.
          </p>
        </header>
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <form onSubmit={submit} className="space-y-3 rounded-xl border bg-white p-5 shadow-sm">
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nome do modelo"
            className="w-full rounded-lg border p-3 text-sm"
          />
          <input
            required
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="Assunto com variáveis"
            className="w-full rounded-lg border p-3 text-sm"
          />
          <textarea
            required
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="HTML do modelo"
            className="min-h-32 w-full rounded-lg border p-3 text-sm"
          />
          <button className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white">
            {editing ? 'Atualizar modelo' : 'Criar modelo'}
          </button>
        </form>
        {preview && (
          <section className="rounded-xl border bg-slate-50 p-4">
            <strong>Preview: {preview.subject}</strong>
            <div
              className="mt-2 rounded-lg bg-white p-4 text-sm"
              dangerouslySetInnerHTML={{ __html: preview.body_html }}
            />
          </section>
        )}
        <section className="grid gap-3 md:grid-cols-2">
          {templates.map((template) => (
            <article key={template.id} className="rounded-xl border bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <strong>{template.name}</strong>
                  <p className="mt-1 text-sm text-slate-600">{template.subject_template}</p>
                </div>
                <span className="text-xs text-slate-400">
                  {template.shared ? 'Compartilhado' : 'Privado'}
                </span>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => edit(template)}
                  className="rounded-md border px-3 py-1.5 text-xs"
                >
                  Editar
                </button>
                <button
                  onClick={() => showPreview(template.id)}
                  className="rounded-md border px-3 py-1.5 text-xs"
                >
                  Preview
                </button>
                <button
                  onClick={() => remove(template.id)}
                  className="rounded-md border border-red-200 px-3 py-1.5 text-xs text-red-700"
                >
                  Excluir
                </button>
              </div>
            </article>
          ))}
        </section>
      </main>
    </SalesLayoutWrapper>
  );
}
