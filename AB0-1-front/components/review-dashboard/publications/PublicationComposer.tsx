'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, ImagePlus, Save, Send, X } from 'lucide-react';
import { reviewerPublicationsApi } from '@/lib/api/reviewerPublications';
import type { PublicationType, ReviewerPublication } from '@/types/reviewer-publication';
import { getPublicationTypeLabel } from '@/lib/publications/publicationTypes';
export function PublicationComposer({ publication }: { publication?: ReviewerPublication }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [cover, setCover] = useState<File>();
  const [attachments, setAttachments] = useState<File[]>([]);
  const [preview, setPreview] = useState(false);
  const [form, setForm] = useState({
    title: publication?.title || '',
    excerpt: publication?.excerpt || '',
    body: publication?.body || '',
    category: publication?.category || '',
    publication_type: publication?.publication_type || ('article' as PublicationType),
    comments_enabled: publication?.comments_enabled ?? true,
    lead_capture_enabled: publication?.lead_capture_enabled ?? false,
  });
  const set = (key: string, value: unknown) => setForm((current) => ({ ...current, [key]: value }));
  const save = async (publish = false) => {
    if (!form.title.trim() || !form.body.trim()) {
      setError('Informe título e conteúdo.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const saved = publication
        ? await reviewerPublicationsApi.update(publication.id, form, { cover, attachments })
        : await reviewerPublicationsApi.create(form, { cover, attachments });
      if (publish) {
        await reviewerPublicationsApi.publish(saved.id);
      }
      router.push('/creator-studio/publications');
    } catch {
      setError('Não foi possível salvar publicação.');
    } finally {
      setSaving(false);
    }
  };
  if (preview)
    return (
      <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
        <button
          type="button"
          onClick={() => setPreview(false)}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold"
        >
          <X className="h-4 w-4" />
          Voltar ao editor
        </button>
        <article>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
            Pré-visualização
          </p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">{form.title || 'Sem título'}</h1>
          {form.excerpt && <p className="mt-3 text-lg text-slate-600">{form.excerpt}</p>}
          <div className="mt-8 whitespace-pre-wrap text-base leading-7 text-slate-700">
            {form.body || 'Sem conteúdo'}
          </div>
        </article>
      </div>
    );
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
      <div className="grid gap-5">
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Título
          <input
            maxLength={120}
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Ex.: Como reduzir perdas em um sistema solar"
            className="h-12 rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-blue-500"
          />
        </label>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Tipo
            <select
              value={form.publication_type}
              onChange={(e) => set('publication_type', e.target.value)}
              className="h-11 rounded-xl border border-slate-200 px-3 font-normal"
            >
              <option value="article">{getPublicationTypeLabel('article')}</option>
              <option value="case_study">{getPublicationTypeLabel('case_study')}</option>
              <option value="tip">{getPublicationTypeLabel('tip')}</option>
              <option value="project">{getPublicationTypeLabel('project')}</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Categoria
            <input
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              placeholder="Energia solar"
              className="h-11 rounded-xl border border-slate-200 px-3 font-normal"
            />
          </label>
        </div>
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Resumo
          <textarea
            maxLength={500}
            value={form.excerpt}
            onChange={(e) => set('excerpt', e.target.value)}
            rows={3}
            placeholder="Resumo que aparece no perfil público"
            className="rounded-xl border border-slate-200 p-3 font-normal"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Conteúdo
          <textarea
            value={form.body}
            onChange={(e) => set('body', e.target.value)}
            rows={16}
            placeholder="Escreva sua experiência..."
            className="rounded-xl border border-slate-200 p-3 font-normal leading-6"
          />
        </label>
        <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 px-4 text-sm text-slate-600">
          <ImagePlus className="h-5 w-5 text-slate-400" />
          Adicionar capa
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setCover(e.target.files?.[0])}
            className="sr-only"
          />
          {cover && <span className="truncate text-xs text-blue-600">{cover.name}</span>}
        </label>
        <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 px-4 text-sm text-slate-600">
          <ImagePlus className="h-5 w-5 text-slate-400" />
          Adicionar anexos (até 5)
          <input type="file" multiple accept="application/pdf,image/jpeg,image/png,image/webp" onChange={(e) => setAttachments(Array.from(e.target.files || []).slice(0, 5))} className="sr-only" />
          {attachments.length > 0 && <span className="truncate text-xs text-blue-600">{attachments.length} arquivo(s) selecionado(s)</span>}
        </label>
        <div className="flex flex-wrap gap-4 text-sm text-slate-600">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.comments_enabled}
              onChange={(e) => set('comments_enabled', e.target.checked)}
            />
            Permitir comentários
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.lead_capture_enabled}
              onChange={(e) => set('lead_capture_enabled', e.target.checked)}
            />
            Capturar contatos
          </label>
        </div>
        {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
          <button
            type="button"
            onClick={() => setPreview(true)}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700"
          >
            <Eye className="h-4 w-4" />
            Pré-visualizar
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void save(false)}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Salvando...' : 'Salvar rascunho'}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void save(true)}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Send className="h-4 w-4" />
            Publicar
          </button>
        </div>
      </div>
    </div>
  );
}
