'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertCircle,
  BarChart3,
  CircleDollarSign,
  FileSpreadsheet,
  Filter,
  LayoutGrid,
  ListFilter,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Target,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';
import Opportunity360View from '@/components/sales/Opportunity360View';
import SolarRoiCalculator from '@/components/sales/SolarRoiCalculator';
import SolarSalesBattlecards from '@/components/sales/SolarSalesBattlecards';
import CRMCommandPalette from '@/components/sales/CRMCommandPalette';
import CreateOpportunityDialog from '@/components/sales/opportunities/CreateOpportunityDialog';
import LeadFilterDrawer, { LeadFilters } from '@/components/sales/filters/LeadFilterDrawer';
import SavedViewMenu from '@/components/sales/filters/SavedViewMenu';
import { PipelineBoard } from '@/components/sales/pipeline/PipelineBoard';
import { salesApi, SalesApiError } from '@/lib/api/sales/client';
import {
  ApiPipelineBoardCard,
  ApiTag,
  PipelineBoardParams,
  NutshellFilterCriteria,
} from '@/lib/api/sales/types';
import { useSalesPipelineBoard, useSalesPipelines } from '@/lib/api/sales/queries';
import NutshellLeadsTable from '@/components/sales/leads/NutshellLeadsTable';

type Deal = {
  id: number;
  stageKey: string;
  stageName?: string;
  stagePosition: number;
  company: string;
  plan: string;
  value: string;
  rawCents: number;
  probability: number;
  contact: string;
  contactPhone?: string | null;
  ownerName?: string | null;
  status: string;
  source?: string | null;
  createdAt?: string;
  expectedCloseDate?: string | null;
  next: string | null;
  score: number | null;
  accountId?: number;
  contactId?: number;
  tags?: Array<{ id: number; name: string; color?: string }>;
};

type FetchState = 'loading' | 'success' | 'unauthorized' | 'forbidden' | 'error';

function stageVisualTone(key: string, name?: string, probability: number = 50) {
  const tones: Record<string, { bg: string; color: string }> = {
    prospect: { bg: 'bg-slate-100', color: 'border-slate-300 text-slate-700' },
    contacted: { bg: 'bg-blue-50', color: 'border-blue-200 text-blue-800' },
    qualified: { bg: 'bg-indigo-50', color: 'border-indigo-200 text-indigo-800' },
    discovery: { bg: 'bg-purple-50', color: 'border-purple-200 text-purple-800' },
    proposal: { bg: 'bg-amber-50', color: 'border-amber-200 text-amber-800' },
    negotiation: { bg: 'bg-orange-50', color: 'border-orange-200 text-orange-800' },
    won: { bg: 'bg-emerald-50', color: 'border-emerald-200 text-emerald-800' },
    lost: { bg: 'bg-red-50', color: 'border-red-200 text-red-800' },
  };
  const defaultTone = { bg: 'bg-slate-50', color: 'border-slate-200 text-slate-700' };
  const tone = tones[key] || defaultTone;
  return {
    key,
    label: name || key.toUpperCase(),
    bg: tone.bg,
    color: tone.color,
    probability,
  };
}

function toastMessage(message: string, type: 'success' | 'error' = 'success') {
  const el = document.createElement('div');
  el.style.cssText = `position:fixed;bottom:24px;right:24px;z-index:9999;padding:12px 20px;border-radius:8px;font-size:14px;font-weight:600;color:white;background:${type === 'success' ? '#1e3a8a' : '#dc2626'};box-shadow:0 4px 12px rgba(0,0,0,0.2);transition:opacity 0.3s;max-width:360px;`;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => document.body.removeChild(el), 300);
  }, 3500);
}

function mapBoardCardsToDeals(cards: ApiPipelineBoardCard[]): Deal[] {
  return cards.map((card) => ({
    id: card.id,
    stageKey: card.stage?.key || 'prospect',
    stageName: card.stage?.name || 'Prospect',
    stagePosition: card.stage?.position ?? 1,
    company: card.account?.name || card.name || 'Empresa',
    plan: card.name || '',
    value: card.value_cents ? `R$ ${(card.value_cents / 100).toLocaleString('pt-BR')}` : 'R$ 0',
    rawCents: card.value_cents || 0,
    probability: card.probability || 0,
    contact: card.primary_contact?.name || '',
    contactPhone: card.primary_contact?.phone || null,
    ownerName: card.owner?.name || null,
    status: card.status || 'open',
    source: card.source || null,
    createdAt: card.created_at,
    expectedCloseDate: card.expected_close_date,
    next: card.next_action?.title || null,
    score: card.qualification?.score || null,
    accountId: card.account?.id,
    contactId: card.primary_contact?.id,
    tags: card.tags || [],
  }));
}

function ExecutiveMetric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Target;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Card className="border-slate-200 bg-white shadow-xs">
      <CardContent className="flex items-start gap-3.5 p-4">
        <div className="rounded-lg bg-blue-900 p-2.5 text-white">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
          <p className="mt-0.5 text-xs text-slate-500">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}

const DEFAULT_STAGES = [
  stageVisualTone('prospect', 'Prospect', 10),
  stageVisualTone('contacted', 'Contacted', 20),
  stageVisualTone('qualified', 'Qualified', 35),
  stageVisualTone('discovery', 'Discovery', 50),
  stageVisualTone('proposal', 'Proposal', 70),
  stageVisualTone('negotiation', 'Negotiation', 85),
  stageVisualTone('won', 'Closed Won', 100),
  stageVisualTone('lost', 'Closed Lost', 0),
];

export default function SalesCommandCenter({
  pipelineOnly = false,
  hideLayout = false,
  hideViewSwitcher = false,
  hideSearch = false,
  hideNewDealButton = false,
  pipelineId,
  refreshVersion = 0,
  initialView = 'kanban',
  searchQuery = '',
  activeQuickFilter = 'all',
  customFilters,
}: {
  pipelineOnly?: boolean;
  hideLayout?: boolean;
  hideViewSwitcher?: boolean;
  hideSearch?: boolean;
  hideNewDealButton?: boolean;
  pipelineId?: number;
  refreshVersion?: number;
  initialView?: 'kanban' | 'table';
  searchQuery?: string;
  activeQuickFilter?: string;
  customFilters?: NutshellFilterCriteria;
}) {
  const [view, setView] = useState<'kanban' | 'table'>(initialView);
  const [search, setSearch] = useState(searchQuery);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isNewDealOpen, setIsNewDealOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [leadFilters, setLeadFilters] = useState<LeadFilters>({});
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [tags, setTags] = useState<ApiTag[]>([]);
  const [columnDialogOpen, setColumnDialogOpen] = useState(false);
  const [columns, setColumns] = useState({ company: true, opportunity: true, stage: true, value: true, contact: true });

  useEffect(() => {
    setView(initialView);
  }, [initialView]);

  useEffect(() => {
    setSearch(searchQuery);
  }, [searchQuery]);

  const { data: pipelines = [], isPending: pipelinesLoading, error: pipelinesError } = useSalesPipelines();
  const resolvedPipelineId = pipelineId ?? pipelines.find((pipeline) => pipeline.active)?.id ?? pipelines[0]?.id;

  const quickFilterParams = useMemo<Partial<PipelineBoardParams>>(() => {
    switch (activeQuickFilter) {
      case 'my_leads':
        return { owner_id: 'me' };
      case 'hot':
        return { temperature: 'hot' };
      case 'closing_this_week':
        return { closing_this_week: true };
      case 'unassigned':
        return { owner_id: 'unassigned' };
      default:
        return {};
    }
  }, [activeQuickFilter]);

  const boardParams = useMemo<PipelineBoardParams>(
    () => ({
      search: search || undefined,
      status: leadFilters.status,
      owner_id: quickFilterParams.owner_id ?? leadFilters.owner_id,
      temperature: quickFilterParams.temperature ?? (leadFilters as any).temperature,
      closing_this_week: quickFilterParams.closing_this_week,
      stage_key: leadFilters.stage_key,
      value_min: leadFilters.value_min,
      value_max: leadFilters.value_max,
      tag_ids: leadFilters.tag_ids,
      filters: customFilters,
    }),
    [leadFilters, search, quickFilterParams, customFilters]
  );
  const {
    data: boardData,
    error: boardQueryError,
    isPending: boardQueryLoading,
    refetch: refetchBoard,
  } = useSalesPipelineBoard(resolvedPipelineId, boardParams);
  const boardError = boardQueryError || pipelinesError;
  const boardLoading = pipelinesLoading || boardQueryLoading;
  const stages = useMemo(
    () =>
      boardData?.stages.map((stage) =>
        stageVisualTone(stage.key, stage.name, stage.probability ?? 50)
      ) ?? DEFAULT_STAGES,
    [boardData]
  );

  useEffect(() => {
    salesApi.getTags().then(setTags).catch(() => setTags([]));
  }, []);

  const refreshBoard = useCallback(async () => {
    await refetchBoard();
  }, [refetchBoard]);

  useEffect(() => {
    if (refreshVersion > 0) void refreshBoard();
  }, [refreshVersion, refreshBoard]);

  const visible = (deal: Deal) => {
    const matchesSearch =
      !search ||
      deal.company.toLowerCase().includes(search.toLowerCase()) ||
      deal.plan.toLowerCase().includes(search.toLowerCase());
    const matchesTags =
      !leadFilters.tag_ids ||
      leadFilters.tag_ids.length === 0 ||
      (deal.tags && deal.tags.some((t) => leadFilters.tag_ids?.includes(t.id)));
    return Boolean(matchesSearch && matchesTags);
  };

  const allDeals = useMemo(() => mapBoardCardsToDeals(boardData?.cards ?? []), [boardData]);
  const totalCents = allDeals.reduce((sum, d) => sum + d.rawCents, 0);
  const weightedCents = allDeals.reduce(
    (sum, d) => sum + Math.round((d.rawCents * d.probability) / 100),
    0
  );
  const totalDealsCount = allDeals.length;
  const fetchState: FetchState = boardLoading
    ? 'loading'
    : boardError instanceof SalesApiError && boardError.status === 401
      ? 'unauthorized'
      : boardError instanceof SalesApiError && boardError.status === 403
        ? 'forbidden'
        : boardError
          ? 'error'
          : 'success';

  const errorDiagnostics = useMemo(() => {
    if (boardError instanceof SalesApiError) {
      const parts = [];
      if (boardError.status) parts.push(`Status HTTP: ${boardError.status}`);
      if (boardError.code) parts.push(`Código: ${boardError.code}`);
      if (boardError.requestId) parts.push(`Request ID: ${boardError.requestId}`);
      return parts.length > 0 ? parts.join(' • ') : boardError.message;
    }
    return boardError instanceof Error ? boardError.message : null;
  }, [boardError]);

  const toggleSelected = (id: number) => setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);

  const runBulk = async (action: 'status' | 'stage' | 'tag' | 'remove_tag', value: string | number) => {
    if (!selectedIds.length) return;
    try { await salesApi.bulkUpdateOpportunities(selectedIds, action, value); setSelectedIds([]); await refreshBoard(); toastMessage('Leads atualizados com sucesso.'); }
    catch { toastMessage('Não foi possível atualizar os Leads.', 'error'); }
  };

  const content = (
    <>
      <CRMCommandPalette />
      <div className="mx-auto w-full max-w-[1700px] space-y-6">
        {/* Executive Header */}
        {!pipelineOnly && (
          <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Badge className="border-0 bg-blue-900 font-bold text-white">Avalia Solar CRM</Badge>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pipeline de Vendas B2B</span>
              </div>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                Sales Command Center
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Prospecção ativa, gestão de oportunidades e relacionamento B2B no setor solar.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <SolarRoiCalculator />
              <SolarSalesBattlecards />
              <Link href="/dashboard/sales/import">
                <Button variant="outline" className="border-slate-300 bg-white font-semibold text-slate-800 hover:bg-slate-50">
                  <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" />
                  Importar Leads (CSV)
                </Button>
              </Link>
              <Button
                onClick={() => setIsNewDealOpen(true)}
                className="bg-blue-900 font-bold text-white shadow-xs hover:bg-blue-950"
              >
                <Plus className="mr-2 h-4 w-4" /> Nova Oportunidade
              </Button>
            </div>
          </header>
        )}

        {/* Executive KPIs */}
        {!pipelineOnly && (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ExecutiveMetric
              icon={CircleDollarSign}
              label="Pipeline Aberto"
              value={`R$ ${(totalCents / 100).toLocaleString('pt-BR')}`}
              detail={`${totalDealsCount} oportunidades ativas`}
            />
            <ExecutiveMetric
              icon={Target}
              label="Pipeline Ponderado"
              value={`R$ ${(weightedCents / 100).toLocaleString('pt-BR')}`}
              detail="Ajustado por probabilidade"
            />
            <ExecutiveMetric
              icon={Activity}
              label="Oportunidades Mapeadas"
              value={String(totalDealsCount)}
              detail="Projetos solares B2B"
            />
            <ExecutiveMetric
              icon={BarChart3}
              label="Taxa de Conversão"
              value="34.8%"
              detail="Proposta → Fechamento"
            />
          </section>
        )}

        {/* Pipeline Control Toolbar */}
        <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            {!hideSearch && !hideLayout && (
              <div className="relative w-full sm:w-auto sm:min-w-[200px] md:min-w-[240px]">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar por empresa ou projeto..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 border-slate-300 pl-9 text-xs w-full"
                />
              </div>
            )}
            <Button variant="outline" size="sm" onClick={() => setColumnDialogOpen(true)} className="h-9 border-slate-300 text-xs font-semibold">Colunas</Button>
            <Button variant="outline" size="sm" onClick={() => setFiltersOpen(true)} className="h-9 border-slate-300 text-xs font-semibold">
              <Filter className="mr-1.5 h-3.5 w-3.5 text-slate-500" /> Filtros Avançados
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refreshBoard()}
              className="h-9 border-slate-300 text-xs font-semibold"
              title="Atualizar dados do servidor"
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5 text-slate-500" /> Refresh
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {selectedIds.length > 0 && <div className="flex items-center gap-1 rounded-md bg-blue-50 p-1 text-xs"><span className="px-2 font-semibold text-blue-900">{selectedIds.length} selecionados</span><Button size="sm" variant="ghost" onClick={() => runBulk('status', 'won')} className="h-7 text-xs">Marcar ganho</Button><select aria-label="Mover Leads selecionados" defaultValue="" onChange={(event) => { if (event.target.value) runBulk('stage', event.target.value); }} className="h-7 rounded border border-blue-200 bg-white px-1 text-xs"><option value="">Mover para...</option>{stages.map((stage) => <option key={stage.key} value={stage.key}>{stage.label}</option>)}</select><select aria-label="Adicionar tag aos Leads selecionados" defaultValue="" onChange={(event) => { if (event.target.value) runBulk('tag', event.target.value); }} className="h-7 rounded border border-blue-200 bg-white px-1 text-xs"><option value="">Adicionar tag...</option>{tags.map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}</select><select aria-label="Remover tag dos Leads selecionados" defaultValue="" onChange={(event) => { if (event.target.value) runBulk('remove_tag', event.target.value); }} className="h-7 rounded border border-blue-200 bg-white px-1 text-xs"><option value="">Remover tag...</option>{tags.map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}</select><Button size="sm" variant="ghost" onClick={() => setSelectedIds([])} className="h-7 text-xs">Limpar</Button></div>}
            <SavedViewMenu filters={leadFilters} search={search} viewMode={view} onApply={(savedFilters, savedSearch) => { setLeadFilters(savedFilters as LeadFilters); setSearch(savedSearch); }} />
            {pipelineOnly && !hideLayout && !hideNewDealButton && (
              <Button
                onClick={() => setIsNewDealOpen(true)}
                size="sm"
                className="h-9 bg-blue-900 font-bold text-white shadow-xs hover:bg-blue-950 mr-2"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Nova Oportunidade
              </Button>
            )}
            {!hideViewSwitcher && !hideLayout && (
              <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
                <button
                  onClick={() => setView('kanban')}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-bold transition-all ${
                    view === 'kanban' ? 'bg-white text-blue-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" /> Kanban
                </button>
                <button
                  onClick={() => setView('table')}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-bold transition-all ${
                    view === 'table' ? 'bg-white text-blue-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ListFilter className="h-3.5 w-3.5" /> Tabela
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Dynamic Fetch States */}
        {fetchState === 'loading' && (
          <div className="flex flex-col items-center justify-center py-20 gap-3" data-testid="pipeline-loading">
            <Loader2 className="h-8 w-8 animate-spin text-blue-900" />
            <p className="text-sm font-semibold text-slate-600">Carregando pipeline comercial...</p>
          </div>
        )}

        {fetchState === 'unauthorized' && (
          <div className="flex flex-col items-center justify-center py-20 gap-4" data-testid="pipeline-unauthorized">
            <XCircle className="h-10 w-10 text-amber-500" />
            <p className="font-semibold text-slate-900">Sessão expirada</p>
            <p className="text-sm text-slate-500">Faça login novamente para acessar o CRM.</p>
            <a href="/login">
              <Button className="bg-blue-900 font-bold hover:bg-blue-950">Fazer Login</Button>
            </a>
          </div>
        )}

        {fetchState === 'forbidden' && (
          <div className="flex flex-col items-center justify-center py-20 gap-4" data-testid="pipeline-forbidden">
            <XCircle className="h-10 w-10 text-red-500" />
            <p className="font-semibold text-slate-900">Você não possui permissão para esta operação.</p>
          </div>
        )}

        {fetchState === 'error' && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center" data-testid="pipeline-error">
            <AlertCircle className="h-10 w-10 text-red-600" />
            <p className="font-semibold text-slate-900">Não foi possível carregar as oportunidades.</p>
            {errorDiagnostics && (
              <p className="text-xs font-mono text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg max-w-md">
                {errorDiagnostics}
              </p>
            )}
            <Button onClick={() => void refreshBoard()} variant="outline" className="font-bold mt-2">
              Tentar Novamente
            </Button>
          </div>
        )}

        {/* KANBAN BOARD (DECOUPLED PIPELINE BOARD V4) */}
        {fetchState === 'success' && view === 'kanban' && (
          <PipelineBoard
            boardData={boardData}
            loading={boardLoading}
            error={boardError instanceof Error ? boardError : null}
            onRefresh={refreshBoard}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelected}
            onOpenDetails={(card) => setSelectedDeal(mapBoardCardsToDeals([card])[0])}
          />
        )}

        <LeadFilterDrawer
          open={filtersOpen}
          onOpenChange={setFiltersOpen}
          filters={leadFilters}
          stages={stages}
          tags={tags}
          onApply={setLeadFilters}
          onClear={() => setLeadFilters({})}
        />

        <Dialog open={columnDialogOpen} onOpenChange={setColumnDialogOpen}><DialogContent className="w-[calc(100vw-1.5rem)] max-w-sm"><DialogHeader><DialogTitle>Colunas do Lead</DialogTitle><DialogDescription>Escolha campos visíveis na tabela.</DialogDescription></DialogHeader><div className="grid gap-3 py-3">{Object.entries(columns).map(([key, enabled]) => <label key={key} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={enabled} onChange={() => setColumns((current) => ({ ...current, [key]: !current[key as keyof typeof current] }))} />{key}</label>)}</div></DialogContent></Dialog>

        {/* TABLE VIEW: PADRÃO CANÔNICO NUTSHELL CRM */}
        {fetchState === 'success' && view === 'table' && (
          <NutshellLeadsTable
            leads={allDeals.filter(visible)}
            onSelectLead={(lead) => {
              const matchingDeal = allDeals.find((d) => d.id === lead.id);
              if (matchingDeal) setSelectedDeal(matchingDeal);
            }}
            totalStagesCount={stages.length}
            allTags={tags}
            selectedTagIds={leadFilters.tag_ids}
            onTagFilterChange={(tagId) => {
              setLeadFilters((prev) => {
                const current = prev.tag_ids || [];
                const next = current.includes(tagId)
                  ? current.filter((id) => id !== tagId)
                  : [...current, tagId];
                return { ...prev, tag_ids: next.length > 0 ? next : undefined };
              });
            }}
          />
        )}
      </div>

      {/* NEW OPPORTUNITY MODAL (DECOUPLED CREATEDIALOG) */}
      <CreateOpportunityDialog
        open={isNewDealOpen}
        onOpenChange={setIsNewDealOpen}
        onSuccess={refreshBoard}
      />

      {/* OPPORTUNITY 360 BENCHMARK NUTSHELL VIEW */}
      <Opportunity360View
        opportunityId={selectedDeal?.id || null}
        initialData={
          selectedDeal
            ? {
                id: selectedDeal.id,
                name: selectedDeal.plan || selectedDeal.company,
                value_cents: selectedDeal.rawCents,
                account: { name: selectedDeal.company },
                contact_name: selectedDeal.contact,
                probability: selectedDeal.probability,
              }
            : null
        }
        onClose={() => setSelectedDeal(null)}
        onUpdated={refreshBoard}
      />
    </>
  );

  if (hideLayout) {
    return content;
  }

  return <SalesLayoutWrapper>{content}</SalesLayoutWrapper>;
}
