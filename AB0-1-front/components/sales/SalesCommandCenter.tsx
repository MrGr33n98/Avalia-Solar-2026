'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Database,
  FileSpreadsheet,
  Filter,
  LayoutGrid,
  ListFilter,
  Loader2,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Target,
  UserPlus,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';
import Opportunity360View from '@/components/sales/Opportunity360View';
import SolarRoiCalculator from '@/components/sales/SolarRoiCalculator';
import SolarSalesBattlecards from '@/components/sales/SolarSalesBattlecards';
import CRMCommandPalette from '@/components/sales/CRMCommandPalette';
import CRMModal from '@/components/sales/ui/CRMModal';
import { CRMFormField, CRMFormRow } from '@/components/sales/ui/CRMForm';
import CreateOpportunityDialog from '@/components/sales/opportunities/CreateOpportunityDialog';
import LeadFilterDrawer, { LeadFilters } from '@/components/sales/filters/LeadFilterDrawer';
import SavedViewMenu from '@/components/sales/filters/SavedViewMenu';
import { salesApi, SalesApiError } from '@/lib/api/sales/client';
import { ApiAccount, ApiContact, ApiOpportunity, ApiStage } from '@/lib/api/sales/types';

type Deal = {
  id: number;
  stageKey: string;
  company: string;
  plan: string;
  value: string;
  rawCents: number;
  probability: number;
  contact: string;
  next: string | null;
  score: number | null;
  accountId?: number;
  contactId?: number;
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

function mapApiToDeals(opportunities: ApiOpportunity[]): Record<string, Deal[]> {
  const grouped: Record<string, Deal[]> = {};
  opportunities.forEach((item) => {
    const key = item.stage_key || item.stage?.key || 'prospect';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push({
      id: item.id,
      stageKey: key,
      company: item.account?.name || item.name || 'Empresa',
      plan: item.name || '',
      value: item.value_cents
        ? `R$ ${(item.value_cents / 100).toLocaleString('pt-BR')}`
        : 'R$ 0',
      rawCents: item.value_cents || 0,
      probability: item.probability || 0,
      contact: item.contact_name || '',
      next: item.next_activity_at
        ? new Date(item.next_activity_at).toLocaleDateString('pt-BR')
        : null,
      score: null,
      accountId: item.sales_account_id || item.account?.id,
      contactId: item.primary_contact_id || undefined,
    });
  });
  return grouped;
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

function DealCard({
  deal,
  onOpen,
  onDragStart,
  selected,
  onToggleSelect,
}: {
  deal: Deal;
  onOpen: () => void;
  onDragStart: (e: React.DragEvent) => void;
  selected: boolean;
  onToggleSelect: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onOpen}
      data-testid={`deal-card-${deal.id}`}
      className="group relative cursor-grab rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs transition-all hover:border-blue-700 hover:shadow-md active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <input type="checkbox" checked={selected} onChange={onToggleSelect} onClick={(event) => event.stopPropagation()} aria-label={`Selecionar ${deal.plan}`} className="mt-1 h-3.5 w-3.5 accent-blue-900" />
          <p className="text-sm font-bold text-slate-900 group-hover:text-blue-900">{deal.company}</p>
          <p className="mt-0.5 text-xs text-slate-500">{deal.plan}</p>
        </div>
        <Badge variant="outline" className="border-slate-200 bg-slate-50 text-[10px] font-semibold text-slate-600">
          {deal.probability}%
        </Badge>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <p className="text-sm font-extrabold text-blue-950">{deal.value}</p>
      </div>

      <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-xs text-slate-500">
        <span className="flex items-center gap-1 font-medium text-slate-600">
          <Users className="h-3 w-3 text-slate-400" />
          {deal.contact || <span className="italic text-slate-400">Sem contato</span>}
        </span>
        {deal.next && (
          <span className="flex items-center gap-1 text-[11px] text-slate-400">
            <CalendarClock className="h-3 w-3" />
            {deal.next}
          </span>
        )}
      </div>
    </div>
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
}: {
  pipelineOnly?: boolean;
  hideLayout?: boolean;
}) {
  const [view, setView] = useState<'kanban' | 'table'>('kanban');
  const [dragged, setDragged] = useState<{ deal: Deal; stageKey: string } | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [dealData, setDealData] = useState<Record<string, Deal[]>>({});
  const [fetchState, setFetchState] = useState<FetchState>('loading');
  const [search, setSearch] = useState('');
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isNewDealOpen, setIsNewDealOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [leadFilters, setLeadFilters] = useState<LeadFilters>({});
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [tags, setTags] = useState<import('@/lib/api/sales/types').ApiTag[]>([]);
  const [columnDialogOpen, setColumnDialogOpen] = useState(false);
  const [columns, setColumns] = useState({ company: true, opportunity: true, stage: true, value: true, contact: true });

  // Stages State (initialized with DEFAULT_STAGES so Kanban board is never empty)
  const [stages, setStages] = useState<Array<{ key: string; label: string; bg: string; color: string; probability: number }>>(DEFAULT_STAGES);

  // Accounts & Contacts State
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [contacts, setContacts] = useState<ApiContact[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [selectedContactId, setSelectedContactId] = useState<string>('');

  // Inline Account creation
  const [isInlineAccount, setIsInlineAccount] = useState(false);
  const [inlineAccountName, setInlineAccountName] = useState('');
  const [inlineAccountDomain, setInlineAccountDomain] = useState('');

  // Inline Contact creation
  const [isInlineContact, setIsInlineContact] = useState(false);
  const [inlineContactFirstName, setInlineContactFirstName] = useState('');
  const [inlineContactEmail, setInlineContactEmail] = useState('');

  // New Deal Form State
  const [newName, setNewName] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newStage, setNewStage] = useState('prospect');

  const loadPipelineAndStages = useCallback(async () => {
    try {
      const pipelines = await salesApi.getPipelines();
      const activePipeline = pipelines.find((p) => p.active) || pipelines[0];
      if (activePipeline && activePipeline.stages.length > 0) {
        const mapped = activePipeline.stages.map((s) => stageVisualTone(s.key, s.name, s.probability ?? 50));
        setStages(mapped);
      } else {
        setStages(DEFAULT_STAGES);
      }
    } catch (err) {
      console.error('[CRM] Erro ao carregar estágios do pipeline:', err);
      setStages(DEFAULT_STAGES);
    }
  }, []);

  const loadOpportunities = useCallback(async () => {
    setFetchState('loading');
    try {
      const opportunities = await salesApi.getOpportunities({ per_page: 100, q: search || undefined, ...leadFilters });
      setDealData(mapApiToDeals(opportunities));
      setFetchState('success');
    } catch (err) {
      if (err instanceof SalesApiError) {
        if (err.status === 401) setFetchState('unauthorized');
        else if (err.status === 403) setFetchState('forbidden');
        else setFetchState('error');
      } else {
        setFetchState('error');
      }
    }
  }, [leadFilters, search]);

  const loadAccountsList = useCallback(async () => {
    try {
      const list = await salesApi.getAccounts();
      setAccounts(list);
    } catch (err) {
      console.warn('[CRM] Failed to load accounts list:', err);
    }
  }, []);

  useEffect(() => {
    loadPipelineAndStages();
    const timer = window.setTimeout(loadOpportunities, 250);
    loadAccountsList();
    salesApi.getTags().then(setTags).catch(() => setTags([]));
    return () => window.clearTimeout(timer);
  }, [loadPipelineAndStages, loadOpportunities, loadAccountsList]);

  // Load contacts when selectedAccountId changes
  useEffect(() => {
    if (!selectedAccountId || selectedAccountId === 'NEW_ACCOUNT') {
      setContacts([]);
      setSelectedContactId('');
      return;
    }

    const accId = parseInt(selectedAccountId, 10);
    if (!isNaN(accId)) {
      salesApi.getContacts({ sales_account_id: accId })
        .then((list) => setContacts(list))
        .catch(() => setContacts([]));
    }
  }, [selectedAccountId]);

  const visible = (deal: Deal) =>
    !search || deal.company.toLowerCase().includes(search.toLowerCase()) ||
    deal.plan.toLowerCase().includes(search.toLowerCase());

  const allDeals = Object.values(dealData).flat();
  const totalCents = allDeals.reduce((sum, d) => sum + d.rawCents, 0);
  const weightedCents = allDeals.reduce(
    (sum, d) => sum + Math.round((d.rawCents * d.probability) / 100),
    0
  );
  const totalDealsCount = allDeals.length;

  const toggleSelected = (id: number) => setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);

  const runBulk = async (action: 'status' | 'stage' | 'tag' | 'remove_tag', value: string | number) => {
    if (!selectedIds.length) return;
    try { await salesApi.bulkUpdateOpportunities(selectedIds, action, value); setSelectedIds([]); await loadOpportunities(); toastMessage('Leads atualizados com sucesso.'); }
    catch { toastMessage('Não foi possível atualizar os Leads.', 'error'); }
  };

  const handleDragStart = (deal: Deal, stageKey: string) => {
    setDragged({ deal, stageKey });
  };

  const handleDrop = async (targetStageKey: string) => {
    if (!dragged || dragged.stageKey === targetStageKey) {
      setDragOverStage(null);
      return;
    }

    const snapshot = JSON.parse(JSON.stringify(dealData)) as Record<string, Deal[]>;
    const updatedDeal = { ...dragged.deal, stageKey: targetStageKey };

    setDealData((current) => ({
      ...current,
      [dragged.stageKey]: (current[dragged.stageKey] || []).filter((d) => d.id !== dragged.deal.id),
      [targetStageKey]: [...(current[targetStageKey] || []), updatedDeal],
    }));

    setDragged(null);
    setDragOverStage(null);

    try {
      const opp = await salesApi.updateOpportunityStage(dragged.deal.id, targetStageKey);
      const realKey = opp.stage_key || opp.stage?.key || targetStageKey;

      setDealData((current) => {
        const next = { ...current };
        next[targetStageKey] = (next[targetStageKey] || []).filter((d) => d.id !== dragged.deal.id);
        if (!next[realKey]) next[realKey] = [];
        next[realKey].push({
          id: opp.id,
          stageKey: realKey,
          company: opp.account?.name || opp.name,
          plan: opp.name,
          value: opp.value_cents ? `R$ ${(opp.value_cents / 100).toLocaleString('pt-BR')}` : 'R$ 0',
          rawCents: opp.value_cents || 0,
          probability: opp.probability || 0,
          contact: opp.contact_name || '',
          next: opp.next_activity_at
            ? new Date(opp.next_activity_at).toLocaleDateString('pt-BR')
            : null,
          score: null,
        });
        return next;
      });

      toastMessage('Oportunidade movida com sucesso.', 'success');
    } catch (err) {
      setDealData(snapshot);
      const msg = err instanceof SalesApiError ? err.message : 'Erro ao mover oportunidade. Mudança revertida.';
      toastMessage(msg, 'error');
    }
  };

  const handleCreateNewOpportunity = async () => {
    if (!newName.trim()) {
      setCreateError('O nome da oportunidade é obrigatório.');
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      let finalAccountId: number | null = null;
      let finalContactId: number | null = null;
      let inlineAccountObj: { name: string; domain?: string } | null = null;
      let inlineContactObj: { first_name: string; email?: string } | null = null;

      // 1. Prepare Inline Account if requested
      if (isInlineAccount) {
        if (!inlineAccountName.trim()) {
          setCreateError('O nome da empresa é obrigatório.');
          setIsCreating(false);
          return;
        }
        inlineAccountObj = {
          name: inlineAccountName.trim(),
          domain: inlineAccountDomain.trim() || undefined,
        };
      } else if (selectedAccountId) {
        finalAccountId = parseInt(selectedAccountId, 10);
      }

      if (!finalAccountId && !inlineAccountObj) {
        setCreateError('É obrigatório selecionar ou criar uma Empresa (Account) para a oportunidade.');
        setIsCreating(false);
        return;
      }

      // 2. Prepare Inline Contact if requested
      if (isInlineContact) {
        if (!inlineContactFirstName.trim()) {
          setCreateError('O nome do contato é obrigatório.');
          setIsCreating(false);
          return;
        }
        inlineContactObj = {
          first_name: inlineContactFirstName.trim(),
          email: inlineContactEmail.trim() || undefined,
        };
      } else if (selectedContactId) {
        const cId = parseInt(selectedContactId, 10);
        if (!isNaN(cId)) finalContactId = cId;
      }

      // 3. Parse Value
      const rawVal = parseFloat(newValue.replace(/[^0-9,.]/g, '').replace(',', '.'));
      const valueCents = isNaN(rawVal) || rawVal < 0 ? 0 : Math.round(rawVal * 100);

      // 4. Create Opportunity Atomically
      const opp = await salesApi.createOpportunity({
        sales_account_id: finalAccountId || undefined,
        primary_contact_id: finalContactId || undefined,
        account: inlineAccountObj,
        contact: inlineContactObj,
        name: newName.trim(),
        stage_key: newStage,
        value_cents: valueCents,
        currency: 'BRL',
      });

      const key = opp.stage_key || opp.stage?.key || newStage;

      setDealData((current) => ({
        ...current,
        [key]: [
          ...(current[key] || []),
          {
            id: opp.id,
            stageKey: key,
            company: opp.account?.name || opp.name,
            plan: opp.name,
            value: opp.value_cents ? `R$ ${(opp.value_cents / 100).toLocaleString('pt-BR')}` : 'R$ 0',
            rawCents: opp.value_cents || 0,
            probability: opp.probability || 50,
            contact: opp.contact_name || '',
            next: opp.next_activity_at
              ? new Date(opp.next_activity_at).toLocaleDateString('pt-BR')
              : null,
            score: null,
          },
        ],
      }));

      // Reset Form State
      setIsNewDealOpen(false);
      setNewName('');
      setNewValue('');
      setNewStage('prospect');
      setSelectedAccountId('');
      setSelectedContactId('');
      setIsInlineAccount(false);
      setIsInlineContact(false);
      setInlineAccountName('');
      setInlineAccountDomain('');
      setInlineContactFirstName('');
      setInlineContactEmail('');
      toastMessage('Oportunidade criada com sucesso!', 'success');
    } catch (err) {
      if (err instanceof SalesApiError) {
        setCreateError(err.message);
      } else {
        setCreateError('Erro inesperado ao criar oportunidade.');
      }
    } finally {
      setIsCreating(false);
    }
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
            <div className="relative min-w-[260px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por empresa ou projeto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 border-slate-300 pl-9 text-xs"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => setColumnDialogOpen(true)} className="h-9 border-slate-300 text-xs font-semibold">Colunas</Button>
            <Button variant="outline" size="sm" onClick={() => setFiltersOpen(true)} className="h-9 border-slate-300 text-xs font-semibold">
              <Filter className="mr-1.5 h-3.5 w-3.5 text-slate-500" /> Filtros Avançados
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadOpportunities}
              className="h-9 border-slate-300 text-xs font-semibold"
              title="Atualizar dados do servidor"
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5 text-slate-500" /> Refresh
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {selectedIds.length > 0 && <div className="flex items-center gap-1 rounded-md bg-blue-50 p-1 text-xs"><span className="px-2 font-semibold text-blue-900">{selectedIds.length} selecionados</span><Button size="sm" variant="ghost" onClick={() => runBulk('status', 'won')} className="h-7 text-xs">Marcar ganho</Button><select aria-label="Mover Leads selecionados" defaultValue="" onChange={(event) => { if (event.target.value) runBulk('stage', event.target.value); }} className="h-7 rounded border border-blue-200 bg-white px-1 text-xs"><option value="">Mover para...</option>{stages.map((stage) => <option key={stage.key} value={stage.key}>{stage.label}</option>)}</select><select aria-label="Adicionar tag aos Leads selecionados" defaultValue="" onChange={(event) => { if (event.target.value) runBulk('tag', event.target.value); }} className="h-7 rounded border border-blue-200 bg-white px-1 text-xs"><option value="">Adicionar tag...</option>{tags.map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}</select><select aria-label="Remover tag dos Leads selecionados" defaultValue="" onChange={(event) => { if (event.target.value) runBulk('remove_tag', event.target.value); }} className="h-7 rounded border border-blue-200 bg-white px-1 text-xs"><option value="">Remover tag...</option>{tags.map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}</select><Button size="sm" variant="ghost" onClick={() => setSelectedIds([])} className="h-7 text-xs">Limpar</Button></div>}
            <SavedViewMenu filters={leadFilters} search={search} viewMode={view} onApply={(savedFilters, savedSearch) => { setLeadFilters(savedFilters as LeadFilters); setSearch(savedSearch); }} />
            {pipelineOnly && (
              <Button
                onClick={() => setIsNewDealOpen(true)}
                size="sm"
                className="h-9 bg-blue-900 font-bold text-white shadow-xs hover:bg-blue-950 mr-2"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Nova Oportunidade
              </Button>
            )}
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
          <div className="flex flex-col items-center justify-center py-20 gap-4" data-testid="pipeline-error">
            <AlertCircle className="h-10 w-10 text-red-600" />
            <p className="font-semibold text-slate-900">Não foi possível carregar as oportunidades.</p>
            <Button onClick={loadOpportunities} variant="outline" className="font-bold">
              Tentar Novamente
            </Button>
          </div>
        )}

        {/* KANBAN BOARD */}
        {fetchState === 'success' && view === 'kanban' && (
          <div className="w-full min-w-0 overflow-x-auto overscroll-x-contain pb-3 [scrollbar-color:#94a3b8_transparent] [scrollbar-width:thin]">
            <section data-testid="sales-pipeline-board" className="flex w-max min-w-full gap-3 pb-1 pt-1 select-none sm:gap-4">
            {stages.map((stage) => {
              const list = (dealData[stage.key] || []).filter(visible);
              const stageTotalCents = list.reduce((sum, d) => sum + d.rawCents, 0);
              const isOver = dragOverStage === stage.key;

              return (
                <div
                  data-testid={`stage-column-${stage.key}`}
                  key={stage.key}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverStage(stage.key);
                  }}
                  onDragLeave={() => setDragOverStage(null)}
                  onDrop={() => handleDrop(stage.key)}
                  className={`flex w-[clamp(18rem,82vw,20rem)] max-w-[calc(100vw-2rem)] flex-shrink-0 snap-start flex-col rounded-xl border transition-all ${
                    isOver
                      ? 'border-blue-700 bg-blue-50/50 shadow-md ring-2 ring-blue-700/20'
                      : 'border-slate-200 bg-slate-100/70'
                  }`}
                >
                  {/* Stage Header */}
                  <div className="flex items-center justify-between border-b border-slate-200 bg-white p-3 rounded-t-xl">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block rounded-md border px-2 py-0.5 text-xs font-bold ${stage.bg} ${stage.color}`}>
                        {stage.label}
                      </span>
                      <span className="text-xs font-bold text-slate-500">({list.length})</span>
                    </div>
                    <span className="text-xs font-bold text-slate-700">
                      R$ {(stageTotalCents / 100).toLocaleString('pt-BR')}
                    </span>
                  </div>

                  {/* Deals Container */}
                  <div className="flex flex-1 flex-col gap-3 p-3 min-h-[420px]">
                    {list.length === 0 ? (
                      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-slate-300 p-4 text-center">
                        <p className="text-xs text-slate-400 font-medium">Arraste oportunidades aqui</p>
                      </div>
                    ) : (
                      list.map((deal) => (
                        <DealCard
                          key={deal.id}
                          deal={deal}
                          onOpen={() => setSelectedDeal(deal)}
                          onDragStart={(e) => handleDragStart(deal, stage.key)}
                          selected={selectedIds.includes(deal.id)}
                          onToggleSelect={() => toggleSelected(deal.id)}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
            </section>
          </div>
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

        {/* TABLE VIEW */}
        {fetchState === 'success' && view === 'table' && (
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Empresa</th>
                      <th className="p-3">Oportunidade / Projeto</th>
                      <th className="p-3">Estágio</th>
                      <th className="p-3">Valor Estimado</th>
                      <th className="p-3">Contato Principal</th>
                      <th className="p-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allDeals.filter(visible).map((deal) => (
                      <tr key={deal.id} className="hover:bg-slate-50 transition">
                        {columns.company && <td className="p-3 font-bold text-slate-900">{deal.company}</td>}
                        {columns.opportunity && <td className="p-3 text-slate-700">{deal.plan}</td>}
                        {columns.stage && <td className="p-3">
                          <Badge variant="outline" className="font-semibold border-slate-300">
                            {stages.find((s) => s.key === deal.stageKey)?.label || deal.stageKey}
                          </Badge>
                        </td>}
                        {columns.value && <td className="p-3 font-bold text-blue-900">{deal.value}</td>}
                        {columns.contact && <td className="p-3 text-slate-600">{deal.contact || '—'}</td>}
                        <td className="p-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedDeal(deal)}
                            className="h-7 text-xs font-semibold text-blue-900 hover:text-blue-950"
                          >
                            Ver Detalhes
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* NEW OPPORTUNITY MODAL (DECOUPLED CREATEDIALOG) */}
      <CreateOpportunityDialog
        open={isNewDealOpen}
        onOpenChange={setIsNewDealOpen}
        onSuccess={loadOpportunities}
      />

      {/* OPPORTUNITY 360 BENCHMARK NUTSHELL VIEW */}
      <Opportunity360View
        opportunityId={selectedDeal?.id || null}
        onClose={() => setSelectedDeal(null)}
        onUpdated={loadOpportunities}
      />
    </>
  );

  if (hideLayout) {
    return content;
  }

  return <SalesLayoutWrapper>{content}</SalesLayoutWrapper>;
}
