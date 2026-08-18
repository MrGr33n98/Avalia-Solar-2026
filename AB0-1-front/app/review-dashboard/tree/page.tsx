'use client';

import { useEffect, useState } from 'react';
import { Copy, ExternalLink, Link2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { ReviewerPageHeader } from '@/components/review-dashboard/layout/ReviewerPageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { reviewerProfileApi } from '@/lib/api';
import { creatorTreeApi, type CreatorTreeBlock } from '@/lib/api/creatorTree';

export default function CreatorTreePage() {
  useAuth();
  const [blocks, setBlocks] = useState<CreatorTreeBlock[]>([]);
  const [slug, setSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<CreatorTreeBlock | null>(null);
  const [form, setForm] = useState({ type: 'external_link', title: '', subtitle: '', url: '', active: true });

  const publicUrl = slug && typeof window !== 'undefined' ? `${window.location.origin}/@${slug}` : '';

  useEffect(() => {
    void Promise.all([creatorTreeApi.list(), reviewerProfileApi.get()])
      .then(([items, profile]) => {
        setBlocks(Array.isArray(items) ? items : []);
        setSlug(profile?.profile?.public_slug || null);
      })
      .catch(() => toast.error('Não foi possível carregar seu Tree.'))
      .finally(() => setLoading(false));
  }, []);

  const copyUrl = async () => {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    toast.success('Link público copiado.');
  };

  const toggle = async (block: CreatorTreeBlock) => {
    const updated = await creatorTreeApi.update(block.id, { active: !block.active });
    setBlocks((current) => current.map((item) => item.id === updated.id ? updated : item));
  };

  const remove = async (id: number) => {
    await creatorTreeApi.remove(id);
    setBlocks((current) => current.filter((item) => item.id !== id));
    toast.success('Bloco removido.');
  };

  const openEditor = (block?: CreatorTreeBlock) => {
    setEditing(block || null);
    setForm({
      type: block?.type || 'external_link',
      title: block?.title || '',
      subtitle: block?.subtitle || '',
      url: block?.url || '',
      active: block?.active ?? true,
    });
    setEditorOpen(true);
  };

  const saveBlock = async () => {
    if (!form.title.trim()) return toast.error('Informe título.');
    if (form.type !== 'whatsapp' && form.url && !/^https?:\/\/[^\s]+$/i.test(form.url)) {
      return toast.error('URL deve começar com http:// ou https://.');
    }
    if (form.type === 'whatsapp' && form.url.replace(/\D/g, '').length < 10) {
      return toast.error('Informe telefone WhatsApp válido.');
    }
    try {
      const payload = { block_type: form.type, title: form.title, subtitle: form.subtitle, url: form.url, active: form.active };
      const saved = editing ? await creatorTreeApi.update(editing.id, payload) : await creatorTreeApi.create(payload);
      setBlocks((current) => editing ? current.map((item) => item.id === saved.id ? saved : item) : [...current, saved]);
      setEditorOpen(false);
      toast.success(editing ? 'Bloco atualizado.' : 'Bloco criado.');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível salvar bloco.');
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    setBlocks(next);
    await creatorTreeApi.reorder(next.map((item) => item.id));
  };

  return (
    <main className="mx-auto min-h-screen max-w-4xl bg-slate-50 px-4 py-6 sm:px-6">
      <ReviewerPageHeader
        title="Meu Tree"
        description="Organize seus links públicos."
        breadcrumbs={[{ label: 'Dashboard', href: '/review-dashboard' }, { label: 'Meu Tree' }]}
      />
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h1 className="text-2xl font-black text-slate-950">Meu Tree</h1><p className="mt-1 text-sm text-slate-500">Organize seus links públicos.</p></div>
          <button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white" onClick={() => openEditor()}><Plus className="h-4 w-4" /> Adicionar bloco</button>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 p-3">
          <Link2 className="h-4 w-4 text-blue-600" /><span className="min-w-0 flex-1 truncate text-sm text-slate-600">{publicUrl || 'Ative seu perfil público para gerar link.'}</span>
          <button type="button" onClick={() => void copyUrl()} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700"><Copy className="h-4 w-4" /> Copiar link</button>
          {publicUrl && <a href={publicUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700"><ExternalLink className="h-4 w-4" /> Ver página</a>}
        </div>
      </section>
      <section className="mt-4 space-y-3">
        {loading ? <p className="py-10 text-center text-sm text-slate-500">Carregando blocos...</p> : blocks.map((block, index) => (
          <article key={block.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700"><Link2 className="h-5 w-5" /></div>
            <div className="min-w-0 flex-1"><h2 className="truncate font-bold text-slate-900">{block.title}</h2><p className="text-xs text-slate-500">{block.type} {block.clicks_count ? `• ${block.clicks_count} cliques` : ''}</p></div>
            <button type="button" onClick={() => void toggle(block)} className={`min-h-10 rounded-full px-3 text-xs font-bold ${block.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{block.active ? 'Ativo' : 'Inativo'}</button>
            <button type="button" aria-label="Editar bloco" onClick={() => openEditor(block)} className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-600"><Pencil className="h-4 w-4" /></button>
            <button type="button" aria-label="Remover bloco" onClick={() => void remove(block.id)} className="grid h-10 w-10 place-items-center rounded-lg border border-red-100 text-red-600"><Trash2 className="h-4 w-4" /></button>
            <div className="flex gap-1"><button type="button" onClick={() => void move(index, -1)} className="min-h-10 rounded-lg border border-slate-200 px-2 text-xs">↑</button><button type="button" onClick={() => void move(index, 1)} className="min-h-10 rounded-lg border border-slate-200 px-2 text-xs">↓</button></div>
          </article>
        ))}
      </section>
      {editorOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-4">
          <div className="w-full max-w-lg rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-2xl">
            <div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-black">{editing ? 'Editar bloco' : 'Adicionar bloco'}</h2><button type="button" onClick={() => setEditorOpen(false)} aria-label="Fechar editor" className="grid h-10 w-10 place-items-center rounded-full hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
            <div className="space-y-3">
              <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"><option value="external_link">Link externo</option><option value="whatsapp">WhatsApp</option><option value="social">Rede social</option><option value="company">Empresa</option><option value="publication">Publicação</option></select>
              <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Título" className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" />
              <input value={form.subtitle} onChange={(event) => setForm({ ...form, subtitle: event.target.value })} placeholder="Descrição opcional" className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" />
              <input value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} placeholder="https://..." className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" />
              <label className="flex min-h-11 items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Bloco ativo</label>
              <button type="button" onClick={() => void saveBlock()} className="min-h-11 w-full rounded-xl bg-blue-600 px-4 text-sm font-bold text-white">Salvar bloco</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}