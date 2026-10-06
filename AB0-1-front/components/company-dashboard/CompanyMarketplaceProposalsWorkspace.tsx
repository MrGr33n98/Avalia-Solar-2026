'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, FilePlus2, History, Loader2, Plus, Send, Users, X } from 'lucide-react';
import {
  companyMarketplaceProposalsApi,
  type MarketplaceProposal,
  type MarketplaceProposalVersion,
} from '@/lib/api';
import { useCompanyContext } from '@/context/CompanyContext';
import { cn } from '@/lib/utils';
import { technicalFields } from '@/lib/marketplace-proposals';

type Distribution = {
  id: number;
  status: string;
  assigned_at?: string;
  lead: MarketplaceProposal['lead'];
};

function money(cents = 0) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}

function date(value?: string | null) {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString('pt-BR');
}

export function CompanyMarketplaceProposalsWorkspace() {
  const { activeCompany, isLoading: companyLoading } = useCompanyContext();
  const [proposals, setProposals] = useState<MarketplaceProposal[]>([]);
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [selected, setSelected] = useState<MarketplaceProposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!activeCompany?.id) return;
    setLoading(true);
    setError(null);
    try {
      const [proposalResponse, distributionResponse] = await Promise.all([
        companyMarketplaceProposalsApi.list(activeCompany.id),
        companyMarketplaceProposalsApi.distributions(activeCompany.id),
      ]);
      setProposals(proposalResponse.proposals || []);
      setDistributions(distributionResponse.distributions || []);
      setSelected((current) => current || proposalResponse.proposals?.[0] || null);
    } catch {
      setError('Não foi possível carregar as propostas da sua empresa.');
    } finally {
      setLoading(false);
    }
  }, [activeCompany?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async (distributionId: number) => {
    setBusy('create-' + distributionId);
    try {
      const response = await companyMarketplaceProposalsApi.create(distributionId);
      setProposals((current) => [response.proposal, ...current.filter((item) => item.id !== response.proposal.id)]);
      setSelected(response.proposal);
    } catch {
      setError('Não foi possível abrir o editor da proposta.');
    } finally {
      setBusy(null);
    }
  };

  if (companyLoading || loading) {
    return <div className="flex min-h-[360px] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-blue-600" /></div>;
  }

  if (!activeCompany) {
    return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm font-semibold text-amber-800">Selecione uma empresa para gerenciar propostas.</div>;
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-blue-700">Portal da empresa</p>
          <h1 className="mt-1 text-3xl font-black text-slate-950">Propostas para clientes</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">Receba leads distribuídos, monte propostas versionadas e acompanhe cada negociação até o projeto concluído.</p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-800"><Users className="h-4 w-4" /> {distributions.length} leads disponíveis</div>
      </header>

      {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">{error}</p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(300px,0.85fr)_minmax(0,1.4fr)]">
        <section className="space-y-3">
          <h2 className="text-sm font-black uppercase tracking-wide text-slate-500">Leads e propostas</h2>
          {distributions.map((distribution) => {
            const proposal = proposals.find((item) => item.lead_distribution_id === distribution.id);
            return (
              <article key={distribution.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="font-bold text-slate-950">{distribution.lead?.name || 'Lead sem nome'}</p><p className="mt-1 text-xs text-slate-500">{distribution.lead?.city || 'Local não informado'} · {distribution.lead?.product_vertical || 'Solução energética'}</p></div>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600">{proposal ? proposal.status : distribution.status}</span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-500">Recebido em {date(distribution.assigned_at)}</span>
                  {proposal ? <button type="button" onClick={() => setSelected(proposal)} className="text-sm font-bold text-blue-700">Abrir proposta</button> : <button type="button" onClick={() => void create(distribution.id)} disabled={busy === 'create-' + distribution.id} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-blue-600 px-3 text-xs font-bold text-white disabled:opacity-60">{busy === 'create-' + distribution.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <FilePlus2 className="h-4 w-4" />} Criar proposta</button>}
                </div>
              </article>
            );
          })}
          {!distributions.length && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">Nenhum lead distribuído disponível para resposta.</div>}
          <div className="border-t border-slate-200 pt-4">
            <h2 className="text-sm font-black uppercase tracking-wide text-slate-500">Publicadas</h2>
            <div className="mt-3 space-y-2">{proposals.map((proposal) => <button type="button" key={proposal.id} onClick={() => setSelected(proposal)} className={cn('flex w-full items-center justify-between gap-3 rounded-xl border bg-white p-3 text-left', selected?.id === proposal.id ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200')}><span><span className="block text-sm font-bold text-slate-950">{proposal.lead?.name || proposal.reference}</span><span className="block text-xs text-slate-500">{proposal.reference}</span></span><span className="text-sm font-bold text-blue-700">{money(proposal.total_cents)}</span></button>)}</div>
          </div>
        </section>

        {selected ? (
          <div className="space-y-6">
            <ProposalEditor key={selected.id + ':' + selected.status + ':' + (selected.version?.number || 0)} proposal={selected} onSaved={(proposal) => { setProposals((current) => current.map((item) => item.id === proposal.id ? proposal : item)); setSelected(proposal); }} />
            {selected.versions && selected.versions.length > 1 && <CompanyVersionHistory versions={selected.versions} />}
            <CompanyLifecyclePanel proposal={selected} onSaved={(proposal) => { setProposals((current) => current.map((item) => item.id === proposal.id ? proposal : item)); setSelected(proposal); }} />
          </div>
        ) : <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">Selecione um lead para abrir o editor.</div>}
      </div>
    </main>
  );
}

function ProposalEditor({ proposal, onSaved }: { proposal: MarketplaceProposal; onSaved: (proposal: MarketplaceProposal) => void }) {
  const version = proposal.version;
  const [title, setTitle] = useState(version?.title || '');
  const [summary, setSummary] = useState(version?.summary || '');
  const [validUntil, setValidUntil] = useState(version?.valid_until?.slice(0, 10) || '');
  const [terms, setTerms] = useState(version?.terms || []);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [items, setItems] = useState<NonNullable<MarketplaceProposalVersion['items']>>(version?.items || []);
  const [busy, setBusy] = useState<string | null>(null);
  const editable = proposal.status === 'draft';
  const canCreateVersion = ['sent', 'viewed', 'under_review', 'negotiating', 'meeting_scheduled'].includes(proposal.status);
  const canWithdraw = canCreateVersion;
  const payload = () => ({ title, summary, valid_until: validUntil || null, terms: terms.filter((term) => term.value.trim()).map((term, position) => ({ key: term.key, label: term.label, value: term.value, position })), items: items.map((item, position) => ({ name: item.name, description: item.description, quantity: item.quantity, unit: item.unit, unit_price_cents: item.unit_price_cents, kind: item.kind, position })) });

  const save = async () => {
    setBusy('save');
    setEditorError(null);
    try {
      const response = await companyMarketplaceProposalsApi.update(proposal.id, payload());
      onSaved(response.proposal);
    } catch {
      setEditorError('Não foi possível salvar a proposta. Revise os campos e tente novamente.');
      setBusy(null);
      return;
    }
    setBusy(null);
  };

  const send = async () => {
    setBusy('send');
    setEditorError(null);
    try {
      await companyMarketplaceProposalsApi.update(proposal.id, payload());
      const response = await companyMarketplaceProposalsApi.send(proposal.id);
      onSaved(response.proposal);
    } catch {
      setEditorError('Não foi possível publicar a proposta. Revise os campos e tente novamente.');
      setBusy(null);
      return;
    }
    setBusy(null);
  };

  const addItem = () => {
    const cents = Math.round(Number(itemPrice.replace(',', '.')) * 100);
    if (!itemName.trim() || !Number.isFinite(cents) || cents < 0) return;
    setItems((current) => [...current, { id: Date.now(), name: itemName.trim(), kind: 'service', description: null, quantity: 1, unit: 'un', unit_price_cents: cents, total_cents: cents, position: current.length }]);
    setItemName('');
    setItemPrice('');
  };

  const createVersion = async () => {
    setBusy('version');
    try {
      const response = await companyMarketplaceProposalsApi.newVersion(proposal.id);
      onSaved(response.proposal);
    } catch {
      setBusy(null);
      return;
    }
    setBusy(null);
  };

  const withdraw = async () => {
    setBusy('withdraw');
    try {
      const response = await companyMarketplaceProposalsApi.withdraw(proposal.id);
      onSaved(response.proposal);
    } catch {
      setBusy(null);
      return;
    }
    setBusy(null);
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{proposal.reference}</p><h2 className="mt-1 text-2xl font-black text-slate-950">Editar proposta</h2><p className="mt-1 text-sm text-slate-600">Lead: {proposal.lead?.name || 'não informado'} · {proposal.lead?.email || 'e-mail não informado'}</p></div><span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">{proposal.status}</span></div>
      <div className="mt-6 space-y-4">
        <label className="block text-sm font-bold text-slate-800">Título<input disabled={!editable} value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 h-12 w-full rounded-xl border border-slate-200 px-3 font-normal" /></label>
        <label className="block text-sm font-bold text-slate-800">Resumo<textarea disabled={!editable} value={summary} onChange={(event) => setSummary(event.target.value)} className="mt-1 min-h-28 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal" /></label>
        <label className="block text-sm font-bold text-slate-800">Válida até<input type="date" disabled={!editable || busy !== null} value={validUntil} onChange={(event) => setValidUntil(event.target.value)} className="mt-1 h-12 w-full rounded-xl border border-slate-200 px-3 font-normal" /></label>
        <fieldset disabled={!editable || busy !== null} className="space-y-3"><legend className="mb-3 text-sm font-semibold">Dados técnicos e condições para comparação</legend><p className="text-xs text-slate-500">Informe valores com as unidades, como kWp, kWh/mês e R$/mês. Os dados serão exibidos ao cliente.</p><div className="grid gap-3 sm:grid-cols-2">{[...technicalFields, { label: 'Premissas e observações', keys: ['assumptions'] }].map((field) => <label key={field.keys[0]} className="text-sm font-medium text-slate-800">{field.label}<input value={terms.find((term) => field.keys.includes(term.key))?.value || ''} onChange={(event) => setTerms((current) => { const existing = current.find((term) => field.keys.includes(term.key)); return existing ? current.map((term) => term.key === existing.key ? { ...term, value: event.target.value } : term) : [...current, { id: Date.now(), key: field.keys[0], label: field.label, value: event.target.value, position: current.length }]; })} maxLength={1000} className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal" /></label>)}</div></fieldset>
        {editorError && <p role="alert" className="text-sm text-rose-700">{editorError}</p>}
        <div><div className="flex items-center justify-between"><h3 className="text-sm font-black text-slate-900">Itens e condições comerciais</h3><span className="text-sm font-black text-blue-700">{money(items.reduce((sum, item) => sum + item.total_cents, 0))}</span></div><div className="mt-2 divide-y divide-slate-100 rounded-2xl border border-slate-200">{items.map((item, index) => <div key={item.id || index} className="flex items-center justify-between gap-3 p-3 text-sm"><span><span className="block font-bold text-slate-900">{item.name}</span><span className="text-xs text-slate-500">{money(item.total_cents)}</span></span>{editable && <button type="button" aria-label="Remover item" onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-700"><X className="h-4 w-4" /></button>}</div>)}{!items.length && <p className="p-4 text-sm text-slate-500">Adicione os itens que compõem a proposta.</p>}</div></div>
        {editable && <div className="grid gap-2 sm:grid-cols-[1fr_160px_auto]"><input value={itemName} onChange={(event) => setItemName(event.target.value)} placeholder="Ex.: Sistema fotovoltaico" className="h-11 rounded-xl border border-slate-200 px-3 text-sm" /><input value={itemPrice} onChange={(event) => setItemPrice(event.target.value)} inputMode="decimal" placeholder="Valor em R$" className="h-11 rounded-xl border border-slate-200 px-3 text-sm" /><button type="button" onClick={addItem} className="inline-flex min-h-11 items-center justify-center gap-1 rounded-xl border border-blue-200 bg-blue-50 px-3 text-sm font-bold text-blue-700"><Plus className="h-4 w-4" /> Adicionar</button></div>}
        {editable && <div className="flex flex-wrap gap-3"><button type="button" onClick={() => void save()} disabled={busy !== null} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-800">{busy === 'save' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Salvar rascunho</button><button type="button" onClick={() => void send()} disabled={busy !== null || !items.length} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white disabled:opacity-50">{busy === 'send' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Publicar proposta</button></div>}
        {canCreateVersion && <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-4"><button type="button" onClick={() => void createVersion()} disabled={busy !== null} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-sm font-bold text-blue-700">{busy === 'version' ? <Loader2 className="h-4 w-4 animate-spin" /> : <History className="h-4 w-4" />} Criar nova versão</button>{canWithdraw && <button type="button" onClick={() => void withdraw()} disabled={busy !== null} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-rose-200 px-4 text-sm font-bold text-rose-700">{busy === 'withdraw' ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />} Retirar proposta</button>}</div>}
      </div>
    </section>
  );
}


function CompanyLifecyclePanel({
  proposal,
  onSaved,
}: {
  proposal: MarketplaceProposal;
  onSaved: (proposal: MarketplaceProposal) => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [lifecycleError, setLifecycleError] = useState<string | null>(null);
  const meetings = proposal.meetings || [];
  const project = proposal.project;

  const updateMeeting = async (meetingId: number, status: string) => {
    setBusy('meeting-' + meetingId);
    setLifecycleError(null);
    try {
      const response = await companyMarketplaceProposalsApi.updateMeeting(proposal.id, meetingId, { status });
      onSaved(response.proposal);
    } catch {
      setLifecycleError('Não foi possível atualizar a reunião.');
    } finally {
      setBusy(null);
    }
  };

  const updateMilestone = async (milestoneId: number, status: string) => {
    setBusy('milestone-' + milestoneId);
    setLifecycleError(null);
    try {
      const response = await companyMarketplaceProposalsApi.updateMilestone(proposal.id, milestoneId, {
        status,
        completed_at: status === 'completed' ? new Date().toISOString() : undefined,
      });
      onSaved(response.proposal);
    } catch {
      setLifecycleError('Não foi possível atualizar a etapa do projeto.');
    } finally {
      setBusy(null);
    }
  };

  if (!project && meetings.length === 0) return null;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      {lifecycleError && <p role="alert" className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">{lifecycleError}</p>}
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Operação da proposta</p>
        <h2 className="mt-1 text-xl font-black text-slate-950">Reuniões e acompanhamento</h2>
        <p className="mt-1 text-sm text-slate-600">Atualizações feitas aqui aparecem para o cliente no PWA e no webapp.</p>
      </div>

      {meetings.length > 0 && (
        <div className="mt-5 space-y-3">
          <h3 className="text-sm font-black text-slate-900">Reuniões solicitadas</h3>
          {meetings.map((meeting) => (
            <div key={meeting.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 p-3">
              <div>
                <p className="font-bold text-slate-900">{meeting.meeting_type === 'video' ? 'Videoconferência' : 'Reunião'}</p>
                <p className="text-xs text-slate-500">{meeting.scheduled_at ? date(meeting.scheduled_at) : 'Horário a combinar'}{meeting.notes ? ' · ' + meeting.notes : ''}</p>
              </div>
              <select
                value={meeting.status}
                onChange={(event) => void updateMeeting(meeting.id, event.target.value)}
                disabled={busy === 'meeting-' + meeting.id}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700"
              >
                <option value="requested">Solicitada</option>
                <option value="confirmed">Confirmada</option>
                <option value="cancelled">Cancelada</option>
                <option value="completed">Concluída</option>
              </select>
            </div>
          ))}
        </div>
      )}

      {project && (
        <div className="mt-6 border-t border-slate-100 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-black text-slate-900">Acompanhamento do projeto</h3>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{project.status}</span>
          </div>
          <div className="mt-3 space-y-2">
            {project.milestones.map((milestone) => (
              <div key={milestone.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 p-3">
                <div><p className="font-bold text-slate-900">{milestone.title}</p><p className="text-xs text-slate-500">{milestone.notes || 'Sem observações'}</p></div>
                <select
                  value={milestone.status}
                  onChange={(event) => void updateMilestone(milestone.id, event.target.value)}
                  disabled={busy === 'milestone-' + milestone.id}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700"
                >
                  <option value="pending">Aguardando</option>
                  <option value="current">Em andamento</option>
                  <option value="completed">Concluída</option>
                  <option value="skipped">Não aplicável</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function CompanyVersionHistory({ versions }: { versions: MarketplaceProposalVersion[] }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-2">
        <History className="h-5 w-5 text-blue-700" />
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Negociação</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">Histórico de versões</h2>
        </div>
      </div>
      <ol className="mt-5 space-y-3">
        {versions.map((version, index) => (
          <li key={version.id || version.number} className="flex gap-3 rounded-2xl border border-slate-200 p-4">
            <span className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black', index === 0 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600')}>
              {version.number}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-bold text-slate-950">{version.title}</p>
                <span className="font-black text-blue-700">{money(version.total_cents)}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{version.status === 'published' ? 'Enviada ao cliente' : 'Rascunho interno'}</p>
              {version.summary && <p className="mt-2 text-sm text-slate-600">{version.summary}</p>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
