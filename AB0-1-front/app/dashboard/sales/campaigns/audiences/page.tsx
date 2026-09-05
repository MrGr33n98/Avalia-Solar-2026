'use client';

import { useCallback, useEffect, useState } from 'react';
import { AudiencePreviewResult, AudienceSegmentsOptions, requestApi } from '@/lib/api-campaigns';
import WorkspaceFrame from '@/components/sales/campaigns/WorkspaceFrame';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AudiencesPage() {
  const [filter, setFilter] = useState({ state: '', city: '', segment: '', search: '' });
  const [segments, setSegments] = useState<AudienceSegmentsOptions | null>(null);
  const [data, setData] = useState<AudiencePreviewResult | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [name, setName] = useState('');
  const [saved, setSaved] = useState('');
  const load = useCallback(async (signal: AbortSignal) => {
    setLoading(true);
    setError('');
    try {
      const [options, result] = await Promise.all([
        requestApi<AudienceSegmentsOptions>('/audiences/segments', { signal }),
        requestApi<AudiencePreviewResult>('/audiences/preview', {
          method: 'POST', signal, body: JSON.stringify({ audience_filter: filter, page, per_page: 20 }),
        }),
      ]);
      if (!signal.aborted) { setSegments(options); setData(result); }
    } catch (err) {
      if (!signal.aborted) setError(err instanceof Error ? err.message : 'Falha ao carregar audiência.');
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [filter, page]);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => void load(controller.signal), 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [load, retry]);

  return <WorkspaceFrame title="Audiências">
    <p>Segmentos de contatos utilizados nas campanhas. Prévia de contatos elegíveis para e-mail.</p>
    <div className="flex flex-wrap gap-3 items-end">
      <label className="text-sm">Nome da audiência<Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Integradores RS" /></label>
      <Button disabled={!name.trim() || loading} onClick={async () => { try { await requestApi('/audiences', { method: 'POST', body: JSON.stringify({ audience: { name: name.trim(), kind: 'dynamic', filter_definition: filter } }) }); setSaved('Audiência salva.'); setName(''); } catch (err) { setError(err instanceof Error ? err.message : 'Falha ao salvar audiência.'); } }}>Salvar audiência</Button>
    </div>
    {saved && <p role="status">{saved}</p>}
    <div className="grid gap-3 sm:grid-cols-2">
      {(['state', 'city', 'segment'] as const).map((key) => <label key={key} className="text-sm">
        {{ state: 'Estado', city: 'Cidade', segment: 'Tipo de empresa' }[key]}
        <select className="block w-full rounded border p-2" value={filter[key]} onChange={(event) => { setPage(1); setFilter({ ...filter, [key]: event.target.value }); }}>
          <option value="">Todos</option>
          {(segments?.[{ state: 'states', city: 'cities', segment: 'company_types' }[key] as 'states' | 'cities' | 'company_types'] ?? []).map((value) => <option key={value}>{value}</option>)}
        </select>
      </label>)}
      <label className="text-sm">Nome ou e-mail<Input value={filter.search} onChange={(event) => { setPage(1); setFilter({ ...filter, search: event.target.value }); }} /></label>
    </div>
    {loading && <p role="status">Carregando audiência...</p>}
    {error && <div role="alert"><p>{error}</p><Button onClick={() => setRetry(retry + 1)}>Tentar novamente</Button></div>}
    {!loading && !error && data && <>
      <p>{data.total_count} contatos elegíveis. Contatos sem e-mail e suprimidos não entram nesta prévia.</p>
      {data.sample_contacts.length === 0 ? <p>Nenhum contato encontrado para os filtros selecionados.</p> : <div className="overflow-x-auto"><table className="w-full text-sm text-left">
        <thead><tr><th>Contato</th><th>E-mail</th><th>Empresa</th><th>Cidade</th><th>Estado</th></tr></thead>
        <tbody>{data.sample_contacts.map((contact) => <tr key={contact.id} className="border-b"><td className="py-3">{contact.first_name} {contact.last_name}</td><td>{contact.email}</td><td>{contact.account_name || '—'}</td><td>{contact.city || '—'}</td><td>{contact.state || '—'}</td></tr>)}</tbody>
      </table></div>}
      <div className="flex gap-3 items-center"><Button disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button><span>Página {page} de {Math.max(1, data.total_pages)}</span><Button disabled={page >= data.total_pages} onClick={() => setPage(page + 1)}>Próxima</Button></div>
    </>}
  </WorkspaceFrame>;
}
