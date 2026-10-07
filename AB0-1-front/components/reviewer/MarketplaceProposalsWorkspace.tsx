'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  GitCompareArrows,
  Info,
  RefreshCw,
} from 'lucide-react';
import { marketplaceProposalsApi, type MarketplaceProposal } from '@/lib/api';
import {
  canDecide,
  formatDate,
  formatMoney,
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
  return (
    <nav
      aria-label="Fluxo da proposta"
      className="mb-5 overflow-hidden rounded-[1.25rem] border border-[hsl(var(--dashboard-border))] bg-card/95 p-3 shadow-sm sm:p-4"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
            Jornada da proposta
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {proposal ? `Etapa ${active} de 10` : 'Acompanhe tudo em um só lugar'}
          </p>
        </div>
        <span className="hidden rounded-full bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary sm:inline-flex">
          PWA + web
        </span>
      </div>
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {journeySteps.map((step) => {
          const isActive = step.id === active;
          const isDone = step.id < active;
          const canOpen =
            Boolean(proposal) &&
            step.id !== 1 &&
            (step.id !== 8 || canDecide(proposal!)) &&
            (step.id !== 4 || canCompare);
          const content = (
            <>
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : isDone
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-muted text-muted-foreground'
                )}
              >
                {isDone ? '✓' : step.id}
              </span>
              <span className="min-w-0 truncate text-left text-[11px] font-medium sm:text-xs">
                {step.label}
              </span>
            </>
          );
          return (
            <li key={step.id}>
              {step.id === 5 && proposal ? (
                <Link
                  href={proposalChatUrl(proposal)}
                  className={cn(
                    'flex min-h-11 min-w-0 items-center gap-2 rounded-xl border px-2 py-2 text-muted-foreground transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary',
                    isActive
                      ? 'border-primary/30 bg-primary/5 text-primary'
                      : 'border-transparent hover:border-border hover:bg-muted'
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
                    'flex min-h-11 w-full min-w-0 items-center gap-2 rounded-xl border px-2 py-2 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary',
                    isActive
                      ? 'border-primary/30 bg-primary/5 text-primary'
                      : 'border-transparent text-muted-foreground hover:border-border hover:bg-muted',
                    !canOpen && step.id !== 1 && 'cursor-not-allowed opacity-60'
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
      // A escolha encerra as propostas concorrentes da mesma solicitação no servidor.
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
      <div role="status" className="space-y-4 py-5">
        <span className="sr-only">Carregando propostas…</span>
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-28 animate-pulse rounded-2xl bg-muted motion-reduce:animate-none"
          />
        ))}
      </div>
    );

  return (
    <section
      className="mx-auto w-full min-w-0 max-w-7xl pb-6 text-foreground"
      aria-label="Jornada de propostas"
    >
      <header
        className={cn(
          'mb-6 flex items-start justify-between gap-3',
          showingDetail && 'hidden lg:flex'
        )}
      >
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Minhas propostas</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Da primeira conversa ao projeto concluído. Compare e acompanhe tudo por aqui.
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => void load()}
          disabled={refreshing}
          aria-label="Atualizar propostas"
        >
          <RefreshCw
            className={cn('h-4 w-4', refreshing && 'animate-spin motion-reduce:animate-none')}
          />
        </Button>
      </header>
      {error && (
        <div
          role="alert"
          className="mb-4 space-y-3 rounded-xl border border-destructive/30 bg-card p-4"
        >
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" onClick={() => void load()} disabled={refreshing}>
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
        <div className="rounded-[1.25rem] border border-[hsl(var(--dashboard-border))] bg-card px-5 py-12 text-center shadow-sm">
          <FileText className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-4 text-lg font-semibold">Suas propostas ficam aqui</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Quando uma empresa responder à sua solicitação, você poderá comparar as condições e dar
            o próximo passo.
          </p>
          <Button asChild className="mt-6">
            <Link href="/companies">Encontrar empresas</Link>
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            'grid min-w-0 gap-5',
            showingDetail &&
              screen !== 'compare' &&
              'lg:grid-cols-[minmax(260px,0.75fr)_minmax(0,1.4fr)]'
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
            <div
              className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1 sm:grid-cols-4 lg:grid-cols-2"
              aria-label="Filtrar propostas"
            >
              {filters.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  aria-pressed={filter === item.id}
                  onClick={() => setFilter(item.id)}
                  className={cn(
                    'min-h-11 whitespace-nowrap rounded-lg px-2 text-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary',
                    filter === item.id
                      ? 'bg-card text-primary shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {item.label}{' '}
                  <span className="ml-1 tabular-nums">
                    {proposals.filter((p) => matchesFilter(p, item.id)).length}
                  </span>
                </button>
              ))}
            </div>
            <div className={cn('grid gap-3', !showingDetail && 'md:grid-cols-2 xl:grid-cols-3')}>
              {proposals
                .filter((proposal) => matchesFilter(proposal, filter))
                .map((proposal) => (
                  <article
                    key={proposal.id}
                    className={cn(
                      'min-w-0 rounded-[1.1rem] border bg-card p-4 shadow-sm transition-[border-color,box-shadow,transform] duration-200',
                      selectedId === proposal.id
                        ? 'border-primary shadow-md'
                        : 'border-[hsl(var(--dashboard-border))] hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md'
                    )}
                  >
                    <button
                      type="button"
                      aria-label={'Abrir proposta de ' + proposal.company.name}
                      onClick={() => openProposal(proposal)}
                      className="w-full min-w-0 rounded-lg text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                    >
                      <span className="flex items-start gap-3">
                        <CompanyMark proposal={proposal} />
                        <span className="min-w-0 flex-1">
                          <span className="block break-words font-semibold">
                            {proposal.company.name}
                          </span>
                          <span className="mt-1 block text-xs text-muted-foreground">
                            {proposal.reference}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          <StatusBadge proposal={proposal} />
                          <ArrowRight className="mt-1 h-4 w-4 text-muted-foreground" />
                        </span>
                      </span>
                      <span className="mt-4 block text-lg font-bold tabular-nums text-primary sm:text-xl">
                        {proposal.version
                          ? formatMoney(proposal.version.total_cents, proposal.currency)
                          : 'Aguardando empresa'}
                      </span>
                      {proposal.request?.city && (
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {proposal.request.city}
                          {proposal.request.state ? `, ${proposal.request.state}` : ''}
                        </span>
                      )}
                      <span className="mt-2 block text-xs text-muted-foreground">
                        Atualizada em{' '}
                        {formatDate(
                          proposal.version?.published_at ||
                            proposal.published_at ||
                            proposal.created_at
                        )}
                      </span>
                    </button>
                    {proposal.version ? (
                      <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-2 border-t border-border pt-3 text-xs font-medium text-muted-foreground">
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
                          className="h-4 w-4 accent-primary"
                        />
                        Comparar proposta
                      </label>
                    ) : (
                      <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
                        A empresa recebeu sua solicitação e está preparando as condições.
                      </p>
                    )}
                  </article>
                ))}
            </div>
            {!proposals.some((proposal) => matchesFilter(proposal, filter)) && (
              <p
                role="status"
                className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground"
              >
                Nenhuma proposta neste status.
              </p>
            )}
            {notice && (
              <p role="status" className="text-sm text-muted-foreground">
                {notice}
              </p>
            )}
            <div className="sticky bottom-[calc(var(--reviewer-mobile-nav-height,64px)+0.5rem)] rounded-[1.1rem] border border-[hsl(var(--dashboard-border))] bg-card/95 p-3 shadow-lg backdrop-blur lg:bottom-4">
              <Button
                disabled={compareIds.length < 2}
                className="w-full"
                onClick={() => {
                  const query = new URLSearchParams(params.toString());
                  query.delete('proposal');
                  query.set('view', 'compare');
                  query.set('compare', compareIds.join(','));
                  router.push(pathname + '?' + query.toString(), { scroll: false });
                }}
              >
                <GitCompareArrows className="mr-2 h-4 w-4" />
                Comparar selecionadas ({compareIds.length})
              </Button>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Selecione de 2 a 3 propostas.
              </p>
            </div>
          </section>
          {showingDetail && (
            <section className="min-w-0 rounded-[1.25rem] border border-[hsl(var(--dashboard-border))] bg-card p-4 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-2">
                <Button
                  variant="ghost"
                  className="-ml-3"
                  onClick={() =>
                    navigate(
                      screen === 'summary' || screen === 'complete' || screen === 'compare'
                        ? null
                        : selectedId
                    )
                  }
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
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
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <h2
                ref={detailHeading}
                tabIndex={-1}
                className="text-xl font-semibold tracking-tight outline-none"
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
                <p role="status" className="py-10 text-sm text-muted-foreground">
                  Carregando os detalhes da proposta…
                </p>
              ) : detailError ? (
                <div role="alert" className="mt-4 space-y-4">
                  <p className="text-sm text-destructive">{detailError}</p>
                  <Button variant="outline" onClick={() => setDetailAttempt((value) => value + 1)}>
                    Tentar novamente
                  </Button>
                </div>
              ) : selected ? (
                <>
                  <div className="my-5 flex flex-wrap items-center gap-3 border-b border-border pb-5">
                    <CompanyMark proposal={selected} />
                    <div className="min-w-0 flex-1">
                      <h3 className="break-words font-semibold">{selected.company.name}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
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
                      <p className="text-sm text-muted-foreground">
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
                      <Button variant="ghost" onClick={() => navigate(selected.id, 'negotiation')}>
                        Histórico de versões
                      </Button>
                      {canDecide(selected) && (
                        <Button
                          variant="ghost"
                          className="text-muted-foreground"
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
              <p className="text-2xl font-semibold tabular-nums text-primary">
                {formatMoney(
                  choosing.version?.total_cents ?? choosing.total_cents,
                  choosing.currency
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                A escolha sinaliza seu interesse em prosseguir. O contrato e o pagamento continuam
                sendo definidos diretamente com a empresa.
              </p>
              <p className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                As outras propostas desta mesma solicitação serão marcadas como não escolhidas.
              </p>
            </>
          )}
          {decisionError && (
            <p role="alert" className="text-sm text-destructive">
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
