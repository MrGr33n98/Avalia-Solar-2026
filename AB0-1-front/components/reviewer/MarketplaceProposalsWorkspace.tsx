'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileText,
  GitCompareArrows,
  Info,
  LayoutGrid,
  MapPin,
  MessageCircle,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Table,
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
  getProposalRawTerm,
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
type PeriodFilter = 'all' | '30d' | '6m' | '12m';
type SortOption = 'recent' | 'oldest' | 'highest' | 'lowest';
type ViewLayout = 'cards' | 'table';

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

      {/* Scrollable Step Rail (no text overlap across all screen sizes) */}
      <ol className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
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
              <span className="whitespace-nowrap text-xs font-semibold">{step.label}</span>
            </div>
          );

          return (
            <li key={step.id} className="shrink-0" aria-current={isActive ? 'step' : undefined}>
              {step.id === 5 && proposal ? (
                <Link
                  href={proposalChatUrl(proposal)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-xl border px-3 py-2 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary',
                    isActive
                      ? 'border-primary/40 bg-primary/5 text-primary font-semibold'
                      : 'border-border/60 bg-card text-muted-foreground hover:border-border hover:bg-muted/50'
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
                    'flex items-center gap-1.5 rounded-xl border px-3 py-2 text-left transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary',
                    isActive
                      ? 'border-primary/40 bg-primary/5 text-primary font-semibold'
                      : 'border-border/60 bg-card text-muted-foreground hover:border-border hover:bg-muted/50',
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
  const [searchQuery, setSearchQuery] = useState('');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [viewLayout, setViewLayout] = useState<ViewLayout>('cards');
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
            {/* Top Toolbar (Search, Status Filter, Period Filter, Advanced Filters) */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search Box */}
              <div className="relative min-w-[240px] flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar propostas, empresas ou tecnologias..."
                  className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Status Select */}
              <div className="relative">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as Filter)}
                  className="h-10 appearance-none rounded-xl border border-border bg-card pl-3 pr-8 text-xs font-semibold text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="all">Todos os status</option>
                  <option value="active">Em andamento</option>
                  <option value="completed">Concluídas</option>
                  <option value="closed">Encerradas</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>

              {/* Period Select */}
              <div className="relative">
                <select
                  value={periodFilter}
                  onChange={(e) => setPeriodFilter(e.target.value as PeriodFilter)}
                  className="h-10 appearance-none rounded-xl border border-border bg-card pl-3 pr-8 text-xs font-semibold text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="all">Todos os períodos</option>
                  <option value="30d">Últimos 30 dias</option>
                  <option value="6m">Últimos 6 meses</option>
                  <option value="12m">Últimos 12 meses</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>

              {/* Filters Button */}
              <Button
                variant="outline"
                size="sm"
                className="h-10 gap-1.5 rounded-xl text-xs font-semibold"
                onClick={() => {
                  /* Drawer toggle / resetting filters if active */
                  if (filter !== 'all' || searchQuery || periodFilter !== 'all') {
                    setFilter('all');
                    setSearchQuery('');
                    setPeriodFilter('all');
                  }
                }}
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span>Filtros</span>
              </Button>
            </div>

            {/* Status Tabs with Counts */}
            <div className="flex items-center justify-between gap-3 flex-wrap border-b border-border/50 pb-3 pt-1">
              <div
                className="flex items-center gap-1.5 overflow-x-auto rounded-xl bg-muted/60 p-1.5 scrollbar-none"
                aria-label="Filtrar propostas por status"
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

              {/* Layout Toggle (Cards / Tabela) & Sort Dropdown */}
              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-xl border border-border bg-card p-1">
                  <button
                    type="button"
                    onClick={() => setViewLayout('cards')}
                    aria-label="Visualização em Cards"
                    className={cn(
                      'flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all',
                      viewLayout === 'cards'
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Cards</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewLayout('table')}
                    aria-label="Visualização em Tabela"
                    className={cn(
                      'flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all',
                      viewLayout === 'table'
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Table className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Tabela</span>
                  </button>
                </div>

                {/* Sort dropdown */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="h-9 appearance-none rounded-xl border border-border bg-card pl-3 pr-7 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="recent">Mais recentes</option>
                    <option value="oldest">Mais antigas</option>
                    <option value="highest">Maior valor</option>
                    <option value="lowest">Menor valor</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
            </div>

            {/* Proposal Rendering (Cards or Table) */}
            {(() => {
              const displayProposals = proposals
                .filter((proposal) => matchesFilter(proposal, filter))
                .filter((proposal) => {
                  if (!searchQuery.trim()) return true;
                  const query = searchQuery.toLowerCase();
                  const company = proposal.company.name.toLowerCase();
                  const ref = proposal.reference.toLowerCase();
                  const city = (proposal.company.city || '').toLowerCase();
                  const state = (proposal.company.state || '').toLowerCase();
                  return company.includes(query) || ref.includes(query) || city.includes(query) || state.includes(query);
                })
                .filter((proposal) => {
                  if (periodFilter === 'all') return true;
                  const date = new Date(proposal.created_at || proposal.published_at || Date.now());
                  const now = new Date();
                  const diffDays = (now.getTime() - date.getTime()) / (1000 * 3600 * 24);
                  if (periodFilter === '30d') return diffDays <= 30;
                  if (periodFilter === '6m') return diffDays <= 180;
                  if (periodFilter === '12m') return diffDays <= 365;
                  return true;
                })
                .sort((a, b) => {
                  if (sortBy === 'oldest') {
                    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                  }
                  if (sortBy === 'highest') {
                    return (b.total_cents || 0) - (a.total_cents || 0);
                  }
                  if (sortBy === 'lowest') {
                    return (a.total_cents || 0) - (b.total_cents || 0);
                  }
                  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                });

              if (!displayProposals.length) {
                return (
                  <p
                    role="status"
                    className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground"
                  >
                    Nenhuma proposta encontrada para os filtros selecionados.
                  </p>
                );
              }

              if (viewLayout === 'table') {
                return (
                  <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-border/60 bg-muted/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3">Empresa</th>
                          <th className="px-4 py-3">Referência</th>
                          <th className="px-4 py-3">Localização</th>
                          <th className="px-4 py-3">Valor total</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {displayProposals.map((proposal) => {
                          const displayPrice = getProposalDisplayPrice(proposal);
                          const location = getProposalLocation(proposal);
                          return (
                            <tr key={proposal.id} className="hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-3 font-semibold text-foreground">
                                <div className="flex items-center gap-2">
                                  <CompanyMark proposal={proposal} />
                                  <span>{proposal.company.name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 font-mono text-muted-foreground">
                                {proposal.reference}
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">{location}</td>
                              <td className="px-4 py-3 font-bold tabular-nums text-primary">
                                {displayPrice.formatted}
                              </td>
                              <td className="px-4 py-3">
                                <StatusBadge proposal={proposal} />
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openProposal(proposal)}
                                    className="h-8 text-xs font-semibold"
                                  >
                                    Ver detalhes
                                  </Button>
                                  <Button
                                    asChild
                                    size="sm"
                                    className="h-8 gap-1 text-xs font-semibold"
                                  >
                                    <Link href={proposalChatUrl(proposal)}>
                                      <MessageCircle className="h-3.5 w-3.5" />
                                      <span>Conversar</span>
                                    </Link>
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              }

              return (
                <div
                  className={cn(
                    'grid gap-4',
                    !showingDetail &&
                      'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4'
                  )}
                >
                  {displayProposals.map((proposal) => {
                    const displayPrice = getProposalDisplayPrice(proposal);
                    const location = getProposalLocation(proposal);
                    const isSelected = selectedId === proposal.id;

                    const powerVal = getProposalRawTerm(proposal, ['system_power', 'power_kwp', 'installed_power', 'potencia']) || 'Não inf.';
                    const genVal = getProposalRawTerm(proposal, ['monthly_generation', 'generation_kwh', 'estimated_generation', 'geracao']) || 'Não inf.';

                    // Default cover image or company banner/logo
                    const coverImage =
                      (proposal.company as { banner_url?: string | null }).banner_url ||
                      '/energia-solar-avalia-solar.webp';

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
                        <div className="w-full min-w-0">
                          {/* Top Header: Logo, Company Name, Reference, Received Date, Status Badge */}
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <CompanyMark proposal={proposal} />
                              <div className="min-w-0">
                                <span className="block truncate font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                                  {proposal.company.name}
                                </span>
                                <span className="block truncate text-[11px] font-mono text-muted-foreground">
                                  Proposta {proposal.reference}
                                </span>
                                <span className="block truncate text-[10px] text-muted-foreground">
                                  Recebida em {formatDate(proposal.published_at || proposal.created_at)}
                                </span>
                              </div>
                            </div>
                            <StatusBadge proposal={proposal} />
                          </div>

                          {/* Cover Image Preview (16:9 ratio with rounded corners) */}
                          <button
                            type="button"
                            onClick={() => openProposal(proposal)}
                            aria-label={'Ver proposta de ' + proposal.company.name}
                            className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-muted/60 border border-border/40 my-2 block focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary group-hover:opacity-95 transition-opacity"
                          >
                            <img
                              src={coverImage}
                              alt=""
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                            <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white">
                              <span className="text-xs font-semibold drop-shadow-xs">
                                {proposal.version?.title || 'Sistema Residencial'}
                              </span>
                              <span className="text-[10px] font-medium bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-full border border-white/20">
                                {proposal.request?.project_profile || 'Residencial'}
                              </span>
                            </div>
                          </button>

                          {/* 3-Column Metrics Grid (Potência, Geração estimada, Valor total) */}
                          <div className="my-3 grid grid-cols-3 gap-1.5 rounded-xl border border-border/60 bg-muted/30 p-2 text-center">
                            {/* Col 1: Potência */}
                            <div className="min-w-0 px-1 border-r border-border/40">
                              <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Potência
                              </span>
                              <span className="mt-0.5 block truncate text-xs font-bold text-foreground">
                                {powerVal}
                              </span>
                            </div>

                            {/* Col 2: Geração estimada */}
                            <div className="min-w-0 px-1 border-r border-border/40">
                              <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Geração est.
                              </span>
                              <span className="mt-0.5 block truncate text-xs font-bold text-foreground">
                                {genVal}
                              </span>
                            </div>

                            {/* Col 3: Valor total */}
                            <div className="min-w-0 px-1">
                              <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Valor total
                              </span>
                              <span
                                className={cn(
                                  'mt-0.5 block truncate text-xs font-bold tabular-nums',
                                  displayPrice.isAvailable ? 'text-primary' : 'text-muted-foreground'
                                )}
                              >
                                {displayPrice.formatted}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Card Footer: Action Buttons (Ver detalhes & Conversar) + Compare toggle */}
                        <div className="mt-2 space-y-2 border-t border-border/60 pt-3">
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              size="sm"
                              onClick={() => openProposal(proposal)}
                              className="h-9 w-full gap-1 rounded-xl text-xs font-semibold shadow-xs"
                            >
                              <span>Ver detalhes</span>
                            </Button>
                            {proposal.version ? (
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="h-9 w-full gap-1 rounded-xl text-xs font-semibold"
                              >
                                <Link href={proposalChatUrl(proposal)}>
                                  <MessageCircle className="h-3.5 w-3.5" />
                                  <span>Conversar</span>
                                </Link>
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openProposal(proposal)}
                                className="h-9 w-full gap-1 rounded-xl text-xs font-semibold"
                              >
                                <span>Acompanhar</span>
                              </Button>
                            )}
                          </div>

                          {proposal.version && (
                            <div className="flex items-center justify-between pt-1">
                              <label className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground cursor-pointer select-none">
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
                                  className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary accent-primary"
                                />
                                <span>Comparar proposta</span>
                              </label>
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              );
            })()}

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
                    onRemoveId={(idToRemove) => {
                      const newIds = compareIds.filter((id) => id !== idToRemove);
                      setCompareIds(newIds);
                      const query = new URLSearchParams(params.toString());
                      if (newIds.length) {
                        query.set('compare', newIds.join(','));
                      } else {
                        query.delete('compare');
                        query.delete('view');
                      }
                      router.push(pathname + '?' + query.toString(), { scroll: false });
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
