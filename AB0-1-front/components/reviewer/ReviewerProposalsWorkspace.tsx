'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  MessageCircle,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useOptionalDashboardContext } from '@/app/review-dashboard/DashboardLayoutClient';
import { ReviewerErrorState } from '@/components/reviewer/ReviewerErrorState';
import { ReviewerSkeleton } from '@/components/reviewer/ReviewerSkeleton';
import { useReviewerProposals } from '@/hooks/reviewer/useReviewerProposals';
import type { Lead } from '@/lib/api';
import { cn } from '@/lib/utils';

type FilterKey = 'all' | 'progress' | 'received';
type Company = { id?: number | string; name: string; logoUrl?: string | null };
type Status = { label: string; description: string; tone: string; progress: number };

const statuses: Record<string, Status> = {
  draft: {
    label: 'Rascunho',
    description: 'A solicitação ainda não foi finalizada.',
    tone: 'border-slate-200 bg-slate-50 text-slate-600',
    progress: 10,
  },
  pending_otp: {
    label: 'Aguardando confirmação',
    description: 'Confirme seus dados para liberar o encaminhamento.',
    tone: 'border-amber-200 bg-amber-50 text-amber-700',
    progress: 20,
  },
  verified: {
    label: 'Dados confirmados',
    description: 'Sua solicitação foi confirmada e está sendo preparada.',
    tone: 'border-blue-200 bg-blue-50 text-blue-700',
    progress: 38,
  },
  routing: {
    label: 'Em encaminhamento',
    description: 'Estamos encaminhando a solicitação para empresas elegíveis.',
    tone: 'border-blue-200 bg-blue-50 text-blue-700',
    progress: 48,
  },
  matched: {
    label: 'Empresas encontradas',
    description: 'Há empresas correspondentes ao seu pedido.',
    tone: 'border-blue-200 bg-blue-50 text-blue-700',
    progress: 58,
  },
  distributed: {
    label: 'Enviada às empresas',
    description: 'A solicitação foi encaminhada para empresas correspondentes.',
    tone: 'border-blue-200 bg-blue-50 text-blue-700',
    progress: 64,
  },
  proposal_submitted: {
    label: 'Solicitação recebida',
    description: 'A empresa recebeu sua solicitação.',
    tone: 'border-blue-200 bg-blue-50 text-blue-700',
    progress: 70,
  },
  proposal_processing: {
    label: 'Em análise',
    description: 'A empresa está preparando o retorno da proposta.',
    tone: 'border-violet-200 bg-violet-50 text-violet-700',
    progress: 80,
  },
  proposal_sent: {
    label: 'Proposta recebida',
    description: 'A empresa enviou uma proposta para você avaliar.',
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    progress: 92,
  },
  proposal_failed: {
    label: 'Não concluída',
    description: 'Não foi possível concluir esta solicitação.',
    tone: 'border-rose-200 bg-rose-50 text-rose-700',
    progress: 100,
  },
  converted: {
    label: 'Projeto avançado',
    description: 'Esta solicitação avançou para uma etapa posterior.',
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    progress: 100,
  },
  closed: {
    label: 'Encerrada',
    description: 'Esta solicitação foi encerrada.',
    tone: 'border-slate-200 bg-slate-50 text-slate-600',
    progress: 100,
  },
};

const steps = [
  { key: 'created', label: 'Solicitação criada', icon: FileText },
  { key: 'verified', label: 'Dados confirmados', icon: ShieldCheck },
  { key: 'distributed', label: 'Enviada às empresas', icon: Send },
  { key: 'processing', label: 'Proposta em análise', icon: Clock3 },
  { key: 'sent', label: 'Proposta recebida', icon: CheckCircle2 },
  { key: 'follow_up', label: 'Acompanhamento do projeto', icon: Sparkles },
] as const;

const stepByStatus: Record<string, number> = {
  draft: 0,
  pending_otp: 0,
  verified: 1,
  routing: 2,
  matched: 2,
  distributed: 2,
  proposal_submitted: 3,
  proposal_processing: 3,
  proposal_sent: 4,
  converted: 5,
  closed: 5,
  proposal_failed: 3,
};

function companyOf(proposal: Lead): Company {
  const company = typeof proposal.company === 'object' ? proposal.company : undefined;
  return {
    id: company?.id ?? proposal.company_obj?.id,
    name:
      (typeof proposal.company === 'string' ? proposal.company : company?.name) ||
      proposal.company_obj?.name ||
      'Empresa não identificada',
    logoUrl: company?.logo_url || proposal.company_obj?.logo_url || proposal.company_logo_url,
  };
}

function statusOf(status?: string): Status {
  return (
    statuses[status || ''] || {
      label: 'Em acompanhamento',
      description: 'O status desta solicitação está sendo atualizado.',
      tone: 'border-blue-200 bg-blue-50 text-blue-700',
      progress: 50,
    }
  );
}

function dateOf(value?: string) {
  if (!value) return 'Data não informada';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Data não informada' : date.toLocaleDateString('pt-BR');
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function Logo({ company }: { company: Company }) {
  return company.logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={company.logoUrl}
      alt=""
      className="h-12 w-12 rounded-xl object-contain ring-1 ring-slate-200"
    />
  ) : (
    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-sm font-black text-blue-700 ring-1 ring-blue-100">
      {initials(company.name)}
    </span>
  );
}

function ProposalCard({
  proposal,
  selected,
  onSelect,
}: {
  proposal: Lead;
  selected: boolean;
  onSelect: () => void;
}) {
  const company = companyOf(proposal);
  const status = statusOf(proposal.status);
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'group w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2',
        selected ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200'
      )}
    >
      <span className="flex items-start gap-3">
        <Logo company={company} />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-start justify-between gap-2">
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-slate-950">
                {company.name}
              </span>
              <span className="mt-1 block text-xs text-slate-500">
                Solicitação #{proposal.id} · {dateOf(proposal.created_at)}
              </span>
            </span>
            <span
              className={cn(
                'shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold',
                status.tone
              )}
            >
              {status.label}
            </span>
          </span>
          <span className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500">
            <span className="truncate">
              {proposal.product_vertical || proposal.category || 'Solução energética'}
            </span>
            <ChevronRight
              className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-blue-600"
              aria-hidden="true"
            />
          </span>
        </span>
      </span>
    </button>
  );
}

function Timeline({ proposal }: { proposal: Lead }) {
  const current = stepByStatus[proposal.status || ''] ?? 0;
  return (
    <ol className="space-y-0" aria-label="Acompanhamento da solicitação">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const completed = index < current;
        const active = index === current;
        return (
          <li key={step.key} className="relative flex gap-3 pb-5 last:pb-0">
            {index < steps.length - 1 && (
              <span
                className={cn(
                  'absolute left-4 top-8 h-[calc(100%-12px)] w-px',
                  completed ? 'bg-blue-500' : 'bg-slate-200'
                )}
                aria-hidden="true"
              />
            )}
            <span
              className={cn(
                'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border',
                completed || active
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-slate-200 bg-white text-slate-400'
              )}
            >
              {completed ? (
                <Check className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Icon className="h-4 w-4" aria-hidden="true" />
              )}
            </span>
            <span className="min-w-0 pt-1">
              <span
                className={cn(
                  'block text-sm font-bold',
                  active ? 'text-slate-950' : completed ? 'text-slate-700' : 'text-slate-400'
                )}
              >
                {step.label}
              </span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">
                {active
                  ? 'Etapa atual desta solicitação.'
                  : completed
                    ? 'Concluída.'
                    : 'Aguardando avanço da solicitação.'}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Comparison({ proposals }: { proposals: Lead[] }) {
  const rows: Array<[string, (proposal: Lead) => string]> = [
    ['Status', (proposal) => statusOf(proposal.status).label],
    ['Solicitação', (proposal) => '#' + proposal.id],
    ['Data', (proposal) => dateOf(proposal.created_at)],
    ['Categoria', (proposal) => proposal.product_vertical || proposal.category || 'Não informado'],
  ];
  return (
    <section
      className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
      aria-labelledby="compare-title"
    >
      <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">Comparação</p>
      <h2 id="compare-title" className="mt-1 text-xl font-black text-slate-950">
        Comparar propostas
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Compare somente informações reais disponíveis no seu painel.
      </p>
      <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead className="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Informação</th>
              {proposals.map((proposal) => (
                <th key={proposal.id} className="px-4 py-3">
                  {companyOf(proposal).name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(([label, value]) => (
              <tr key={label}>
                <th className="px-4 py-3 font-semibold text-slate-500">{label}</th>
                {proposals.map((proposal) => (
                  <td key={proposal.id} className="px-4 py-3 font-semibold text-slate-900">
                    {value(proposal)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs leading-5 text-slate-500">
        Valores, potência, equipamentos e prazos só aparecerão quando forem enviados pela empresa e
        estiverem disponíveis no contrato.
      </p>
    </section>
  );
}

function Detail({ proposal }: { proposal: Lead }) {
  const company = companyOf(proposal);
  const status = statusOf(proposal.status);
  const canChat = company.id !== undefined && company.id !== null;
  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-[#071735] via-[#0d2d66] to-blue-600 p-5 text-white sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="rounded-2xl bg-white p-1">
                <Logo company={company} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-lg font-black">{company.name}</p>
                <p className="mt-1 text-xs text-blue-100">Solicitação #{proposal.id}</p>
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold">
              {status.label}
            </span>
          </div>
          <div className="mt-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-blue-100">Andamento da solicitação</p>
              <p className="mt-1 text-sm font-bold text-white">Acompanhe o status abaixo</p>
            </div>
            <BarChart3 className="h-9 w-9 text-blue-100" aria-hidden="true" />
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white"
              style={{ width: status.progress + '%' }}
            />
          </div>
        </div>
        <div className="space-y-4 p-5 sm:p-6">
          <div>
            <p className="text-sm font-bold text-slate-950">{status.description}</p>
            <p className="mt-1 text-xs text-slate-500">
              Criada em {dateOf(proposal.created_at)} ·{' '}
              {proposal.product_vertical || proposal.category || 'Categoria não informada'}
            </p>
          </div>
          {canChat ? (
            <Link
              href={'/chat?company_id=' + encodeURIComponent(String(company.id))}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-sm hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" /> Conversar com a empresa
            </Link>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-center text-xs font-semibold text-slate-500">
              A conversa ficará disponível quando uma empresa for associada.
            </div>
          )}
        </div>
      </section>
      <section
        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        aria-labelledby="summary-title"
      >
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" aria-hidden="true" />
          <h2 id="summary-title" className="text-base font-black text-slate-950">
            Resumo da proposta
          </h2>
        </div>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">Empresa</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">{company.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">Status</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">{status.label}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">Categoria</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">
              {proposal.product_vertical || proposal.category || 'Não informado'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Data da solicitação
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">
              {dateOf(proposal.created_at)}
            </dd>
          </div>
        </dl>
      </section>
      <section
        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        aria-labelledby="journey-title"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
              Acompanhamento
            </p>
            <h2 id="journey-title" className="mt-1 text-lg font-black text-slate-950">
              Próximas etapas
            </h2>
          </div>
          <Clock3 className="h-5 w-5 text-slate-400" aria-hidden="true" />
        </div>
        <div className="mt-5">
          <Timeline proposal={proposal} />
        </div>
      </section>
      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
        <p className="text-sm font-black text-amber-950">Informações adicionais</p>
        <p className="mt-1 text-sm leading-6 text-amber-900">
          Valores, equipamentos, negociação, agenda e avaliação só serão habilitados quando houver
          dados e ações reais disponibilizados pela empresa.
        </p>
      </section>
    </div>
  );
}

export function ReviewerProposalsWorkspace() {
  const dashboard = useOptionalDashboardContext();
  const standalone = useReviewerProposals({ enabled: !dashboard });
  const proposals = dashboard ? dashboard.leads : standalone.proposals;
  const loading = dashboard ? dashboard.leadsLoading : standalone.loading;
  const error = dashboard ? dashboard.leadsError : standalone.error;
  const refetch = dashboard ? dashboard.onRefresh : standalone.refetch;
  const [filter, setFilter] = useState<FilterKey>('all');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const activeCount = proposals.filter(
    (item) =>
      !['proposal_sent', 'converted', 'closed', 'proposal_failed'].includes(item.status || '')
  ).length;
  const receivedCount = proposals.filter((item) => item.status === 'proposal_sent').length;
  const filtered = useMemo(
    () =>
      proposals.filter(
        (item) =>
          filter === 'all' ||
          (filter === 'received'
            ? item.status === 'proposal_sent'
            : !['proposal_sent', 'converted', 'closed', 'proposal_failed'].includes(
                item.status || ''
              ))
      ),
    [filter, proposals]
  );

  useEffect(() => {
    if (!proposals.length) setSelectedId(null);
    else
      setSelectedId((current) =>
        current && proposals.some((item) => item.id === current) ? current : proposals[0].id
      );
  }, [proposals]);
  useEffect(() => {
    if (filtered.length && !filtered.some((item) => item.id === selectedId))
      setSelectedId(filtered[0].id);
  }, [filtered, selectedId]);

  const selected = proposals.find((item) => item.id === selectedId) || filtered[0];
  if (loading) return <ReviewerSkeleton />;
  if (error) return <ReviewerErrorState onRetry={() => void refetch()} />;

  return (
    <div className="space-y-6 pb-4">
      <header className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link
            href="/review-dashboard"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Voltar ao painel
          </Link>
          <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-blue-600">
            Jornada de propostas
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Minhas propostas
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Acompanhe cada solicitação, compare empresas e avance somente quando houver uma proposta
            real disponível.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:border-blue-300 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" /> Atualizar
        </button>
      </header>
      {proposals.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm sm:p-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <FileText className="h-7 w-7" aria-hidden="true" />
          </div>
          <h2 className="mt-5 text-xl font-black text-slate-950">Você ainda não tem propostas</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
            Quando uma solicitação for criada com seu e-mail, ela aparecerá aqui com o
            acompanhamento real do sistema.
          </p>
          <Link
            href="/empresas"
            className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            Encontrar empresas <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </section>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-3" aria-label="Resumo das propostas">
            {[
              ['Total de solicitações', proposals.length, 'Todas as suas solicitações'],
              ['Em andamento', activeCount, 'Aguardando retorno ou encaminhamento'],
              ['Propostas recebidas', receivedCount, 'Com retorno registrado'],
            ].map(([label, value, caption], index) => (
              <div
                key={label as string}
                className={cn(
                  'rounded-2xl border p-4 shadow-sm',
                  index === 1 ? 'border-blue-100 bg-blue-50' : 'border-slate-200 bg-white'
                )}
              >
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
                <p className="mt-1 text-xs text-slate-500">{caption}</p>
              </div>
            ))}
          </section>
          <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)] xl:items-start">
            <section className="min-w-0 space-y-4" aria-labelledby="proposals-list-title">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
                    Visão geral
                  </p>
                  <h2 id="proposals-list-title" className="mt-1 text-xl font-black text-slate-950">
                    Solicitações recebidas
                  </h2>
                </div>
                <button
                  type="button"
                  disabled={proposals.length < 2}
                  onClick={() => setCompareOpen((open) => !open)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <BarChart3 className="h-4 w-4" aria-hidden="true" /> Comparar propostas
                </button>
              </div>
              <div
                className="flex gap-2 overflow-x-auto pb-1"
                role="tablist"
                aria-label="Filtrar propostas"
              >
                {[
                  ['all', 'Todas', proposals.length],
                  ['progress', 'Em andamento', activeCount],
                  ['received', 'Recebidas', receivedCount],
                ].map(([key, label, count]) => (
                  <button
                    key={key as string}
                    type="button"
                    role="tab"
                    aria-selected={filter === key}
                    onClick={() => setFilter(key as FilterKey)}
                    className={cn(
                      'min-h-11 shrink-0 rounded-xl px-3 text-xs font-bold',
                      filter === key
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700'
                    )}
                  >
                    {label} <span className="ml-1 opacity-75">{count}</span>
                  </button>
                ))}
              </div>
              {filtered.length ? (
                <div className="space-y-3">
                  {filtered.map((proposal) => (
                    <ProposalCard
                      key={proposal.id}
                      proposal={proposal}
                      selected={selected?.id === proposal.id}
                      onSelect={() => {
                        setSelectedId(proposal.id);
                        setCompareOpen(false);
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                  Nenhuma solicitação neste filtro.
                </div>
              )}
            </section>
            <section className="min-w-0" aria-label="Detalhes da proposta selecionada">
              {compareOpen && proposals.length > 1 ? (
                <Comparison proposals={proposals} />
              ) : selected ? (
                <Detail proposal={selected} />
              ) : null}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
