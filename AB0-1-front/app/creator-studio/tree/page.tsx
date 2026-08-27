'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  ArrowUpRight,
  Check,
  Crown,
  Download,
  Eye,
  ExternalLink,
  Globe,
  GripVertical,
  Instagram,
  Link2,
  Lightbulb,
  MessageCircle,
  MousePointerClick,
  Pencil,
  Plus,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  X,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { ReviewerPageHeader } from '@/components/review-dashboard/layout/ReviewerPageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { companiesApi, reviewerProfileApi, type Company } from '@/lib/api';
import type { CreatorTreeTheme, CreatorTreeSettings } from '@/types/creator-tree';
import { useTreeEditorState } from '@/hooks/creator-tree/useTreeEditorState';
import { creatorTreeApi, type CreatorTreeBlock, creatorTreeUrl, reviewerTreeSettingsApi } from '@/lib/api/creatorTree';
import { reviewerPublicationsApi } from '@/lib/api/reviewerPublications';
import type { ReviewerPublication } from '@/types/reviewer-publication';
import { TreeDevicePreview } from '@/components/creator/tree/TreeDevicePreview';
import { TreeAppearancePanel } from '@/components/creator/tree/TreeAppearancePanel';
import { TreeBlocksPanel } from '@/components/creator/tree/TreeBlocksPanel';
import { TreeAnalyticsPanel } from '@/components/creator/tree/TreeAnalyticsPanel';
import { TreeSettingsPanel } from '@/components/creator/tree/TreeSettingsPanel';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

function normalizeTreeUrl(value: string, type: string) {
  const trimmed = value.trim();
  if (!trimmed || type === 'whatsapp') return trimmed;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

const blockTypeOptions: Array<{ value: string; label: string; description: string; icon: LucideIcon }> = [
  { value: 'external_link', label: 'Link', description: 'Para qualquer site', icon: Link2 },
  { value: 'whatsapp', label: 'WhatsApp', description: 'Fale com sua audiência', icon: MessageCircle },
  { value: 'social', label: 'Social', description: 'Instagram, LinkedIn...', icon: Instagram },
  { value: 'company', label: 'Empresa', description: 'Destaque sua empresa', icon: Globe },
  { value: 'publication', label: 'Publicação', description: 'Conteúdo do Avalia Solar', icon: Download },
  { value: 'download', label: 'Download', description: 'Materiais e arquivos', icon: Download },
  { value: 'lead_form', label: 'Lead Form', description: 'Capture novos leads', icon: Sparkles },
  { value: 'separator', label: 'Separador', description: 'Linha de organização', icon: SlidersHorizontal },
];

const blockIconByType: Record<string, LucideIcon> = {
  external_link: Link2,
  whatsapp: MessageCircle,
  social: Instagram,
  company: Globe,
  publication: Download,
  download: Download,
  lead_form: Sparkles,
  separator: SlidersHorizontal,
};

const blockTypeLabels: Record<string, string> = Object.fromEntries(
  blockTypeOptions.map((option) => [option.value, option.label])
);

export default function CreatorTreePage() {
  useAuth();
  const [blocks, setBlocks] = useState<CreatorTreeBlock[]>([]);
  const [slug, setSlug] = useState<string | null>(null);
  const [treeViews, setTreeViews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<CreatorTreeBlock | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [publications, setPublications] = useState<ReviewerPublication[]>([]);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(true);
  const [form, setForm] = useState({ type: 'external_link', title: '', subtitle: '', url: '', active: true, companyId: '', publicationId: '', color: 'blue', icon: 'link' });
  
  const [activeTab, setActiveTab] = useState('links');
  const [settings, setSettings] = useState<any>(null);
  const [creatorProfile, setCreatorProfile] = useState<any>(null);
  const editor = useTreeEditorState(settings);

  const publicUrl = slug ? creatorTreeUrl(slug) : '';

  useEffect(() => {
    void Promise.all([
      creatorTreeApi.list(), 
      reviewerProfileApi.get(), 
      companiesApi.mine(), 
      reviewerPublicationsApi.list({ status: 'published' }),
      reviewerTreeSettingsApi.get().catch(() => ({ theme_key: 'solar', appearance: {} }))
    ])
      .then(([items, profile, ownedCompanies, publicationResponse, settingsResponse]) => {
        const treeResponse = Array.isArray(items) ? { blocks: items, profile: {} } : items;
        setBlocks(treeResponse?.blocks || []);
        setSlug(treeResponse?.profile?.public_slug || profile?.profile?.public_slug || null);
        setTreeViews(treeResponse?.profile?.tree_views_count || 0);
        setCompanies(Array.isArray(ownedCompanies) ? ownedCompanies : []);
        setPublications(publicationResponse?.items || []);
        setSettings(settingsResponse);
        setCreatorProfile({
          name: (profile as any)?.user?.name || '',
          headline: (profile as any)?.profile?.headline || '',
          bio: (profile as any)?.profile?.bio || '',
          slug: (profile as any)?.profile?.public_slug || '',
          avatar_url: (profile as any)?.user?.avatar_url || '',
          banner_url: (profile as any)?.profile?.public_banner_url || '',
          city: (profile as any)?.profile?.city || '',
          state: (profile as any)?.profile?.state || '',
          linkedin_url: (profile as any)?.profile?.linkedin_url || '',
          instagram_url: (profile as any)?.profile?.instagram_url || '',
          youtube_url: (profile as any)?.profile?.youtube_url || '',
          website_url: (profile as any)?.profile?.website_url || ''
        });
      })
      .catch(() => toast.error('Não foi possível carregar seu Tree.'))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdateSettings = async (payload: Partial<CreatorTreeSettings>): Promise<CreatorTreeSettings> => {
    const next = { ...settings, ...payload, appearance: payload.appearance || settings?.appearance || {} } as CreatorTreeSettings;
    setSettings(next);
    editor.update(payload, payload.theme_key ? 200 : 500);
    return next;
  };

  const copyUrl = async () => {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
    toast.success('Link público copiado.');
  };

  const toggle = async (block: CreatorTreeBlock) => {
    try {
      const updated = await creatorTreeApi.update(block.id, { active: !block.active });
      setBlocks((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch {
      toast.error('Não foi possível alterar status do bloco.');
    }
  };

  const remove = async (id: number) => {
    if (!window.confirm('Remover este bloco?')) return;
    try {
      await creatorTreeApi.remove(id);
      setBlocks((current) => current.filter((item) => item.id !== id));
      toast.success('Bloco removido.');
    } catch {
      toast.error('Não foi possível remover bloco.');
    }
  };

  const openEditor = (block?: CreatorTreeBlock) => {
    setEditing(block || null);
    setForm({
      type: block?.block_type || block?.type || 'external_link',
      title: block?.title || '',
      subtitle: block?.subtitle || '',
      url: block?.url || '',
      active: block?.active ?? true,
      companyId: block?.company_id ? String(block.company_id) : '',
      publicationId: block?.publication_id ? String(block.publication_id) : '',
      color: String(block?.metadata?.color || 'blue'),
      icon: String(block?.metadata?.icon || 'link'),
    });
    setEditorOpen(true);
  };

  const saveBlock = async () => {
    if (saving) return;
    if (!form.title.trim()) return toast.error('Informe título.');
    const normalizedUrl = normalizeTreeUrl(form.url, form.type);
    if (form.type !== 'whatsapp' && form.type !== 'company' && form.type !== 'publication' && form.type !== 'separator' && !/^https?:\/\/[^\s]+$/i.test(normalizedUrl)) {
      return toast.error('Informe um endereço válido.');
    }
    if (form.type === 'whatsapp' && form.url.replace(/\D/g, '').length < 10) {
      return toast.error('Informe telefone WhatsApp válido.');
    }
    if (form.type === 'company' && !form.companyId) return toast.error('Selecione empresa.');
    if (form.type === 'publication' && !form.publicationId) return toast.error('Selecione publicação.');
    try {
      setSaving(true);
      const payload: Partial<CreatorTreeBlock> = {
        block_type: form.type as CreatorTreeBlock['block_type'],
        title: form.title,
        subtitle: form.subtitle,
        url: form.type === 'company' || form.type === 'publication' ? '' : normalizedUrl,
        active: form.active,
        company_id: form.type === 'company' ? Number(form.companyId) : null,
        publication_id: form.type === 'publication' ? Number(form.publicationId) : null,
        metadata: { color: form.color, icon: form.icon },
      };
      const saved = editing ? await creatorTreeApi.update(editing.id, payload) : await creatorTreeApi.create(payload);
      setBlocks((current) => editing ? current.map((item) => item.id === saved.id ? saved : item) : [...current, saved]);
      setEditorOpen(false);
      toast.success(editing ? 'Bloco atualizado.' : 'Bloco criado.');
    } catch (error: unknown) {
      const details = (error as { context?: { details?: { error?: { fields?: Record<string, string[]> } } } })?.context?.details?.error?.fields;
      const urlError = details?.url?.[0];
      toast.error(urlError || 'Não foi possível adicionar o link. Verifique os dados e tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    setBlocks(next);
    try {
      await creatorTreeApi.reorder(next.map((item) => item.id));
    } catch {
      setBlocks(blocks);
      toast.error('Não foi possível reordenar blocos.');
    }
  };

  const totalClicks = blocks.reduce((sum, block) => sum + (block.clicks_count || 0), 0);
  const activeBlocks = blocks.filter((block) => block.active).length;
  const displayUrl = publicUrl.replace(/^https?:\/\//, '');
  const profilePreviewUrl = publicUrl || '/creators/creator/tree';
  const previewBlocks = blocks.filter((block) => block.active).slice(0, 4);

  return (
    <main className="mx-auto min-h-screen max-w-[1080px] bg-[#f8faff] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <ReviewerPageHeader
        title="Meu Tree"
        description="Reúna seus principais links e compartilhe uma única página com sua audiência."
        breadcrumbs={[{ label: 'Creator Studio', href: '/creator-studio' }, { label: 'Meu Tree' }]}
      />
      <div className="-mt-2 mb-4 flex items-center gap-2 text-xs font-bold text-emerald-600"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Ativo</div>
      <section className="rounded-[18px] border border-slate-200 bg-white p-4 shadow-[0_8px_30px_rgba(30,94,255,0.04)] sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1"><p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Sua página pública</p><div className="flex items-center gap-2 text-sm font-bold text-blue-600"><Link2 className="h-4 w-4 shrink-0" /><span className="truncate">{displayUrl || 'Ative seu perfil público para gerar link.'}</span><ArrowUpRight className="h-4 w-4 shrink-0" /></div><p className="mt-2 text-xs text-slate-400">Compartilhe este endereço no Instagram, LinkedIn ou outras redes.</p></div>
          <div className="flex w-full gap-2 sm:w-auto"><button type="button" className="hidden min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 sm:inline-flex" onClick={() => publicUrl && window.open(publicUrl, '_blank')} disabled={!publicUrl}><ExternalLink className="h-4 w-4" /> Ver página pública</button><button type="button" className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white sm:flex-none" onClick={() => openEditor()}><Plus className="h-4 w-4" /> Adicionar link</button></div>
        </div>
        <div className="mt-4 flex gap-2"><button type="button" onClick={() => void copyUrl()} disabled={!publicUrl} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700"><Check className={`h-4 w-4 ${copied ? 'text-emerald-600' : 'text-slate-400'}`} /> {copied ? 'Copiado' : 'Copiar link'}</button><button type="button" onClick={() => publicUrl && navigator.share?.({ title: 'Meu Tree', url: publicUrl })} disabled={!publicUrl} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700"><Share2 className="h-4 w-4" /> Compartilhar</button></div>
      </section>
      <TreeAnalyticsPanel blocks={blocks} treeViews={treeViews} />
      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section className="bg-transparent">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4 bg-white border border-slate-200">
            <TabsTrigger value="links">Links</TabsTrigger>
            <TabsTrigger value="appearance">Aparência</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>
          
          <TabsContent value="links" className="space-y-3 rounded-[18px] border border-slate-200 bg-white p-4 shadow-[0_8px_30px_rgba(30,94,255,0.03)]">
            <TreeBlocksPanel
              blocks={blocks}
              loading={loading}
              onMove={move}
              onRemove={remove}
              onToggle={toggle}
              onOpenEditor={openEditor}
              blockTypeLabels={blockTypeLabels}
              blockIconByType={blockIconByType as any}
            />
          </TabsContent>
          <TabsContent value="appearance">
            <div className="rounded-[18px] border border-slate-200 bg-white p-4 shadow-[0_8px_30px_rgba(30,94,255,0.03)]">
              {settings && (
                <TreeAppearancePanel
                  initialTheme={editor.themeKey}
                  initialAppearance={editor.appearance}
                  onUpdate={handleUpdateSettings}
                />
              )}
              {!settings && !loading && (
                <p className="text-slate-500 text-sm">Carregando configurações de aparência...</p>
              )}
            </div>
          </TabsContent>
          <TabsContent value="settings">
            <div className="rounded-[18px] border border-slate-200 bg-white p-4 shadow-[0_8px_30px_rgba(30,94,255,0.03)]">
              {settings && (
                <TreeSettingsPanel 
                  settings={settings}
                  onUpdate={handleUpdateSettings}
                />
              )}
              {!settings && !loading && (
                <p className="text-slate-500 text-sm">Carregando configurações...</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </section>
      <aside className="hidden lg:block h-[800px] sticky top-4">
        <TreeDevicePreview 
          publicUrl={publicUrl}
          data={creatorProfile ? {
            creator: creatorProfile,
            blocks: blocks.map(b => ({
              id: b.id,
              type: b.block_type || b.type || 'external_link',
              title: b.title,
              subtitle: b.subtitle || null,
              position: b.position,
              url: b.url || null,
              metadata: b.metadata
            })),
            appearance: editor.appearance,
            theme_key: editor.themeKey || 'solar'
          } : null}
        />
      </aside>
      </div>
      <section className="mt-4 rounded-[18px] border border-slate-200 bg-white p-4"><div className="flex items-center gap-2"><Lightbulb className="h-4 w-4 text-amber-500" /><h2 className="text-sm font-black text-slate-800">Dicas para turbinar seu Tree</h2></div><div className="mt-3 grid gap-2 sm:grid-cols-4"><div className="rounded-xl bg-blue-50 p-3 text-xs text-slate-600"><b className="block text-slate-800">Adicione até 8 links</b>Organize seus principais destinos.</div><div className="rounded-xl bg-blue-50 p-3 text-xs text-slate-600"><b className="block text-slate-800">Use CTAs claros</b>Títulos objetivos convertem mais.</div><div className="rounded-xl bg-emerald-50 p-3 text-xs text-slate-600"><b className="block text-slate-800">Mantenha atualizado</b>Revise seus links periodicamente.</div><div className="rounded-xl bg-rose-50 p-3 text-xs text-slate-600"><b className="block text-slate-800">Compartilhe sempre</b>Divulgue em suas redes sociais.</div></div></section>
      {editorOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-4">
          <div className="w-full max-w-lg rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-2xl">
            <div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-black">{editing ? 'Editar bloco' : 'Adicionar bloco'}</h2><button type="button" onClick={() => setEditorOpen(false)} aria-label="Fechar editor" className="grid h-10 w-10 place-items-center rounded-full hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
            <div className="space-y-3">
              <p className="text-sm text-slate-500">Escolha o destino que deseja destacar no seu Tree.</p>
              <label className="block text-xs font-bold text-slate-700">Tipo de bloco<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"><option value="external_link">🔗 Link externo</option><option value="whatsapp">💬 WhatsApp</option><option value="social">◎ Rede social</option><option value="company">🏢 Empresa</option><option value="publication">📄 Publicação</option><option value="download">⬇ Download</option><option value="lead_form">✦ Formulário</option><option value="separator">— Separador</option></select></label>
              {form.type === 'company' && <label className="block text-xs font-bold text-slate-700">Empresa<select value={form.companyId} onChange={(event) => setForm({ ...form, companyId: event.target.value })} className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"><option value="">Selecione empresa</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label>}
              {form.type === 'publication' && <label className="block text-xs font-bold text-slate-700">Publicação<select value={form.publicationId} onChange={(event) => setForm({ ...form, publicationId: event.target.value })} className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"><option value="">Selecione publicação</option>{publications.map((publication) => <option key={publication.id} value={publication.id}>{publication.title}</option>)}</select></label>}
              <label className="block text-xs font-bold text-slate-700">Título<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Meu site" className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" /></label>
              <label className="block text-xs font-bold text-slate-700">Descrição <span className="font-normal text-slate-400">(opcional)</span><input value={form.subtitle} onChange={(event) => setForm({ ...form, subtitle: event.target.value })} placeholder="Conheça meu trabalho" className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" /></label>
              {form.type !== 'company' && form.type !== 'publication' && form.type !== 'separator' && <label className="block text-xs font-bold text-slate-700">URL<input value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} placeholder={form.type === 'whatsapp' ? '5511999999999' : 'https://meusite.com.br'} className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" />{form.url.trim() && <span className="mt-1 block truncate text-xs text-slate-500">Prévia: {normalizeTreeUrl(form.url, form.type)}</span>}</label>}
              <div className="grid grid-cols-2 gap-3"><label className="block text-xs font-bold text-slate-700">Ícone<select value={form.icon} onChange={(event) => setForm({ ...form, icon: event.target.value })} className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"><option value="link">Link</option><option value="whatsapp">WhatsApp</option><option value="instagram">Instagram</option><option value="linkedin">LinkedIn</option><option value="youtube">YouTube</option></select></label><label className="block text-xs font-bold text-slate-700">Cor<select value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"><option value="blue">Azul</option><option value="green">Verde</option><option value="violet">Violeta</option><option value="amber">Âmbar</option><option value="dark">Escuro</option></select></label></div>
              <label className="flex min-h-11 items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Bloco ativo</label>
              <div className="flex gap-2 pt-2"><button type="button" onClick={() => setEditorOpen(false)} className="min-h-11 flex-1 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700">Cancelar</button><button type="button" onClick={() => void saveBlock()} disabled={saving} className="min-h-11 flex-1 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white disabled:opacity-60">{saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Adicionar link'}</button></div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
