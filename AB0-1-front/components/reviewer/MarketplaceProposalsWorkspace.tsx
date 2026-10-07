'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  FileText,
  GitCompareArrows,
  Info,
  MapPin,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { marketplaceProposalsApi, type MarketplaceProposal } from '@/lib/api';
import {
  canDecide,
  formatDate,
  formatMoney,
  getProposalCardMetrics,
  getProposalDisplayPrice,
  getProposalLocation,
  getProposalStatusTone,
  isProjectComplete,
  proposalChatUrl,
} from '@/lib/marketplace-proposals';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { CompanyMark, ProposalSummary, StatusBadge } from './proposals/ProposalSummary';
import { ProposalComparison } from './proposals/ProposalComparison';
import { ProposalMeeting } from './proposals/ProposalMeeting';
import { ProposalNegotiation } from './proposals/ProposalNegotiation';
import { ProposalProject } from './proposals/ProposalProject';

type Screen = 'summary' | 'complete' | 'meeting' | 'negotiation' | 'project' | 'compare';
type Filter = 'all' | 'active' | 'completed' | 'closed';
const screens: Screen[] = ['summary', 'complete', 'meeting', 'negotiation', 'project', 'compare'];
const screenTitles: Record<Screen, string> = {
  summary: 'Detalhes da proposta',
  complete: 'Proposta completa',
  meeting: 'Agendar reunião',
  negotiation: 'Negociação da proposta',
  project: 'Acompanhamento do projeto',
  compare: 'Comparar propostas',
};
const filters: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'active', label: 'Em andamento' },
  { id: 'completed', label: 'Concluídas' },
  { id: 'closed', label: 'Encerradas' },
];

const journeySteps = [
  { id: 1, label: 'Minhas propostas' },
  { id: 2, label: 'Detalhes', view: 'summary' as Screen },
  { id: 3, label: 'Proposta completa', view: 'complete' as Screen },
  { id: 4, label: 'Comparar', view: 'compare' as Screen },
  { id: 5, label: 'Conversa' },
  { id: 6, label: 'Reunião', view: 'meeting' as Screen },
  { id: 7, label: 'Negociação', view: 'negotiation' as Screen },
  { id: 8, label: 'Escolher' },
  { id: 9, label: 'Projeto', view: 'project' as Screen },
  { id: 10, label: 'Concluído', view: 'project' as Screen },
];

function activeJourneyStep(proposal: MarketplaceProposal | undefined, screen: Screen) {
  if (screen === 'compare') return 4;
  if (!proposal) return 1;
  if (screen === 'meeting') return 6;
  if (screen === 'negotiation') return 7;
  if (isProjectComplete(proposal.project)) return 10;
  if (screen === 'project' || proposal.status === 'accepted') return 9;
  if (screen === 'complete') return 3;
  return 2;
}

function ProposalJourneyRail({
  proposal,
  screen,
  onNavigate,
  onList,
  onChoose,
  canCompare,
}: {
  proposal?: MarketplaceProposal;
  screen: Screen;
  onNavigate: (view: Screen) => void;
  onList: () => void;
  onChoose: () => void;
  canCompare: boolean;
}) {
  const active = activeJourneyStep(proposal, screen);
  const activeStepObj = journeySteps.find((s) => s.id === active) || journeySteps[0];

  return (
    <nav
      aria-label="Fluxo da proposta"
      className="mb-6 rounded-2xl border border-border bg-card p-3 shadow-xs sm:p-4"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
            Jornada da proposta
          </p>
          <h2 className="mt-0.5 text-xs font-semibold text-foreground sm:text-sm">
            {proposal ? `Etapa ${active} de 10 — ${activeStepObj.label}` : 'Acompanhe todas as etapas'}
          </h2>
        </div>
        <span className="hidden shrink-0 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary sm:inline-flex">
          10 Passos do Projeto
        </span>
      </div>

      {/* Desktop 1-row view (xl+) */}
      <ol className="hidden xl:flex xl:items-center xl:justify-between xl:gap-1">
        {journeySteps.map((step) => {
          const isActive = step.id === active;
          const isDone = step.id < active;
          const canOpen =
            Boolean(proposal) &&
            step.id !== 1 &&
            (step.id !== 8 || canDecide(proposal!)) &&
            (step.id !== 4 || canCompare);

          const badgeClass = isActive
            ? 'bg-primary text-primary-foreground shadow-xs ring-2 ring-primary/20'
            : isDone
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-muted text-muted-foreground';

          const content = (
            <div className="flex items-center gap-2">
              <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold', badgeClass)}>
                {isDone ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : step.id}
              </span>
              <span className="truncate text-xs font-medium">{step.label}</span>
            </div>
          );

          return (
            <li key={step.id} className="flex-1 min-w-0" aria-current={isActive ? 'step' : undefined}>
              {step.id === 5 && proposal ? (
                <Link
                  href={proposalChatUrl(proposal)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-xl border px-2.5 py-2 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary',
                    isActive
                      ? 'border-primary/40 bg-primary/5 text-primary font-semibold'
                      : 'border-transparent text-muted-foreground hover:border-border hover:bg-muted/50'
                  )}
                >
                  {content}
                </Link>
              ) : (
                <button
                  type="button"
                  disabled={!canOpen && step.id !== 1}
                  onClick={() => {
                    if (step.id === 1) onList();
                    else if (step.id === 8) onChoose();
                    else if (step.view) onNavigate(step.view);
                  }}
                  className={cn(
                    'flex w-full items-center gap-1.5 rounded-xl border px-2.5 py-2 text-left transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary',
                    isActive
                      ? 'border-primary/40 bg-primary/5 text-primary font-semibold'
                      : 'border-transparent text-muted-foreground hover:border-border hover:bg-muted/50',
                    !canOpen && step.id !== 1 && 'cursor-not-allowed opacity-50'
                  )}
                >
                  {content}
                </button>
              )}
            </li>
          );
        })}
      </ol>

      {/* Mobile/Tablet Horizontal Scroll View (<xl) */}
      <ol className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none xl:hidden">
        {journeySteps.map((step) => {
          const isActive = step.id === active;
          const isDone = step.id < active;
          const canOpen =
            Boolean(proposal) &&
            step.id !== 1 &&
            (step.id !== 8 || canDecide(proposal!)) &&
            (step.id !== 4 || canCompare);

          const badgeClass = isActive
            ? 'bg-primary text-primary-foreground shadow-xs'
            : isDone
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-muted text-muted-foreground';

          const content = (
            <div className="flex items-center gap-2">
              <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold', badgeClass)}>
                {isDone ? <Check className="h-3 w-3 stroke-[3]" /> : step.id}
              </span>
              <span className="whitespace-nowrap text-xs font-medium">{step.label}</span>
            </div>
          );

          return (
            <li key={step.id} className="shrink-0" aria-current={isActive ? 'step' : undefined}>
              {step.id === 5 && proposal ? (
                <Link
                  href={proposalChatUrl(proposal)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-xl border px-3 py-1.5 transition-all',
                    isActive
                      ? 'border-primary/40 bg-primary/5 text-primary font-semibold'
                      : 'border-border/60 bg-muted/30 text-muted-foreground'
                  )}
                >
                  {content}
                </Link>
              ) : (
                <button
                  type="button"
                  disabled={!canOpen && step.id !== 1}
                  onClick={() => {
                    if (step.id === 1) onList();
                    else if (step.id === 8) onChoose();
                    else if (step.view) onNavigate(step.view);
                  }}
                  className={cn(
                    'flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-left transition-all',
                    isActive
                      ? 'border-primary/40 bg-primary/5 text-primary font-semibold'
                      : 'border-border/60 bg-muted/30 text-muted-foreground',
                    !canOpen && step.id !== 1 && 'cursor-not-allowed opacity-50'
                  )}
                >
                  {content}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function matchesFilter(proposal: MarketplaceProposal, filter: Filter) {
  const completed = isProjectComplete(proposal.project);
  const active =
    canDecide(proposal) ||
    proposal.status === 'draft' ||
    Boolean(proposal.revision_pending) ||
    (proposal.status === 'accepted' && !completed && proposal.project?.status !== 'cancelled');
  return (
    filter === 'all' ||
    (filter === 'completed' && completed) ||
    (filter === 'active' && active) ||
    (filter === 'closed' && !active && !completed)
  );
}

export function MarketplaceProposalsWorkspace() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const selectedId = Number(params.get('proposal')) || null;
  const requestedScreen = params.get('view') as Screen;
  const screen = screens.includes(requestedScreen) ? requestedScreen : 'summary';
  const [proposals, setProposals] = useState<MarketplaceProposal[]>([]);
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [detailAttempt, setDetailAttempt] = useState(0);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [choosing, setChoosing] = useState<MarketplaceProposal | null>(null);
  const [declining, setDeclining] = useState(false);
  const [decisionError, setDecisionError] = useState('');
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const detailHeading = useRef<HTMLHeadingElement>(null);
  const selected = proposals.find((proposal) => proposal.id === selectedId);
  const showingDetail = Boolean(selectedId) || screen === 'compare';
  const comparisonIds = (params.get('compare') || '')
    .split(',')
    .map(Number)
    .filter((id) => Number.isSafeInteger(id) && id > 0)
    .slice(0, 3);

  const updateProposal = useCallback((proposal: MarketplaceProposal) => {
    setProposals((current) =>
      current.some((item) => item.id === proposal.id)
        ? current.map((item) => (item.id === proposal.id ? proposal : item))
        : [...current, proposal]
    );
  }, []);

  const load = useCallback(async () => {
    setRefreshing(true);
    setError('');
    try {
      const response = await marketplaceProposalsApi.list();
      setProposals(response.proposals);
      setCompareIds((current) =>
        current.filter((id) => response.proposals.some((proposal) => proposal.id === id))
      );
    } catch {
      setError('Não foi possível carregar suas propostas. Confira sua conexão e tente novamente.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!selectedId) return;
    let current = true;
    setDetailLoading(true);
    setDetailError('');
    (async () => {
      try {
        const response = await marketplaceProposalsApi.get(selectedId);
        const proposal =
          response.proposal.status === 'sent'
            ? (await marketplaceProposalsApi.view(selectedId)).proposal
            : response.proposal;
        if (current) updateProposal(proposal);
      } catch {
        if (current)
          setDetailError(
            'Não foi possível abrir esta proposta. Ela pode não estar mais disponível para sua conta.'
          );
      } finally {
        if (current) setDetailLoading(false);
      }
    })();
    return () => {
      current = false;
    };
  }, [selectedId, detailAttempt, updateProposal]);

  useEffect(() => {
    if (showingDetail) detailHeading.current?.focus({ preventScroll: true });
  }, [selectedId, screen, showingDetail, detailLoading]);

  function navigate(id: number | null, view: Screen = 'summary') {
    const query = new URLSearchParams(params.toString());
    query.delete('compare');
    if (view === 'compare' && compareIds.length >= 2) {
      query.set('compare', compareIds.join(','));
    }
    if (id) query.set('proposal', String(id));
    else query.delete('proposal');
    if (view !== 'summary') query.set('view', view);
    else query.delete('view');
    const search = query.toString();
    router.push(pathname + (search ? '?' + search : ''), { scroll: false });
  }

  function openProposal(proposal: MarketplaceProposal) {
    updateProposal(proposal);
    navigate(proposal.id, proposal.status === 'accepted' ? 'project' : 'summary');
  }

  async function decide(kind: 'accept' | 'decline') {
    const proposal = kind === 'accept' ? choosing : selected;
    if (!proposal || submitting.current) return;
    if (kind === 'accept' && !proposal.version) {
      setDecisionError('A empresa ainda não publicou uma versão disponível para escolha.');
      return;
    }
    submitting.current = true;
    setBusy(true);
    setDecisionError('');
    try {
      const response =
        kind === 'accept'
          ? await marketplaceProposalsApi.accept(proposal.id, proposal.version!.id)
          : await marketplaceProposalsApi.decline(proposal.id);
      updateProposal(response.proposal);
      setChoosing(null);
      setDeclining(false);
      navigate(proposal.id, kind === 'accept' ? 'project' : 'summary');
      await load();
    } catch {
      setDecisionError(
        'Não foi possível registrar sua decisão. Atualize a proposta e tente novamente.'
      );
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  if (loading)
    return (
      <div role="status" className="mx-auto w-full max-w-[1536px] space-y-4 px-4 py-6 sm:px-6">
        <span className="sr-only">Carregando propostas…</span>
        <div className="h-10 w-64 animate-pulse rounded-lg bg-muted" />
        <div className="h-16 w-full animate-pulse rounded-2xl bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-56 animate-pulse rounded-2xl bg-muted motion-reduce:animate-none"
            />
          ))}
        </div>
      </div>
    );

  return (
    <section
      className="mx-auto w-full min-w-0 max-w-[1536px] px-4 pb-8 pt-2 text-foreground sm:px-6 lg:px-8"
      aria-label="Jornada de propostas"
    >
      <header
        className={cn(
          'mb-6 flex items-start justify-between gap-4 border-b border-border/50 pb-5',
          showingDetail && 'hidden lg:flex'
        )}
      >
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Minhas propostas
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Da solicitação ao projeto concluído. Compare propostas, converse com as empresas e acompanhe cada etapa em um só lugar.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void load()}
          disabled={refreshing}
          aria-label="Atualizar propostas"
          className="shrink-0 gap-2 font-medium"
        >
          <RefreshCw
            className={cn('h-4 w-4', refreshing && 'animate-spin motion-reduce:animate-none')}
          />
          <span>Atualizar</span>
        </Button>
      </header>

      {error && (
        <div
          role="alert"
          className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4"
        >
          <p className="text-sm font-medium text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={refreshing}>
            Tentar novamente
          </Button>
        </div>
      )}

      {(proposals.length > 0 || showingDetail) && (
        <ProposalJourneyRail
          proposal={selected}
          screen={screen}
          canCompare={compareIds.length >= 2}
          onList={() => navigate(null)}
          onNavigate={(view) => navigate(selectedId, view)}
          onChoose={() => {
            if (selected && canDecide(selected)) {
              setDecisionError('');
              setChoosing(selected);
            }
          }}
        />
      )}

      {!proposals.length && !error && !showingDetail ? (
        <div className="rounded-2xl border border-border bg-card px-6 py-16 text-center shadow-xs">
          <FileText className="mx-auto h-12 w-12 text-primary" />
          <h2 className="mt-4 text-xl font-bold">Suas propostas ficam aqui</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            Quando uma empresa responder à sua solicitação, você poderá comparar as condições e dar o próximo passo.
          </p>
          <Button asChild className="mt-6 font-semibold">
            <Link href="/companies">Encontrar empresas</Link>
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            'grid min-w-0 gap-6',
            showingDetail &&
              screen !== 'compare' &&
              'lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[380px_minmax(0,1fr)]'
          )}
        >
          <section
            aria-label="Lista de propostas"
            className={cn(
              'min-w-0 space-y-4',
              showingDetail && 'hidden lg:block',
              screen === 'compare' && 'lg:hidden'
            )}
          >
            {/* Filter Pills */}
            <div
              className="flex items-center gap-1.5 overflow-x-auto rounded-xl bg-muted/60 p-1.5 scrollbar-none"
              aria-label="Filtrar propostas"
            >
              {filters.map((item) => {
                const count = proposals.filter((p) => matchesFilter(p, item.id)).length;
                return (
                  <button
                    type="button"
                    key={item.id}
                    aria-pressed={filter === item.id}
                    onClick={() => setFilter(item.id)}
                    className={cn(
                      'flex min-h-9 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-xs font-semibold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary',
                      filter === item.id
                        ? 'bg-card text-primary shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <span>{item.label}</span>
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
                        filter === item.id
                          ? 'bg-primary/10 text-primary'
                          : 'bg-background/80 text-muted-foreground'
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Proposal Cards Grid */}
            <div
              className={cn(
                'grid gap-4',
                !showingDetail &&
                  'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4'
              )}
            >
              {proposals
                .filter((proposal) => matchesFilter(proposal, filter))
                .map((proposal) => {
                  const displayPrice = getProposalDisplayPrice(proposal);
                  const location = getProposalLocation(proposal);
                  const metrics = getProposalCardMetrics(proposal);
                  const isSelected = selectedId === proposal.id;

                  return (
                    <article
                      key={proposal.id}
                      className={cn(
                        'group relative flex flex-col justify-between rounded-2xl border bg-card p-4 transition-all duration-200',
                        isSelected
                          ? 'border-primary ring-2 ring-primary/20 shadow-sm'
                          : 'border-border/80 hover:border-primary/50 hover:shadow-md'
                      )}
                    >
                      <button
                        type="button"
                        aria-label={'Abrir proposta de ' + proposal.company.name}
                        onClick={() => openProposal(proposal)}
                        className="w-full min-w-0 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                      >
                        {/* Header: Logo, Company Name, Status */}
                        <div className="flex items-start gap-3">
                          <CompanyMark proposal={proposal} />
                          <div className="min-w-0 flex-1">
                            <span className="block truncate font-bold text-foreground group-hover:text-primary transition-colors">
                              {proposal.company.name}
                            </span>
                            <span className="mt-0.5 block text-xs font-mono text-muted-foreground">
                              {proposal.reference}
                            </span>
                          </div>
                          <StatusBadge proposal={proposal} />
                        </div>

                        {/* Location & Request context */}
                        {location !== 'Não informado' && (
                          <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                            <span className="truncate">{location}</span>
                          </div>
                        )}

                        {/* Display Price Highlight */}
                        <div className="mt-4 rounded-xl bg-muted/40 p-3 border border-border/40">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Valor total
                          </span>
                          <span
                            className={cn(
                              'mt-0.5 block font-bold tabular-nums',
                              displayPrice.isAvailable
                                ? 'text-lg sm:text-xl text-primary'
                                : 'text-sm text-muted-foreground font-normal'
                            )}
                          >
                            {displayPrice.formatted}
                          </span>
                        </div>

                        {/* Technical Metrics Summary (Only if version.terms available) */}
                        {metrics.length > 0 && (
                          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border/50 pt-3">
                            {metrics.map((m) => (
                              <div key={m.key} className="min-w-0">
                                <span className="block truncate text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                  {m.label}
                                </span>
                                <span className="block truncate text-xs font-semibold text-foreground">
                                  {m.value}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Updated timestamp */}
                        <span className="mt-3 block text-[11px] text-muted-foreground">
                          Atualizada em{' '}
                          {formatDate(
                            proposal.version?.published_at ||
                              proposal.published_at ||
                              proposal.created_at
                          )}
                        </span>
                      </button>

                      {/* Card Footer: Compare Checkbox */}
                      {proposal.version ? (
                        <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                          <label className="flex min-h-11 cursor-pointer items-center gap-2 text-xs font-semibold text-foreground select-none">
                            <input
                              type="checkbox"
                              checked={compareIds.includes(proposal.id)}
                              onChange={(event) => {
                                event.stopPropagation();
                                if (!event.currentTarget.checked) {
                                  setNotice('');
                                  setCompareIds((current) =>
                                    current.filter((id) => id !== proposal.id)
                                  );
                                  return;
                                }
                                if (compareIds.length >= 3 && !compareIds.includes(proposal.id)) {
                                  setNotice(
                                    'Você pode comparar até 3 propostas. Desmarque uma para incluir outra.'
                                  );
                                  return;
                                }
                                setNotice('');
                                setCompareIds((current) =>
                                  current.includes(proposal.id) ? current : [...current, proposal.id]
                                );
                              }}
                              aria-label={'Comparar proposta de ' + proposal.company.name}
                              className="h-4 w-4 rounded border-border text-primary focus:ring-primary accent-primary"
                            />
                            <span>Comparar</span>
                          </label>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openProposal(proposal)}
                            className="h-8 gap-1 text-xs font-semibold text-primary hover:text-primary"
                          >
                            <span>Ver detalhes</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <p className="mt-4 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                          A empresa recebeu sua solicitação e está preparando as condições.
                        </p>
                      )}
                    </article>
                  );
                })}
            </div>

            {!proposals.some((proposal) => matchesFilter(proposal, filter)) && (
              <p
                role="status"
                className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground"
              >
                Nenhuma proposta neste status.
              </p>
            )}

            {notice && (
              <p role="status" className="text-xs font-medium text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                {notice}
              </p>
            )}

            {/* Sticky Compare Floating Bar */}
            <div className="sticky bottom-[calc(var(--reviewer-mobile-nav-height,64px)+0.75rem+env(safe-area-inset-bottom,0px))] rounded-2xl border border-border bg-card/95 p-3.5 shadow-xl backdrop-blur-md lg:bottom-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground">
                    Comparar propostas ({compareIds.length})
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Selecione de 2 a 3 propostas.
                  </p>
                </div>
                <Button
                  disabled={compareIds.length < 2}
                  size="sm"
                  className="shrink-0 font-semibold gap-1.5"
                  onClick={() => {
                    const query = new URLSearchParams(params.toString());
                    query.delete('proposal');
                    query.set('view', 'compare');
                    query.set('compare', compareIds.join(','));
                    router.push(pathname + '?' + query.toString(), { scroll: false });
                  }}
                >
                  <GitCompareArrows className="h-4 w-4" />
                  <span>Abrir comparação</span>
                </Button>
              </div>
            </div>
          </section>

          {/* Proposal Detail Workspace Pane */}
          {showingDetail && (
            <section className="min-w-0 rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-2 border-b border-border/50 pb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-2 font-semibold text-muted-foreground hover:text-foreground"
                  onClick={() =>
                    navigate(
                      screen === 'summary' || screen === 'complete' || screen === 'compare'
                        ? null
                        : selectedId
                    )
                  }
                >
                  <ArrowLeft className="mr-1.5 h-4 w-4" />
                  {screen === 'summary' || screen === 'complete' || screen === 'compare'
                    ? 'Minhas propostas'
                    : 'Voltar'}
                </Button>
                {selectedId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={detailLoading}
                    onClick={() => setDetailAttempt((value) => value + 1)}
                    aria-label="Atualizar proposta"
                  >
                    <RefreshCw className={cn('h-4 w-4', detailLoading && 'animate-spin')} />
                  </Button>
                )}
              </div>

              <h2
                ref={detailHeading}
                tabIndex={-1}
                className="text-xl font-bold tracking-tight outline-none sm:text-2xl"
              >
                {screenTitles[screen]}
              </h2>

              {screen === 'compare' ? (
                <div className="mt-5">
                  <ProposalComparison
                    ids={comparisonIds}
                    onOpen={openProposal}
                    onChoose={(proposal) => {
                      setDecisionError('');
                      setChoosing(proposal);
                    }}
                  />
                </div>
              ) : detailLoading ? (
                <p role="status" className="py-12 text-center text-sm text-muted-foreground">
                  Carregando os detalhes da proposta…
                </p>
              ) : detailError ? (
                <div role="alert" className="mt-4 space-y-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                  <p className="text-sm text-destructive font-medium">{detailError}</p>
                  <Button variant="outline" size="sm" onClick={() => setDetailAttempt((value) => value + 1)}>
                    Tentar novamente
                  </Button>
                </div>
              ) : selected ? (
                <>
                  <div className="my-5 flex flex-wrap items-center gap-3 border-b border-border pb-5">
                    <CompanyMark proposal={selected} />
                    <div className="min-w-0 flex-1">
                      <h3 className="break-words font-bold text-foreground">{selected.company.name}</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground font-mono">
                        {selected.reference}
                        {selected.request?.city ? ' · ' + selected.request.city : ''}
                        {selected.request?.state ? ', ' + selected.request.state : ''}
                      </p>
                    </div>
                    <StatusBadge proposal={selected} />
                  </div>

                  {(screen === 'summary' || screen === 'complete') && (
                    <ProposalSummary
                      key={`${selected.id}-${screen}`}
                      proposal={selected}
                      initialTab={screen === 'complete' ? 'complete' : 'summary'}
                      onMeeting={() => navigate(selected.id, 'meeting')}
                      onChoose={() => {
                        setDecisionError('');
                        setChoosing(selected);
                      }}
                      onNegotiate={() => navigate(selected.id, 'negotiation')}
                      onProject={() => navigate(selected.id, 'project')}
                    />
                  )}
                  {screen === 'meeting' &&
                    (canDecide(selected) || selected.status === 'accepted' ? (
                      <ProposalMeeting
                        key={selected.id}
                        proposal={selected}
                        onSaved={(meeting) =>
                          updateProposal({
                            ...selected,
                            status:
                              selected.status === 'accepted' ? 'accepted' : 'meeting_scheduled',
                            meetings: [meeting, ...(selected.meetings || [])],
                          })
                        }
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground py-6">
                        Esta proposta não permite novos agendamentos.
                      </p>
                    ))}
                  {screen === 'negotiation' && (
                    <ProposalNegotiation
                      key={selected.id}
                      proposal={selected}
                      onUpdated={updateProposal}
                      onChoose={() => {
                        setDecisionError('');
                        setChoosing(selected);
                      }}
                    />
                  )}
                  {screen === 'project' && (
                    <ProposalProject
                      key={selected.id}
                      proposal={selected}
                      onViewProposal={() => navigate(selected.id)}
                    />
                  )}
                  {screen === 'summary' && (
                    <div className="mt-6 flex flex-wrap gap-3 border-t border-border pt-4">
                      <Button variant="outline" size="sm" onClick={() => navigate(selected.id, 'negotiation')}>
                        Histórico de versões
                      </Button>
                      {canDecide(selected) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            setDecisionError('');
                            setDeclining(true);
                          }}
                        >
                          Recusar proposta
                        </Button>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">Proposta não encontrada.</p>
              )}
            </section>
          )}
        </div>
      )}

      {/* Decision Dialog */}
      <Dialog
        open={Boolean(choosing) || declining}
        onOpenChange={(open) => {
          if (!open && !busy) {
            setChoosing(null);
            setDeclining(false);
            setDecisionError('');
          }
        }}
      >
        <DialogContent
          className="w-[calc(100%-2rem)] max-w-md px-5 py-6 motion-reduce:animate-none"
          onEscapeKeyDown={(event) => {
            if (busy) event.preventDefault();
          }}
          onPointerDownOutside={(event) => {
            if (busy) event.preventDefault();
          }}
        >
          <CheckCircle2 className="h-12 w-12 text-primary" />
          <DialogTitle>{declining ? 'Recusar esta proposta?' : 'Confirmar interesse?'}</DialogTitle>
          <DialogDescription>
            {declining
              ? 'A proposta será encerrada para você. Para retomar, será necessário conversar com a empresa.'
              : 'Você deseja avançar com a proposta da ' + choosing?.company.name + '?'}
          </DialogDescription>
          {!declining && choosing && (
            <>
              <p className="text-2xl font-bold tabular-nums text-primary">
                {formatMoney(
                  choosing.version?.total_cents ?? choosing.total_cents,
                  choosing.currency
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                A escolha sinaliza seu interesse em prosseguir. O contrato e o pagamento continuam sendo definidos diretamente com a empresa.
              </p>
              <p className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 border border-amber-200">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                As outras propostas desta mesma solicitação serão marcadas como não escolhidas.
              </p>
            </>
          )}
          {decisionError && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {decisionError}
            </p>
          )}
          <Button disabled={busy} onClick={() => void decide(declining ? 'decline' : 'accept')}>
            {busy ? 'Registrando…' : declining ? 'Recusar proposta' : 'Confirmar interesse'}
          </Button>
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => {
              setChoosing(null);
              setDeclining(false);
            }}
          >
            Voltar
          </Button>
        </DialogContent>
      </Dialog>
    </section>
  );
}
