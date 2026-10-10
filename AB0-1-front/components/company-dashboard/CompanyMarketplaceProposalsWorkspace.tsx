'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import {
  Clock3,
  FilePlus2,
  History,
  Loader2,
  Plus,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import {
  companyMarketplaceProposalsApi,
  type MarketplaceProposal,
  type MarketplaceProposalVersion,
} from '@/lib/api';
import { useCompanyContext } from '@/context/CompanyContext';
import { cn } from '@/lib/utils';
import {
  getStatusInfo,
  formatBrlCurrency,
  normalizeVertical,
} from '@/lib/proposals/domain';
import { ProposalFiltersDrawer, type FilterState } from './proposals/ProposalFiltersDrawer';
import { LeadDetailsDrawer } from './proposals/LeadDetailsDrawer';
import { ProposalWizardEditor } from './proposals/ProposalWizardEditor';
import { ProposalSuccessScreen } from './proposals/ProposalSuccessScreen';

type Distribution = {
  id: number;
  status: string;
  assigned_at?: string;
  lead: MarketplaceProposal['lead'];
};

interface CompanyMarketplaceProposalsWorkspaceProps {
  companyId?: string | number;
}

export function CompanyMarketplaceProposalsWorkspace({
  companyId: propCompanyId,
}: CompanyMarketplaceProposalsWorkspaceProps = {}) {
  const { activeCompany, isLoading: companyLoading } = useCompanyContext();
  const effectiveCompanyId = propCompanyId || activeCompany?.id;
  const [proposals, setProposals] = useState<MarketplaceProposal[]>([]);
  const [distributions, setDistributions] = useState<Distribution[]>([]);

  // Selection & Navigation
  const [selectedProposal, setSelectedProposal] = useState<MarketplaceProposal | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [publishedSuccessProposal, setPublishedSuccessProposal] = useState<MarketplaceProposal | null>(null);

  // Drawers
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [leadDetailTarget, setLeadDetailTarget] = useState<{
    distribution: Distribution | null;
    proposal: MarketplaceProposal | null;
  } | null>(null);

  // Loading & Action states
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    category: 'all',
    dateFrom: '',
    dateTo: '',
  });

  const load = useCallback(async () => {
    if (!effectiveCompanyId) return;
    setLoading(true);
    setError(null);
    try {
      const [proposalResponse, distributionResponse] = await Promise.all([
        companyMarketplaceProposalsApi.list(effectiveCompanyId),
        companyMarketplaceProposalsApi.distributions(effectiveCompanyId),
      ]);
      const fetchedProposals = proposalResponse.proposals || [];
      setProposals(fetchedProposals);
      setDistributions(distributionResponse.distributions || []);

      // Desktop helper: only select if viewport is large, but do NOT force wizard open
      if (typeof window !== 'undefined' && window.innerWidth >= 1024 && fetchedProposals.length > 0) {
        setSelectedProposal(fetchedProposals[0]);
      }
    } catch {
      setError('Não foi possível carregar as propostas da sua empresa.');
    } finally {
      setLoading(false);
    }
  }, [effectiveCompanyId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Create proposal from distribution
  const handleCreateProposal = async (distributionId: number) => {
    if (!effectiveCompanyId) return;
    setBusy(`create-${distributionId}`);
    try {
      const response = await companyMarketplaceProposalsApi.create(
        distributionId,
        effectiveCompanyId
      );
      setProposals((current) => [
        response.proposal,
        ...current.filter((item) => item.id !== response.proposal.id),
      ]);
      setSelectedProposal(response.proposal);
      setIsWizardOpen(true);
      setPublishedSuccessProposal(null);
    } catch {
      setError('Não foi possível abrir o editor da proposta.');
    } finally {
      setBusy(null);
    }
  };

  // Open existing proposal in wizard
  const handleOpenProposal = (prop: MarketplaceProposal) => {
    setSelectedProposal(prop);
    setIsWizardOpen(true);
    setPublishedSuccessProposal(null);
  };

  // Close wizard and return to list
  const handleBackToList = () => {
    setIsWizardOpen(false);
    setPublishedSuccessProposal(null);
    void load();
  };

  // Unify and filter items
  const unifiedItems = useMemo(() => {
    // Map of proposal by lead_distribution_id
    const proposalByDist = new Map<number, MarketplaceProposal>();
    proposals.forEach((p) => {
      if (p.lead_distribution_id) {
        proposalByDist.set(p.lead_distribution_id, p);
      }
    });

    // 1. Items from distributions
    const itemsFromDist = distributions.map((dist) => {
      const prop = proposalByDist.get(dist.id) || null;
      return {
        key: `dist-${dist.id}`,
        distribution: dist,
        proposal: prop,
        status: prop ? prop.status : dist.status,
        date: dist.assigned_at || prop?.created_at,
        lead: prop?.lead || dist.lead,
        totalCents: prop?.total_cents,
      };
    });

    // 2. Extra proposals without matching distribution in current batch
    const extraProposals = proposals
      .filter((p) => !p.lead_distribution_id || !distributions.some((d) => d.id === p.lead_distribution_id))
      .map((prop) => ({
        key: `prop-${prop.id}`,
        distribution: null,
        proposal: prop,
        status: prop.status,
        date: prop.created_at,
        lead: prop.lead,
        totalCents: prop.total_cents,
      }));

    const all = [...itemsFromDist, ...extraProposals];

    // Filter by query
    const normQuery = query.trim().toLowerCase();
    const queryFiltered = all.filter((item) => {
      if (!normQuery) return true;
      const haystack = [
        item.lead?.name,
        item.lead?.email,
        item.lead?.city,
        item.lead?.state,
        item.proposal?.reference,
        item.lead?.product_vertical,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(normQuery);
    });

    // Filter by status
    const statusFiltered = queryFiltered.filter((item) => {
      if (filters.status === 'all') return true;
      return item.status === filters.status;
    });

    // Filter by category
    const categoryFiltered = statusFiltered.filter((item) => {
      if (filters.category === 'all') return true;
      const vertical = normalizeVertical(item.lead?.product_vertical);
      return vertical === filters.category;
    });

    // Filter by dates
    const dateFiltered = categoryFiltered.filter((item) => {
      if (!filters.dateFrom && !filters.dateTo) return true;
      if (!item.date) return true;
      const itemTime = new Date(item.date).getTime();
      if (filters.dateFrom && itemTime < new Date(filters.dateFrom).getTime()) return false;
      if (filters.dateTo && itemTime > new Date(`${filters.dateTo}T23:59:59`).getTime()) return false;
      return true;
    });

    return dateFiltered;
  }, [proposals, distributions, query, filters]);

  // Tab counts
  const counts = useMemo(() => {
    const total = proposals.length;
    const drafts = proposals.filter((p) => p.status === 'draft').length;
    const sent = proposals.filter((p) => p.status === 'sent').length;
    const negotiating = proposals.filter((p) => p.status === 'negotiating').length;
    const accepted = proposals.filter((p) => p.status === 'accepted').length;
    return { total, drafts, sent, negotiating, accepted };
  }, [proposals]);

  const statusTabItems = [
    { value: 'all', label: 'Todas', count: counts.total },
    { value: 'draft', label: 'Rascunhos', count: counts.drafts },
    { value: 'sent', label: 'Enviadas', count: counts.sent },
    { value: 'negotiating', label: 'Em negociação', count: counts.negotiating },
    { value: 'accepted', label: 'Aprovadas', count: counts.accepted },
  ];

  if (companyLoading || loading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!effectiveCompanyId && !companyLoading) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm font-semibold text-amber-800">
        Selecione uma empresa para gerenciar propostas.
      </div>
    );
  }

  // View: Success Screen (Screen 11)
  if (publishedSuccessProposal) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <ProposalSuccessScreen
          proposal={publishedSuccessProposal}
          onViewProposal={() => {
            setSelectedProposal(publishedSuccessProposal);
            setPublishedSuccessProposal(null);
            setIsWizardOpen(true);
          }}
          onBackToList={handleBackToList}
        />
      </main>
    );
  }

  // View: Focused Wizard on mobile/PWA or when user opens proposal (Screen 4-10)
  if (isWizardOpen && selectedProposal) {
    return (
      <main className="mx-auto max-w-7xl px-0 sm:px-6 py-0 sm:py-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <ProposalWizardEditor
            proposal={selectedProposal}
            companyId={Number(effectiveCompanyId)}
            onSaved={(updated) => {
              setProposals((cur) => cur.map((p) => (p.id === updated.id ? updated : p)));
              setSelectedProposal(updated);
            }}
            onBack={handleBackToList}
            onPublishedSuccess={(pub) => {
              setPublishedSuccessProposal(pub);
              setIsWizardOpen(false);
            }}
            onOpenLeadDetails={() => {
              setLeadDetailTarget({
                distribution:
                  distributions.find((d) => d.id === selectedProposal.lead_distribution_id) || null,
                proposal: selectedProposal,
              });
            }}
          />

          {/* Desktop Sidebar: Timeline & History */}
          <div className="hidden lg:block space-y-6">
            <ProposalTimeline proposal={selectedProposal} />
            {selectedProposal.versions && selectedProposal.versions.length > 1 && (
              <CompanyVersionHistory versions={selectedProposal.versions} />
            )}
            <CompanyLifecyclePanel
              proposal={selectedProposal}
              onSaved={(updated) => {
                setProposals((cur) => cur.map((p) => (p.id === updated.id ? updated : p)));
                setSelectedProposal(updated);
              }}
            />
          </div>
        </div>

        {/* Lead Detail Drawer if triggered from wizard */}
        <LeadDetailsDrawer
          isOpen={!!leadDetailTarget}
          onClose={() => setLeadDetailTarget(null)}
          distribution={leadDetailTarget?.distribution || null}
          proposal={leadDetailTarget?.proposal || null}
          onOpenProposal={({ proposal: p, distributionId }) => {
            if (p) handleOpenProposal(p);
            else if (distributionId) void handleCreateProposal(distributionId);
          }}
        />
      </main>
    );
  }

  // View: Main Proposals List (Screen 1 & desktop master-detail)
  return (
    <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
      {/* Screen 1 Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Portal da empresa
          </span>
          <h1 className="mt-0.5 text-2xl font-black text-slate-950 sm:text-3xl">
            Propostas para clientes
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {distributions.length > 0 && (
            <button
              type="button"
              onClick={() => {
                const firstAvailableDist = distributions.find(
                  (d) => !proposals.some((p) => p.lead_distribution_id === d.id)
                );
                if (firstAvailableDist) {
                  void handleCreateProposal(firstAvailableDist.id);
                } else if (proposals.length > 0) {
                  handleOpenProposal(proposals[0]);
                }
              }}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Nova proposta</span>
            </button>
          )}
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800"
        >
          {error}
        </div>
      )}

      {/* Screen 1 Tabs with Counts */}
      <section className="mt-5 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-sm">
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {statusTabItems.map((tab) => {
            const isSelected = filters.status === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, status: tab.value }))}
                className={cn(
                  'flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3.5 text-xs font-bold transition-all',
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[10px] font-black',
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Screen 1 Search bar & Filter Trigger */}
      <div className="mt-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por cliente, proposta ou local..."
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-xs sm:text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <button
          type="button"
          onClick={() => setIsFilterDrawerOpen(true)}
          aria-label="Abrir filtros avançados"
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors',
            filters.category !== 'all' || filters.dateFrom || filters.dateTo
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Main Grid: Mobile single column / Desktop layout */}
      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(340px,0.85fr)_minmax(0,1.4fr)]">
        {/* Left Column: Leads & Proposals List */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Leads e propostas ({unifiedItems.length})
            </h2>
          </div>

          <div className="space-y-3">
            {unifiedItems.map((item) => {
              const lead = item.lead;
              const proposal = item.proposal;
              const dist = item.distribution;
              const statusInfo = getStatusInfo(item.status);
              const isSelected = selectedProposal?.id === proposal?.id;

              return (
                <article
                  key={item.key}
                  className={cn(
                    'rounded-2xl border bg-white p-4 shadow-sm transition-all hover:shadow-md',
                    isSelected && typeof window !== 'undefined' && window.innerWidth >= 1024
                      ? 'border-blue-500 ring-2 ring-blue-100'
                      : 'border-slate-200'
                  )}
                >
                  {/* Top card row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-black text-blue-700">
                        {(lead?.name || 'L')[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-950">
                          {lead?.name || 'Lead sem nome'}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {lead?.product_vertical || 'Solução energética'} ·{' '}
                          {lead?.city ? `${lead.city}, ${lead.state || ''}` : 'Local não informado'}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-bold',
                        statusInfo.bg,
                        statusInfo.text,
                        statusInfo.border
                      )}
                    >
                      {statusInfo.label}
                    </span>
                  </div>

                  {/* Metadata & Values row */}
                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                    <span className="text-slate-400">
                      {item.date
                        ? `Recebido em ${new Date(item.date).toLocaleDateString('pt-BR')}`
                        : '—'}
                    </span>
                    <span className="font-black text-blue-700">
                      {formatBrlCurrency(item.totalCents)}
                    </span>
                  </div>

                  {/* CTAs (hit target >= 44px) */}
                  <div className="mt-3 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setLeadDetailTarget({
                          distribution: dist,
                          proposal: proposal,
                        })
                      }
                      className="min-h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Ver detalhes
                    </button>

                    {proposal ? (
                      <div className="flex items-center gap-2">
                        {proposal.status !== 'draft' && (
                          <button
                            type="button"
                            onClick={() => handleOpenProposal(proposal)}
                            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-blue-600 bg-white px-3.5 text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            Criar nova versão
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenProposal(proposal)}
                          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors"
                        >
                          Abrir proposta
                        </button>
                      </div>
                    ) : dist ? (
                      <button
                        type="button"
                        onClick={() => void handleCreateProposal(dist.id)}
                        disabled={busy === `create-${dist.id}`}
                        className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-60"
                      >
                        {busy === `create-${dist.id}` ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <FilePlus2 className="h-4 w-4" />
                        )}
                        Criar proposta
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}

            {unifiedItems.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
                Nenhuma proposta ou lead encontrado para os filtros selecionados.
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Desktop master-detail preview (Hidden on small screens) */}
        <div className="hidden lg:block space-y-6">
          {selectedProposal ? (
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {selectedProposal.reference}
                    </span>
                    <h3 className="text-xl font-black text-slate-950 mt-1">
                      {selectedProposal.version?.title || 'Proposta comercial'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Lead: {selectedProposal.lead?.name} · {selectedProposal.lead?.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedProposal.status !== 'draft' && (
                      <button
                        type="button"
                        onClick={() => handleOpenProposal(selectedProposal)}
                        className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-blue-600 bg-white px-3.5 text-xs font-bold text-blue-600 hover:bg-blue-50"
                      >
                        Criar nova versão
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenProposal(selectedProposal)}
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
                    >
                      Abrir no editor
                    </button>
                  </div>
                </div>
              </div>

              <ProposalTimeline proposal={selectedProposal} />

              {selectedProposal.versions && selectedProposal.versions.length > 1 && (
                <CompanyVersionHistory versions={selectedProposal.versions} />
              )}

              <CompanyLifecyclePanel
                proposal={selectedProposal}
                onSaved={(updated) => {
                  setProposals((cur) => cur.map((p) => (p.id === updated.id ? updated : p)));
                  setSelectedProposal(updated);
                }}
              />
            </div>
          ) : (
            <div className="flex min-h-[380px] items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-center text-xs text-slate-400">
              Selecione um lead ou proposta para visualizar detalhes na lateral.
            </div>
          )}
        </div>
      </div>

      {/* Screen 2 Drawer: Filtros Avançados */}
      <ProposalFiltersDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={filters}
        onApply={(newFilters) => setFilters(newFilters)}
        onReset={() =>
          setFilters({
            status: 'all',
            category: 'all',
            dateFrom: '',
            dateTo: '',
          })
        }
      />

      {/* Screen 3 Drawer: Detalhes do Lead */}
      <LeadDetailsDrawer
        isOpen={!!leadDetailTarget}
        onClose={() => setLeadDetailTarget(null)}
        distribution={leadDetailTarget?.distribution || null}
        proposal={leadDetailTarget?.proposal || null}
        onOpenProposal={({ proposal: p, distributionId }) => {
          if (p) handleOpenProposal(p);
          else if (distributionId) void handleCreateProposal(distributionId);
        }}
      />
    </main>
  );
}

// Support components: ProposalTimeline, CompanyLifecyclePanel, CompanyVersionHistory
const eventLabels: Record<string, string> = {
  'proposal.created': 'Proposta criada',
  'proposal.sent': 'Proposta publicada',
  'proposal.viewed': 'Visualizada pelo cliente',
  'proposal.change_requested': 'Cliente solicitou ajuste',
  'proposal.version_created': 'Nova versão criada',
  'proposal.accepted': 'Proposta aprovada',
  'proposal.declined': 'Proposta recusada',
  'proposal.withdrawn': 'Proposta retirada',
  'document.attached': 'Documento anexado',
  'document.removed': 'Documento removido',
  'meeting.updated': 'Reunião atualizada',
  'project.updated': 'Projeto atualizado',
  'project.milestone_updated': 'Etapa do projeto atualizada',
};

function ProposalTimeline({ proposal }: { proposal: MarketplaceProposal }) {
  const events = proposal.events || [];

  return (
    <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Clock3 className="h-5 w-5 text-blue-700" />
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Auditoria</p>
          <h2 className="font-black text-slate-950">Linha do tempo</h2>
        </div>
      </div>
      <ol className="mt-5 space-y-0">
        {events.map((event, index) => (
          <li key={event.id} className="relative flex gap-3 pb-5 last:pb-0">
            {index < events.length - 1 && (
              <span className="absolute left-[7px] top-4 h-full w-px bg-slate-200" />
            )}
            <span className="relative mt-1.5 h-4 w-4 shrink-0 rounded-full border-4 border-blue-100 bg-blue-600" />
            <span className="min-w-0">
              <span className="block text-sm font-bold text-slate-900">
                {eventLabels[event.event_type] || event.event_type}
              </span>
              <span className="mt-0.5 block text-xs text-slate-500">
                {new Date(event.occurred_at).toLocaleString('pt-BR')}
              </span>
            </span>
          </li>
        ))}
      </ol>
      {!events.length && (
        <p className="mt-4 text-xs text-slate-400">Nenhum evento registrado para esta proposta.</p>
      )}
    </aside>
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
      const response = await companyMarketplaceProposalsApi.updateMeeting(proposal.id, meetingId, {
        status,
      });
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
      const response = await companyMarketplaceProposalsApi.updateMilestone(
        proposal.id,
        milestoneId,
        {
          status,
          completed_at: status === 'completed' ? new Date().toISOString() : undefined,
        }
      );
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
      {lifecycleError && (
        <p
          role="alert"
          className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800"
        >
          {lifecycleError}
        </p>
      )}
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
          Operação da proposta
        </p>
        <h2 className="mt-1 text-xl font-black text-slate-950">Reuniões e acompanhamento</h2>
        <p className="mt-1 text-xs text-slate-500">
          Atualizações feitas aqui aparecem para o cliente no PWA e no webapp.
        </p>
      </div>

      {meetings.length > 0 && (
        <div className="mt-5 space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase">Reuniões solicitadas</h3>
          {meetings.map((meeting) => (
            <div
              key={meeting.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 p-3"
            >
              <div>
                <p className="font-bold text-slate-900 text-sm">
                  {meeting.meeting_type === 'video' ? 'Videoconferência' : 'Reunião'}
                </p>
                <p className="text-xs text-slate-500">
                  {meeting.scheduled_at
                    ? new Date(meeting.scheduled_at).toLocaleDateString('pt-BR')
                    : 'Horário a combinar'}
                  {meeting.notes ? ' · ' + meeting.notes : ''}
                </p>
              </div>
              <select
                value={meeting.status}
                onChange={(event) => void updateMeeting(meeting.id, event.target.value)}
                disabled={busy === 'meeting-' + meeting.id}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700"
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
            <h3 className="text-xs font-bold text-slate-900 uppercase">Acompanhamento do projeto</h3>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
              {project.status}
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {project.milestones.map((milestone) => (
              <div
                key={milestone.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 p-3"
              >
                <div>
                  <p className="font-bold text-slate-900 text-sm">{milestone.title}</p>
                  <p className="text-xs text-slate-500">{milestone.notes || 'Sem observações'}</p>
                </div>
                <select
                  value={milestone.status}
                  onChange={(event) => void updateMilestone(milestone.id, event.target.value)}
                  disabled={busy === 'milestone-' + milestone.id}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700"
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
          <li
            key={version.id || version.number}
            className="flex gap-3 rounded-2xl border border-slate-200 p-4"
          >
            <span
              className={cn(
                'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black',
                index === 0 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
              )}
            >
              {version.number}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-bold text-slate-950">{version.title}</p>
                <span className="font-black text-blue-700">
                  {formatBrlCurrency(version.total_cents, false)}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {version.status === 'published' ? 'Enviada ao cliente' : 'Rascunho interno'}
              </p>
              {version.summary && <p className="mt-2 text-xs text-slate-600">{version.summary}</p>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
