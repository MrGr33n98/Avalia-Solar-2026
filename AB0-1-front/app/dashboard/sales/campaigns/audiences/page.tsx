'use client';

import { useCallback, useEffect, useState } from 'react';
import WorkspaceFrame from '@/components/sales/campaigns/WorkspaceFrame';
import { AudiencePreviewResult, AudienceSegmentsOptions, requestApi } from '@/lib/api-campaigns';
import { Button } from '@/components/ui/button';
import { AudienceBuilder } from '@/components/sales/campaigns/audiences/AudienceBuilder';
import { AudienceSkeleton } from '@/components/sales/campaigns/audiences/AudienceSkeleton';
import { AudienceTable } from '@/components/sales/campaigns/audiences/AudienceTable';

type Filter = { state: string; city: string; segment: string; search: string; tag_ids: number[] };
type SavedAudience = { id: number; name: string; kind: string; active: boolean };

export default function AudiencesPage() {
  const [filter, setFilter] = useState<Filter>({ state: '', city: '', segment: '', search: '', tag_ids: [] });
  const [segments, setSegments] = useState<AudienceSegmentsOptions | null>(null);
  const [data, setData] = useState<AudiencePreviewResult | null>(null);
  const [savedAudiences, setSavedAudiences] = useState<SavedAudience[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState('');
  const hasFilter = Boolean(filter.state || filter.city || filter.segment || filter.search.trim() || filter.tag_ids.length);

  const load = useCallback(async (signal: AbortSignal) => {
    setLoading(true); setError('');
    const [optionsRes, savedRes, previewRes] = await Promise.allSettled([
      requestApi<AudienceSegmentsOptions>('/audiences/segments', { signal }),
      requestApi<{ audiences: SavedAudience[] }>('/audiences?per_page=100', { signal }),
      hasFilter ? requestApi<AudiencePreviewResult>('/audiences/preview', { method: 'POST', signal, body: JSON.stringify({ audience_filter: filter, page, per_page: 20 }) }) : Promise.resolve(null),
    ]);
    if (signal.aborted) return;
    if (optionsRes.status === 'fulfilled') setSegments(optionsRes.value); else setError('Não foi possível carregar os filtros.');
    if (savedRes.status === 'fulfilled') setSavedAudiences(savedRes.value.audiences); else setError('Não foi possível carregar suas audiências.');
    if (previewRes.status === 'fulfilled') setData(previewRes.value); else if (hasFilter) setError('Não foi possível carregar a prévia.');
    setLoading(false);
  }, [filter, page, hasFilter]);

  useEffect(() => { const controller = new AbortController(); const timer = setTimeout(() => void load(controller.signal), filter.search ? 450 : 150); return () => { clearTimeout(timer); controller.abort(); }; }, [load, retry, filter.search]);

  function changeFilter(key: keyof Filter, value: string) { setPage(1); setFilter((current) => { if (key === 'tag_ids') { const id = Number(value); const tags = current.tag_ids.includes(id) ? current.tag_ids.filter((tagId) => tagId !== id) : [...current.tag_ids, id]; return { ...current, tag_ids: tags }; } return { ...current, [key]: value, ...(key === 'state' ? { city: '' } : {}) }; }); }
  async function updateAudience(id: number, payload: Record<string, unknown>) {
    try { await requestApi(`/audiences/${id}`, { method: 'PATCH', body: JSON.stringify({ audience: payload }) }); setRetry((value) => value + 1); }
    catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível atualizar a audiência.'); }
  }
  async function removeAudience(id: number) {
    if (!window.confirm('Excluir esta audiência?')) return;
    try { await requestApi(`/audiences/${id}`, { method: 'DELETE' }); setRetry((value) => value + 1); }
    catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível excluir a audiência.'); }
  }
  async function saveAudience() {
    setSaving(true); setSaved('');
    try { await requestApi('/audiences', { method: 'POST', body: JSON.stringify({ audience: { name: name.trim(), kind: 'dynamic', filter_definition: filter } }) }); setSaved('Audiência salva com sucesso.'); setName(''); setRetry((value) => value + 1); }
    catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível salvar a audiência.'); }
    finally { setSaving(false); }
  }

  return <WorkspaceFrame title="Audiências"><div className="space-y-6">
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Campaign workspace</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Segmentos que trabalham por você</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Crie audiências reutilizáveis, confira a elegibilidade e envie campanhas com segurança.</p></div><div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">Dados em tempo real</div></header>
    {saved && <p role="status" aria-live="polite" className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{saved}</p>}
    {loading && !segments ? <AudienceSkeleton /> : <AudienceBuilder filter={filter} segments={segments} name={name} onNameChange={setName} onFilterChange={changeFilter} onSave={saveAudience} saving={saving} />}
    {savedAudiences.length > 0 ? <section aria-label="Audiências salvas" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="font-semibold text-slate-950">Audiências salvas</h2><p className="mt-1 text-sm text-slate-500">Segmentos dinâmicos prontos para campanhas.</p></div><span className="text-xs text-slate-400">{savedAudiences.length} total</span></div><div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{savedAudiences.map((audience) => <div key={audience.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><span className="truncate text-sm font-medium text-slate-800">{audience.name}</span><div className="ml-3 flex shrink-0 items-center gap-2"><span className="text-xs text-emerald-600">{audience.active ? 'Ativa' : 'Arquivada'}</span><button type="button" className="text-xs text-slate-500 hover:underline" onClick={() => void updateAudience(audience.id, { active: !audience.active })}>{audience.active ? 'Arquivar' : 'Reativar'}</button><button type="button" className="text-xs text-red-600 hover:underline" onClick={() => void removeAudience(audience.id)}>Excluir</button></div></div>)}</div></section>
    : <section aria-label="Audiências salvas" className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><h2 className="font-semibold text-slate-950">Nenhuma audiência salva ainda</h2><p className="mt-2 text-sm text-slate-500">Salve filtros reutilizáveis para acelerar sua próxima campanha.</p></section>}
    {error && <div role="alert" className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"><span>{error}</span><Button variant="outline" size="sm" onClick={() => setRetry((value) => value + 1)}>Tentar novamente</Button></div>}
    {!loading && !error && !data && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><p className="font-semibold text-slate-900">Defina um filtro para visualizar sua audiência</p><p className="mt-1 text-sm text-slate-500">Prévia só executa após filtro significativo.</p></div>}
    {!loading && !error && data && <section className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold text-slate-950">Prévia da audiência</h2><p className="mt-1 text-sm text-slate-500"><strong className="text-slate-900">{data.total_count.toLocaleString('pt-BR')}</strong> contatos elegíveis · suppressions excluídas</p></div><div className="rounded-xl bg-slate-950 px-4 py-3 text-right text-white"><p className="text-xs text-slate-400">Página</p><p className="font-semibold">{page} / {Math.max(1, data.total_pages)}</p></div></div><AudienceTable data={data} /><div className="flex items-center justify-between"><Button variant="outline" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Anterior</Button><Button variant="outline" disabled={page >= data.total_pages} onClick={() => setPage((value) => value + 1)}>Próxima</Button></div></section>}
  </div></WorkspaceFrame>;
}
