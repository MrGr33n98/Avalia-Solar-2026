'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';
import { requestApi } from '@/lib/api-campaigns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Suppression = { id: number; email: string; reason: string; suppressed_at: string };
export default function SuppressionPage() {
  const [items, setItems] = useState<Suppression[]>([]); const [email, setEmail] = useState(''); const [reason, setReason] = useState('manual'); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = useCallback(async () => { setLoading(true); setError(''); try { const result = await requestApi<{ suppressions: Suppression[] }>('/email_suppressions'); setItems(result.suppressions); } catch (e) { setError(e instanceof Error ? e.message : 'Falha ao carregar supressões.'); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  async function add(event: FormEvent) { event.preventDefault(); setError(''); try { const result = await requestApi<{ suppression: Suppression }>('/email_suppressions', { method: 'POST', body: JSON.stringify({ email: email.trim(), reason }) }); setItems((current) => [result.suppression, ...current]); setEmail(''); } catch (e) { setError(e instanceof Error ? e.message : 'Falha ao suprimir e-mail.'); } }
  async function remove(id: number) { try { await requestApi(`/email_suppressions/${id}`, { method: 'DELETE' }); setItems((current) => current.filter((item) => item.id !== id)); } catch (e) { setError(e instanceof Error ? e.message : 'Falha ao remover supressão.'); } }
  return <SalesLayoutWrapper><section className="space-y-5"><h1 className="text-xl font-bold">Supressão de e-mails</h1><p>Contatos suprimidos não entram em novas audiências ou disparos.</p><form onSubmit={add} className="flex flex-wrap gap-3 items-end"><label className="text-sm">E-mail<Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label><label className="text-sm">Motivo<select className="block border rounded p-2" value={reason} onChange={(e) => setReason(e.target.value)}><option value="manual">Manual</option><option value="unsubscribe">Unsubscribe</option><option value="hard_bounce">Hard bounce</option><option value="complaint">Complaint</option></select></label><Button type="submit">Suprimir</Button></form>{error && <p role="alert">{error}</p>}{loading && <p role="status">Carregando supressões...</p>}{!loading && items.length === 0 && <p>Nenhum contato suprimido.</p>}{!loading && items.length > 0 && <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr><th>E-mail</th><th>Motivo</th><th>Data</th><th>Ação</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-b"><td>{item.email}</td><td>{item.reason}</td><td>{new Date(item.suppressed_at).toLocaleString('pt-BR')}</td><td><Button variant="outline" size="sm" onClick={() => void remove(item.id)}>Remover</Button></td></tr>)}</tbody></table></div>}</section></SalesLayoutWrapper>;
}
