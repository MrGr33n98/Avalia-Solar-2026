'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from 'react';
import { BarChart3, FileText, FolderKanban, Pencil, Plus, RefreshCw, Send, ShieldCheck, Upload, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { fetchApi } from '@/lib/api';
import { buildApiUrl } from '@/lib/api-config';

type Asset = { id: number; kind: string; title?: string | null; alt_text?: string | null; caption?: string | null; external_url?: string | null; status: string; processing_status?: string | null; position?: number | null };
type Project = { id: number; title: string; status: string; summary?: string | null; project_type?: string | null; city?: string; state?: string; capacity_value?: number | null; capacity_unit?: string | null; moderation_reason?: string | null; assets?: Asset[] };
type Material = { id: number; title: string; status: string; description?: string | null; material_type: string; gate_mode: string; content_lead_form_id?: number | null; download_count: number; moderation_reason?: string | null; assets?: Asset[] };
type FormField = { key: string; label: string; type: 'text' | 'email' | 'tel' | 'select'; required: boolean; options?: string[] };
type LeadForm = { id: number; name: string; status: string; version: number; fields: FormField[]; consent_text?: string | null; privacy_url?: string | null };
type Analytics = { metrics: { material_views: number; download_clicks: number; gate_views: number; form_submissions: number; authorizations: number; delivered_downloads: number; unique_leads: number; delivery_rate: number }; assets: Array<{ id: number; title: string; authorizations: number; delivered_downloads: number; unique_leads: number }>; data_freshness?: { updated_at: string } };
type Funnel = { stages: Array<{ key: string; label: string; value: number; conversion_from_previous?: number }>; authorizations: number; unique_leads: number };
type Timeseries = { data: Array<{ date: string; authorizations: number; delivered_downloads: number }> };
type Sources = { sources: Array<{ source: string; medium: string; campaign: string; authorizations: number; delivered_downloads: number }> };
type Leads = { leads: Array<{ id: number; name?: string | null; email: string; phone?: string | null; company_name?: string | null; download_count: number; last_seen_at?: string | null }>; pagination: { page: number; total: number; total_pages: number } };

const Status = ({ value }: { value: string }) => <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${value === 'published' || value === 'active' ? 'bg-emerald-100 text-emerald-700' : value === 'pending' ? 'bg-amber-100 text-amber-700' : value === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>{value}</span>;
const initialFields: FormField[] = [{ key: 'name', label: 'Nome', type: 'text', required: true }, { key: 'email', label: 'E-mail', type: 'email', required: true }];

export default function ProjectsMaterialsHub({
  companyId,
  defaultTab = 'projects',
  onForbidden,
}: {
  companyId: string;
  defaultTab?: string;
  onForbidden?: () => void;
}) {
  const query = companyId ? `?company_id=${encodeURIComponent(companyId)}` : '';
  
  const handleActionError = useCallback((err: unknown, fallbackMsg: string) => {
    const isForbidden = err instanceof Error && (
      err.message.includes("[403]") || 
      err.message.includes("FEATURE_NOT_AVAILABLE") ||
      err.message.includes("unavailable for this company")
    );
    if (isForbidden) {
      onForbidden?.();
    }
    const errMsg = err instanceof Error ? cleanErrorMessage(err.message) : fallbackMsg;
    toast({ title: 'Erro', description: errMsg, variant: 'destructive' });
  }, [onForbidden]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [forms, setForms] = useState<LeadForm[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [funnel, setFunnel] = useState<Funnel | null>(null);
  const [timeseries, setTimeseries] = useState<Timeseries | null>(null);
  const [sources, setSources] = useState<Sources | null>(null);
  const [leads, setLeads] = useState<Leads | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<'project' | 'material' | 'form' | null>(null);
  const [editingForm, setEditingForm] = useState<LeadForm | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [assetTarget, setAssetTarget] = useState<{ type: 'project' | 'material'; id: number } | null>(null);
  const [materialPdf, setMaterialPdf] = useState<File | null>(null);
  const [materialCover, setMaterialCover] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [projectResponse, materialResponse, formResponse, analyticsResponse, funnelResponse, timeseriesResponse, sourcesResponse, leadsResponse] = await Promise.all([
        fetchApi<{ projects: Project[] }>(`/company_admin/projects${query}`),
        fetchApi<{ materials: Material[] }>(`/company_admin/materials${query}`),
        fetchApi<{ forms: LeadForm[] }>(`/company_admin/content_lead_forms${query}`),
        fetchApi<Analytics>(`/company_admin/content_analytics/overview${query}`),
        fetchApi<Funnel>(`/company_admin/content_analytics/funnel${query}`),
        fetchApi<Timeseries>(`/company_admin/content_analytics/timeseries${query}`),
        fetchApi<Sources>(`/company_admin/content_analytics/sources${query}`),
        fetchApi<Leads>(`/company_admin/content_leads${query}`),
      ]);
      setProjects(projectResponse.projects || []); setMaterials(materialResponse.materials || []); setForms(formResponse.forms || []);
      setAnalytics(analyticsResponse); setFunnel(funnelResponse); setTimeseries(timeseriesResponse); setSources(sourcesResponse); setLeads(leadsResponse);
    } catch { toast({ title: 'Não foi possível carregar seus conteúdos', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [query]);
  useEffect(() => { load(); }, [load]);

  const create = async (event: FormEvent<HTMLFormElement>, type: 'project' | 'material') => {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    const body = type === 'project' ? { project: { title: data.get('title'), project_type: data.get('project_type'), city: data.get('city'), state: data.get('state') } } : { material: { title: data.get('title'), material_type: 'catalog', gate_mode: data.get('gate_mode'), content_lead_form_id: data.get('content_lead_form_id') || undefined } };
    try { await fetchApi(`/company_admin/${type}s${query}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); toast({ title: 'Rascunho salvo' }); setCreating(null); event.currentTarget.reset(); await load(); }
    catch (err) { handleActionError(err, 'Não foi possível salvar'); }
  };

  const createMaterial = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    
    if (!materialPdf) {
      toast({ title: 'PDF obrigatório', description: 'Por favor, selecione um arquivo PDF.', variant: 'destructive' });
      return;
    }

    const gateMode = data.get('gate_mode');
    const contentLeadFormId = data.get('content_lead_form_id');
    if (gateMode === 'form' && !contentLeadFormId) {
      toast({
        title: 'Selecione um formulário',
        description: 'Para materiais com formulário antes de baixar, é necessário selecionar qual formulário exibir.',
        variant: 'destructive'
      });
      return;
    }

    setUploadProgress('Criando rascunho...');
    try {
      const body = {
        material: {
          title: data.get('title'),
          description: data.get('description'),
          material_type: 'catalog',
          gate_mode: gateMode,
          content_lead_form_id: contentLeadFormId || undefined
        }
      };
      
      const response = await fetchApi<{ material: Material }>(`/company_admin/materials${query}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const matId = response.material.id;
      
      setUploadProgress('Enviando PDF...');
      const pdfPayload = new FormData();
      pdfPayload.append('attachable_type', 'material');
      pdfPayload.append('attachable_id', String(matId));
      pdfPayload.append('kind', 'document');
      pdfPayload.append('file', materialPdf);
      await fetchApi(`/company_admin/assets?company_id=${encodeURIComponent(companyId)}`, {
        method: 'POST',
        body: pdfPayload
      });

      if (materialCover) {
        setUploadProgress('Enviando capa...');
        const coverPayload = new FormData();
        coverPayload.append('attachable_type', 'material');
        coverPayload.append('attachable_id', String(matId));
        coverPayload.append('kind', 'image');
        coverPayload.append('file', materialCover);
        await fetchApi(`/company_admin/assets?company_id=${encodeURIComponent(companyId)}`, {
          method: 'POST',
          body: coverPayload
        });
      }

      toast({ title: 'Material criado com sucesso!' });
      setCreating(null);
      setMaterialPdf(null);
      setMaterialCover(null);
      event.currentTarget.reset();
      await load();
    } catch (err) {
      handleActionError(err, 'Não foi possível salvar o material');
    } finally {
      setUploadProgress('');
    }
  };

  const saveForm = async (form: LeadForm | null, payload: Omit<LeadForm, 'id' | 'version' | 'status'> & { status?: string }) => {
    try {
      const path = form ? `/company_admin/content_lead_forms/${form.id}${query}` : `/company_admin/content_lead_forms${query}`;
      await fetchApi(path, { method: form ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content_lead_form: payload }) });
      toast({ title: form ? 'Formulário atualizado' : 'Formulário criado' }); setCreating(null); setEditingForm(null); await load();
    } catch (err) { handleActionError(err, 'Não foi possível salvar o formulário'); }
  };

  const toggleFormStatus = async (form: LeadForm) => {
    const nextStatus = form.status === 'active' ? 'inactive' : 'active';
    try { await fetchApi(`/company_admin/content_lead_forms/${form.id}${query}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content_lead_form: { status: nextStatus } }) }); toast({ title: nextStatus === 'active' ? 'Formulário ativado' : 'Formulário desativado' }); await load(); }
    catch (err) { handleActionError(err, 'Não foi possível alterar o formulário'); }
  };

  const submit = async (type: 'project' | 'material', id: number) => {
    try { await fetchApi(`/company_admin/${type}s/${id}/submit${query}`, { method: 'POST' }); toast({ title: 'Enviado para moderação' }); await load(); }
    catch (err) { handleActionError(err, 'Não foi possível enviar'); }
  };

  const updateContent = async (type: 'project' | 'material', id: number, payload: Record<string, unknown>) => {
    try { await fetchApi(`/company_admin/${type}s/${id}${query}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [type]: payload }) }); toast({ title: 'Alterações salvas', description: 'Conteúdo já publicado volta para moderação após uma edição.' }); setEditingProject(null); setEditingMaterial(null); await load(); }
    catch (err) { handleActionError(err, 'Não foi possível salvar as alterações'); }
  };

  const archive = async (type: 'project' | 'material', id: number) => {
    if (!window.confirm('Arquivar este item? Ele deixará de aparecer publicamente.')) return;
    try { await fetchApi(`/company_admin/${type}s/${id}${query}`, { method: 'DELETE' }); toast({ title: 'Item arquivado' }); await load(); }
    catch (err) { handleActionError(err, 'Não foi possível arquivar'); }
  };

  const updateAsset = async (id: number, payload: Record<string, unknown>) => {
    try { await fetchApi(`/company_admin/assets/${id}${query}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); toast({ title: 'Metadados da mídia salvos', description: 'Mídia publicada volta para moderação após edição.' }); await load(); }
    catch (err) { handleActionError(err, 'Não foi possível salvar a mídia'); }
  };

  const archiveAsset = async (id: number) => {
    if (!window.confirm('Remover esta mídia da vitrine? O arquivo permanece auditável como arquivado.')) return;
    try { await fetchApi(`/company_admin/assets/${id}${query}`, { method: 'DELETE' }); toast({ title: 'Mídia arquivada' }); await load(); }
    catch (err) { handleActionError(err, 'Não foi possível arquivar a mídia'); }
  };

  const activeForms = useMemo(() => forms.filter(form => form.status === 'active'), [forms]);
  const assetOwner = assetTarget ? (assetTarget.type === 'project' ? projects.find(project => project.id === assetTarget.id) : materials.find(material => material.id === assetTarget.id)) : null;
  return <div className="mx-auto max-w-6xl space-y-6 pb-16">
    <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 md:flex-row md:items-center"><div><h2 className="text-2xl font-black text-slate-950">Projetos e materiais</h2><p className="mt-1 text-sm text-slate-500">Cases, documentos e dados de intenção da sua empresa.</p></div><Button variant="outline" onClick={load} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" />Atualizar</Button></div>
    <Tabs defaultValue={defaultTab} className="space-y-5"><TabsList className="h-auto w-full justify-start gap-2 overflow-x-auto rounded-xl bg-slate-100 p-1"><TabsTrigger value="projects"><FolderKanban className="mr-2 h-4 w-4" />Projetos</TabsTrigger><TabsTrigger value="materials"><FileText className="mr-2 h-4 w-4" />Materiais</TabsTrigger><TabsTrigger value="forms"><ShieldCheck className="mr-2 h-4 w-4" />Formulários</TabsTrigger><TabsTrigger value="analytics"><BarChart3 className="mr-2 h-4 w-4" />Desempenho</TabsTrigger><TabsTrigger value="leads"><Users className="mr-2 h-4 w-4" />Leads</TabsTrigger></TabsList>
      <TabsContent value="projects" className="space-y-4"><div className="flex justify-end"><Button onClick={() => setCreating('project')}><Plus className="mr-2 h-4 w-4" />Novo projeto</Button></div>{creating === 'project' && <form onSubmit={event => create(event, 'project')} className="grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-2"><Field label="Título *" name="title" required /><Field label="Tipo de projeto" name="project_type" /><Field label="Cidade" name="city" /><Field label="UF" name="state" /><Actions onCancel={() => setCreating(null)} /></form>}{editingProject && <ProjectEditor project={editingProject} onCancel={() => setEditingProject(null)} onSave={payload => updateContent('project', editingProject.id, payload)} />}<List loading={loading} empty="Crie o primeiro projeto para montar sua vitrine pública." rows={projects}>{project => <><span className="font-semibold">{project.title}<ModerationNote note={project.moderation_reason} /></span><span>{[project.city, project.state].filter(Boolean).join(' - ') || 'Sem localização'}</span><Status value={project.status} /><div className="flex flex-wrap gap-2"><AssetUpload companyId={companyId} type="project" id={project.id} accept="image/png,image/jpeg,image/webp" kind="image" onDone={load} /><ExternalVideo companyId={companyId} projectId={project.id} onDone={load} /><Button size="sm" type="button" variant="outline" onClick={() => setAssetTarget({ type: 'project', id: project.id })}>Mídias ({project.assets?.length || 0})</Button><Button size="sm" type="button" variant="outline" onClick={() => setEditingProject(project)}><Pencil className="mr-1 h-3 w-3" />Editar</Button>{project.status === 'draft' && <Button size="sm" variant="outline" onClick={() => submit('project', project.id)}><Send className="mr-1 h-3 w-3" />Enviar</Button>}<Button size="sm" type="button" variant="ghost" onClick={() => archive('project', project.id)}>Arquivar</Button></div></>}</List>{assetTarget?.type === 'project' && assetOwner && <AssetManager title={assetOwner.title} assets={assetOwner.assets || []} onClose={() => setAssetTarget(null)} onSave={updateAsset} onArchive={archiveAsset} />}</TabsContent>
      <TabsContent value="materials" className="space-y-4">
        <div className="flex flex-col gap-4 rounded-2xl border border-blue-100 bg-gradient-to-br from-white via-white to-blue-50/60 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div><div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20"><FileText className="h-4 w-4" /></span><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Biblioteca premium</p><h2 className="text-xl font-black tracking-tight text-slate-950">Materiais da empresa</h2></div></div><p className="mt-2 text-sm text-slate-500">PDFs prontos para gerar demanda, com revisão segura e download rastreável.</p></div>
          <Button onClick={() => {
            setMaterialPdf(null);
            setMaterialCover(null);
            setCreating('material');
          }}>
            <Plus className="mr-2 h-4 w-4" />Novo material
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3"><Card className="border-blue-100 bg-white/80 shadow-sm"><CardContent className="p-4"><p className="text-xs font-semibold text-slate-500">Materiais</p><p className="mt-1 text-2xl font-black text-slate-950">{materials.length}</p></CardContent></Card><Card className="border-blue-100 bg-white/80 shadow-sm"><CardContent className="p-4"><p className="text-xs font-semibold text-slate-500">Prontos para revisão</p><p className="mt-1 text-2xl font-black text-blue-600">{materials.filter(material => material.assets?.some(asset => asset.kind === 'document' && asset.status !== 'archived')).length}</p></CardContent></Card><Card className="border-blue-100 bg-white/80 shadow-sm"><CardContent className="p-4"><p className="text-xs font-semibold text-slate-500">Downloads</p><p className="mt-1 text-2xl font-black text-slate-950">{materials.reduce((total, material) => total + (material.download_count || 0), 0)}</p></CardContent></Card></div>

        {creating === 'material' && (
          <form onSubmit={createMaterial} className="grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-2">
            <Field label="Título *" name="title" required />
            <label className="space-y-1 text-sm font-medium">
              <span>Acesso</span>
              <select name="gate_mode" className="h-10 w-full rounded-md border border-input bg-background px-3">
                <option value="none">Livre</option>
                <option value="form">Formulário antes de baixar</option>
              </select>
            </label>
            <label className="space-y-1 text-sm font-medium">
              <span>Formulário</span>
              <select name="content_lead_form_id" className="h-10 w-full rounded-md border border-input bg-background px-3">
                <option value="">Selecione se usar gate</option>
                {activeForms.map(form => (
                  <option key={form.id} value={form.id}>{form.name}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm font-medium md:col-span-2">
              <span>Descrição</span>
              <textarea name="description" className="min-h-20 w-full rounded-md border border-input bg-background p-2 text-sm" />
            </label>

            <div className="md:col-span-2 grid gap-3 md:grid-cols-2">
              <DropzoneField label="Arquivo PDF (máx. 25MB) *" accept="application/pdf" onChange={setMaterialPdf} file={materialPdf} />
              <DropzoneField label="Imagem de Capa (opcional)" accept="image/png,image/jpeg,image/webp" onChange={setMaterialCover} file={materialCover} />
            </div>

            <div className="flex items-end gap-3 md:col-span-2 mt-2">
              {uploadProgress ? (
                <div className="flex items-center gap-2 text-sm font-bold text-primary">
                  <RefreshCw className="animate-spin h-4 w-4" />
                  <span>{uploadProgress}</span>
                </div>
              ) : (
                <>
                  <Button type="submit">Salvar rascunho</Button>
                  <Button type="button" variant="ghost" onClick={() => setCreating(null)}>Cancelar</Button>
                </>
              )}
            </div>
          </form>
        )}

        {editingMaterial && (
          <MaterialEditor
            material={editingMaterial}
            forms={forms}
            onCancel={() => setEditingMaterial(null)}
            onSave={async (payload, pdf, cover) => {
              try {
                // 1. Update metadata
                await fetchApi(`/company_admin/materials/${editingMaterial.id}${query}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ material: payload })
                });
                
                // 2. Upload PDF if selected
                if (pdf) {
                  const pdfPayload = new FormData();
                  pdfPayload.append('attachable_type', 'material');
                  pdfPayload.append('attachable_id', String(editingMaterial.id));
                  pdfPayload.append('kind', 'document');
                  pdfPayload.append('file', pdf);
                  await fetchApi(`/company_admin/assets?company_id=${encodeURIComponent(companyId)}`, {
                    method: 'POST',
                    body: pdfPayload
                  });
                }

                // 3. Upload Cover if selected
                if (cover) {
                  const coverPayload = new FormData();
                  coverPayload.append('attachable_type', 'material');
                  coverPayload.append('attachable_id', String(editingMaterial.id));
                  coverPayload.append('kind', 'image');
                  coverPayload.append('file', cover);
                  await fetchApi(`/company_admin/assets?company_id=${encodeURIComponent(companyId)}`, {
                    method: 'POST',
                    body: coverPayload
                  });
                }
                
                toast({ title: 'Material atualizado com sucesso!' });
                setEditingMaterial(null);
                await load();
              } catch (err) {
                const errMsg = err instanceof Error ? cleanErrorMessage(err.message) : 'Erro ao atualizar material';
                toast({ title: 'Erro ao atualizar', description: errMsg, variant: 'destructive' });
              }
            }}
          />
        )}

        <List loading={loading} empty="Publique catálogos, apresentações e materiais técnicos." rows={materials}>
          {material => (
            <>
              <span className="font-semibold">
                {material.title}
                <ModerationNote note={material.moderation_reason} />
              </span>
              <span>{material.gate_mode === 'none' ? 'Acesso livre' : 'Com formulário'}</span>
              <Status value={material.status} />
              <div className="flex flex-wrap gap-2">
                <AssetUpload companyId={companyId} type="material" id={material.id} accept="application/pdf" kind="document" onDone={load} />
                <Button size="sm" type="button" variant="outline" onClick={() => setAssetTarget({ type: 'material', id: material.id })}>
                  Mídias ({material.assets?.length || 0})
                </Button>
                <Button size="sm" type="button" variant="outline" onClick={() => setEditingMaterial(material)}>
                  <Pencil className="mr-1 h-3 w-3" />Editar
                </Button>
                {material.status === 'draft' && (
                  <Button size="sm" variant="outline" disabled={!material.assets?.some(asset => asset.kind === 'document' && asset.status !== 'archived')} onClick={() => submit('material', material.id)}>
                    <Send className="mr-1 h-3 w-3" />Enviar
                  </Button>
                )}
                <Button size="sm" type="button" variant="ghost" onClick={() => archive('material', material.id)}>
                  Arquivar
                </Button>
              </div>
            </>
          )}
        </List>
        {assetTarget?.type === 'material' && assetOwner && (
          <AssetManager title={assetOwner.title} assets={assetOwner.assets || []} onClose={() => setAssetTarget(null)} onSave={updateAsset} onArchive={archiveAsset} />
        )}
      </TabsContent>
      <TabsContent value="forms" className="space-y-4"><div className="flex justify-end"><Button onClick={() => { setEditingForm(null); setCreating('form'); }}><Plus className="mr-2 h-4 w-4" />Novo formulário</Button></div>{(creating === 'form' || editingForm) && <FormBuilder initial={editingForm} onCancel={() => { setCreating(null); setEditingForm(null); }} onSave={payload => saveForm(editingForm, payload)} />}<List loading={loading} empty="Crie formulários para seus materiais protegidos." rows={forms}>{form => <><span className="font-semibold">{form.name}<span className="ml-2 text-xs font-normal text-slate-500">{form.fields?.length || 0} campos</span></span><span>Versão {form.version}</span><Status value={form.status} /><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => { setCreating(null); setEditingForm(form); }}><Pencil className="mr-1 h-3 w-3" />Editar</Button><Button size="sm" type="button" variant="ghost" onClick={() => toggleFormStatus(form)}>{form.status === 'active' ? 'Desativar' : 'Ativar'}</Button></div></>}</List></TabsContent>
      <TabsContent value="analytics"><AnalyticsPanel analytics={analytics} funnel={funnel} timeseries={timeseries} sources={sources} /></TabsContent>
      <TabsContent value="leads"><LeadsPanel leads={leads} companyId={companyId} /></TabsContent>
    </Tabs>
  </div>;
}

function ProjectEditor({ project, onCancel, onSave }: { project: Project; onCancel: () => void; onSave: (payload: Record<string, unknown>) => void }) {
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const data = new FormData(event.currentTarget); onSave({ title: data.get('title'), summary: data.get('summary'), project_type: data.get('project_type'), city: data.get('city'), state: data.get('state'), capacity_value: data.get('capacity_value') || undefined, capacity_unit: data.get('capacity_unit') || undefined }); };
  return <form onSubmit={submit} className="grid gap-3 rounded-xl border border-blue-200 bg-blue-50/30 p-4 md:grid-cols-2"><Field label="Título *" name="title" required value={project.title} /><Field label="Tipo de projeto" name="project_type" value={project.project_type || ''} /><Field label="Cidade" name="city" value={project.city || ''} /><Field label="UF" name="state" value={project.state || ''} /><Field label="Potência" name="capacity_value" type="number" value={project.capacity_value?.toString() || ''} /><Field label="Unidade" name="capacity_unit" value={project.capacity_unit || 'kWp'} /><label className="space-y-1 text-sm font-medium md:col-span-2"><span>Resumo</span><textarea name="summary" defaultValue={project.summary || ''} className="min-h-20 w-full rounded-md border border-input bg-white p-2 text-sm" /></label><Actions onCancel={onCancel} /></form>;
}

function MaterialEditor({
  material,
  forms,
  onCancel,
  onSave
}: {
  material: Material;
  forms: LeadForm[];
  onCancel: () => void;
  onSave: (payload: Record<string, unknown>, pdf: File | null, cover: File | null) => Promise<void>;
}) {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const gate_mode = data.get('gate_mode');
    const content_lead_form_id = data.get('content_lead_form_id');

    if (gate_mode === 'form' && !content_lead_form_id) {
      toast({
        title: 'Selecione um formulário',
        description: 'Para materiais com formulário antes de baixar, é necessário selecionar qual formulário exibir.',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    const payload = {
      title: data.get('title'),
      description: data.get('description'),
      material_type: data.get('material_type'),
      gate_mode,
      content_lead_form_id: content_lead_form_id || null
    };
    await onSave(payload, pdfFile, coverFile);
    setSaving(false);
  };

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-xl border border-blue-200 bg-blue-50/30 p-4 md:grid-cols-2">
      <Field label="Título *" name="title" required value={material.title} />
      <Field label="Tipo de material" name="material_type" value={material.material_type} />
      <label className="space-y-1 text-sm font-medium">
        <span>Acesso</span>
        <select name="gate_mode" defaultValue={material.gate_mode === 'request_access' ? 'form' : material.gate_mode} className="h-10 w-full rounded-md border border-input bg-white px-3">
          <option value="none">Livre</option>
          <option value="form">Formulário antes de baixar</option>
        </select>
      </label>
      <label className="space-y-1 text-sm font-medium">
        <span>Formulário</span>
        <select name="content_lead_form_id" defaultValue={material.content_lead_form_id?.toString() || ''} className="h-10 w-full rounded-md border border-input bg-white px-3">
          <option value="">Selecione se usar gate</option>
          {forms.map(form => (
            <option key={form.id} value={form.id} disabled={form.status !== 'active' && form.id !== material.content_lead_form_id}>
              {form.name}{form.status !== 'active' ? ' (inativo)' : ''}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1 text-sm font-medium md:col-span-2">
        <span>Descrição</span>
        <textarea name="description" defaultValue={material.description || ''} className="min-h-20 w-full rounded-md border border-input bg-white p-2 text-sm" />
      </label>

      <div className="md:col-span-2 grid gap-3 md:grid-cols-2">
        <DropzoneField label="Substituir PDF (opcional)" accept="application/pdf" onChange={setPdfFile} file={pdfFile} />
        <DropzoneField label="Substituir Capa (opcional)" accept="image/png,image/jpeg,image/webp" onChange={setCoverFile} file={coverFile} />
      </div>

      <div className="flex items-end gap-2 md:col-span-2">
        <Button type="submit" disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function AssetManager({ title, assets, onClose, onSave, onArchive }: { title: string; assets: Asset[]; onClose: () => void; onSave: (id: number, payload: Record<string, unknown>) => Promise<void>; onArchive: (id: number) => Promise<void> }) {
  return <section className="space-y-3 rounded-xl border border-blue-200 bg-blue-50/30 p-4"><div className="flex items-center justify-between"><div><h3 className="font-bold">Mídias de {title}</h3><p className="text-xs text-slate-500">Defina a ordem, o título, o texto alternativo e a legenda. Alterações em mídia publicada voltam para revisão.</p></div><Button type="button" variant="ghost" size="sm" onClick={onClose}>Fechar</Button></div>{assets.length ? <div className="space-y-3">{assets.map(asset => <form key={asset.id} onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); const position = String(data.get('position') || '').trim(); void onSave(asset.id, { title: data.get('title'), alt_text: data.get('alt_text'), caption: data.get('caption'), position: position ? Number(position) : null }); }} className="grid gap-2 rounded-lg border bg-white p-3 md:grid-cols-[90px_70px_1fr_1fr_1fr_auto_auto]"><div className="text-sm"><p className="font-semibold capitalize">{asset.kind}</p><Status value={asset.status} /></div><Input name="position" aria-label="Ordem de exibição" type="number" min="0" defaultValue={asset.position?.toString() || ''} placeholder="Ordem" /><Input name="title" aria-label="Título da mídia" defaultValue={asset.title || ''} placeholder="Título" /><Input name="alt_text" aria-label="Texto alternativo" defaultValue={asset.alt_text || ''} placeholder="Texto alternativo" /><Input name="caption" aria-label="Legenda" defaultValue={asset.caption || ''} placeholder="Legenda" /><Button type="submit" size="sm">Salvar</Button><Button type="button" size="sm" variant="ghost" onClick={() => void onArchive(asset.id)}>Arquivar</Button>{asset.external_url ? <a className="text-xs text-blue-700 underline md:col-span-7" href={asset.external_url} target="_blank" rel="noreferrer">Abrir vídeo externo</a> : null}</form>)}</div> : <p className="rounded-lg border border-dashed bg-white p-4 text-sm text-slate-500">Nenhuma mídia enviada ainda.</p>}</section>;
}

function FormBuilder({ initial, onCancel, onSave }: { initial: LeadForm | null; onCancel: () => void; onSave: (payload: Omit<LeadForm, 'id' | 'version' | 'status'>) => void }) {
  const [name, setName] = useState(initial?.name || ''); const [fields, setFields] = useState<FormField[]>(initial?.fields?.length ? initial.fields : initialFields); const [consentText, setConsentText] = useState(initial?.consent_text || ''); const [privacyUrl, setPrivacyUrl] = useState(initial?.privacy_url || '');
  const addField = () => setFields(current => [...current, { key: `field_${current.length + 1}`, label: 'Novo campo', type: 'text', required: false }]);
  const updateField = (index: number, patch: Partial<FormField>) => setFields(current => current.map((field, fieldIndex) => fieldIndex === index ? { ...field, ...patch } : field));
  return <form onSubmit={event => { event.preventDefault(); onSave({ name, fields, consent_text: consentText || undefined, privacy_url: privacyUrl || undefined }); }} className="space-y-4 rounded-xl border bg-white p-4"><div className="grid gap-3 md:grid-cols-2"><Field label="Nome do formulário *" name="form-name" required value={name} onChange={setName} /><Field label="URL de privacidade" name="privacy-url" type="url" value={privacyUrl} onChange={setPrivacyUrl} /></div><div><p className="mb-2 text-sm font-semibold">Campos coletados</p><div className="space-y-2">{fields.map((field, index) => <div key={`${field.key}-${index}`} className="rounded-lg bg-slate-50 p-2"><div className="grid gap-2 md:grid-cols-[1fr_1fr_120px_auto_auto]"><Input aria-label="Chave do campo" value={field.key} onChange={event => updateField(index, { key: event.target.value.replace(/\s+/g, '_').toLowerCase() })} placeholder="chave" /><Input aria-label="Rótulo do campo" value={field.label} onChange={event => updateField(index, { label: event.target.value })} placeholder="Rótulo" /><select aria-label="Tipo do campo" value={field.type} onChange={event => updateField(index, { type: event.target.value as FormField['type'] })} className="h-10 rounded-md border border-input bg-white px-2 text-sm"><option value="text">Texto</option><option value="email">E-mail</option><option value="tel">Telefone</option><option value="select">Lista</option></select><label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={field.required} onChange={event => updateField(index, { required: event.target.checked })} />Obrigatório</label><Button type="button" size="sm" variant="ghost" disabled={fields.length <= 1} onClick={() => setFields(current => current.filter((_, fieldIndex) => fieldIndex !== index))}>Remover</Button></div>{field.type === 'select' ? <Input aria-label="Opções da lista" className="mt-2" value={(field.options || []).join(', ')} onChange={event => updateField(index, { options: event.target.value.split(',').map(option => option.trim()).filter(Boolean) })} placeholder="Opções, separadas por vírgula" /> : null}</div>)}</div><Button type="button" size="sm" variant="outline" className="mt-3" onClick={addField}><Plus className="mr-1 h-3 w-3" />Adicionar campo</Button></div><label className="block space-y-1 text-sm font-medium"><span>Texto de consentimento de marketing (opcional)</span><textarea value={consentText} onChange={event => setConsentText(event.target.value)} className="min-h-20 w-full rounded-md border border-input bg-background p-2 text-sm" placeholder="Deixe vazio se não houver opt-in de marketing." /></label><div className="flex gap-2"><Button type="submit">Salvar formulário</Button><Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button></div></form>;
}

function AnalyticsPanel({ analytics, funnel, timeseries, sources }: { analytics: Analytics | null; funnel: Funnel | null; timeseries: Timeseries | null; sources: Sources | null }) {
  const max = Math.max(...(timeseries?.data.map(point => Math.max(point.authorizations, point.delivered_downloads)) || [1]), 1);
  return <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[['Visualizações', analytics?.metrics.material_views], ['Cliques em baixar', analytics?.metrics.download_clicks], ['Gates abertos', analytics?.metrics.gate_views], ['Formulários enviados', analytics?.metrics.form_submissions], ['Autorizações', analytics?.metrics.authorizations], ['Downloads entregues', analytics?.metrics.delivered_downloads], ['Leads únicos', analytics?.metrics.unique_leads], ['Taxa de entrega', analytics ? `${analytics.metrics.delivery_rate}%` : undefined]].map(([label, value]) => <div key={String(label)} className="rounded-xl border bg-white p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-2xl font-black text-slate-900">{value ?? '—'}</p></div>)}</div><div className="grid gap-4 lg:grid-cols-2"><section className="rounded-xl border bg-white p-5"><h3 className="font-bold">Funil de intenção</h3><p className="mt-1 text-sm text-slate-500">Do interesse até a entrega confirmada.</p><div className="mt-5 space-y-3">{funnel?.stages.map((stage, index) => <div key={stage.key}><div className="mb-1 flex justify-between text-sm"><span>{stage.label}</span><span className="font-bold">{stage.value}{index > 0 ? ` · ${stage.conversion_from_previous}%` : ''}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.min(100, (stage.value / Math.max(funnel.stages[0]?.value || 1, 1)) * 100)}%` }} /></div></div>) || <p className="mt-4 text-sm text-slate-500">Dados em processamento.</p>}</div></section><section className="rounded-xl border bg-white p-5"><h3 className="font-bold">Entregas nos últimos 30 dias</h3><div className="mt-5 flex h-40 items-end gap-1">{timeseries?.data.map(point => <div key={point.date} title={`${point.date}: ${point.delivered_downloads} entregues`} className="flex min-w-0 flex-1 flex-col justify-end"><div className="min-h-1 rounded-t bg-blue-600" style={{ height: `${(point.delivered_downloads / max) * 100}%` }} /></div>) || <p className="text-sm text-slate-500">Dados em processamento.</p>}</div><p className="mt-3 text-xs text-slate-500">Barras representam downloads entregues por dia.</p></section></div>{analytics?.assets?.length ? <section className="overflow-hidden rounded-xl border bg-white"><div className="border-b p-4"><h3 className="font-bold">Materiais com maior intenção</h3></div><div className="divide-y">{analytics.assets.map(asset => <div key={asset.id} className="grid gap-1 p-4 text-sm sm:grid-cols-4"><span className="font-semibold">{asset.title}</span><span>{asset.authorizations} autorizações</span><span>{asset.delivered_downloads} entregues</span><span>{asset.unique_leads} leads</span></div>)}</div></section> : null}{sources?.sources?.length ? <section className="overflow-hidden rounded-xl border bg-white"><div className="border-b p-4"><h3 className="font-bold">Origem e campanhas</h3></div><div className="divide-y">{sources.sources.map((source, index) => <div key={`${source.source}-${source.medium}-${source.campaign}-${index}`} className="grid gap-1 p-4 text-sm sm:grid-cols-5"><span className="font-semibold">{source.source}</span><span>{source.medium}</span><span className="truncate" title={source.campaign}>{source.campaign}</span><span>{source.authorizations} autorizações</span><span>{source.delivered_downloads} entregues</span></div>)}</div></section> : null}<p className="text-xs text-slate-500">Dados transacionais atualizados em {analytics?.data_freshness?.updated_at ? new Date(analytics.data_freshness.updated_at).toLocaleString('pt-BR') : 'processamento'}. PostHog complementa comportamento sem receber dados pessoais.</p></div>;
}

function LeadsPanel({ leads, companyId }: { leads: Leads | null; companyId: string }) {
  if (!leads) return <div className="rounded-xl border border-dashed bg-white p-8 text-center text-sm text-slate-500">Carregando leads autorizados…</div>;
  if (!leads.leads.length) return <div className="rounded-xl border border-dashed bg-white p-8 text-center text-sm text-slate-500">Os leads dos materiais protegidos aparecerão aqui. Contatos de download não criam usuários da plataforma.</div>;
  const exportCsv = async () => { try { const response = await fetch(buildApiUrl(`/company_admin/content_leads/export?company_id=${encodeURIComponent(companyId)}`), { credentials: 'include', headers: { Accept: 'text/csv' } }); if (!response.ok) throw new Error('export_failed'); const blob = await response.blob(); const href = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = href; anchor.download = `leads_${companyId}.csv`; anchor.click(); URL.revokeObjectURL(href); toast({ title: 'Exportação concluída' }); } catch { toast({ title: 'Não foi possível exportar os leads', variant: 'destructive' }); } };
  return <section className="overflow-hidden rounded-xl border bg-white"><div className="flex items-center justify-between gap-3 border-b p-4"><div><h3 className="font-bold">Leads captados</h3><p className="text-xs text-slate-500">{leads.pagination.total} contato(s) no escopo da sua empresa.</p></div><div className="flex items-center gap-3"><Button size="sm" type="button" variant="outline" onClick={() => void exportCsv()}>Exportar CSV</Button><span className="text-xs text-slate-500">Exportações são auditadas</span></div></div><div className="divide-y">{leads.leads.map(lead => <div key={lead.id} className="grid gap-1 p-4 text-sm md:grid-cols-5"><div><p className="font-semibold">{lead.name || 'Sem nome'}</p><p className="text-xs text-slate-500">{lead.company_name || '—'}</p></div><span className="break-all">{lead.email}</span><span>{lead.phone || '—'}</span><span>{lead.download_count} download(s)</span><span className="text-slate-500">{lead.last_seen_at ? new Date(lead.last_seen_at).toLocaleDateString('pt-BR') : '—'}</span></div>)}</div></section>;
}

function Field({ label, name, required = false, type = 'text', value, onChange }: { label: string; name: string; required?: boolean; type?: string; value?: string; onChange?: (value: string) => void }) { return <label className="space-y-1 text-sm font-medium"><span>{label}</span><Input name={name} type={type} required={required} {...(onChange ? { value, onChange: (event) => onChange(event.target.value) } : { defaultValue: value })} /></label>; }
function Actions({ onCancel }: { onCancel: () => void }) { return <div className="flex items-end gap-2"><Button type="submit">Salvar rascunho</Button><Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button></div>; }
function ModerationNote({ note }: { note?: string | null }) { return note ? <span className="mt-1 block text-xs font-normal text-rose-600">Motivo da moderação: {note}</span> : null; }
function List<T extends { id: number }>({ loading, empty, rows, children }: { loading: boolean; empty: string; rows: T[]; children: (row: T) => ReactNode }) { if (loading) return <div className="h-32 animate-pulse rounded-xl bg-slate-100" />; if (!rows.length) return <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">{empty}</div>; return <div className="divide-y overflow-hidden rounded-xl border border-slate-200 bg-white">{rows.map(row => <div key={row.id} className="grid items-center gap-3 p-4 text-sm md:grid-cols-4">{children(row)}</div>)}</div>; }
function AssetUpload({ companyId, type, id, accept, kind, onDone }: { companyId: string; type: 'project' | 'material'; id: number; accept: string; kind: 'image' | 'document'; onDone: () => Promise<void> }) { const [sending, setSending] = useState(false); const upload = async (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; const payload = new FormData(); payload.append('attachable_type', type); payload.append('attachable_id', String(id)); payload.append('kind', kind); payload.append('file', file); setSending(true); try { await fetchApi(`/company_admin/assets?company_id=${encodeURIComponent(companyId)}`, { method: 'POST', body: payload }); toast({ title: 'Arquivo enviado para moderação' }); await onDone(); } catch { toast({ title: 'Falha no envio do arquivo', variant: 'destructive' }); } finally { setSending(false); event.target.value = ''; } }; return <label className="inline-flex h-8 cursor-pointer items-center rounded-md border border-input px-2 text-xs font-medium hover:bg-slate-50"><Upload className="mr-1 h-3 w-3" />{sending ? 'Enviando…' : 'Enviar'}<input className="sr-only" type="file" accept={accept} disabled={sending} onChange={upload} /></label>; }
function ExternalVideo({ companyId, projectId, onDone }: { companyId: string; projectId: number; onDone: () => Promise<void> }) { const [open, setOpen] = useState(false); const [url, setUrl] = useState(''); const save = async () => { if (!url) return; try { await fetchApi(`/company_admin/assets?company_id=${encodeURIComponent(companyId)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ attachable_type: 'project', attachable_id: projectId, kind: 'video', provider: 'youtube', external_url: url }) }); toast({ title: 'Vídeo enviado para moderação' }); setUrl(''); setOpen(false); await onDone(); } catch { toast({ title: 'Link de vídeo inválido', variant: 'destructive' }); } }; return <>{open ? <span className="flex gap-1"><Input aria-label="URL do vídeo" className="h-8 w-44 text-xs" value={url} onChange={event => setUrl(event.target.value)} placeholder="https://youtube.com/..." /><Button size="sm" type="button" onClick={save}>Salvar</Button></span> : <Button size="sm" type="button" variant="outline" onClick={() => setOpen(true)}>Vídeo</Button>}</>; }

function DropzoneField({
  label,
  accept,
  onChange,
  file
}: {
  label: string;
  accept: string;
  onChange: (file: File | null) => void;
  file: File | null;
}) {
  const [dragActive, setDragActive] = useState(false);
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onChange(e.dataTransfer.files[0]);
    }
  };
  return (
    <div className="space-y-1 text-sm font-medium">
      <span>{label}</span>
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-4 cursor-pointer transition-colors min-h-[100px] ${
          dragActive ? 'border-blue-500 bg-blue-50/50' : file ? 'border-emerald-500 bg-emerald-50/10' : 'border-slate-300 hover:border-blue-400'
        }`}
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = accept;
          input.onchange = (e) => {
            const selected = (e.target as HTMLInputElement).files?.[0];
            if (selected) onChange(selected);
          };
          input.click();
        }}
      >
        {file ? (
          <div className="text-center space-y-1.5 w-full">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate px-2">{file.name}</p>
            <p className="text-[10px] text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            <button
              type="button"
              className="text-[10px] text-rose-500 underline font-bold"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
            >
              Remover arquivo
            </button>
          </div>
        ) : (
          <div className="text-center text-slate-500 space-y-1">
            <Upload className="mx-auto h-5 w-5 text-slate-400" />
            <p className="text-xs">Arraste ou clique para selecionar</p>
            <p className="text-[10px] text-slate-400">Tipo: {accept}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function cleanErrorMessage(message: string): string {
  if (
    message.includes("FEATURE_NOT_AVAILABLE") ||
    message.includes("[403]") ||
    message.includes("Feature unavailable") ||
    message.includes("unavailable for this company")
  ) {
    return "Este recurso não está disponível no plano atual desta empresa.";
  }
  if (message.includes("Content lead form can't be blank")) {
    return "O formulário de captura de leads é obrigatório para materiais restritos.";
  }
  if (message.includes("Title can't be blank")) {
    return "O título não pode ficar em branco.";
  }
  if (message.includes("Slug can't be blank")) {
    return "O slug da URL não pode ficar em branco.";
  }
  return message.replace(/^\[\d+\]\s*/, '');
}
