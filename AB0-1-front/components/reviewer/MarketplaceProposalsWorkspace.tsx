'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  BarChart2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  DollarSign,
  FileText,
  GitCompareArrows,
  Grid,
  Info,
  LayoutGrid,
  Lightbulb,
  MessageCircle,
  MessageSquare,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Table,
  Zap,
  AlertCircle,
} from 'lucide-react';
import { marketplaceProposalsApi, type MarketplaceProposal } from '@/lib/api';
import {
  canDecide,
  formatDate,
  formatMoney,
  getProposalDisplayPrice,
  getProposalLocation,
  getProposalRawTerm,
  isProjectComplete,
  proposalChatUrl,
  formatRelativeDay,
  getProposalSolutionLabel,
  isProposalActive,
  isProposalAwaiting,
  isProposalCompleted,
  isProposalReceived,
} from '@/lib/marketplace-proposals';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { CompanyMark, ProposalSummary, StatusBadge } from './proposals/ProposalSummary';
import { ProposalComparison } from './proposals/ProposalComparison';
import { ProposalMeeting } from './proposals/ProposalMeeting';
import { ProposalNegotiation } from './proposals/ProposalNegotiation';
import { ProposalProject } from './proposals/ProposalProject';
import { ProposalConversation } from './proposals/ProposalConversation';
import { ProposalChoose } from './proposals/ProposalChoose';

type Screen =
  | 'summary'
  | 'complete'
  | 'meeting'
  | 'negotiation'
  | 'project'
  | 'compare'
  | 'conversation'
  | 'choose';
type Filter = 'all' | 'active' | 'received' | 'completed';
type SortOption = 'recent' | 'oldest' | 'highest' | 'lowest';
type ViewLayout = 'cards' | 'table';

const screens: Screen[] = [
  'summary',
  'complete',
  'meeting',
  'negotiation',
  'project',
  'compare',
  'conversation',
  'choose',
];
const screenTitles: Record<Screen, string> = {
  summary: 'Detalhes da proposta',
  complete: 'Proposta completa',
  meeting: 'Agendar reunião',
  negotiation: 'Negociação da proposta',
  project: 'Acompanhamento do projeto',
  compare: 'Comparar propostas',
  conversation: 'Conversa com a empresa',
  choose: 'Escolher proposta',
};

const filterTabs: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'active', label: 'Em andamento' },
  { id: 'received', label: 'Recebidas' },
  { id: 'completed', label: 'Concluídas' },
];

const journeySteps = [
  { id: 1, label: 'Minhas propostas' },
  { id: 2, label: 'Detalhes', view: 'summary' as Screen },
  { id: 3, label: 'Proposta completa', view: 'complete' as Screen },
  { id: 4, label: 'Comparar', view: 'compare' as Screen },
  { id: 5, label: 'Conversa', view: 'conversation' as Screen },
  { id: 6, label: 'Reunião', view: 'meeting' as Screen },
  { id: 7, label: 'Negociação', view: 'negotiation' as Screen },
  { id: 8, label: 'Escolher', view: 'choose' as Screen },
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

/**
 * Rail de navegação da jornada mantido no mobile ou em tela de detalhe
 * para garantir compatibilidade com o fluxo de 10 passos do projeto.
 */
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
      className="mb-6 w-full max-w-full overflow-hidden rounded-2xl border border-slate-800 bg-[#0B132B] p-4 text-white shadow-md sm:p-5"
    >
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Jornada da proposta
            </h2>
          </div>
          <p className="text-xs font-medium text-slate-300 mt-0.5">
            Página {active} de 10 — {activeStepObj.label} (visão geral)
          </p>
        </div>
        <span className="hidden shrink-0 rounded-full bg-blue-500/20 border border-blue-400/30 px-3 py-1 text-[11px] font-bold text-blue-300 sm:inline-flex">
          10 Passos do Projeto
        </span>
      </div>

      <div className="w-full max-w-full overflow-x-auto pb-1 pt-0.5 scrollbar-none">
        <ol className="flex items-center gap-2 min-w-max">
          {journeySteps.map((step) => {
            const isActive = step.id === active;
            const isDone = step.id < active;
            const canOpen =
              Boolean(proposal) &&
              step.id !== 1 &&
              (step.id !== 8 || canDecide(proposal!)) &&
              (step.id !== 4 || canCompare);

            const badgeClass = isActive
              ? 'bg-blue-600 text-white font-extrabold shadow-sm ring-2 ring-blue-400/40'
              : isDone
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-slate-800/80 text-slate-400 border border-slate-700/60';

            return (
              <li key={step.id} className="flex items-center gap-2">
                {step.id > 1 && <span className="text-slate-600 text-xs">›</span>}
                <button
                  type="button"
                  disabled={!canOpen && step.id !== 1 && !isActive}
                  onClick={() => {
                    if (step.id === 1) onList();
                    else if (step.id === 8) onChoose();
                    else if (step.view) onNavigate(step.view);
                  }}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                    isActive
                      ? 'bg-slate-800 text-white'
                      : canOpen || step.id === 1
                        ? 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                        : 'text-slate-500 cursor-not-allowed opacity-60'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-full text-[10px]',
                      badgeClass
                    )}
                  >
                    {step.id}
                  </span>
                  <span>{step.label}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}

function CompanyAvatar({ proposal }: { proposal: MarketplaceProposal }) {
  if (proposal.company.logo_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={proposal.company.logo_url}
        alt={proposal.company.name}
        className="h-full w-full object-contain"
      />
    );
  }
  return <CompanyMark proposal={proposal} />;
}


export function MarketplaceProposalsWorkspace() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const selectedId = Number(params.get('proposal')) || null;
  const requestedScreen = params.get('view') as Screen;
  const screen = screens.includes(requestedScreen) ? requestedScreen : 'summary';

  const [apiProposals, setApiProposals] = useState<MarketplaceProposal[]>([]);
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [filter, setFilter] = useState<Filter>(
    filterTabs.some((tab) => tab.id === params.get('tab')) ? (params.get('tab') as Filter) : 'all'
  );
  const [compareNotice, setCompareNotice] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [viewLayout, setViewLayout] = useState<ViewLayout>('cards');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [detailAttempt, setDetailAttempt] = useState(0);
  const [error, setError] = useState('');
  const [choosing, setChoosing] = useState<MarketplaceProposal | null>(null);
  const [declining, setDeclining] = useState(false);
  const [decisionError, setDecisionError] = useState('');
  const [busy, setBusy] = useState(false);
  const [infoDismissed, setInfoDismissed] = useState(false);

  const submitting = useRef(false);
  const detailHeading = useRef<HTMLHeadingElement>(null);

  // Somente dados reais vindos da API. Nunca usar propostas de demonstração.
  const proposals = apiProposals;

  const selected = proposals.find((proposal) => proposal.id === selectedId);
  const showingDetail = Boolean(selectedId) || screen === 'compare' || screen === 'choose';
  const comparisonIds = (params.get('compare') || '')
    .split(',')
    .map(Number)
    .filter((id) => Number.isSafeInteger(id) && id > 0)
    .slice(0, 3);

  const updateProposal = useCallback((proposal: MarketplaceProposal) => {
    setApiProposals((current) =>
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
      setApiProposals(response.proposals ?? []);
    } catch {
      setError('Não foi possível carregar suas propostas. Tente novamente.');
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
        // Se falhar a chamada individual no mock, usa a proposta selecionada local
        if (current && !selected) {
          setDetailError(
            'Não foi possível abrir esta proposta. Ela pode não estar mais disponível.'
          );
        }
      } finally {
        if (current) setDetailLoading(false);
      }
    })();
    return () => {
      current = false;
    };
  }, [selectedId, detailAttempt, updateProposal, selected]);

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
    const targetScreen =
      proposal.status === 'accepted' || isProposalCompleted(proposal)
        ? 'project'
        : 'summary';
    navigate(proposal.id, targetScreen);
  }

  useEffect(() => {
    if (!compareNotice) return;
    const timer = setTimeout(() => setCompareNotice(''), 3500);
    return () => clearTimeout(timer);
  }, [compareNotice]);

  function handleFilterChange(newFilter: Filter) {
    setFilter(newFilter);
    const query = new URLSearchParams(params.toString());
    if (newFilter !== 'all') {
      query.set('tab', newFilter);
    } else {
      query.delete('tab');
    }
    const search = query.toString();
    router.replace(pathname + (search ? '?' + search : ''), { scroll: false });
  }

  function toggleCompare(id: number) {
    const target = proposals.find((p) => p.id === id);
    if (!target || !isProposalReceived(target)) {
      setCompareNotice('Disponível apenas quando a proposta for recebida.');
      return;
    }
    setCompareIds((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }
      if (current.length >= 3) {
        setCompareNotice('Você pode comparar até 3 propostas.');
        return current;
      }
      return [...current, id];
    });
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

  // Estatísticas calculadas exclusivamente a partir dos status reais
  const stats = useMemo(() => {
    return {
      active: proposals.filter(isProposalActive).length,
      received: proposals.filter(isProposalReceived).length,
      pending: proposals.filter(isProposalAwaiting).length,
    };
  }, [proposals]);

  // Lista dinâmica de empresas para o filtro
  const companiesList = useMemo(() => {
    return Array.from(new Set(proposals.map((p) => p.company.name).filter(Boolean)));
  }, [proposals]);

  // Filtragem e ordenação
  const filteredProposals = useMemo(() => {
    return proposals
      .filter((proposal) => {
        if (filter === 'all') return true;
        if (filter === 'active') return isProposalActive(proposal);
        if (filter === 'received') return isProposalReceived(proposal);
        if (filter === 'completed') return isProposalCompleted(proposal);
        return true;
      })
      .filter((proposal) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const name = (proposal.company.name || '').toLowerCase();
        const city = (proposal.company.city || '').toLowerCase();
        const ref = (proposal.reference || '').toLowerCase();
        const profile = (proposal.request?.project_profile || '').toLowerCase();
        return name.includes(q) || city.includes(q) || ref.includes(q) || profile.includes(q);
      })
      .filter((proposal) => {
        if (regionFilter === 'all') return true;
        const state = (proposal.company.state || '').toLowerCase();
        return state === regionFilter.toLowerCase();
      })
      .filter((proposal) => {
        if (companyFilter === 'all') return true;
        return proposal.company.name === companyFilter;
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
  }, [proposals, filter, searchQuery, regionFilter, companyFilter, sortBy]);

  if (loading && !proposals.length) {
    return (
      <div role="status" className="mx-auto w-full max-w-6xl space-y-4 px-4 py-6 sm:px-6">
        <span className="sr-only">Carregando propostas…</span>
        <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-100" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1240px] px-2 sm:px-4 lg:px-6 pb-12 pt-1 text-slate-900">
      {/* ── HEADER DA PÁGINA ────────────────────────────────────────── */}
      <header
        className={cn(
          'mb-6 flex items-start justify-between gap-4 border-b border-slate-200/80 pb-5',
          showingDetail && 'hidden'
        )}
      >
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Minhas propostas
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            Acompanhe solicitações, respostas e próximas etapas em um só lugar.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => void load()}
          disabled={refreshing}
          aria-label="Atualizar propostas"
          className="shrink-0 gap-2 rounded-xl border-slate-200 bg-white text-xs sm:text-sm font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
        >
          <RefreshCw className={cn('h-3.5 w-3.5 text-slate-500', refreshing && 'animate-spin')} />
          <span>Atualizar</span>
        </Button>
      </header>

      {/* Rail da jornada no mobile ou em tela de detalhe */}
      {showingDetail && screen !== 'project' && screen !== 'conversation' && screen !== 'choose' && (
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

      {/* Visor de detalhes quando uma proposta específica estiver aberta */}
      {screen === 'project' && selected ? (
        <ProposalProject
          key={selected.id}
          proposal={selected}
          onViewProposal={() => navigate(selected.id, 'summary')}
          onList={() => navigate(null)}
          onConversation={() => navigate(selected.id, 'conversation')}
          onMeeting={() => navigate(selected.id, 'meeting')}
        />
      ) : screen === 'conversation' && selected ? (
        <ProposalConversation
          key={selected.id}
          proposal={selected}
          onBack={() => navigate(selected.id, 'summary')}
          onViewProposal={() => navigate(selected.id, 'summary')}
          onMeeting={() => navigate(selected.id, 'meeting')}
          onNegotiate={() => navigate(selected.id, 'negotiation')}
        />
      ) : screen === 'choose' ? (
        <ProposalChoose
          proposals={proposals}
          initialSelectedId={selectedId || undefined}
          onBack={() => navigate(selectedId, 'summary')}
          onConfirm={(proposal) => {
            setDecisionError('');
            setChoosing(proposal);
          }}
          onConversation={(proposal) => navigate(proposal.id, 'conversation')}
          onViewDetails={(proposal) => navigate(proposal.id, 'summary')}
        />
      ) : showingDetail ? (
        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <Button
              variant="ghost"
              size="sm"
              className="-ml-2 font-semibold text-slate-600 hover:text-slate-900"
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
            className="text-xl font-bold tracking-tight outline-none sm:text-2xl text-slate-900"
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
                  navigate(proposal.id, 'choose');
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
                onClearAll={() => {
                  setCompareIds([]);
                  const query = new URLSearchParams(params.toString());
                  query.delete('compare');
                  query.delete('view');
                  router.push(pathname + '?' + query.toString(), { scroll: false });
                }}
                onBack={() => navigate(null)}
                onConversation={(p) => navigate(p.id, 'conversation')}
                onMeeting={() => (selectedId ? navigate(selectedId, 'meeting') : undefined)}
              />
            </div>
          ) : detailLoading ? (
            <p role="status" className="py-12 text-center text-sm text-slate-500">
              Carregando os detalhes da proposta…
            </p>
          ) : detailError ? (
            <div role="alert" className="mt-4 space-y-4 rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700 font-medium">{detailError}</p>
              <Button variant="outline" size="sm" onClick={() => setDetailAttempt((value) => value + 1)}>
                Tentar novamente
              </Button>
            </div>
          ) : selected ? (
            <>
              <div className="my-5 flex flex-wrap items-center gap-3 border-b border-slate-100 pb-5">
                <CompanyMark proposal={selected} />
                <div className="min-w-0 flex-1">
                  <h3 className="break-words font-bold text-slate-900">{selected.company.name}</h3>
                  <p className="mt-0.5 text-xs text-slate-500 font-mono">
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
                  onChoose={() => navigate(selected.id, 'choose')}
                  onNegotiate={() => navigate(selected.id, 'negotiation')}
                  onProject={() => navigate(selected.id, 'project')}
                  onList={() => navigate(null)}
                  onConversation={() => navigate(selected.id, 'conversation')}
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
                  <p className="text-sm text-slate-500 py-6">
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
              {screen === 'summary' && (
                <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-100 pt-4">
                  <Button variant="outline" size="sm" onClick={() => navigate(selected.id, 'negotiation')}>
                    Histórico de versões
                  </Button>
                  {canDecide(selected) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
            <p className="mt-4 text-sm text-slate-500">Proposta não encontrada.</p>
          )}
        </section>
      ) : (
        /* ── VISUALIZAÇÃO PRINCIPAL DE PROPOSTAS ── */
        <main className="space-y-6">
          {error && (
            <div
              role="alert"
              className="flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm font-medium text-red-700"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void load()}
                className="rounded-xl border-red-300 bg-white text-xs font-semibold text-red-700 hover:bg-red-50"
              >
                Tentar novamente
              </Button>
            </div>
          )}

          {compareNotice && (
            <div
              role="status"
              className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs sm:text-sm font-medium text-amber-800"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                <span>{compareNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setCompareNotice('')}
                className="text-xs font-bold text-amber-700 hover:text-amber-900"
              >
                ✕
              </button>
            </div>
          )}

          {/* ── 3 CARDS DE KPIS / STATUS (CLICÁVEIS) ───────────────────── */}
          <section
            aria-label="Resumo de status"
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            {/* Card 1: Ativas */}
            <button
              type="button"
              onClick={() => handleFilterChange('active')}
              className={cn(
                'flex items-center gap-4 rounded-2xl border bg-white p-4 text-left transition-all hover:border-slate-300 hover:shadow-xs',
                filter === 'active'
                  ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-xs'
                  : 'border-slate-200/90'
              )}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50">
                <FileText className="h-6 w-6 text-blue-600 stroke-[1.8]" />
              </div>
              <div>
                <span className="block text-xs font-medium text-slate-500">Ativas</span>
                <span className="block text-2xl font-bold text-slate-900 mt-0.5">
                  {stats.active}
                </span>
              </div>
            </button>

            {/* Card 2: Recebidas */}
            <button
              type="button"
              onClick={() => handleFilterChange('received')}
              className={cn(
                'flex items-center gap-4 rounded-2xl border bg-white p-4 text-left transition-all hover:border-slate-300 hover:shadow-xs',
                filter === 'received'
                  ? 'border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs'
                  : 'border-slate-200/90'
              )}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                <MessageSquare className="h-6 w-6 text-emerald-600 stroke-[1.8]" />
              </div>
              <div>
                <span className="block text-xs font-medium text-slate-500">Recebidas</span>
                <span className="block text-2xl font-bold text-slate-900 mt-0.5">
                  {stats.received}
                </span>
              </div>
            </button>

            {/* Card 3: Aguardando retorno */}
            <button
              type="button"
              onClick={() => handleFilterChange('active')}
              className="flex items-center gap-4 rounded-2xl border border-slate-200/90 bg-white p-4 text-left transition-all hover:border-slate-300 hover:shadow-xs"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-50">
                <Clock className="h-6 w-6 text-amber-500 stroke-[1.8]" />
              </div>
              <div>
                <span className="block text-xs font-medium text-slate-500">Aguardando retorno</span>
                <span className="block text-2xl font-bold text-slate-900 mt-0.5">
                  {stats.pending}
                </span>
              </div>
            </button>
          </section>

          {/* ── ABAS EM PÍLULA (SEGMENTED CONTROL COM URL SYNC) ────────── */}
          <div className="flex items-center justify-between sm:justify-start gap-1 p-1 rounded-full border border-slate-200/80 bg-white overflow-x-auto max-w-full">
            {filterTabs.map((tab) => {
              const isActive = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleFilterChange(tab.id)}
                  className={cn(
                    'px-6 sm:px-8 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap',
                    isActive
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* ── BARRA DE FERRAMENTAS / FILTROS (TOOLBAR) ────────────────── */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Campo de Busca */}
            <div className="relative min-w-[280px] flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar propostas, empresas ou tecnologia..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Select Regiões */}
            <div className="relative">
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="h-10 appearance-none rounded-xl border border-slate-200 bg-white pl-3.5 pr-8 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 focus:border-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="all">Todas as regiões</option>
                <option value="sp">São Paulo, SP</option>
                <option value="sc">Santa Catarina, SC</option>
                <option value="mg">Minas Gerais, MG</option>
                <option value="rj">Rio de Janeiro, RJ</option>
                <option value="pr">Paraná, PR</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>

            {/* Select Empresas */}
            <div className="relative">
              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className="h-10 appearance-none rounded-xl border border-slate-200 bg-white pl-3.5 pr-8 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 focus:border-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="all">Todas as empresas</option>
                {companiesList.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>

            {/* Botão Filtros */}
            <Button
              variant="outline"
              size="sm"
              className="h-10 gap-1.5 rounded-xl border-slate-200 bg-white text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => {
                if (searchQuery || regionFilter !== 'all' || companyFilter !== 'all') {
                  setSearchQuery('');
                  setRegionFilter('all');
                  setCompanyFilter('all');
                }
              }}
            >
              <SlidersHorizontal className="h-4 w-4 text-slate-500" />
              <span>Filtros</span>
            </Button>

            {/* Alternador de visualização (Cards / Lista) */}
            <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1">
              <button
                type="button"
                onClick={() => setViewLayout('cards')}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                  viewLayout === 'cards'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setViewLayout('table')}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                  viewLayout === 'table'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                <Table className="h-3.5 w-3.5" />
                <span>Lista</span>
              </button>
            </div>

            {/* Dropdown de Ordenação */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="h-10 appearance-none rounded-xl border border-slate-200 bg-white pl-3.5 pr-8 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 focus:border-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="recent">Ordenar: Mais recentes</option>
                <option value="oldest">Ordenar: Mais antigas</option>
                <option value="highest">Ordenar: Maior valor</option>
                <option value="lowest">Ordenar: Menor valor</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {/* ── LISTAGEM DE PROPOSTAS EM ROW-CARDS ──────────────────────── */}
          {filteredProposals.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-3 text-base font-bold text-slate-900">Nenhuma proposta encontrada</h3>
              <p className="mt-1 text-xs sm:text-sm text-slate-500">
                Tente ajustar os filtros ou a busca para encontrar o que procura.
              </p>
            </div>
          ) : viewLayout === 'table' ? (
            /* Modo Tabela */
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5">Empresa</th>
                    <th className="px-5 py-3.5">Sistema / Local</th>
                    <th className="px-5 py-3.5">Valor total</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProposals.map((proposal) => {
                    const price = getProposalDisplayPrice(proposal);
                    return (
                      <tr key={proposal.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-slate-900">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 shrink-0 rounded-lg border border-slate-100 p-1 flex items-center justify-center">
                              <CompanyAvatar proposal={proposal} />
                            </div>
                            <span>{proposal.company.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-500">
                          {proposal.request?.project_profile || 'Residencial'} • {getProposalLocation(proposal)}
                        </td>
                        <td className="px-5 py-3.5 font-bold text-slate-900">
                          {price.formatted}
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge proposal={proposal} />
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            aria-label={'Abrir proposta de ' + proposal.company.name}
                            onClick={() => openProposal(proposal)}
                            className="h-8 rounded-lg text-xs font-semibold text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            Ver detalhes
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* Modo Cards Horizontais */
            <div className="space-y-4">
              {filteredProposals.map((proposal) => {
                const isSentOrReady = isProposalReceived(proposal);
                const isUnderAnalysis = proposal.status === 'draft' || proposal.status === 'under_review';
                const isPending = isProposalAwaiting(proposal);

                // Dados técnicos reais (sem inventar fallbacks fictícios)
                const power = getProposalRawTerm(proposal, [
                  'system_power',
                  'power_kwp',
                  'potencia',
                  'installed_power',
                ]);
                const generation = getProposalRawTerm(proposal, [
                  'monthly_generation',
                  'geracao',
                  'generation_kwh',
                ]);
                const price = getProposalDisplayPrice(proposal);
                const deadline = getProposalRawTerm(proposal, [
                  'installation_deadline',
                  'prazo',
                  'installation_time',
                ]);

                const hasMetrics = isSentOrReady && Boolean(power || generation || price.isAvailable || deadline);

                const isCompleted = isProposalCompleted(proposal) || proposal.status === 'accepted';

                // Configuração de Status e Data
                let statusBadgeText = 'Aguardando envio';
                let statusBadgeColor = 'bg-amber-50 text-amber-700 border-amber-200/40';
                let statusDotColor = 'bg-amber-500';
                let dateIcon = <Clock className="h-3.5 w-3.5 text-slate-400" />;
                const updRel = formatRelativeDay(proposal.created_at);
                let dateText = updRel === 'hoje' ? 'Atualizado hoje' : updRel ? `Atualizado em ${updRel}` : 'Atualizado';

                if (isCompleted) {
                  statusBadgeText = 'Projeto concluído';
                  statusBadgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200/40';
                  statusDotColor = 'bg-emerald-500';
                  dateIcon = <Check className="h-3.5 w-3.5 text-emerald-600" />;
                  dateText = 'Instalação finalizada';
                } else if (isSentOrReady) {
                  statusBadgeText = 'Proposta recebida';
                  statusBadgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200/40';
                  statusDotColor = 'bg-emerald-500';
                  dateIcon = <Calendar className="h-3.5 w-3.5 text-slate-400" />;
                  const pubRel = formatRelativeDay(
                    proposal.published_at || proposal.version?.published_at || proposal.created_at
                  );
                  dateText = pubRel === 'hoje' ? 'Recebida hoje' : pubRel ? `Recebida em ${pubRel}` : 'Recebida';
                } else if (isUnderAnalysis) {
                  statusBadgeText = 'Em análise';
                  statusBadgeColor = 'bg-blue-50 text-blue-700 border-blue-200/40';
                  statusDotColor = 'bg-blue-500';
                  dateIcon = <Clock className="h-3.5 w-3.5 text-slate-400" />;
                  dateText = 'Prazo estimado: até 24h';
                }

                // Linha descritiva
                let detailIcon = <FileText className="h-3.5 w-3.5 text-slate-400" />;
                let detailText = 'Seu pedido está sendo preparado';

                if (isSentOrReady) {
                  detailIcon = <Grid className="h-3.5 w-3.5 text-blue-600" />;
                  detailText =
                    proposal.version?.summary ||
                    (proposal.version
                      ? `Versão ${proposal.version.number} disponível`
                      : 'Proposta disponível para análise');
                } else if (isUnderAnalysis) {
                  detailIcon = <FileText className="h-3.5 w-3.5 text-slate-400" />;
                  detailText = 'Solicitação enviada com sucesso';
                }

                const isComparing = compareIds.includes(proposal.id);
                const solutionLabel =
                  getProposalSolutionLabel(proposal) ||
                  proposal.request?.project_profile ||
                  'Sistema solar';
                const location = getProposalLocation(proposal);

                return (
                  <article
                    key={proposal.id}
                    className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-none transition-all hover:border-slate-300"
                  >
                    {/* Linha Superior: Logo + Dados da Empresa à esquerda | Status + Data à direita */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-start gap-4 min-w-0">
                        {/* Logo da Empresa */}
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-white p-1.5 overflow-hidden shadow-2xs">
                          <CompanyAvatar proposal={proposal} />
                        </div>

                        {/* Textos da Empresa */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                              {proposal.company.name}
                            </h3>
                            {proposal.reference && (
                              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-mono font-medium text-slate-600">
                                #{proposal.reference}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-slate-500 font-medium">
                            {solutionLabel} • {location}
                          </p>
                          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                            {detailIcon}
                            <span>{detailText}</span>
                          </div>
                        </div>
                      </div>

                      {/* Status + Data à direita */}
                      <div className="flex items-center gap-4 self-start sm:self-auto shrink-0">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border',
                            statusBadgeColor
                          )}
                        >
                          <span className={cn('h-1.5 w-1.5 rounded-full', statusDotColor)} />
                          <span>{statusBadgeText}</span>
                        </span>

                        <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                          {dateIcon}
                          <span>{dateText}</span>
                        </span>
                      </div>
                    </div>

                    {/* Linha Inferior: Métricas Técnicas em Linha + Botões de Ação */}
                    <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Métricas Técnicas */}
                      {hasMetrics ? (
                        <div className="flex items-center gap-6 sm:gap-8 flex-wrap">
                          {power && (
                            <div className="flex items-center gap-1.5">
                              <Zap className="h-4 w-4 text-blue-600" />
                              <span className="text-xs text-slate-500 font-medium">Potência</span>
                              <span className="text-xs sm:text-sm font-bold text-slate-900 ml-1">
                                {power}
                              </span>
                            </div>
                          )}

                          {generation && (
                            <div className="flex items-center gap-1.5">
                              <BarChart2 className="h-4 w-4 text-blue-600" />
                              <span className="text-xs text-slate-500 font-medium">Geração estimada</span>
                              <span className="text-xs sm:text-sm font-bold text-slate-900 ml-1">
                                {generation}
                              </span>
                            </div>
                          )}

                          {price.isAvailable && (
                            <div className="flex items-center gap-1.5">
                              <DollarSign className="h-4 w-4 text-blue-600" />
                              <span className="text-xs text-slate-500 font-medium">Valor total</span>
                              <span className="text-xs sm:text-sm font-bold text-slate-900 ml-1">
                                {price.formatted}
                              </span>
                            </div>
                          )}

                          {deadline && (
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-4 w-4 text-blue-600" />
                              <span className="text-xs text-slate-500 font-medium">Prazo de instalação</span>
                              <span className="text-xs sm:text-sm font-bold text-slate-900 ml-1">
                                {deadline}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div />
                      )}

                      {/* Botões de Ação */}
                      <div className="flex items-center gap-2.5 self-end md:self-auto shrink-0">
                        {isCompleted ? (
                          <Button
                            aria-label={'Ver projeto de ' + proposal.company.name}
                            onClick={() => openProposal(proposal)}
                            className="h-9 gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold px-4 shadow-2xs"
                          >
                            <span>Ver projeto</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        ) : isSentOrReady ? (
                          <Button
                            aria-label={'Abrir proposta de ' + proposal.company.name}
                            onClick={() => openProposal(proposal)}
                            className="h-9 gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold px-4 shadow-2xs"
                          >
                            <span>Ver proposta</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        ) : isUnderAnalysis ? (
                          <Button
                            variant="outline"
                            aria-label={'Abrir proposta de ' + proposal.company.name}
                            onClick={() => openProposal(proposal)}
                            className="h-9 gap-1.5 rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50 text-xs sm:text-sm font-semibold px-4"
                          >
                            <span>Acompanhar status</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            aria-label={'Abrir proposta de ' + proposal.company.name}
                            onClick={() => openProposal(proposal)}
                            className="h-9 gap-1.5 rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50 text-xs sm:text-sm font-semibold px-4"
                          >
                            <span>Ver detalhes</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          aria-label={'Comparar proposta de ' + proposal.company.name}
                          disabled={!isSentOrReady}
                          title={!isSentOrReady ? 'Disponível quando a proposta for recebida' : undefined}
                          onClick={() => toggleCompare(proposal.id)}
                          className={cn(
                            'h-9 gap-1.5 rounded-xl text-xs sm:text-sm font-semibold px-3.5 transition-colors',
                            !isSentOrReady && 'opacity-50 cursor-not-allowed hover:bg-transparent',
                            isComparing
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                              : 'border-slate-200 text-blue-600 hover:bg-slate-50'
                          )}
                        >
                          <BarChart2 className="h-3.5 w-3.5" />
                          <span>{isComparing ? 'Selecionada' : 'Comparar'}</span>
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* ── CARD INFORMATIVO DE RODAPÉ "COMO FUNCIONA?" ─────────────── */}
          {!infoDismissed && (
            <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 sm:p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
                  <Lightbulb className="h-5 w-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                    Como funciona?
                  </h4>
                  <p className="mt-0.5 text-xs sm:text-sm text-slate-600">
                    Você solicita orçamento, acompanha respostas e compara propostas com mais clareza.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInfoDismissed(true)}
                className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 shrink-0"
              >
                <span>Entendi</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Barra flutuante de comparação quando 1 ou mais propostas estiverem selecionadas */}
          {compareIds.length >= 1 && (
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 rounded-2xl border border-slate-200 bg-white/95 p-3.5 shadow-2xl backdrop-blur-md flex items-center gap-4">
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900">
                  Comparar propostas ({compareIds.length})
                </p>
                <p className="text-[11px] text-slate-500">Selecione de 2 a 3 propostas.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  disabled={compareIds.length < 2}
                  className="font-semibold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
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
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setCompareIds([])}
                  className="rounded-xl px-2 text-xs text-slate-500 hover:text-slate-800"
                >
                  Limpar
                </Button>
              </div>
            </div>
          )}
        </main>
      )}

      {/* ── MODAL DE CONFIRMAÇÃO DE DECISÃO ─────────────────────────── */}
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
          className="w-[calc(100%-2rem)] max-w-md px-5 py-6"
          onEscapeKeyDown={(event) => {
            if (busy) event.preventDefault();
          }}
          onPointerDownOutside={(event) => {
            if (busy) event.preventDefault();
          }}
        >
          <CheckCircle2 className="h-12 w-12 text-blue-600" />
          <DialogTitle className="text-slate-900 font-bold">
            {declining ? 'Recusar esta proposta?' : 'Confirmar interesse?'}
          </DialogTitle>
          <DialogDescription className="text-slate-600 text-sm">
            {declining
              ? 'A proposta será encerrada para você. Para retomar, será necessário conversar com a empresa.'
              : 'Você deseja avançar com a proposta da ' + choosing?.company.name + '?'}
          </DialogDescription>
          {!declining && choosing && (
            <>
              <p className="text-2xl font-bold tabular-nums text-blue-600">
                {formatMoney(
                  choosing.version?.total_cents ?? choosing.total_cents,
                  choosing.currency
                )}
              </p>
              <p className="text-sm text-slate-500">
                A escolha sinaliza seu interesse em prosseguir. O contrato e o pagamento continuam
                sendo definidos diretamente com a empresa.
              </p>
              <p className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs sm:text-sm text-amber-900 border border-amber-200">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <span>
                  As outras propostas desta mesma solicitação serão marcadas como não escolhidas.
                </span>
              </p>
            </>
          )}
          {decisionError && (
            <p role="alert" className="text-sm font-medium text-red-600">
              {decisionError}
            </p>
          )}
          <div className="flex items-center justify-end gap-2.5 mt-2">
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => {
                setChoosing(null);
                setDeclining(false);
              }}
              className="rounded-xl border-slate-200"
            >
              Voltar
            </Button>
            <Button
              disabled={busy}
              onClick={() => void decide(declining ? 'decline' : 'accept')}
              className={cn(
                'rounded-xl text-white font-semibold',
                declining ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
              )}
            >
              {busy ? 'Registrando…' : declining ? 'Recusar proposta' : 'Confirmar interesse'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
