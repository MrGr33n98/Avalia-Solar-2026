'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Download, FileText, LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetchApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

type Material = { id: number; title: string; slug: string; description?: string; material_type: string; gate_mode: string; gated: boolean; file_available: boolean };

export default function MaterialsLibrary({ companyId }: { companyId: number | string }) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selected, setSelected] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchApi<{ materials: Material[] }>(`/companies/${companyId}/materials`).then((response) => active && setMaterials(response.materials || [])).catch(() => active && setMaterials([])).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [companyId]);

  const track = (eventType: string, material: Material) => fetchApi('/events/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ company_id: companyId, event_type: eventType, metadata: { material_id: material.id, material_slug: material.slug } }) }).catch(() => undefined);

  useEffect(() => {
    if (!materials.length) return;
    fetchApi('/events/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ company_id: companyId, event_type: 'material_list_viewed', metadata: { material_count: materials.length } }) }).catch(() => undefined);
  }, [companyId, materials.length]);

  const requestDownload = async (material: Material, values: Record<string, string> = {}) => {
    await track('material_download_clicked', material);
    try {
      const response = await fetchApi<{ delivery_url: string }>(`/material_downloads`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify({ company_id: companyId, material_slug: material.slug, ...values }) });
      window.location.assign(response.delivery_url);
      setSelected(null);
    } catch { toast({ title: 'Não foi possível preparar o download', description: 'Tente novamente em alguns instantes.', variant: 'destructive' }); }
  };

  if (loading || !materials.length) return null;
  return <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4"><h2 className="text-lg font-black text-slate-950">Materiais e catálogos</h2><p className="mt-1 text-sm text-slate-500">Documentos técnicos e comerciais para apoiar sua decisão.</p></div><div className="grid gap-3 sm:grid-cols-2">{materials.map((material) => <article key={material.id} className="flex gap-3 rounded-xl border border-slate-200 p-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50"><FileText className="h-5 w-5 text-blue-700" /></div><div className="min-w-0 flex-1"><h3 className="truncate text-sm font-bold text-slate-900">{material.title}</h3><p className="mt-1 line-clamp-2 text-xs text-slate-500">{material.description || 'Material técnico disponível para download.'}</p><Button size="sm" variant="outline" className="mt-3" onClick={() => material.gated ? setSelected(material) : requestDownload(material)}><Download className="mr-1 h-3 w-3" />{material.gated ? <><LockKeyhole className="mr-1 h-3 w-3" />Acessar material</> : 'Baixar material'}</Button></div></article>)}</div><DownloadGate material={selected} onClose={() => setSelected(null)} onSubmit={requestDownload} onViewed={track} /></section>;
}

function DownloadGate({ material, onClose, onSubmit, onViewed }: { material: Material | null; onClose: () => void; onSubmit: (material: Material, values: Record<string, string>) => Promise<void>; onViewed: (eventType: string, material: Material) => Promise<unknown> }) {
  useEffect(() => { if (material) void onViewed('material_gate_viewed', material); }, [material, onViewed]);
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!material) return; const data = new FormData(event.currentTarget); await onViewed('material_form_submitted', material); await onSubmit(material, { name: String(data.get('name') || ''), email: String(data.get('email') || ''), marketing_consent: data.get('marketing_consent') ? 'true' : 'false' }); };
  return <Dialog open={Boolean(material)} onOpenChange={(open) => !open && onClose()}><DialogContent><DialogHeader><DialogTitle>Acesse “{material?.title}”</DialogTitle><DialogDescription>Preencha seus dados para receber o material solicitado.</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-4"><label className="block space-y-1"><Label htmlFor="material-lead-name">Nome</Label><Input id="material-lead-name" name="name" required /></label><label className="block space-y-1"><Label htmlFor="material-lead-email">E-mail</Label><Input id="material-lead-email" name="email" type="email" required /></label><label className="flex gap-2 text-xs text-slate-600"><input name="marketing_consent" type="checkbox" />Quero receber novidades da empresa. Este consentimento é opcional.</label><Button className="w-full" type="submit"><Download className="mr-2 h-4 w-4" />Enviar e baixar</Button></form></DialogContent></Dialog>;
}
