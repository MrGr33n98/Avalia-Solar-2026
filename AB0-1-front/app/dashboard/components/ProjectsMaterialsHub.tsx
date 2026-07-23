'use client';

import { FormEvent, useCallback, useEffect, useState, type ChangeEvent, type ReactNode } from 'react';
import { BarChart3, FileText, FolderKanban, Plus, RefreshCw, Send, ShieldCheck, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { fetchApi } from '@/lib/api';

type Project = { id: number; title: string; status: string; city?: string; state?: string };
type Material = { id: number; title: string; status: string; material_type: string; gate_mode: string; download_count: number };
type LeadForm = { id: number; name: string; status: string; version: number };
type Analytics = { metrics: { material_views: number; download_clicks: number; gate_views: number; form_submissions: number; authorizations: number; delivered_downloads: number; unique_leads: number; delivery_rate: number } };

const Status = ({ value }: { value: string }) => <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${value === 'published' || value === 'active' ? 'bg-emerald-100 text-emerald-700' : value === 'pending' ? 'bg-amber-100 text-amber-700' : value === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>{value}</span>;

export default function ProjectsMaterialsHub({ companyId }: { companyId: string }) {
  const query = companyId ? `?company_id=${encodeURIComponent(companyId)}` : '';
  const [projects, setProjects] = useState<Project[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [forms, setForms] = useState<LeadForm[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<'project' | 'material' | 'form' | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [projectResponse, materialResponse, formResponse] = await Promise.all([
        fetchApi<{ projects: Project[] }>(`/company_admin/projects${query}`),
        fetchApi<{ materials: Material[] }>(`/company_admin/materials${query}`),
        fetchApi<{ forms: LeadForm[] }>(`/company_admin/content_lead_forms${query}`),
      ]);
      setProjects(projectResponse.projects || []); setMaterials(materialResponse.materials || []); setForms(formResponse.forms || []);
      fetchApi<Analytics>(`/company_admin/content_analytics/overview${query}`).then(setAnalytics).catch(() => setAnalytics(null));
    } catch { toast({ title: 'Não foi possível carregar seus conteúdos', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [query]);
  useEffect(() => { load(); }, [load]);

  const create = async (event: FormEvent<HTMLFormElement>, type: 'project' | 'material' | 'form') => {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    const body = type === 'project' ? { project: { title: data.get('title'), project_type: data.get('project_type'), city: data.get('city'), state: data.get('state') } } : type === 'material' ? { material: { title: data.get('title'), material_type: 'catalog', gate_mode: data.get('gate_mode'), content_lead_form_id: data.get('content_lead_form_id') || undefined } } : { content_lead_form: { name: data.get('name'), fields: [{ key: 'name', label: 'Nome', type: 'text', required: true }, { key: 'email', label: 'E-mail', type: 'email', required: true }] } };
    try {
      await fetchApi(`/company_admin/${type === 'form' ? 'content_lead_forms' : `${type}s`}${query}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      toast({ title: 'Rascunho salvo' }); setCreating(null); event.currentTarget.reset(); await load();
    } catch { toast({ title: 'Não foi possível salvar', variant: 'destructive' }); }
  };

  const submit = async (type: 'project' | 'material', id: number) => {
    try { await fetchApi(`/company_admin/${type}s/${id}/submit${query}`, { method: 'POST' }); toast({ title: 'Enviado para moderação' }); await load(); }
    catch { toast({ title: 'Não foi possível enviar', variant: 'destructive' }); }
  };

  return <div className="mx-auto max-w-6xl space-y-6 pb-16">
    <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 md:flex-row md:items-center"><div><h2 className="text-2xl font-black text-slate-950">Projetos e materiais</h2><p className="mt-1 text-sm text-slate-500">Cases, documentos e dados de intenção da sua empresa.</p></div><Button variant="outline" onClick={load} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" />Atualizar</Button></div>
    <Tabs defaultValue="projects" className="space-y-5"><TabsList className="h-auto w-full justify-start gap-2 overflow-x-auto rounded-xl bg-slate-100 p-1"><TabsTrigger value="projects"><FolderKanban className="mr-2 h-4 w-4" />Projetos</TabsTrigger><TabsTrigger value="materials"><FileText className="mr-2 h-4 w-4" />Materiais</TabsTrigger><TabsTrigger value="forms"><ShieldCheck className="mr-2 h-4 w-4" />Formulários</TabsTrigger><TabsTrigger value="analytics"><BarChart3 className="mr-2 h-4 w-4" />Desempenho</TabsTrigger></TabsList>
      <TabsContent value="projects" className="space-y-4"><div className="flex justify-end"><Button onClick={() => setCreating('project')}><Plus className="mr-2 h-4 w-4" />Novo projeto</Button></div>{creating === 'project' && <form onSubmit={(event) => create(event, 'project')} className="grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-2"><Field label="Título *" name="title" required /><Field label="Tipo de projeto" name="project_type" /><Field label="Cidade" name="city" /><Field label="UF" name="state" /><div className="flex items-end gap-2"><Button type="submit">Salvar rascunho</Button><Button type="button" variant="ghost" onClick={() => setCreating(null)}>Cancelar</Button></div></form>}<List loading={loading} empty="Crie o primeiro projeto para montar sua vitrine pública." rows={projects}>{project => <><span className="font-semibold">{project.title}</span><span>{[project.city, project.state].filter(Boolean).join(' - ') || 'Sem localização'}</span><Status value={project.status} /><div className="flex flex-wrap gap-2"><AssetUpload companyId={companyId} type="project" id={project.id} accept="image/png,image/jpeg,image/webp" kind="image" onDone={load} /><ExternalVideo companyId={companyId} projectId={project.id} onDone={load} />{project.status === 'draft' && <Button size="sm" variant="outline" onClick={() => submit('project', project.id)}><Send className="mr-1 h-3 w-3" />Enviar</Button>}</div></>}</List></TabsContent>
      <TabsContent value="materials" className="space-y-4"><div className="flex justify-end"><Button onClick={() => setCreating('material')}><Plus className="mr-2 h-4 w-4" />Novo material</Button></div>{creating === 'material' && <form onSubmit={(event) => create(event, 'material')} className="grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-2"><Field label="Título *" name="title" required /><label className="space-y-1 text-sm font-medium"><span>Acesso</span><select name="gate_mode" className="h-10 w-full rounded-md border border-input bg-background px-3"><option value="none">Livre</option><option value="form">Formulário antes de baixar</option></select></label><label className="space-y-1 text-sm font-medium"><span>Formulário</span><select name="content_lead_form_id" className="h-10 w-full rounded-md border border-input bg-background px-3"><option value="">Selecione se usar gate</option>{forms.filter(form => form.status === 'active').map(form => <option key={form.id} value={form.id}>{form.name}</option>)}</select></label><div className="flex items-end gap-2"><Button type="submit">Salvar rascunho</Button><Button type="button" variant="ghost" onClick={() => setCreating(null)}>Cancelar</Button></div></form>}<List loading={loading} empty="Publique catálogos, apresentações e materiais técnicos." rows={materials}>{material => <><span className="font-semibold">{material.title}</span><span>{material.gate_mode === 'none' ? 'Acesso livre' : 'Com formulário'}</span><Status value={material.status} /><div className="flex flex-wrap gap-2"><AssetUpload companyId={companyId} type="material" id={material.id} accept="application/pdf" kind="document" onDone={load} />{material.status === 'draft' && <Button size="sm" variant="outline" onClick={() => submit('material', material.id)}><Send className="mr-1 h-3 w-3" />Enviar</Button>}</div></>}</List></TabsContent>
      <TabsContent value="forms" className="space-y-4"><div className="flex justify-end"><Button onClick={() => setCreating('form')}><Plus className="mr-2 h-4 w-4" />Novo formulário</Button></div>{creating === 'form' && <form onSubmit={(event) => create(event, 'form')} className="flex max-w-xl gap-3 rounded-xl border bg-white p-4"><div className="flex-1"><Field label="Nome *" name="name" required /></div><div className="flex items-end"><Button type="submit">Criar</Button></div></form>}<List loading={loading} empty="Crie formulários para seus materiais protegidos." rows={forms}>{form => <><span className="font-semibold">{form.name}</span><span>Versão {form.version}</span><Status value={form.status} /></>}</List></TabsContent>
      <TabsContent value="analytics"><div className="space-y-4"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[['Visualizações', analytics?.metrics.material_views], ['Cliques em baixar', analytics?.metrics.download_clicks], ['Gates abertos', analytics?.metrics.gate_views], ['Formulários enviados', analytics?.metrics.form_submissions], ['Autorizações', analytics?.metrics.authorizations], ['Downloads entregues', analytics?.metrics.delivered_downloads], ['Leads únicos', analytics?.metrics.unique_leads], ['Taxa de entrega', analytics ? `${analytics.metrics.delivery_rate}%` : undefined]].map(([label, value]) => <div key={String(label)} className="rounded-xl border bg-white p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-2xl font-black text-slate-900">{value ?? '—'}</p></div>)}</div><div className="rounded-xl border border-dashed border-slate-300 bg-white p-7 text-center"><BarChart3 className="mx-auto mb-3 h-9 w-9 text-blue-600" /><h3 className="font-bold">Leads e desempenho</h3><p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">Os indicadores usam registros transacionais da plataforma. A abertura do formulário e o interesse são complementados pelo PostHog, sem enviar dados pessoais.</p></div></div></TabsContent>
    </Tabs>
  </div>;
}

function Field({ label, name, required = false }: { label: string; name: string; required?: boolean }) { return <label className="space-y-1 text-sm font-medium"><span>{label}</span><Input name={name} required={required} /></label>; }
function List<T extends { id: number }>({ loading, empty, rows, children }: { loading: boolean; empty: string; rows: T[]; children: (row: T) => ReactNode }) { if (loading) return <div className="h-32 animate-pulse rounded-xl bg-slate-100" />; if (!rows.length) return <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">{empty}</div>; return <div className="divide-y overflow-hidden rounded-xl border border-slate-200 bg-white">{rows.map(row => <div key={row.id} className="grid items-center gap-3 p-4 text-sm md:grid-cols-4">{children(row)}</div>)}</div>; }
function AssetUpload({ companyId, type, id, accept, kind, onDone }: { companyId: string; type: 'project' | 'material'; id: number; accept: string; kind: 'image' | 'document'; onDone: () => Promise<void> }) { const [sending, setSending] = useState(false); const upload = async (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; const payload = new FormData(); payload.append('attachable_type', type); payload.append('attachable_id', String(id)); payload.append('kind', kind); payload.append('file', file); setSending(true); try { await fetchApi(`/company_admin/assets?company_id=${encodeURIComponent(companyId)}`, { method: 'POST', body: payload }); toast({ title: 'Arquivo enviado para moderação' }); await onDone(); } catch { toast({ title: 'Falha no envio do arquivo', variant: 'destructive' }); } finally { setSending(false); event.target.value = ''; } }; return <label className="inline-flex h-8 cursor-pointer items-center rounded-md border border-input px-2 text-xs font-medium hover:bg-slate-50"><Upload className="mr-1 h-3 w-3" />{sending ? 'Enviando…' : 'Enviar'}<input className="sr-only" type="file" accept={accept} disabled={sending} onChange={upload} /></label>; }
function ExternalVideo({ companyId, projectId, onDone }: { companyId: string; projectId: number; onDone: () => Promise<void> }) { const [open, setOpen] = useState(false); const [url, setUrl] = useState(''); const save = async () => { if (!url) return; try { await fetchApi(`/company_admin/assets?company_id=${encodeURIComponent(companyId)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ attachable_type: 'project', attachable_id: projectId, kind: 'video', provider: 'youtube', external_url: url }) }); toast({ title: 'Vídeo enviado para moderação' }); setUrl(''); setOpen(false); await onDone(); } catch { toast({ title: 'Link de vídeo inválido', variant: 'destructive' }); } }; return <>{open ? <span className="flex gap-1"><Input aria-label="URL do vídeo" className="h-8 w-44 text-xs" value={url} onChange={event => setUrl(event.target.value)} placeholder="https://youtube.com/..." /><Button size="sm" type="button" onClick={save}>Salvar</Button></span> : <Button size="sm" type="button" variant="outline" onClick={() => setOpen(true)}>Vídeo</Button>}</>; }
