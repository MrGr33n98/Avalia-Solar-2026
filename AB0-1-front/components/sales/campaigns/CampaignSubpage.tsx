'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';
import { CampaignDetailed, CampaignMetrics, CampaignRecipientLog, fetchCampaign, fetchCampaignRecipients, fetchCampaignActivity } from '@/lib/api-campaigns';
import { Button } from '@/components/ui/button';
import { RecipientStatusTimeline } from '@/components/sales/campaigns/RecipientStatusTimeline';
type Props = { kind: 'recipients' | 'analytics' | 'settings' | 'activity' };
export default function CampaignSubpage({ kind }: Props) {
  const raw = useParams()?.id; const id = typeof raw === 'string' && /^\d+$/.test(raw) ? Number(raw) : NaN;
  const [activity, setActivity] = useState<Array<{ id: number; type: string; occurred_at: string; provider_event_id?: string | null }>>([]);
  const [recipientPage, setRecipientPage] = useState(1);
  const [recipientMeta, setRecipientMeta] = useState<{ total_pages: number } | null>(null);
  const [data, setData] = useState<{ campaign: CampaignDetailed; metrics: CampaignMetrics; recipients: CampaignRecipientLog[] } | null>(null); const [error, setError] = useState('');
  useEffect(() => { if (!Number.isSafeInteger(id) || id <= 0) return; fetchCampaign(id).then(setData).catch((e) => setError(e.message || 'Falha ao carregar campanha.')); }, [id]);
  useEffect(() => { if (kind === 'activity' && Number.isSafeInteger(id) && id > 0) fetchCampaignActivity(id).then((result) => setActivity(result.activity)).catch((e) => setError(e.message || 'Falha ao carregar atividade.')); }, [id, kind]);
  useEffect(() => { if (kind !== 'recipients' || !Number.isSafeInteger(id) || id <= 0) return; fetchCampaignRecipients(id, { page: recipientPage, per_page: 50 }).then((result) => { setData((current) => current ? { ...current, recipients: result.recipients } : current); setRecipientMeta(result.meta); }).catch((e) => setError(e.message || 'Falha ao carregar destinatários.')); }, [id, kind, recipientPage]);
  if (!Number.isSafeInteger(id) || id <= 0) return <SalesLayoutWrapper><h1>Campanha não encontrada</h1></SalesLayoutWrapper>;
  if (error) return <SalesLayoutWrapper><p role="alert">{error}</p><Button onClick={() => location.reload()}>Tentar novamente</Button></SalesLayoutWrapper>;
  if (!data) return <SalesLayoutWrapper><p role="status">Carregando campanha...</p></SalesLayoutWrapper>;
  const { campaign, metrics, recipients } = data; const titles = { recipients: 'Destinatários', analytics: 'Analytics', settings: 'Configurações', activity: 'Atividade' };
  return <SalesLayoutWrapper><section className="space-y-4 min-w-0"><Link href={`/dashboard/sales/campaigns/${id}`}>← {campaign.name}</Link><h1 className="text-xl font-bold">{titles[kind]}</h1><nav className="flex flex-wrap gap-4 border-b pb-3"><Link href={`/dashboard/sales/campaigns/${id}`}>Overview</Link><Link href={`/dashboard/sales/campaigns/${id}/recipients`}>Recipients</Link><Link href={`/dashboard/sales/campaigns/${id}/analytics`}>Analytics</Link><Link href={`/dashboard/sales/campaigns/${id}/settings`}>Settings</Link><Link href={`/dashboard/sales/campaigns/${id}/activity`}>Activity</Link></nav>
    {kind === 'recipients' && <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr><th>Contato</th><th>E-mail</th><th>Status</th><th>Jornada</th><th>Erro</th></tr></thead><tbody>{recipients.map((r) => <tr key={r.id} className="border-b"><td>{r.first_name || 'Contato'}</td><td>{r.email}</td><td><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium">{r.status}</span></td><td><RecipientStatusTimeline recipient={r} /></td><td className="max-w-xs text-red-600">{r.error_message || '—'}</td></tr>)}</tbody></table>{recipients.length === 0 && <p>Nenhum destinatário.</p>}<div className="flex gap-3 items-center"><Button disabled={recipientPage <= 1} onClick={() => setRecipientPage(recipientPage - 1)}>Anterior</Button><span>Página {recipientPage} de {recipientMeta?.total_pages || 1}</span><Button disabled={recipientPage >= (recipientMeta?.total_pages || 1)} onClick={() => setRecipientPage(recipientPage + 1)}>Próxima</Button></div></div>}
    {kind === 'analytics' && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[['Enviados', metrics.sent_count], ['Entregas', `${metrics.delivery_rate}%`], ['Aberturas', `${metrics.open_rate}%`], ['Cliques', `${metrics.click_rate}%`], ['Bounces', `${metrics.bounce_rate}%`], ['Descadastros', metrics.unsubscribed_count], ['Receita', `R$ ${(metrics.attributed_revenue_cents / 100).toFixed(2)}`]].map(([label, value]) => <article key={String(label)} className="border rounded p-4"><p className="text-sm text-slate-500">{label}</p><strong className="text-xl">{value}</strong></article>)}</div>}
    {kind === 'activity' && <ol className="space-y-3">{activity.map((event) => <li key={event.id} className="border rounded p-3"><strong>{event.type}</strong><span className="ml-3 text-sm text-slate-500">{new Date(event.occurred_at).toLocaleString('pt-BR')}</span>{event.provider_event_id && <span className="ml-3 text-xs">{event.provider_event_id}</span>}</li>)}{activity.length === 0 && <p>Nenhuma atividade registrada.</p>}</ol>}
    {kind === 'settings' && <div className="space-y-3"><p>Status: <strong>{campaign.status}</strong></p><p>Tipo: <strong>{campaign.campaign_type}</strong></p><p>Template: <strong>{campaign.template_name || campaign.email_template_id || 'Não configurado'}</strong></p><p>Remetente: <strong>{campaign.user_name || 'Não configurado'}</strong></p><p>Audiência configurada: <strong>{Object.keys(campaign.audience_filter || {}).length ? 'Sim' : 'Não'}</strong></p></div>}
  </section></SalesLayoutWrapper>;
}
