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
  Shield,
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
import { ProposalCompleted } from './proposals/ProposalCompleted';
import { ProposalReview } from './proposals/ProposalReview';
import { ModernProposalStepper, type Screen } from './proposals/ModernProposalStepper';
import {
  JOURNEY_STAGES,
  type ProposalJourneyStageId,
  SCREEN_TO_STAGE,
  getActiveJourneyStage,
} from './proposals/proposal-journey-config';
import {
  classifyProposalError,
  type ClassifiedProposalError,
  proposalStateMessages,
} from './proposals/proposal-state';
import {
  ProposalStatusSummary,
  type ProposalFilter,
} from './proposals/ProposalStatusSummary';
import { ProposalCompactCard } from './proposals/ProposalCompactCard';
import {
  ProposalFiltersSheet,
  type SortOption,
} from './proposals/ProposalFiltersSheet';
import { useBuyerProposalsList } from '@/hooks/reviewer/useBuyerProposalsList';
import { useBuyerProposalDetail } from '@/hooks/reviewer/useBuyerProposalDetail';
import { useProposalComparison } from '@/hooks/reviewer/useProposalComparison';

type Filter = ProposalFilter;
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
  'completed',
  'review',
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
  completed: 'Projeto concluído',
  review: 'Avaliação e feedback',
};

const filterTabs: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'active', label: 'Em andamento' },
  { id: 'received', label: 'Recebidas' },
  { id: 'completed', label: 'Concluídas' },
];

function activeJourneyStep(proposal: MarketplaceProposal | undefined, screen: Screen) {
  return getActiveJourneyStage(proposal, screen);
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
  const rawProposalParam = params.get('proposal');
  const parsedId = Number(rawProposalParam);
  const selectedId =
    rawProposalParam && Number.isSafeInteger(parsedId) && parsedId > 0 ? parsedId : null;
  const requestedScreen = params.get('view') as Screen;
  const screen = screens.includes(requestedScreen) ? requestedScreen : 'summary';

  const {
    proposals,
    loading,
    refreshing,
    error,
    load,
    updateProposal,
  } = useBuyerProposalsList();

  const {
    detailLoading,
    detailErrorState,
    retryDetail,
  } = useBuyerProposalDetail({
    selectedId,
    rawProposalParam,
    onProposalLoaded: updateProposal,
  });

  const {
    compareIds,
    setCompareIds,
    compareNotice,
    setCompareNotice,
    toggleCompare,
    removeCompareId,
    clearCompare,
  } = useProposalComparison([], proposals);

  const [filter, setFilter] = useState<Filter>(
    params.get('tab') === 'awaiting'
      ? 'awaiting'
      : filterTabs.some((tab) => tab.id === params.get('tab'))
      ? (params.get('tab') as Filter)
      : 'all'
  );
  const [filtersSheetOpen, setFiltersSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [viewLayout, setViewLayout] = useState<ViewLayout>('cards');
  const [choosing, setChoosing] = useState<MarketplaceProposal | null>(null);
  const [declining, setDeclining] = useState(false);
  const [decisionError, setDecisionError] = useState('');
  const [busy, setBusy] = useState(false);
  const [infoDismissed, setInfoDismissed] = useState(false);

  const submitting = useRef(false);
  const detailHeading = useRef<HTMLHeadingElement>(null);

  const selected = proposals.find((proposal) => proposal.id === selectedId);
  const selectedRef = useRef<MarketplaceProposal | undefined>(selected);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  const showingDetail =
    Boolean(selectedId) || Boolean(rawProposalParam) || screen === 'compare' || screen === 'choose';
  const comparisonIds = (params.get('compare') || '')
    .split(',')
    .map(Number)
    .filter((id) => Number.isSafeInteger(id) && id > 0)
    .slice(0, 3);

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
    const targetScreen = isProjectComplete(proposal.project)
      ? 'completed'
      : proposal.status === 'accepted'
        ? 'project'
        : 'summary';
    navigate(proposal.id, targetScreen);
  }

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
        if (filter === 'awaiting') return isProposalAwaiting(proposal);
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
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <section
      aria-label="Jornada de propostas"
      data-testid="marketplace-proposals-journey"
      className="mx-auto w-full max-w-[1240px] px-2 sm:px-4 lg:px-6 pb-12 pt-1 text-slate-900"
    >
      {/* ── HEADER DA PÁGINA ────────────────────────────────────────── */}
      <header
        className={cn(
          'mb-4 flex items-start justify-between gap-3 border-b border-slate-100 pb-3 sm:mb-6 sm:border-slate-200/80 sm:pb-5',
          showingDetail && 'hidden'
        )}
      >
        <div className="min-w-0">
          <div className="mb-0.5 text-[11px] sm:text-xs font-semibold text-blue-600">
            Meu painel / Propostas
          </div>
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Minhas propostas
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-500 font-normal sm:font-medium">
            Acompanhe as respostas das empresas e escolha com mais segurança.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => void load()}
          disabled={refreshing}
          aria-label="Atualizar propostas"
          className="shrink-0 h-9 gap-1.5 rounded-xl border-slate-200 bg-white text-xs sm:text-sm font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
        >
          <RefreshCw className={cn('h-3.5 w-3.5 text-slate-500', refreshing && 'animate-spin')} />
          <span className="hidden sm:inline">Atualizar</span>
        </Button>
      </header>

      {/* Modern Stepper Header em telas de detalhes (somente com proposta autorizada e sem erro) */}
      {showingDetail && !detailLoading && !detailErrorState && selected && (
        <ModernProposalStepper
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
      {screen === 'completed' && selected ? (
        <ProposalCompleted
          key={selected.id}
          proposal={selected}
          onViewProposal={() => navigate(selected.id, 'summary')}
          onList={() => navigate(null)}
          onReview={() => navigate(selected.id, 'review')}
          onConversation={() => navigate(selected.id, 'conversation')}
        />
      ) : screen === 'review' && selected ? (
        <ProposalReview
          key={selected.id}
          proposal={selected}
          onBack={() => navigate(selected.id, 'completed')}
          onViewProposal={() => navigate(selected.id, 'summary')}
          onConversation={() => navigate(selected.id, 'conversation')}
        />
      ) : screen === 'project' && selected ? (
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
        <div className="min-w-0 space-y-6">
          {screen === 'compare' ? (
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
          ) : detailLoading ? (
            <div
              role="status"
              className="rounded-3xl border border-slate-200/80 bg-white p-12 text-center shadow-xs"
            >
              <p className="text-sm font-medium text-slate-500">
                Carregando os detalhes da proposta…
              </p>
            </div>
          ) : detailErrorState ? (
            <div
              role="alert"
              aria-live="polite"
              className={cn(
                'rounded-3xl border p-8 text-center space-y-4 max-w-xl mx-auto shadow-xs',
                detailErrorState.state === 'permission_denied'
                  ? 'border-amber-200 bg-amber-50/70'
                  : detailErrorState.state === 'not_found'
                  ? 'border-slate-200 bg-slate-50/90'
                  : 'border-rose-200 bg-rose-50/70'
              )}
            >
              <div
                className={cn(
                  'mx-auto flex h-12 w-12 items-center justify-center rounded-2xl',
                  detailErrorState.state === 'permission_denied'
                    ? 'bg-amber-100 text-amber-700'
                    : detailErrorState.state === 'not_found'
                    ? 'bg-slate-200 text-slate-700'
                    : 'bg-rose-100 text-rose-700'
                )}
              >
                {detailErrorState.state === 'permission_denied' ? (
                  <Shield className="h-6 w-6" />
                ) : (
                  <AlertCircle className="h-6 w-6" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {detailErrorState.config.title}
                </h3>
                <p className="mt-1 text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  {detailErrorState.message || detailErrorState.config.description}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {detailErrorState.canRetry && (
                  <Button
                    size="sm"
                    onClick={() => retryDetail()}
                    className="rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Tentar novamente
                  </Button>
                )}
                {detailErrorState.state === 'unauthorized' && (
                  <Button
                    size="sm"
                    asChild
                    className="rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Link
                      href={`/login?redirect=${encodeURIComponent(
                        pathname + (params.toString() ? '?' + params.toString() : '')
                      )}`}
                    >
                      Entrar novamente
                    </Link>
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(null)}
                  className="rounded-xl font-bold border-slate-300 hover:bg-slate-100"
                >
                  Minhas propostas
                </Button>
                {detailErrorState.config.secondaryAction?.href && (
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="rounded-xl font-medium text-slate-600 hover:bg-slate-100"
                  >
                    <Link href={detailErrorState.config.secondaryAction.href}>
                      {detailErrorState.config.secondaryAction.label}
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          ) : selected ? (
            <>
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
                  <div className="rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-xs">
                    <p className="text-sm font-medium text-slate-500">
                      Esta proposta não permite novos agendamentos.
                    </p>
                  </div>
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
            </>
          ) : (
            <div
              role="alert"
              className="rounded-3xl border border-slate-200/80 bg-slate-50/60 p-8 text-center space-y-4 shadow-xs"
            >
              <p className="text-sm font-medium text-slate-700">
                A proposta #{selectedId} não foi encontrada ou você não tem acesso a ela.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(null)}
                className="rounded-xl font-bold text-slate-800"
              >
                Voltar para minhas propostas
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* ── VISUALIZAÇÃO PRINCIPAL DE PROPOSTAS ── */
        <div className="space-y-3.5 sm:space-y-4">
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

          {/* ── VISÃO GERAL (STATUS RESUMO COM 3 COLUNAS FIXAS NO PWA) ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Visão geral</span>
              <span className="text-[11px] text-slate-400 font-normal">Situação atual</span>
            </div>
            <ProposalStatusSummary
              stats={stats}
              currentFilter={filter}
              onSelectFilter={handleFilterChange}
            />
          </div>

          {/* ── EMPRESAS E PROPOSTAS ── */}
          <div className="space-y-3 pt-1 sm:pt-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>Empresas e propostas</span>
              {(filter !== 'all' || Boolean(searchQuery.trim()) || regionFilter !== 'all' || companyFilter !== 'all' || sortBy !== 'recent') && (
                <button
                  type="button"
                  onClick={() => {
                    setFilter('all');
                    setSearchQuery('');
                    setRegionFilter('all');
                    setCompanyFilter('all');
                    setSortBy('recent');
                    const query = new URLSearchParams(params.toString());
                    query.delete('tab');
                    const search = query.toString();
                    router.replace(pathname + (search ? '?' + search : ''), { scroll: false });
                  }}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Limpar filtros
                </button>
              )}
            </div>

            {/* Abas em Pílula com rolagem horizontal controlada */}
            <div className="flex items-center gap-1.5 p-1 rounded-full border border-slate-200/80 bg-white overflow-x-auto max-w-full scrollbar-none">
              {filterTabs.map((tab) => {
                const isActive = filter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleFilterChange(tab.id)}
                    className={cn(
                      'px-4 sm:px-6 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap',
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

            {/* Barra de Ferramentas / Busca */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Campo de Busca (1 linha no mobile com min-w-0 flex-1) */}
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar empresa ou proposta..."
                  className="h-10 sm:h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-8 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Limpar busca"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Botão Filtros no Mobile (Abre Bottom Sheet Drawer) */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFiltersSheetOpen(true)}
                aria-label="Abrir filtros avançados"
                className={cn(
                  'h-10 sm:h-11 w-10 sm:w-11 shrink-0 p-0 rounded-xl border-slate-200 bg-white sm:hidden',
                  (filter !== 'all' || regionFilter !== 'all' || companyFilter !== 'all' || sortBy !== 'recent') &&
                    'border-blue-500 bg-blue-50/60 text-blue-600 ring-1 ring-blue-500'
                )}
              >
                <SlidersHorizontal className="h-4 w-4 text-slate-600" />
              </Button>

              {/* Controles no Desktop (Filtros em linha) */}
              <div className="hidden sm:flex items-center gap-2 shrink-0">
                {/* Select Regiões */}
                <div className="relative">
                  <select
                    value={regionFilter}
                    onChange={(e) => setRegionFilter(e.target.value)}
                    className="h-11 appearance-none rounded-xl border border-slate-200 bg-white pl-3.5 pr-8 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 focus:border-blue-500 focus:outline-none cursor-pointer"
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
                    className="h-11 appearance-none rounded-xl border border-slate-200 bg-white pl-3.5 pr-8 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 focus:border-blue-500 focus:outline-none cursor-pointer"
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

                {/* Alternador Cards/Lista */}
                <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1">
                  <button
                    type="button"
                    onClick={() => setViewLayout('cards')}
                    aria-label="Visualização em cards"
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all',
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
                    aria-label="Visualização em lista"
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all',
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
                    className="h-11 appearance-none rounded-xl border border-slate-200 bg-white pl-3.5 pr-8 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 focus:border-blue-500 focus:outline-none cursor-pointer"
                  >
                    <option value="recent">Mais recentes</option>
                    <option value="oldest">Mais antigas</option>
                    <option value="highest">Maior valor</option>
                    <option value="lowest">Menor valor</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Contador de Solicitações Encontradas */}
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium pt-0.5">
              <span>
                {filteredProposals.length}{' '}
                {filteredProposals.length === 1 ? 'solicitação encontrada' : 'solicitações encontradas'}
              </span>
              <span className="text-[11px] text-slate-400">
                {sortBy === 'recent'
                  ? 'Mais recentes'
                  : sortBy === 'oldest'
                  ? 'Mais antigas'
                  : sortBy === 'highest'
                  ? 'Maior valor'
                  : 'Menor valor'}
              </span>
            </div>
          </div>

          {/* ── LISTAGEM DE PROPOSTAS ──────────────────────── */}
          {filteredProposals.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-3 text-base font-bold text-slate-900">
                {proposals.length === 0 ? 'Suas propostas ficam aqui' : 'Nenhuma proposta encontrada'}
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-slate-500">
                {proposals.length === 0
                  ? 'Assim que você solicitar um orçamento, as propostas recebidas aparecerão nesta página.'
                  : 'Tente ajustar os filtros ou a busca para encontrar o que procura.'}
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
                    const solution = getProposalSolutionLabel(proposal) || 'Categoria não informada';
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
                          {solution} • {getProposalLocation(proposal)}
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
            /* Modo Cards Responsivo: 1 col PWA, 2 col tablet/md, até 3 col desktop */
            <div className="grid grid-cols-1 gap-3 sm:gap-3.5 md:grid-cols-2 xl:grid-cols-3 items-start">
              {filteredProposals.map((proposal) => (
                <ProposalCompactCard
                  key={proposal.id}
                  proposal={proposal}
                  onOpen={openProposal}
                  onToggleCompare={toggleCompare}
                  isComparing={compareIds.includes(proposal.id)}
                  canCompare={isProposalReceived(proposal)}
                />
              ))}
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

          {/* Barra flutuante de comparação posicionada acima do rodapé mobile e respeitando safe-area */}
          {compareIds.length >= 1 && (
            <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] lg:bottom-6 left-1/2 -translate-x-1/2 z-40 lg:z-50 rounded-2xl border border-slate-200 bg-white/95 p-3.5 shadow-2xl backdrop-blur-md flex items-center gap-4 max-w-[95%] sm:max-w-md">
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
        </div>
      )}

      {/* Drawer de Filtros Mobile */}
      <ProposalFiltersSheet
        open={filtersSheetOpen}
        onClose={() => setFiltersSheetOpen(false)}
        currentFilter={filter}
        onFilterChange={handleFilterChange}
        regionFilter={regionFilter}
        onRegionFilterChange={setRegionFilter}
        companyFilter={companyFilter}
        onCompanyFilterChange={setCompanyFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        companiesList={companiesList}
        onReset={() => {
          setFilter('all');
          setSearchQuery('');
          setRegionFilter('all');
          setCompanyFilter('all');
          setSortBy('recent');
          const query = new URLSearchParams(params.toString());
          query.delete('tab');
          const search = query.toString();
          router.replace(pathname + (search ? '?' + search : ''), { scroll: false });
        }}
        hasActiveFilters={
          filter !== 'all' ||
          Boolean(searchQuery.trim()) ||
          regionFilter !== 'all' ||
          companyFilter !== 'all' ||
          sortBy !== 'recent'
        }
      />

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
    </section>
  );
}
