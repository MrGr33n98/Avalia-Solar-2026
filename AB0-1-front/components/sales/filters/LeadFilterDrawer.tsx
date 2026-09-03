import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ApiTag } from '@/lib/api/sales/types';

export interface LeadFilters {
  status?: string;
  pipeline_id?: number;
  stage_key?: string;
  owner_id?: number | 'unassigned';
  value_min?: number;
  value_max?: number;
  tag_ids?: number[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: LeadFilters;
  stages: Array<{ key: string; label: string }>;
  tags?: ApiTag[];
  onApply: (filters: LeadFilters) => void;
  onClear: () => void;
}

export default function LeadFilterDrawer({ open, onOpenChange, filters, stages, tags = [], onApply, onClear }: Props) {
  const [draft, setDraft] = useState<LeadFilters>(filters);
  useEffect(() => { if (open) setDraft(filters); }, [filters, open]);
  const set = (key: keyof LeadFilters, value: string) => setDraft((current) => ({
    ...current,
    [key]: value === '' ? undefined : key.includes('_id') || key.includes('value') ? Number(value) : value,
  }));

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="w-[calc(100vw-1.5rem)] max-w-lg rounded-2xl p-5 sm:p-6">
      <DialogHeader><DialogTitle>Filtros avançados</DialogTitle><DialogDescription>Refine Leads sem perder filtros ao trocar de modo.</DialogDescription></DialogHeader>
      <div className="grid gap-4 py-3 sm:grid-cols-2">
        <div className="space-y-2"><Label>Status</Label><select value={draft.status || ''} onChange={(e) => set('status', e.target.value)} className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"><option value="">Abertos</option><option value="open">Abertos</option><option value="won">Ganhos</option><option value="lost">Perdidos</option></select></div>
        <div className="space-y-2"><Label>Estágio</Label><select value={draft.stage_key || ''} onChange={(e) => set('stage_key', e.target.value)} className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"><option value="">Todos</option>{stages.map((stage) => <option key={stage.key} value={stage.key}>{stage.label}</option>)}</select></div>
        <div className="space-y-2"><Label>Valor mínimo (centavos)</Label><Input inputMode="numeric" value={draft.value_min ?? ''} onChange={(e) => set('value_min', e.target.value)} /></div>
        <div className="space-y-2"><Label>Valor máximo (centavos)</Label><Input inputMode="numeric" value={draft.value_max ?? ''} onChange={(e) => set('value_max', e.target.value)} /></div>
        <div className="space-y-2 sm:col-span-2"><Label>Tags</Label><div className="flex flex-wrap gap-2">{tags.map((tag) => <label key={tag.id} className="flex items-center gap-1.5 rounded-md border border-slate-200 px-2 py-1 text-xs"><input type="checkbox" checked={draft.tag_ids?.includes(tag.id) || false} onChange={(e) => setDraft((current) => ({ ...current, tag_ids: e.target.checked ? [...(current.tag_ids || []), tag.id] : (current.tag_ids || []).filter((id) => id !== tag.id) }))} />{tag.name}</label>)}</div></div>
      </div>
      <DialogFooter className="flex-col gap-2 sm:flex-row"><Button variant="ghost" onClick={() => { onClear(); onOpenChange(false); }}>Limpar</Button><Button className="bg-blue-900" onClick={() => { onApply(draft); onOpenChange(false); }}>Aplicar filtros</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
