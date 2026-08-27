'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Eye, Loader2, Lock, Palette, Plus, Send, Trash2 } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useCompanyContext } from '@/context/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { quoteFormApi, type QuoteFormDraft, type QuoteFormStudioResponse } from '@/lib/api/quoteForm';

type Field = { id: string; label: string; type: string; required: boolean };
type Step = { id: string; title: string; fields: Field[] };
type Editor = { steps: Step[]; thank_you_config: { title: string; message: string }; ui_config: { primary_color: string; logo_url: string; show_progress_bar: boolean; modal_radius: string } };
const initial: Editor = { ui_config: { primary_color: '#2563eb', logo_url: '', show_progress_bar: true, modal_radius: 'rounded' }, steps: [{ id: 'contact', title: 'Sobre você', fields: [{ id: 'name', label: 'Como podemos chamar você?', type: 'text', required: true }] }], thank_you_config: { title: 'Obrigado!', message: 'Recebemos sua solicitação.' } };

export default function QuoteFormStudioPage() {
  const { activeCompany } = useCompanyContext();
  const { user } = useAuth();
  const [tab, setTab] = useState<'appearance' | 'questions'>('appearance');
  const [editor, setEditor] = useState<Editor>(initial);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [entitlement, setEntitlement] = useState<QuoteFormStudioResponse['entitlement']>();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const companyId = activeCompany?.id ?? user?.company_id;
  const canEdit = entitlement?.can_customize !== false && entitlement?.can_publish !== false;

  useEffect(() => { if (!companyId) return; quoteFormApi.studio(companyId).then((data) => { setEntitlement(data.entitlement); if (data.draft) setEditor({ ...initial, ...data.draft, ui_config: { ...initial.ui_config, ...(data.draft.ui_config as Editor['ui_config']) } } as Editor); }).catch(() => setStatus('Modo local: API indisponível')).finally(() => setLoading(false)); }, [companyId]);
  const update = useCallback((change: (current: Editor) => Editor) => { setEditor((current) => { const next = change(current); setStatus('Alterações pendentes'); if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(async () => { if (!companyId) return; setStatus('Salvando...'); try { await quoteFormApi.save(companyId, { ui_config: next.ui_config, steps: next.steps, thank_you_config: next.thank_you_config }); setStatus('Salvo'); } catch { setStatus('Não foi possível salvar'); } }, 600); return next; }); }, [companyId]);
  const addField = () => update((current) => ({ ...current, steps: current.steps.map((step, index) => index ? step : { ...step, fields: [...step.fields, { id: `field-${Date.now()}`, label: 'Nova pergunta', type: 'text', required: false }] }) }));
  const previewStyle = useMemo(() => ({ '--quote-primary': editor.ui_config.primary_color } as React.CSSProperties), [editor.ui_config.primary_color]);
  const publish = async () => { if (!companyId) return; setStatus('Publicando...'); try { await quoteFormApi.publish(companyId); setStatus('Publicado'); } catch { setStatus('Falha ao publicar'); } };

  return <DashboardLayout><div className="mx-auto max-w-7xl space-y-6" style={previewStyle}>
    <header className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm text-muted-foreground">Company Dashboard</p><h1 className="text-3xl font-black">Quote Form Studio</h1><p className="text-muted-foreground">Personalize formulário de orçamento da sua empresa.</p></div><div className="flex items-center gap-3"><span className="text-sm text-muted-foreground">{status}</span><Button onClick={publish} disabled={!canEdit || loading}><Send className="mr-2 h-4 w-4" />Publicar</Button></div></header>
    {!canEdit && <Card className="border-amber-200 bg-amber-50"><CardContent className="flex items-center gap-3 p-5"><Lock className="text-amber-600" /><div><b>Recurso disponível no plano elegível</b><p className="text-sm text-muted-foreground">Faça upgrade para personalizar e publicar seu formulário.</p></div></CardContent></Card>}
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]"><Card><CardHeader className="border-b"><div className="flex gap-2"><Button variant={tab === 'appearance' ? 'default' : 'outline'} onClick={() => setTab('appearance')}><Palette className="mr-2 h-4 w-4" />Aparência</Button><Button variant={tab === 'questions' ? 'default' : 'outline'} onClick={() => setTab('questions')}>Perguntas</Button></div></CardHeader><CardContent className="space-y-6 p-6">{loading ? <Loader2 className="animate-spin" /> : tab === 'appearance' ? <><label className="block text-sm font-medium">Cor primária<Input type="color" value={editor.ui_config.primary_color} onChange={(e) => update((c) => ({ ...c, ui_config: { ...c.ui_config, primary_color: e.target.value } }))} className="mt-2 h-12 w-full" /></label><label className="block text-sm font-medium">URL do logo<Input value={editor.ui_config.logo_url} onChange={(e) => update((c) => ({ ...c, ui_config: { ...c.ui_config, logo_url: e.target.value } }))} placeholder="https://..." /></label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editor.ui_config.show_progress_bar} onChange={(e) => update((c) => ({ ...c, ui_config: { ...c.ui_config, show_progress_bar: e.target.checked } }))} />Exibir barra de progresso</label><label className="block text-sm font-medium">Título de conclusão<Input value={editor.thank_you_config.title} onChange={(e) => update((c) => ({ ...c, thank_you_config: { ...c.thank_you_config, title: e.target.value } }))} /></label></> : <>{editor.steps.map((step, index) => <div className="space-y-3 rounded-xl border p-4" key={step.id}><Input value={step.title} onChange={(e) => update((c) => ({ ...c, steps: c.steps.map((s, i) => i === index ? { ...s, title: e.target.value } : s) }))} />{step.fields.map((field, fieldIndex) => <div className="flex gap-2" key={field.id}><Input value={field.label} onChange={(e) => update((c) => ({ ...c, steps: c.steps.map((s, i) => i === index ? { ...s, fields: s.fields.map((f, j) => j === fieldIndex ? { ...f, label: e.target.value } : f) } : s) }))} /><Button size="icon" variant="ghost" onClick={() => update((c) => ({ ...c, steps: c.steps.map((s, i) => i === index ? { ...s, fields: s.fields.filter((_, j) => j !== fieldIndex) } : s) }))}><Trash2 className="h-4 w-4" /></Button></div>)}<Button variant="outline" onClick={addField}><Plus className="mr-2 h-4 w-4" />Adicionar pergunta</Button></div>)}</>}</CardContent></Card>
    <Card className="overflow-hidden"><CardHeader><CardTitle className="flex items-center gap-2"><Eye className="h-4 w-4" />Preview</CardTitle></CardHeader><CardContent><div className="rounded-2xl bg-slate-950 p-5 text-white"><div className="mx-auto max-w-xs space-y-5"><div className="text-center">{editor.ui_config.logo_url && <img src={editor.ui_config.logo_url} alt="Logo" className="mx-auto h-12 w-12 rounded-full object-cover" />}<h2 className="mt-3 text-xl font-bold">{editor.steps[0]?.title}</h2><p className="text-sm text-slate-300">Preencha seus dados para receber uma proposta.</p></div><div className="space-y-3">{editor.steps[0]?.fields.map((field) => <div key={field.id}><label className="text-sm">{field.label}{field.required && ' *'}</label><div className="mt-1 rounded-lg bg-white/10 p-3 text-sm text-slate-400">Digite sua resposta</div></div>)}</div><Button className="w-full" style={{ backgroundColor: editor.ui_config.primary_color }}><Check className="mr-2 h-4 w-4" />Continuar</Button></div></div></CardContent></Card></div>
  </div></DashboardLayout>;
}
