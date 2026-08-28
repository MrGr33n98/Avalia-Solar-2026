'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Download, FileText, LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetchApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

export type FormField = { key: string; label: string; type: 'text' | 'email' | 'tel' | 'select'; required?: boolean; options?: string[] };
export type LeadForm = { id: number; name: string; fields: FormField[]; consent_text?: string | null; privacy_url?: string | null; version: number };
export type Material = { id: number; title: string; slug: string; description?: string; material_type: string; gate_mode: string; gated: boolean; file_available: boolean; lead_form?: LeadForm | null; cover_url?: string | null };

export default function MaterialsLibrary({ companyId }: { companyId: number | string }) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selected, setSelected] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchApi<{ materials: Material[] }>(`/companies/${companyId}/materials`)
      .then((response) => {
        if (active) setMaterials(response.materials || []);
      })
      .catch((err) => {
        if (active) console.error('[MaterialsLibrary] Erro ao carregar materiais:', err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [companyId]);

  const track = (eventType: string, material: Material) => fetchApi('/events/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ company_id: companyId, event_type: eventType, metadata: { material_id: material.id, material_slug: material.slug } }) }).catch(() => undefined);

  useEffect(() => {
    if (!materials.length) return;
    fetchApi('/events/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ company_id: companyId, event_type: 'material_list_viewed', metadata: { material_count: materials.length } }) }).catch(() => undefined);
  }, [companyId, materials.length]);

  const requestDownload = async (material: Material, values: Record<string, string | Record<string, string>> = {}) => {
    await track('material_download_clicked', material);
    try {
      const campaign = new URLSearchParams(window.location.search);
      const response = await fetchApi<{ delivery_url: string }>(`/material_downloads`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify({ company_id: companyId, material_slug: material.slug, utm_source: campaign.get('utm_source') || undefined, utm_medium: campaign.get('utm_medium') || undefined, utm_campaign: campaign.get('utm_campaign') || undefined, ...values }) });
      window.location.assign(response.delivery_url);
      setSelected(null);
    } catch { toast({ title: 'Não foi possível preparar o download', description: 'Tente novamente em alguns instantes.', variant: 'destructive' }); }
  };

  if (loading || !materials.length) return null;
  return <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4"><h2 className="text-lg font-black text-slate-950">Materiais e catálogos</h2><p className="mt-1 text-sm text-slate-500">Documentos técnicos e comerciais para apoiar sua decisão.</p></div><div className="grid gap-3 sm:grid-cols-2">{materials.map((material) => <article key={material.id} className="flex gap-3 rounded-xl border border-slate-200 p-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50"><FileText className="h-5 w-5 text-blue-700" /></div><div className="min-w-0 flex-1"><h3 className="truncate text-sm font-bold text-slate-900">{material.title}</h3><p className="mt-1 line-clamp-2 text-xs text-slate-500">{material.description || 'Material técnico disponível para download.'}</p><Button size="sm" variant="outline" className="mt-3" onClick={() => material.gated ? setSelected(material) : requestDownload(material)}><Download className="mr-1 h-3 w-3" />{material.gated ? <><LockKeyhole className="mr-1 h-3 w-3" />Acessar material</> : 'Baixar material'}</Button></div></article>)}</div><DownloadGate material={selected} onClose={() => setSelected(null)} onSubmit={requestDownload} onViewed={track} /></section>;
}

export function DownloadGate({ material, onClose, onSubmit, onViewed }: { material: Material | null; onClose: () => void; onSubmit: (material: Material, values: Record<string, string | Record<string, string>>) => Promise<void>; onViewed: (eventType: string, material: Material) => Promise<unknown> }) {
  useEffect(() => { if (material) void onViewed('material_gate_viewed', material); }, [material, onViewed]);
  const fields: FormField[] = material?.lead_form?.fields?.length ? material.lead_form.fields : [{ key: 'name', label: 'Nome', type: 'text', required: true }, { key: 'email', label: 'E-mail', type: 'email', required: true }];
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!material) return; const data = new FormData(event.currentTarget); const values: Record<string, string | Record<string, string>> = {}; const attributes: Record<string, string> = {}; fields.forEach((field) => { const value = String(data.get(field.key) || ''); if (['name', 'email', 'phone', 'company_name'].includes(field.key)) values[field.key] = value; else attributes[field.key] = value; }); if (Object.keys(attributes).length) values.attributes_data = attributes; values.company_website = String(data.get('company_website') || ''); values.marketing_consent = data.get('marketing_consent') ? 'true' : 'false'; await onSubmit(material, values); };
  return <Dialog open={Boolean(material)} onOpenChange={(open) => !open && onClose()}><DialogContent><DialogHeader><DialogTitle>Acesse “{material?.title}”</DialogTitle><DialogDescription>Preencha os dados solicitados para receber o material.</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-4">{fields.map((field) => <label key={field.key} className="block space-y-1"><Label htmlFor={`material-${field.key}`}>{field.label}{field.required ? ' *' : ''}</Label>{field.type === 'select' ? <select id={`material-${field.key}`} name={field.key} required={field.required} className="h-10 w-full rounded-md border border-input bg-background px-3">{(field.options || []).map(option => <option key={option} value={option}>{option}</option>)}</select> : <Input id={`material-${field.key}`} name={field.key} type={field.type} required={field.required} />}</label>)}<input name="company_website" tabIndex={-1} autoComplete="off" className="sr-only" aria-hidden="true" />{material?.lead_form?.consent_text ? <label className="flex gap-2 text-xs text-slate-600"><input name="marketing_consent" type="checkbox" />{material.lead_form.consent_text}</label> : null}{material?.lead_form?.privacy_url ? <a href={material.lead_form.privacy_url} target="_blank" rel="noreferrer" className="block text-xs text-blue-700 underline">Política de privacidade</a> : null}<Button className="w-full" type="submit"><Download className="mr-2 h-4 w-4" />Enviar e baixar</Button></form></DialogContent></Dialog>;
}
