'use client';

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  FilePlus2,
  History,
  Loader2,
  Plus,
  SlidersHorizontal,
  X,
  MessageSquare,
  Settings,
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
  matchesGroupedFilter,
  type ProposalGroupedFilter,
} from '@/lib/proposals/domain';
import { ProposalFiltersDrawer, type FilterState } from './proposals/ProposalFiltersDrawer';
import { LeadDetailsDrawer } from './proposals/LeadDetailsDrawer';
import { ProposalWizardEditor } from './proposals/ProposalWizardEditor';
import { ProposalSuccessScreen } from './proposals/ProposalSuccessScreen';
import { ProposalListPane } from './proposals/ProposalListPane';
import { ProposalDetailsPane } from './proposals/ProposalDetailsPane';
import { SelectEligibleLeadDialog } from './proposals/SelectEligibleLeadDialog';
import { ProposalReadonlyPreview } from './proposals/ProposalReadonlyPreview';
import { ProposalSettingsStudio } from './proposals/ProposalSettingsStudio';

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlProposalId = searchParams?.get('id');

  const { activeCompany, isLoading: companyLoading } = useCompanyContext();
  const effectiveCompanyId = propCompanyId || activeCompany?.id;

  const [proposals, setProposals] = useState<MarketplaceProposal[]>([]);
  const [distributions, setDistributions] = useState<Distribution[]>([]);

  // Selection & Deep Link
  const [selectedProposal, setSelectedProposal] = useState<MarketplaceProposal | null>(null);
  const [notFoundProposalId, setNotFoundProposalId] = useState<string | null>(null);

  // Wizard & Success
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [publishedSuccessProposal, setPublishedSuccessProposal] = useState<MarketplaceProposal | null>(null);

  const tabParam = searchParams?.get('tab');

  // Workspace Navigation Tab (Minhas propostas | Modelos e configurações)
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'proposals' | 'settings'>(
    tabParam === 'settings' ? 'settings' : 'proposals'
  );

  // Dialogs & Drawers
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [leadDetailTarget, setLeadDetailTarget] = useState<{
    distribution: Distribution | null;
    proposal: MarketplaceProposal | null;
  } | null>(null);

  // Mobile navigation stage (1 view per screen on mobile/PWA)
  const [mobileView, setMobileView] = useState<'list' | 'details'>('list');

  // Loading & Action states
  const [loading, setLoading] = useState(true);
  const [isCreatingLeadProposal, setIsCreatingLeadProposal] = useState(false);
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [groupedFilter, setGroupedFilter] = useState<ProposalGroupedFilter>('all');
  const [advancedFilters, setAdvancedFilters] = useState<FilterState>({
    status: 'all',
    category: 'all',
    dateFrom: '',
    dateTo: '',
  });

  // Carregamento de dados com resolução estrita de deep link
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

      // Resolução segura de deep-link por ID
      if (urlProposalId) {
        const found = fetchedProposals.find(
          (p) => String(p.id) === urlProposalId || p.reference === urlProposalId
        );
        if (found) {
          setSelectedProposal(found);
          setNotFoundProposalId(null);
        } else {
          // Tentar consulta individual para verificar se o ID existe
          try {
            const single = await companyMarketplaceProposalsApi.get(urlProposalId, effectiveCompanyId);
            if (single?.proposal) {
              setSelectedProposal(single.proposal);
              setNotFoundProposalId(null);
              setProposals((cur) => [
                single.proposal,
                ...cur.filter((p) => p.id !== single.proposal.id),
              ]);
            } else {
              setNotFoundProposalId(urlProposalId);
              setSelectedProposal(null);
            }
          } catch {
            // Falha ao encontrar: alertar explicitamente 404/403 sem selecionar outra proposta silenciosamente
            setNotFoundProposalId(urlProposalId);
            setSelectedProposal(null);
          }
        }
      } else if (typeof window !== 'undefined' && window.innerWidth >= 1024 && fetchedProposals.length > 0) {
        setSelectedProposal(fetchedProposals[0]);
      }
    } catch {
      setError('Não foi possível carregar as propostas da sua empresa.');
    } finally {
      setLoading(false);
    }
  }, [effectiveCompanyId, urlProposalId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Limpar seleção ao trocar de empresa
  useEffect(() => {
    setSelectedProposal(null);
    setNotFoundProposalId(null);
    setMobileView('list');
  }, [effectiveCompanyId]);

  // Contadores por filtro agrupado (cobre 100% dos status de domínio)
  const counts = useMemo(() => {
    return {
      all: proposals.length,
      draft: proposals.filter((p) => matchesGroupedFilter(p.status, 'draft')).length,
      sent_or_review: proposals.filter((p) => matchesGroupedFilter(p.status, 'sent_or_review')).length,
      negotiating: proposals.filter((p) => matchesGroupedFilter(p.status, 'negotiating')).length,
      accepted: proposals.filter((p) => matchesGroupedFilter(p.status, 'accepted')).length,
      closed: proposals.filter((p) => matchesGroupedFilter(p.status, 'closed')).length,
    };
  }, [proposals]);

  // Filtragem da lista
  const filteredProposals = useMemo(() => {
    return proposals.filter((proposal) => {
      // Filtro de status agrupado
      if (!matchesGroupedFilter(proposal.status, groupedFilter)) {
        return false;
      }

      // Filtro de busca textual
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesRef = proposal.reference?.toLowerCase().includes(q);
        const matchesLeadName = proposal.lead?.name?.toLowerCase().includes(q);
        const matchesLeadEmail = proposal.lead?.email?.toLowerCase().includes(q);
        const matchesCity = proposal.lead?.city?.toLowerCase().includes(q);
        const matchesState = proposal.lead?.state?.toLowerCase().includes(q);
        const matchesTitle = proposal.version?.title?.toLowerCase().includes(q);

        if (
          !matchesRef &&
          !matchesLeadName &&
          !matchesLeadEmail &&
          !matchesCity &&
          !matchesState &&
          !matchesTitle
        ) {
          return false;
        }
      }

      // Filtro por data
      if (advancedFilters.dateFrom) {
        const fromDate = new Date(advancedFilters.dateFrom);
        const proposalDate = new Date(proposal.created_at);
        if (proposalDate < fromDate) return false;
      }
      if (advancedFilters.dateTo) {
        const toDate = new Date(`${advancedFilters.dateTo}T23:59:59`);
        const proposalDate = new Date(proposal.created_at);
        if (proposalDate > toDate) return false;
      }

      return true;
    });
  }, [proposals, groupedFilter, searchQuery, advancedFilters]);

  // Selecionar proposta (atualiza URL e central de visualização)
  const handleSelectProposal = (proposal: MarketplaceProposal) => {
    setSelectedProposal(proposal);
    setNotFoundProposalId(null);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('id', String(proposal.id));
      window.history.replaceState({}, '', url.toString());
    }
    setMobileView('details');
  };

  // Criação explícita de proposta a partir de distribuição confirmada
  const handleCreateProposal = async (distributionId: number) => {
    if (!effectiveCompanyId) return;
    setIsCreatingLeadProposal(true);
    setError(null);
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
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('id', String(response.proposal.id));
        window.history.replaceState({}, '', url.toString());
      }
    } catch {
      setError('Não foi possível criar a proposta para a oportunidade selecionada.');
    } finally {
      setIsCreatingLeadProposal(false);
    }
  };

  // Criação de nova versão real via POST /proposals/:id/new_version
  const handleCreateNewVersion = async (proposal: MarketplaceProposal) => {
    if (!effectiveCompanyId) return;
    setIsCreatingVersion(true);
    setError(null);
    try {
      const response = await companyMarketplaceProposalsApi.newVersion(
        proposal.id,
        effectiveCompanyId
      );
      const updated = response.proposal;
      setProposals((cur) => cur.map((p) => (p.id === updated.id ? updated : p)));
      setSelectedProposal(updated);
      // Abre o editor imediatamente no novo rascunho de versão
      setIsWizardOpen(true);
      setPublishedSuccessProposal(null);
    } catch {
      setError('Não foi possível gerar a nova versão para esta proposta.');
    } finally {
      setIsCreatingVersion(false);
    }
  };

  // Visualizar proposta (somente leitura / PDF e Digital)
  const handleViewProposal = (prop: MarketplaceProposal) => {
    setSelectedProposal(prop);
    setIsPreviewModalOpen(true);
  };

  // Abrir wizard de edição
  const handleOpenEditor = (prop: MarketplaceProposal) => {
    setSelectedProposal(prop);
    setIsWizardOpen(true);
    setPublishedSuccessProposal(null);
  };

  // Fechar wizard
  const handleBackFromWizard = () => {
    setIsWizardOpen(false);
    setPublishedSuccessProposal(null);
    void load();
  };

  // Distribuições elegíveis que ainda não possuem proposta
  const eligibleDistributionsCount = distributions.filter(
    (d) => !proposals.some((p) => p.lead_distribution_id === d.id)
  ).length;

  // Telas de carregamento e estado vazio de empresa
  if (companyLoading || loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="mt-3 text-xs font-semibold text-slate-500">
          Carregando propostas empresariais...
        </p>
      </div>
    );
  }

  if (!effectiveCompanyId) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm font-semibold text-amber-800">
        Selecione uma empresa para gerenciar propostas e oportunidades.
      </div>
    );
  }

  // Se a tela de sucesso após publicação estiver ativa
  if (publishedSuccessProposal) {
    return (
      <ProposalSuccessScreen
        proposal={publishedSuccessProposal}
        onBackToList={handleBackFromWizard}
        onViewProposal={() => {
          setPublishedSuccessProposal(null);
          setIsWizardOpen(true);
        }}
      />
    );
  }

  // Se o Wizard de edição estiver ativo
  if (isWizardOpen && selectedProposal) {
    return (
      <div className="h-full w-full overflow-y-auto bg-white rounded-2xl border border-slate-200 shadow-sm">
        <ProposalWizardEditor
          proposal={selectedProposal}
          companyId={effectiveCompanyId}
          onSaved={(updated) => {
            setProposals((cur) => cur.map((p) => (p.id === updated.id ? updated : p)));
            setSelectedProposal(updated);
          }}
          onBack={handleBackFromWizard}
          onPublishedSuccess={(pub) => {
            setProposals((cur) => cur.map((p) => (p.id === pub.id ? pub : p)));
            setSelectedProposal(pub);
            setIsWizardOpen(false);
            setPublishedSuccessProposal(pub);
          }}
          onOpenLeadDetails={() => {
            setLeadDetailTarget({
              proposal: selectedProposal,
              distribution: null,
            });
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Workspace Header Bar */}
      <header className="mb-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Portal da empresa
            </span>
            <h1 className="mt-0.5 text-xl font-black text-slate-950 sm:text-2xl">
              Propostas para clientes
            </h1>
          </div>

          {/* Top-Level Tabs (C.1: Minhas propostas | Modelos e configurações) */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200/80">
            <button
              type="button"
              onClick={() => setActiveWorkspaceTab('proposals')}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-bold transition-all',
                activeWorkspaceTab === 'proposals'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Minhas propostas
            </button>
            <button
              type="button"
              onClick={() => setActiveWorkspaceTab('settings')}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-bold transition-all',
                activeWorkspaceTab === 'settings'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Modelos e configurações
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeWorkspaceTab === 'proposals' && eligibleDistributionsCount > 0 && (
            <button
              type="button"
              onClick={() => setIsCreateDialogOpen(true)}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Nova proposta</span>
            </button>
          )}
        </div>
      </header>

      {/* Alerta de Deep Link Não Encontrado (G-04) */}
      {notFoundProposalId && (
        <div className="mb-2.5 flex items-center justify-between rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs text-amber-900 shadow-xs shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
            <span>
              A proposta com identificador <strong>{notFoundProposalId}</strong> não foi encontrada ou sua empresa não possui permissão para acessá-la.
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setNotFoundProposalId(null);
              if (typeof window !== 'undefined') {
                const url = new URL(window.location.href);
                url.searchParams.delete('id');
                window.history.replaceState({}, '', url.toString());
              }
            }}
            className="rounded-lg bg-amber-200/80 px-2.5 py-1 text-xs font-bold text-amber-900 hover:bg-amber-300 transition-colors"
          >
            Limpar filtro
          </button>
        </div>
      )}

      {/* Alerta de Erro Geral */}
      {error && (
        <div className="mb-2.5 flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-800 shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-500 hover:text-rose-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* ABA 1: MODELOS E CONFIGURAÇÕES                                 */}
      {/* ============================================================== */}
      {activeWorkspaceTab === 'settings' && (
        <div className="flex-1 min-h-0 w-full overflow-hidden">
          <ProposalSettingsStudio onClose={() => setActiveWorkspaceTab('proposals')} />
        </div>
      )}

      {/* ============================================================== */}
      {/* ABA 2: MINHAS PROPOSTAS (DESKTOP >= 1024px - 2 REGIÕES SEM CHAT) */}
      {/* ============================================================== */}
      {activeWorkspaceTab === 'proposals' && (
        <>
          <div className="hidden lg:flex flex-1 gap-3.5 overflow-hidden min-h-0 w-full">
            {/* Coluna 1: Lista e Filtros */}
            <div className="w-[280px] xl:w-[320px] shrink-0 h-full">
              <ProposalListPane
                proposals={filteredProposals}
                selectedProposalId={selectedProposal?.id || null}
                onSelectProposal={handleSelectProposal}
                groupedFilter={groupedFilter}
                onFilterChange={setGroupedFilter}
                counts={counts}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onOpenCreateDialog={() => setIsCreateDialogOpen(true)}
                hasEligibleDistributions={eligibleDistributionsCount > 0}
              />
            </div>

            {/* Coluna 2: Detalhes da Proposta (Ampla, Sem Chat Fixo) */}
            <div className="flex-1 min-w-0 h-full">
              <ProposalDetailsPane
                proposal={selectedProposal}
                companyId={effectiveCompanyId}
                onOpenEditor={handleOpenEditor}
                onViewProposalModal={handleViewProposal}
                onCreateNewVersion={handleCreateNewVersion}
                onProposalUpdated={(updated) => {
                  setProposals((cur) => cur.map((p) => (p.id === updated.id ? updated : p)));
                  setSelectedProposal(updated);
                }}
                isCreatingVersion={isCreatingVersion}
              />
            </div>
          </div>

          {/* ============================================================== */}
          {/* MOBILE / PWA PROGRESSIVE LAYOUT (< 1024px)                     */}
          {/* ============================================================== */}
          <div className="lg:hidden flex-1 flex flex-col min-h-0 w-full">
            {/* Barra de Navegação Progressiva */}
            {mobileView !== 'list' && (
              <div className="mb-2 flex items-center justify-between border-b border-slate-200/80 bg-white px-3 py-2 rounded-xl shadow-xs shrink-0">
                <button
                  type="button"
                  onClick={() => setMobileView('list')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-blue-600"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Voltar para lista de propostas</span>
                </button>
              </div>
            )}

            {/* View 1: Lista */}
            {mobileView === 'list' && (
              <div className="flex-1 min-h-0">
                <ProposalListPane
                  proposals={filteredProposals}
                  selectedProposalId={selectedProposal?.id || null}
                  onSelectProposal={handleSelectProposal}
                  groupedFilter={groupedFilter}
                  onFilterChange={setGroupedFilter}
                  counts={counts}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onOpenCreateDialog={() => setIsCreateDialogOpen(true)}
                  hasEligibleDistributions={eligibleDistributionsCount > 0}
                />
              </div>
            )}

            {/* View 2: Detalhes da Proposta */}
            {mobileView === 'details' && selectedProposal && (
              <div className="flex-1 min-h-0">
                <ProposalDetailsPane
                  proposal={selectedProposal}
                  companyId={effectiveCompanyId}
                  onOpenEditor={handleOpenEditor}
                  onViewProposalModal={handleViewProposal}
                  onCreateNewVersion={handleCreateNewVersion}
                  onProposalUpdated={(updated) => {
                    setProposals((cur) => cur.map((p) => (p.id === updated.id ? updated : p)));
                    setSelectedProposal(updated);
                  }}
                  isCreatingVersion={isCreatingVersion}
                />
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal de Criação Explícita de Proposta (G-05) */}
      <SelectEligibleLeadDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        distributions={distributions}
        existingProposals={proposals}
        onConfirm={handleCreateProposal}
        isCreating={isCreatingLeadProposal}
      />

      {/* Drawer de Filtros Avançados */}
      <ProposalFiltersDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={advancedFilters}
        onApply={(f) => setAdvancedFilters(f)}
        onReset={() =>
          setAdvancedFilters({
            status: 'all',
            category: 'all',
            dateFrom: '',
            dateTo: '',
          })
        }
      />

      {/* Drawer de Detalhes do Lead */}
      <LeadDetailsDrawer
        isOpen={!!leadDetailTarget}
        onClose={() => setLeadDetailTarget(null)}
        distribution={leadDetailTarget?.distribution || null}
        proposal={leadDetailTarget?.proposal || null}
        onOpenProposal={({ proposal: p, distributionId }) => {
          if (p) handleOpenEditor(p);
          else if (distributionId) void handleCreateProposal(distributionId);
        }}
      />

      {/* Modal de Pré-visualização Somente Leitura (PDF / Digital) */}
      <ProposalReadonlyPreview
        isOpen={isPreviewModalOpen}
        proposal={selectedProposal}
        companyId={effectiveCompanyId}
        onClose={() => setIsPreviewModalOpen(false)}
      />
    </div>
  );
}
