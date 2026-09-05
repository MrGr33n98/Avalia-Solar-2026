'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { requestApi } from '@/lib/api-campaigns';
import WorkspaceFrame from '@/components/sales/campaigns/WorkspaceFrame';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Template = { id: number; name: string; subject_template: string; body_html?: string; category?: string; updated_at: string };
const emptyForm = { name: '', subject_template: '', body_html: '', category: 'Prospecção' };
export default function TemplateManager() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editor, setEditor] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [preview, setPreview] = useState<{ subject: string; body_html: string } | null>(null);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const result = await requestApi<{ templates: Template[] }>('/email_templates'); setTemplates(result.templates); }
    catch (err) { setError(err instanceof Error ? err.message : 'Falha ao carregar templates.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setSuccess('');
    try {
      await requestApi(editingId ? `/email_templates/${editingId}` : '/email_templates', {
        method: editingId ? 'PATCH' : 'POST', body: JSON.stringify({ template: { ...form, private: false } }),
      });
      setEditor(false); setForm(emptyForm); setEditingId(null);
      await load(); setSuccess('Template salvo.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Falha ao salvar template.'); }
    finally { setBusy(false); }
  }
  async function showPreview(template: Template) {
    setBusy(true); setError('');
    try { const result = await requestApi<{ preview: { subject: string; body_html: string } }>(`/email_templates/${template.id}/preview`, { method: 'POST', body: JSON.stringify({ context: {} }) }); setPreview(result.preview); }
    catch (err) { setError(err instanceof Error ? err.message : 'Falha na prévia.'); }
    finally { setBusy(false); }
  }
  const visible = templates.filter((template) => `${template.name} ${template.subject_template} ${template.category}`.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')));
  return <WorkspaceFrame title="Templates">
    <div className="flex flex-wrap gap-3"><Button onClick={() => { setEditingId(null); setForm(emptyForm); setEditor(true); setSuccess(''); }}>Novo template</Button>
      <Input aria-label="Buscar templates" placeholder="Buscar templates" value={search} onChange={(event) => setSearch(event.target.value)} className="max-w-sm" /></div>
    {error && <div role="alert"><p>{error}</p><Button variant="outline" onClick={() => void load()}>Tentar novamente</Button></div>}
    {success && <p role="status">{success}</p>}
    {editor && <form onSubmit={save} className="space-y-3 border rounded p-4">
      {(['name', 'subject_template', 'category'] as const).map((key) => <label key={key} className="block text-sm">{{ name: 'Nome', subject_template: 'Assunto', category: 'Categoria' }[key]}<Input required value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} /></label>)}
      <label className="block text-sm">Conteúdo HTML<textarea required className="block w-full border rounded p-3 min-h-48 font-mono" value={form.body_html} onChange={(event) => setForm({ ...form, body_html: event.target.value })} /></label>
      <div className="flex gap-3"><Button disabled={busy} type="submit">{busy ? 'Salvando...' : 'Salvar template'}</Button><Button disabled={busy} type="button" variant="outline" onClick={() => setEditor(false)}>Cancelar</Button></div>
    </form>}
    {preview && <section className="space-y-2"><h2 className="font-semibold">Prévia: {preview.subject}</h2><iframe title="Prévia do template" sandbox="" referrerPolicy="no-referrer" className="w-full h-96 border rounded" srcDoc={`<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:;">${preview.body_html}`} /><Button variant="outline" onClick={() => setPreview(null)}>Fechar prévia</Button></section>}
    {loading && <p role="status">Carregando templates...</p>}
    {!loading && !error && (visible.length === 0 ? <p>Nenhum template encontrado.</p> : <div className="divide-y border rounded">{visible.map((template) => <article key={template.id} className="p-4 space-y-2">
      <h2 className="font-semibold">{template.name}</h2><p>{template.subject_template}</p><p className="text-sm">{template.category}</p>
      <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={busy} onClick={() => { setEditingId(template.id); setForm({ name: template.name, subject_template: template.subject_template, body_html: template.body_html || '', category: template.category || 'Prospecção' }); setEditor(true); }}>Editar</Button>
      <Button variant="outline" disabled={busy} onClick={() => void showPreview(template)}>Prévia</Button>
      <Button variant="outline" disabled={busy} onClick={() => { setEditingId(null); setForm({ name: `${template.name} (cópia)`, subject_template: template.subject_template, body_html: template.body_html || '', category: template.category || 'Prospecção' }); setEditor(true); }}>Duplicar</Button></div>
    </article>)}</div>)}
  </WorkspaceFrame>;
}
