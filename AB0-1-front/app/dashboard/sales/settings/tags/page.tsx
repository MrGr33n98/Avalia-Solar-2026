'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import OrganizationSettingLayout from '@/components/sales/settings/OrganizationSettingLayout';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';
import { salesApi } from '@/lib/api/sales/client';
import { ApiTag } from '@/lib/api/sales/types';

export default function TagsPage() {
  const [tags, setTags] = useState<ApiTag[]>([]);
  const [query, setQuery] = useState('');
  const [name, setName] = useState('');
  const [color, setColor] = useState('#2563eb');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => { try { setTags(await salesApi.getTags()); } catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível carregar tags.'); } };
  useEffect(() => { load(); }, []);
  const create = async () => {
    if (!name.trim()) return;
    try { const tag = await salesApi.createTag({ name: name.trim(), color, entity_type: 'Opportunity' }); setTags((current) => [...current, tag].sort((a, b) => a.name.localeCompare(b.name))); setName(''); setAdding(false); setError(null); }
    catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível criar tag.'); }
  };
  const archive = async (id: number) => { try { await salesApi.archiveTag(id); setTags((current) => current.filter((tag) => tag.id !== id)); } catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível arquivar tag.'); } };
  const visible = tags.filter((tag) => tag.name.toLowerCase().includes(query.toLowerCase()));

  return <SalesLayoutWrapper><OrganizationSettingLayout title="Tags" subtitle="Organize e classifique seus Leads comerciais." helpTitle="Tags do CRM" helpDescription="Tags são compartilhadas por Leads, empresas e pessoas conforme o tipo selecionado.">
    <div className="space-y-4">
      {error && <p className="rounded-md bg-red-50 p-3 text-xs font-medium text-red-700">{error}</p>}
      <div className="flex flex-col gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between"><div className="relative w-full sm:max-w-xs"><Search className="absolute left-2.5 top-2 h-4 w-4 text-slate-400" /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar tags..." className="h-9 pl-8 text-xs" /></div>{!adding && <Button onClick={() => setAdding(true)} size="sm" className="bg-blue-900 text-xs"><Plus className="mr-1 h-3.5 w-3.5" /> Criar tag</Button>}</div>
      {adding && <div className="flex flex-col gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 sm:flex-row"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da tag" className="h-9 text-xs" autoFocus /><Input value={color} onChange={(e) => setColor(e.target.value)} type="color" className="h-9 w-14 p-1" /><Button onClick={create} size="sm" className="h-9 bg-blue-900 text-xs">Salvar</Button><Button onClick={() => setAdding(false)} variant="ghost" size="sm" className="h-9 text-xs">Cancelar</Button></div>}
      <div className="overflow-x-auto rounded-md border border-slate-100"><div className="min-w-[480px] divide-y divide-slate-100"><div className="grid grid-cols-[1fr_100px_70px_40px] gap-3 bg-slate-50 p-3 text-[10px] font-bold uppercase text-slate-500"><span>Tag</span><span>Registros</span><span>Status</span><span /></div>{visible.map((tag) => <div key={tag.id} className="grid grid-cols-[1fr_100px_70px_40px] items-center gap-3 p-3 text-xs hover:bg-slate-50"><span className="flex items-center gap-2 font-semibold"><i className="h-3 w-3 rounded-full" style={{ backgroundColor: tag.color }} />{tag.name}</span><span>{tag.records_count ?? 0}</span><span className="text-emerald-700">Ativa</span><button onClick={() => archive(tag.id)} className="text-slate-400 hover:text-red-600" aria-label={`Arquivar ${tag.name}`}><Trash2 className="h-3.5 w-3.5" /></button></div>)}</div></div>
    </div>
  </OrganizationSettingLayout></SalesLayoutWrapper>;
}
