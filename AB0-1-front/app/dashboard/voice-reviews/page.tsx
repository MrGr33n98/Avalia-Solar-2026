'use client';

import { useEffect, useState } from 'react';
import { Copy, Mic2, QrCode, ShieldCheck } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { useCompanyContext } from '@/context/CompanyContext';
import DashboardLayout from '../components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Form = { id: number; name: string; status: string };
type Invite = { short_code: string; public_url: string; whatsapp_url?: string | null; expires_at?: string };
type Metrics = { invites_created: number; sessions_started: number; consented: number; audio_received: number; transcript_ready: number; confirmed: number; submitted: number; approved: number };

export default function VoiceReviewsPage() {
  const searchParams = useSearchParams();
  const { activeCompany } = useCompanyContext();
  const companyId = searchParams.get('company_id') || String(activeCompany?.id || '');
  const [forms, setForms] = useState<Form[]>([]);
  const [formId, setFormId] = useState('');
  const [invite, setInvite] = useState<Invite | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState('');

  useEffect(() => { if (!companyId) return; fetchApi<{ review_forms: Form[] }>('/company_admin/review_forms', { params: { company_id: companyId } }).then((response) => { const active = response.review_forms.filter((form) => form.status === 'active'); setForms(active); setFormId(String(active[0]?.id || '')); }).catch(() => setError('Não foi possível carregar os formulários.')); }, [companyId]);
  useEffect(() => { if (!companyId) return; const to = new Date(); const from = new Date(); from.setDate(to.getDate() - 30); fetchApi<Metrics>('/company_admin/voice_review_metrics', { params: { company_id: companyId, from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) }, silent: true }).then(setMetrics).catch(() => undefined); }, [companyId, invite]);

  async function createInvite(kind: 'personal' | 'reusable_qr') { try { setError(''); const response = await fetchApi<Invite>('/company_admin/voice_review_invites', { method: 'POST', params: { company_id: companyId }, headers: { 'Idempotency-Key': `voice-${companyId}-${formId}-${Date.now()}` }, body: JSON.stringify({ company_id: Number(companyId), review_form_id: Number(formId), kind }) }); setInvite(response); } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Não foi possível gerar o convite.'); } }
  const copy = async (value: string) => { await navigator.clipboard?.writeText(value); };

  return <DashboardLayout><div className="mx-auto max-w-6xl space-y-6"><div><p className="text-sm font-semibold text-violet-700">Coleta de reputação</p><h1 className="mt-1 text-3xl font-black">Avaliações por voz</h1><p className="mt-2 max-w-2xl text-slate-600">Convide clientes a falar com o WhatsApp oficial do Avalia Solar. Opiniões positivas e críticas seguem os mesmos critérios.</p></div>{error && <div role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}<Card><CardHeader><CardTitle className="flex items-center gap-2"><Mic2 className="h-5 w-5 text-violet-700" /> Gerar convite</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-[1fr_auto_auto] sm:items-end"><label className="text-sm font-semibold">Formulário ativo<select className="mt-2 block h-11 w-full rounded-xl border border-slate-300 bg-white px-3" value={formId} onChange={(event) => setFormId(event.target.value)}>{forms.map((form) => <option key={form.id} value={form.id}>{form.name}</option>)}</select></label><Button onClick={() => createInvite('personal')} disabled={!formId}>Gerar convite pessoal</Button><Button variant="outline" onClick={() => createInvite('reusable_qr')} disabled={!formId}><QrCode className="mr-2 h-4 w-4" /> QR reutilizável</Button></CardContent></Card>{invite && <Card><CardContent className="grid gap-4 p-6"><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Link público</p><p className="mt-1 break-all text-sm font-semibold">{invite.public_url}</p><Button className="mt-3" variant="outline" size="sm" onClick={() => copy(invite.public_url)}><Copy className="mr-2 h-4 w-4" /> Copiar link</Button></div><p className="text-sm text-slate-600">Compartilhe o link manualmente. Isso não comprova que uma avaliação foi enviada.</p></CardContent></Card>}<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[['Convites', metrics?.invites_created], ['Conversas', metrics?.sessions_started], ['Áudios', metrics?.audio_received], ['Confirmadas', metrics?.confirmed], ['Enviadas', metrics?.submitted], ['Aprovadas', metrics?.approved]].map(([label, value]) => <Card key={String(label)}><CardContent className="p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-black">{value ?? '—'}</p></CardContent></Card>)}</div><div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm leading-6 text-emerald-900"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" /><p>O áudio é privado, o texto precisa ser confirmado pelo autor e a empresa não recebe gravações nem pode vetar opiniões desfavoráveis.</p></div></div></DashboardLayout>;
}
