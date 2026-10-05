'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  FileText,
  Loader2,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import {
  marketplaceProposalsApi,
  type MarketplaceProposal,
  type MarketplaceProposalProject,
} from '@/lib/api';
import { cn } from '@/lib/utils';

const statusLabels: Record<string, { label: string; tone: string; step: number }> = {
  draft: { label: 'Rascunho', tone: 'bg-slate-100 text-slate-700', step: 0 },
  sent: { label: 'Recebida', tone: 'bg-blue-50 text-blue-700', step: 1 },
  viewed: { label: 'Visualizada', tone: 'bg-blue-50 text-blue-700', step: 1 },
  under_review: { label: 'Em análise', tone: 'bg-violet-50 text-violet-700', step: 2 },
  negotiating: { label: 'Negociação', tone: 'bg-amber-50 text-amber-700', step: 2 },
  meeting_scheduled: { label: 'Reunião agendada', tone: 'bg-amber-50 text-amber-700', step: 3 },
  accepted: { label: 'Escolhida', tone: 'bg-emerald-50 text-emerald-700', step: 4 },
  declined: { label: 'Recusada', tone: 'bg-slate-100 text-slate-600', step: 4 },
  not_selected: { label: 'Outra proposta escolhida', tone: 'bg-slate-100 text-slate-600', step: 4 },
  withdrawn: { label: 'Retirada', tone: 'bg-slate-100 text-slate-600', step: 4 },
};

const journeySteps = [
  { label: 'Proposta recebida', icon: FileText },
  { label: 'Em análise', icon: ShieldCheck },
  { label: 'Negociação', icon: MessageCircle },
  { label: 'Escolher proposta', icon: CheckCircle2 },
  { label: 'Projeto em andamento', icon: Sparkles },
];

function money(cents = 0, currency = 'BRL') {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(cents / 100);
}

function date(value?: string | null) {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString('pt-BR');
}

function statusOf(status: string) {
  return statusLabels[status] || { label: 'Atualizando', tone: 'bg-slate-100 text-slate-700', step: 1 };
}

function companyInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function CompanyMark({ proposal }: { proposal: MarketplaceProposal }) {
  return (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-black text-blue-700 ring-1 ring-blue-100">
      {companyInitials(proposal.company.name)}
    </span>
  );
}

function ProgressRail({ status, project }: { status: string; project?: MarketplaceProposalProject | null }) {
  const active = project ? 4 : statusOf(status).step;
  return (
    <ol className="grid grid-cols-5 gap-1" aria-label="Progresso da proposta">
      {journeySteps.map((step, index) => {
        const Icon = step.icon;
        const done = index < active;
        const current = index === active;
        return (
          <li key={step.label} className="min-w-0 text-center">
            <span
              className={cn(
                'mx-auto flex h-8 w-8 items-center justify-center rounded-full border',
                done || current
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-slate-200 bg-white text-slate-400'
              )}
            >
              {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
            </span>
            <span className="mt-1 block truncate text-[10px] font-semibold text-slate-600">{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

function ProposalCard({
  proposal,
  selected,
  compared,
  onSelect,
  onCompare,
}: {
  proposal: MarketplaceProposal;
  selected: boolean;
  compared: boolean;
  onSelect: () => void;
  onCompare: () => void;
}) {
  const status = statusOf(proposal.status);
  return (
    <article
      className={cn(
        'rounded-2xl border bg-white p-4 shadow-sm transition',
        selected ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200'
      )}
    >
      <button type="button" onClick={onSelect} className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
        <span className="flex items-start gap-3">
          <CompanyMark proposal={proposal} />
          <span className="min-w-0 flex-1">
            <span className="flex items-start justify-between gap-2">
              <span className="min-w-0">
                <span className="block truncate font-bold text-slate-950">{proposal.company.name}</span>
                <span className="mt-1 block text-xs text-slate-500">
                  {proposal.reference} · Atualizada {date(proposal.published_at || proposal.created_at)}
                </span>
              </span>
              <span className={cn('shrink-0 rounded-full px-2 py-1 text-[11px] font-bold', status.tone)}>
                {status.label}
              </span>
            </span>
            <span className="mt-3 flex items-center justify-between gap-2">
              <span className="font-black text-blue-700">
                {proposal.total_cents ? money(proposal.total_cents, proposal.currency) : 'Aguardando valor'}
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
            </span>
          </span>
        </span>
      </button>
      <label className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3 text-xs font-semibold text-slate-600">
        <input type="checkbox" checked={compared} onChange={onCompare} className="h-4 w-4 rounded border-slate-300 text-blue-600" />
        Comparar proposta
      </label>
    </article>
  );
}

export function MarketplaceProposalsWorkspace() {
  const [proposals, setProposals] = useState<MarketplaceProposal[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingNotes, setMeetingNotes] = useState('');
  const [showCompare, setShowCompare] = useState(false);

  const selected = useMemo(
    () => proposals.find((proposal) => proposal.id === selectedId) || proposals[0],
    [proposals, selectedId]
  );

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await marketplaceProposalsApi.list();
      setProposals(response.proposals || []);
      setSelectedId((current) => current || response.proposals?.[0]?.id || null);
    } catch {
      setError('Não foi possível carregar suas propostas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const updateProposal = (proposal: MarketplaceProposal) => {
    setProposals((current) => current.map((item) => (item.id === proposal.id ? proposal : item)));
    setSelectedId(proposal.id);
  };

  const run = async (key: string, action: () => Promise<{ proposal: MarketplaceProposal }>) => {
    setBusy(key);
    setError(null);
    try {
      updateProposal((await action()).proposal);
    } catch {
      setError('Não foi possível concluir essa ação. Tente novamente.');
    } finally {
      setBusy(null);
    }
  };

  const toggleCompare = (id: number) => {
    setCompareIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : current.length < 3 ? [...current, id] : current));
  };

  const requestMeeting = async () => {
    if (!selected) return;
    setBusy('meeting');
    try {
      await marketplaceProposalsApi.createMeeting(selected.id, {
        meeting_type: 'video',
        scheduled_at: meetingDate ? new Date(meetingDate).toISOString() : undefined,
        notes: meetingNotes,
      });
      await load();
      setMeetingNotes('');
    } catch {
      setError('Não foi possível solicitar a reunião.');
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return <div className="flex min-h-[360px] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-blue-600" /></div>;
  }

  if (error && proposals.length === 0) {
    return (
      <section className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-center">
        <p className="font-bold text-rose-800">{error}</p>
        <button type="button" onClick={() => void load()} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 font-bold text-white">
          <RefreshCw className="h-4 w-4" /> Tentar novamente
        </button>
      </section>
    );
  }

  if (!proposals.length) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <CircleDollarSign className="mx-auto h-10 w-10 text-blue-600" />
        <h1 className="mt-4 text-2xl font-black text-slate-950">Minhas propostas</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">Quando uma empresa responder à sua solicitação, a proposta aparecerá aqui.</p>
        <Link href="/" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-blue-600 px-5 font-bold text-white">Encontrar empresas</Link>
      </section>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-blue-700">Área do consumidor</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">Minhas propostas</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">Compare condições, converse com as empresas e acompanhe seu projeto até a conclusão.</p>
        </div>
        <button type="button" onClick={() => void load()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm">
          <RefreshCw className="h-4 w-4" /> Atualizar
        </button>
      </header>

      {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">{error}</p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(300px,0.8fr)_minmax(0,1.4fr)]">
        <section aria-label="Lista de propostas" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wide text-slate-500">{proposals.length} recebida(s)</h2>
            <span className="text-xs text-slate-500">Até 3 para comparar</span>
          </div>
          {proposals.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              selected={selected?.id === proposal.id}
              compared={compareIds.includes(proposal.id)}
              onSelect={() => {
                setSelectedId(proposal.id);
                if (proposal.status === 'sent') void run('view-' + proposal.id, () => marketplaceProposalsApi.view(proposal.id));
              }}
              onCompare={() => toggleCompare(proposal.id)}
            />
          ))}
          <button
            type="button"
            disabled={compareIds.length < 2}
            onClick={() => setShowCompare(true)}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-sm font-bold text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CircleDollarSign className="h-4 w-4" /> Comparar selecionadas ({compareIds.length})
          </button>
        </section>

        {selected && (
          <section className="space-y-5">
            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <CompanyMark proposal={selected} />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Detalhes da proposta</p>
                    <h2 className="mt-1 text-2xl font-black text-slate-950">{selected.company.name}</h2>
                    <p className="mt-1 text-sm text-slate-500">{selected.reference} · {selected.request?.city || 'Local não informado'}{selected.request?.state ? ', ' + selected.request.state : ''}</p>
                  </div>
                </div>
                <span className={cn('rounded-full px-3 py-1.5 text-xs font-bold', statusOf(selected.status).tone)}>{statusOf(selected.status).label}</span>
              </div>

              <div className="mt-6"><ProgressRail status={selected.status} project={selected.project} /></div>

              {selected.version ? (
                <div className="mt-7 grid gap-4 md:grid-cols-[1fr_220px]">
                  <div>
                    <h3 className="text-lg font-black text-slate-950">{selected.version.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{selected.version.summary || 'A empresa ainda não adicionou um resumo.'}</p>
                    <div className="mt-5 divide-y divide-slate-100 rounded-2xl border border-slate-200">
                      {selected.version.items.length ? selected.version.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                          <div><p className="font-bold text-slate-900">{item.name}</p><p className="text-xs text-slate-500">{item.quantity} {item.unit}</p></div>
                          <span className="font-bold text-slate-900">{money(item.total_cents, selected.currency)}</span>
                        </div>
                      )) : <p className="p-4 text-sm text-slate-500">Itens detalhados ainda não publicados.</p>}
                    </div>
                  </div>
                  <aside className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Valor total</p>
                    <p className="mt-2 text-2xl font-black text-blue-700">{money(selected.version.total_cents || selected.total_cents, selected.currency)}</p>
                    <p className="mt-2 text-xs text-slate-500">Válida até {date(selected.version.valid_until || selected.expires_at)}</p>
                    {selected.version.terms.length > 0 && (
                      <dl className="mt-5 space-y-3 border-t border-slate-200 pt-4">
                        {selected.version.terms.map((term) => <div key={term.id}><dt className="text-xs font-bold text-slate-500">{term.label}</dt><dd className="mt-1 text-sm text-slate-800">{term.value}</dd></div>)}
                      </dl>
                    )}
                  </aside>
                </div>
              ) : (
                <div className="mt-6 rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">A empresa está preparando os detalhes desta proposta.</div>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={'/chat?company_id=' + selected.company.id + '&marketplace_proposal_id=' + selected.id} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-amber-400 px-4 text-sm font-black text-slate-950">
                  <MessageCircle className="h-4 w-4" /> Conversar com a empresa
                </Link>
                <button type="button" onClick={() => setMeetingDate((current) => current || new Date().toISOString().slice(0, 16))} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800">
                  <CalendarClock className="h-4 w-4" /> Agendar reunião
                </button>
                {selected.status !== 'accepted' && !['declined', 'not_selected', 'withdrawn'].includes(selected.status) && (
                  <button type="button" disabled={busy === 'accept'} onClick={() => void run('accept', () => marketplaceProposalsApi.accept(selected.id))} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white disabled:opacity-60">
                    {busy === 'accept' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Escolher esta proposta
                  </button>
                )}
              </div>

              {meetingDate && (
                <div className="mt-4 grid gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                  <label className="text-xs font-bold text-slate-700">Data e horário<input type="datetime-local" value={meetingDate} onChange={(event) => setMeetingDate(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" /></label>
                  <label className="text-xs font-bold text-slate-700">Observações<textarea value={meetingNotes} onChange={(event) => setMeetingNotes(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Opcional" /></label>
                  <button type="button" onClick={() => void requestMeeting()} disabled={busy === 'meeting'} className="min-h-11 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white disabled:opacity-60">{busy === 'meeting' ? 'Enviando...' : 'Confirmar reunião'}</button>
                </div>
              )}

              {selected.status !== 'accepted' && !['declined', 'not_selected', 'withdrawn'].includes(selected.status) && (
                <div className="mt-5 border-t border-slate-100 pt-5">
                  <label className="block text-sm font-bold text-slate-800">Quer negociar ou pedir uma alteração?</label>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                    <input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Ex.: ajustar prazo ou equipamento" className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm" />
                    <button type="button" disabled={!reason.trim() || busy === 'change'} onClick={() => void run('change', () => marketplaceProposalsApi.requestChange(selected.id, reason))} className="min-h-11 rounded-xl border border-amber-300 bg-amber-50 px-4 text-sm font-bold text-amber-800 disabled:opacity-50">Solicitar alteração</button>
                    <button type="button" disabled={busy === 'decline'} onClick={() => void run('decline', () => marketplaceProposalsApi.decline(selected.id, reason))} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600">Recusar</button>
                  </div>
                </div>
              )}
            </article>

            {selected.versions && selected.versions.length > 1 && (
              <ProposalVersionHistory versions={selected.versions} />
            )}
            {selected.project && <ProjectTimeline project={selected.project} companyId={selected.company.id} />}
          </section>
        )}
      </div>

      {showCompare && <CompareDialog proposals={proposals.filter((proposal) => compareIds.includes(proposal.id))} onClose={() => setShowCompare(false)} />}
    </main>
  );
}

function ProposalVersionHistory({ versions }: { versions: NonNullable<MarketplaceProposal['versions']> }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Negociação da proposta</p>
      <h3 className="mt-1 text-xl font-black text-slate-950">Histórico de versões</h3>
      <ol className="mt-5 space-y-3">
        {versions.map((version, index) => (
          <li key={version.id || version.number} className="flex gap-3 rounded-2xl border border-slate-200 p-4">
            <span className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black', index === 0 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600')}>
              {version.number}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-bold text-slate-950">{version.title}</p>
                <span className="font-black text-blue-700">{money(version.total_cents, version.currency)}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{version.status === 'published' ? 'Enviada ao cliente' : 'Versão interna'}</p>
              {version.summary && <p className="mt-2 text-sm text-slate-600">{version.summary}</p>}
            </div>
          </li>
        ))}
      </ol>
    </article>
  );
}

function ProjectTimeline({ project, companyId }: { project: MarketplaceProposalProject; companyId: number }) {
  const completed = project.milestones.filter((milestone) => milestone.status === 'completed').length;
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Acompanhamento do projeto</p><h3 className="mt-1 text-xl font-black text-slate-950">{completed === project.milestones.length ? 'Projeto concluído' : 'Projeto em andamento'}</h3></div>
        <span className="text-sm font-bold text-blue-700">{completed}/{project.milestones.length} etapas</span>
      </div>
      <ol className="mt-5 space-y-4">
        {project.milestones.map((milestone) => (
          <li key={milestone.id} className="flex gap-3">
            <span className={cn('mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full', milestone.status === 'completed' ? 'bg-emerald-500 text-white' : milestone.status === 'current' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500')}>
              {milestone.status === 'completed' ? <Check className="h-4 w-4" /> : <span className="h-2 w-2 rounded-full bg-current" />}
            </span>
            <div><p className="font-bold text-slate-900">{milestone.title}</p><p className="text-xs text-slate-500">{milestone.completed_at ? 'Concluída em ' + date(milestone.completed_at) : milestone.scheduled_at ? 'Agendada para ' + date(milestone.scheduled_at) : 'Aguardando próxima atualização'}</p></div>
          </li>
        ))}
      </ol>
      {completed === project.milestones.length && <Link href={'/companies/' + companyId + '#review-form'} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white"><Sparkles className="h-4 w-4" /> Avaliar empresa</Link>}
    </article>
  );
}

function CompareDialog({ proposals, onClose }: { proposals: MarketplaceProposal[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-3 sm:items-center">
      <section role="dialog" aria-modal="true" aria-labelledby="compare-title" className="max-h-[90dvh] w-full max-w-5xl overflow-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wide text-blue-700">Comparação lado a lado</p><h2 id="compare-title" className="mt-1 text-2xl font-black text-slate-950">Comparar propostas</h2></div><button type="button" aria-label="Fechar comparação" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200"><X className="h-5 w-5" /></button></div>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {proposals.map((proposal) => <article key={proposal.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex items-center gap-2"><CompanyMark proposal={proposal} /><h3 className="font-bold text-slate-950">{proposal.company.name}</h3></div><p className="mt-4 text-2xl font-black text-blue-700">{money(proposal.total_cents, proposal.currency)}</p><dl className="mt-4 space-y-3 text-sm">{[['Status', statusOf(proposal.status).label], ['Validade', date(proposal.expires_at || proposal.version?.valid_until)], ['Itens', String(proposal.version?.items.length || 0)]].map(([label, value]) => <div key={label} className="flex justify-between gap-3 border-b border-slate-100 pb-2"><dt className="text-slate-500">{label}</dt><dd className="text-right font-bold text-slate-900">{value}</dd></div>)}</dl></article>)}
        </div>
      </section>
    </div>
  );
}
