import { useEffect, useState } from 'react';
import { Bookmark, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { salesApi } from '@/lib/api/sales/client';
import { ApiSavedView } from '@/lib/api/sales/types';

interface Props {
  filters: any;
  search: string;
  viewMode: 'kanban' | 'table';
  onApply: (filters: any, search: string) => void;
}
export default function SavedViewMenu({ filters, search, viewMode, onApply }: Props) {
  const [views, setViews] = useState<ApiSavedView[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [manageOpen, setManageOpen] = useState(false);
  useEffect(() => { salesApi.getSavedViews('opportunity').then(setViews).catch(() => setViews([])); }, []);
  const pin = async (item: ApiSavedView) => { const updated = await salesApi.pinSavedView(item.id, !item.is_pinned); setViews((current) => current.map((view) => view.id === updated.id ? updated : view)); };
  const remove = async (id: number) => { if (!window.confirm('Remover esta view salva?')) return; await salesApi.deleteSavedView(id); setViews((current) => current.filter((item) => item.id !== id)); };
  const save = async () => {
    if (!name.trim()) return;
    const created = await salesApi.createSavedView({ name: name.trim(), resource_type: 'opportunity', filters: { ...filters, search }, sort: {}, columns: [viewMode] });
    setViews((current) => [...current, created]); setName(''); setOpen(false);
  };
  return <div className="flex items-center gap-1">
    <select aria-label="Views salvas" className="h-9 max-w-[150px] rounded-md border border-slate-300 bg-white px-2 text-xs" defaultValue="" onChange={(e) => { const item = views.find((v) => String(v.id) === e.target.value); if (item) onApply(item.filters, String(item.filters.search || '')); }}>
      <option value="">Views salvas</option>{views.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
    </select>
    {views.length > 0 && <Button variant="ghost" size="sm" onClick={() => setManageOpen(true)} className="h-9 text-xs">Gerenciar</Button>}
    <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="h-9 text-xs"><Plus className="mr-1 h-3.5 w-3.5" /> Salvar</Button>
    <Dialog open={manageOpen} onOpenChange={setManageOpen}><DialogContent className="w-[calc(100vw-1.5rem)] max-w-sm"><DialogHeader><DialogTitle>Views salvas</DialogTitle><DialogDescription>Gerencie suas views de Leads.</DialogDescription></DialogHeader><div className="divide-y divide-slate-100">{views.map((item) => <div key={item.id} className="flex items-center justify-between py-2 text-sm"><span>{item.name}</span><span className="flex gap-1"><Button variant="ghost" size="sm" onClick={() => pin(item)} className="text-xs">{item.is_pinned ? 'Desafixar' : 'Fixar'}</Button><Button variant="ghost" size="sm" onClick={() => remove(item.id)} className="text-red-600">Remover</Button></span></div>)}</div></DialogContent></Dialog>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="w-[calc(100vw-1.5rem)] max-w-sm"><DialogHeader><DialogTitle>Salvar view</DialogTitle><DialogDescription>Filtros e modo atual ficam disponíveis para sua equipe.</DialogDescription></DialogHeader><div className="py-3"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Leads quentes" autoFocus /></div><DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button><Button className="bg-blue-900" onClick={save}><Bookmark className="mr-1 h-4 w-4" />Salvar</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
