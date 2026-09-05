'use client';

import { useEffect, useState } from 'react';
import { requestApi } from '@/lib/api-campaigns';
import WorkspaceFrame from '@/components/sales/campaigns/WorkspaceFrame';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type Sequence = { id: number; name: string; description?: string; active: boolean; steps: { id: number; position: number; delay_days: number; step_type: string }[] };
export default function SequencesPage() {
  const [data, setData] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [stepType, setStepType] = useState('email');
  const [delayDays, setDelayDays] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    requestApi<{ sequences: Sequence[] }>('/email_sequences', { signal: controller.signal })
      .then((result) => { if (!controller.signal.aborted) setData(result.sequences); })
      .catch((err) => { if (!controller.signal.aborted) setError(err.message || 'Falha ao carregar sequências.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [retry]);
  async function createSequence() {
    setSaving(true); setError('');
    try { await requestApi('/email_sequences', { method: 'POST', body: JSON.stringify({ sequence: { name: name.trim(), description, active: true, steps_attributes: [{ position: 1, delay_days: delayDays, step_type: stepType }] } }) }); setName(''); setDescription(''); setRetry((value) => value + 1); }
    catch (err) { setError(err instanceof Error ? err.message : 'Falha ao criar sequência.'); }
    finally { setSaving(false); }
  }
  return <WorkspaceFrame title="Sequências Drip">
    <p>Sequências cadastradas e etapas de acompanhamento.</p>
    <div className="flex flex-wrap gap-3 items-end"><label className="text-sm">Nome<Input value={name} onChange={(event) => setName(event.target.value)} /></label><label className="text-sm">Descrição<Input value={description} onChange={(event) => setDescription(event.target.value)} /></label><label className="text-sm">Etapa<select className="block border rounded p-2" value={stepType} onChange={(event) => setStepType(event.target.value)}><option value="email">E-mail</option><option value="wait">Espera</option><option value="condition">Condição</option></select></label><label className="text-sm">Dias de espera<Input type="number" min="0" value={delayDays} onChange={(event) => setDelayDays(Number(event.target.value) || 0)} /></label><Button disabled={!name.trim() || saving} onClick={() => void createSequence()}>{saving ? 'Salvando...' : 'Nova sequência'}</Button></div>
    {loading && <p role="status">Carregando sequências...</p>}
    {error && <div role="alert"><p>{error}</p><Button onClick={() => setRetry(retry + 1)}>Tentar novamente</Button></div>}
    {!loading && !error && (data.length === 0 ? <p>Nenhuma sequência cadastrada.</p> : data.map((sequence) => <article key={sequence.id} className="border rounded p-4 space-y-2">
      <h2 className="font-semibold">{sequence.name}</h2><p>{sequence.description}</p>
      <p>{sequence.active ? 'Ativa' : 'Inativa'}</p>
      <ol>{sequence.steps.map((step) => <li key={step.id}>Etapa {step.position}: {step.step_type}; espera de {step.delay_days} dias.</li>)}</ol>
    </article>))}
  </WorkspaceFrame>;
}
