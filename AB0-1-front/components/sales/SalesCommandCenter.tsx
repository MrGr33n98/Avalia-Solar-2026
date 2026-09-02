'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
import DashboardLayout from '@/app/dashboard/components/DashboardLayout';
import SolarRoiCalculator from '@/components/sales/SolarRoiCalculator';
import SolarSalesBattlecards from '@/components/sales/SolarSalesBattlecards';
import CRMCommandPalette from '@/components/sales/CRMCommandPalette';

type Deal = {
  id: number;
  stageKey: string;
  company: string;
  plan: string;
  value: string;
  rawCents: number;
  probability: number;
  contact: string;
  email?: string;
  phone?: string;
  next: string | null;
  score: number | null;
};

type ApiOpportunity = {
  id: number;
  name: string;
  value_cents: number;
  probability: number;
  status: string;
  stage_key?: string;
  stage?: { id: number; key: string; name: string };
  account?: { id: number; name: string };
  account_id?: number;
  contact_name?: string;
  owner_id?: number;
  next_activity_at?: string | null;
  score?: number | null;
};

type FetchState = 'idle' | 'loading' | 'error' | 'unauthorized' | 'forbidden' | 'success';

const STAGES = [
  { key: 'prospect', label: '1. Prospect', tone: 'border-slate-300 bg-slate-100 text-slate-700' },
  { key: 'contacted', label: '2. Contatado', tone: 'border-sky-300 bg-sky-50 text-sky-800' },
  { key: 'qualified', label: '3. Qualificado', tone: 'border-blue-300 bg-blue-50 text-blue-900' },
  { key: 'discovery', label: '4. Diagnóstico', tone: 'border-indigo-300 bg-indigo-50 text-indigo-900' },
  { key: 'proposal', label: '5. Proposta', tone: 'border-violet-300 bg-violet-50 text-violet-900' },
  { key: 'negotiation', label: '6. Negociação', tone: 'border-amber-300 bg-amber-50 text-amber-900' },
  { key: 'won', label: '7. Fechado (Won)', tone: 'border-emerald-300 bg-emerald-50 text-emerald-900' },
  { key: 'lost', label: '8. Perdido (Lost)', tone: 'border-red-200 bg-red-50 text-red-800' },
];

const EMPTY_DEAL_DATA: Record<string, Deal[]> = {
  prospect: [],
  contacted: [],
  qualified: [],
  discovery: [],
  proposal: [],
  negotiation: [],
  won: [],
  lost: [],
};

function toastMessage(message: string, type: 'success' | 'error' = 'success') {
  // Simple toast using browser notification — replace with your toast library if available
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
  const grouped: Record<string, Deal[]> = {
    prospect: [], contacted: [], qualified: [], discovery: [],
    proposal: [], negotiation: [], won: [], lost: [],
  };
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
      score: item.score ?? null,
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
}: {
  deal: Deal;
  onOpen: () => void;
  onDragStart: (e: React.DragEvent) => void;
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
        <div>
          <p className="text-sm font-bold text-slate-900 group-hover:text-blue-900">{deal.company}</p>
          <p className="mt-0.5 text-xs text-slate-500">{deal.plan}</p>
        </div>
        <Badge variant="outline" className="border-slate-200 bg-slate-50 text-[10px] font-semibold text-slate-600">
          {deal.probability}%
        </Badge>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm font-extrabold text-blue-950">{deal.value}</span>
        {deal.score !== null && (
          <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-800">
            Score {deal.score}
          </span>
        )}
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

export default function SalesCommandCenter({ pipelineOnly = false }: { pipelineOnly?: boolean }) {
  const [view, setView] = useState<'kanban' | 'table'>('kanban');
  const [dragged, setDragged] = useState<{ deal: Deal; stageKey: string } | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [dealData, setDealData] = useState<Record<string, Deal[]>>(EMPTY_DEAL_DATA);
  const [fetchState, setFetchState] = useState<FetchState>('loading');
  const [search, setSearch] = useState('');
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isNewDealOpen, setIsNewDealOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // New Deal Form State
  const [newName, setNewName] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newStage, setNewStage] = useState('prospect');
  const [newContact, setNewContact] = useState('');

  const loadOpportunities = useCallback(async () => {
    setFetchState('loading');
    try {
      const res = await fetch('/api/v1/sales/opportunities', { credentials: 'include' });
      if (res.status === 401) {
        setFetchState('unauthorized');
        return;
      }
      if (res.status === 403) {
        setFetchState('forbidden');
        return;
      }
      if (!res.ok) {
        setFetchState('error');
        return;
      }
      const data = await res.json();
      const opportunities: ApiOpportunity[] = data?.opportunities ?? [];
      setDealData(mapApiToDeals(opportunities));
      setFetchState('success');
    } catch {
      setFetchState('error');
    }
  }, []);

  useEffect(() => {
    loadOpportunities();
  }, [loadOpportunities]);

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

  const handleDragStart = (deal: Deal, stageKey: string) => {
    setDragged({ deal, stageKey });
  };

  const handleDrop = async (targetStageKey: string) => {
    if (!dragged || dragged.stageKey === targetStageKey) {
      setDragOverStage(null);
      return;
    }

    // 1. Capture snapshot
    const snapshot = JSON.parse(JSON.stringify(dealData)) as Record<string, Deal[]>;

    // 2. Apply optimistic state
    const updatedDeal = { ...dragged.deal, stageKey: targetStageKey };
    setDealData((current) => ({
      ...current,
      [dragged.stageKey]: current[dragged.stageKey].filter((d) => d.id !== dragged.deal.id),
      [targetStageKey]: [...(current[targetStageKey] || []), updatedDeal],
    }));

    setDragged(null);
    setDragOverStage(null);

    // 3. PATCH Rails
    try {
      const res = await fetch(`/api/v1/sales/opportunities/${dragged.deal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ opportunity: { stage_key: targetStageKey } }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        // 4. Rollback on failure
        setDealData(snapshot);
        toastMessage(
          errData?.error?.message || `Erro ao mover oportunidade (${res.status}). Mudança revertida.`,
          'error'
        );
        console.error('[CRM] DnD PATCH falhou', res.status, errData);
        return;
      }

      // 5. Reconcile with real response
      const updated = await res.json();
      if (updated?.opportunity) {
        const opp = updated.opportunity as ApiOpportunity;
        const realKey = opp.stage_key || opp.stage?.key || targetStageKey;
        setDealData((current) => {
          const next = { ...current };
          // Remove from target (has optimistic version with old id)
          next[targetStageKey] = next[targetStageKey].filter((d) => d.id !== dragged.deal.id);
          if (!next[realKey]) next[realKey] = [];
          next[realKey].push({
            id: opp.id,
            stageKey: realKey,
            company: opp.account?.name || opp.name,
            plan: opp.name,
            value: opp.value_cents ? `R$ ${(opp.value_cents / 100).toLocaleString('pt-BR')}` : 'R$ 0',
            rawCents: opp.value_cents || 0,
            probability: opp.probability,
            contact: opp.contact_name || '',
            next: opp.next_activity_at
              ? new Date(opp.next_activity_at).toLocaleDateString('pt-BR')
              : null,
            score: opp.score ?? null,
          });
          return next;
        });
      }

      toastMessage('Oportunidade movida com sucesso.', 'success');
    } catch (err) {
      // Network failure — rollback
      setDealData(snapshot);
      toastMessage('Erro de rede ao mover oportunidade. Mudança revertida.', 'error');
      console.error('[CRM] DnD network error', err);
    }
  };

  const handleCreateNewOpportunity = async () => {
    if (!newName.trim()) {
      setCreateError('O nome da oportunidade é obrigatório.');
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    const rawVal = parseFloat(newValue.replace(/[^0-9,.]/g, '').replace(',', '.'));
    const valueCents = isNaN(rawVal) || rawVal < 0 ? 0 : Math.round(rawVal * 100);

    try {
      const res = await fetch('/api/v1/sales/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          opportunity: {
            name: newName.trim(),
            stage_key: newStage,
            value_cents: valueCents,
          },
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          data?.error?.message ||
          (data?.error?.fields ? Object.values(data.error.fields).flat().join('; ') : null) ||
          `Erro ao criar oportunidade (${res.status}).`;
        setCreateError(msg);
        return;
      }

      const opp: ApiOpportunity = data.opportunity;
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
            probability: opp.probability,
            contact: opp.contact_name || newContact.trim() || '',
            next: null,
            score: null,
          },
        ],
      }));

      toastMessage('Oportunidade criada com sucesso!', 'success');
      setIsNewDealOpen(false);
      setNewName('');
      setNewValue('');
      setNewStage('prospect');
      setNewContact('');
    } catch (err) {
      setCreateError('Erro de rede ao criar oportunidade. Verifique sua conexão.');
      console.error('[CRM] Create opportunity error', err);
    } finally {
      setIsCreating(false);
    }
  };

  const renderFetchStateContent = () => {
    if (fetchState === 'loading') {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-4" data-testid="pipeline-loading">
          <Loader2 className="h-8 w-8 animate-spin text-blue-700" />
          <p className="text-sm text-slate-500">Carregando pipeline comercial...</p>
        </div>
      );
    }
    if (fetchState === 'unauthorized') {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-4" data-testid="pipeline-unauthorized">
          <XCircle className="h-10 w-10 text-amber-500" />
          <p className="font-semibold text-slate-900">Sessão expirada</p>
          <p className="text-sm text-slate-500">Faça login novamente para acessar o CRM.</p>
          <a href="/auth/sign_in">
            <Button className="bg-blue-900 font-bold hover:bg-blue-950">Fazer Login</Button>
          </a>
        </div>
      );
    }
    if (fetchState === 'forbidden') {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-4" data-testid="pipeline-forbidden">
          <XCircle className="h-10 w-10 text-red-500" />
          <p className="font-semibold text-slate-900">Sem permissão de acesso</p>
          <p className="text-sm text-slate-500">O CRM comercial requer autorização de vendas.</p>
        </div>
      );
    }
    if (fetchState === 'error') {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-4" data-testid="pipeline-error">
          <AlertCircle className="h-10 w-10 text-red-500" />
          <p className="font-semibold text-slate-900">Erro ao carregar o pipeline</p>
          <p className="text-sm text-slate-500">Não foi possível conectar à API de vendas.</p>
          <Button onClick={loadOpportunities} variant="outline" className="font-semibold">
            <RefreshCw className="mr-2 h-4 w-4" /> Tentar Novamente
          </Button>
        </div>
      );
    }
    return null;
  };

  return (
    <DashboardLayout className="bg-slate-50/70">
      <CRMCommandPalette />
      <div className="mx-auto w-full max-w-[1700px] space-y-6">
        {/* Executive Header */}
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge className="border-0 bg-blue-900 font-bold text-white shadow-xs">Avalia Solar CRM</Badge>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Workspace do Founder
              </span>
            </div>
            <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              {pipelineOnly ? 'Pipeline Comercial (Kanban)' : 'Sales Command Center'}
            </h1>
            <p className="mt-0.5 text-sm text-slate-600">
              Prospecção ativa, gestão de oportunidades e relacionamento B2B da Avalia Solar.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <SolarRoiCalculator />
            <SolarSalesBattlecards />

            <Link href="/dashboard/sales/import">
              <Button
                variant="outline"
                className="min-h-11 border-slate-300 bg-white font-semibold text-slate-800 shadow-xs hover:bg-slate-50"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4 text-blue-800" />
                Importar Leads (.CSV)
              </Button>
            </Link>

            <Button
              onClick={() => setIsNewDealOpen(true)}
              className="min-h-11 bg-blue-900 font-bold text-white shadow-sm hover:bg-blue-950"
            >
              <Plus className="mr-2 h-4 w-4" /> Nova Oportunidade
            </Button>
          </div>
        </header>

        {/* Sales Workspace Top Sub-Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xs">
          <Link href="/dashboard/sales" className="flex-1 min-w-[130px]">
            <Button
              variant="secondary"
              className="w-full justify-start min-h-10 bg-blue-900 font-bold text-white hover:bg-blue-950"
            >
              <LayoutGrid className="mr-2 h-4 w-4" /> Pipeline Kanban
            </Button>
          </Link>
          <Link href="/dashboard/sales/accounts" className="flex-1 min-w-[130px]">
            <Button
              variant="ghost"
              className="w-full justify-start min-h-10 text-slate-700 hover:bg-slate-100 font-semibold"
            >
              <Users className="mr-2 h-4 w-4 text-blue-800" /> Contas / Prospects
            </Button>
          </Link>
          <Link href="/dashboard/sales/import" className="flex-1 min-w-[130px]">
            <Button
              variant="ghost"
              className="w-full justify-start min-h-10 text-slate-700 hover:bg-slate-100 font-semibold"
            >
              <Database className="mr-2 h-4 w-4 text-blue-800" /> Importar Leads
            </Button>
          </Link>
          <Link href="/dashboard/sales/reports" className="flex-1 min-w-[130px]">
            <Button
              variant="ghost"
              className="w-full justify-start min-h-10 text-slate-700 hover:bg-slate-100 font-semibold"
            >
              <BarChart3 className="mr-2 h-4 w-4 text-blue-800" /> Analytics & Reports
            </Button>
          </Link>
        </div>

        {/* Executive Metrics Overview */}
        {!pipelineOnly && fetchState === 'success' && (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <ExecutiveMetric
              icon={CircleDollarSign}
              label="Pipeline Total"
              value={`R$ ${(totalCents / 100).toLocaleString('pt-BR')}`}
              detail={`${totalDealsCount} oportunidades no pipeline`}
            />
            <ExecutiveMetric
              icon={Target}
              label="Pipeline Ponderado"
              value={`R$ ${(weightedCents / 100).toLocaleString('pt-BR')}`}
              detail="com base na probabilidade de cada estágio"
            />
            <ExecutiveMetric
              icon={CheckCircle2}
              label="Taxa de Fechamento"
              value={`${totalDealsCount > 0 ? Math.round(((dealData['won']?.length || 0) / totalDealsCount) * 100) : 0}%`}
              detail={`${dealData['won']?.length || 0} negócios fechados`}
            />
            <ExecutiveMetric
              icon={Clock3}
              label="Em Negociação"
              value={`${(dealData['negotiation']?.length || 0) + (dealData['proposal']?.length || 0)}`}
              detail="propostas e negociações ativas"
            />
          </div>
        )}

        {/* Pipeline Control Toolbar */}
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardHeader className="flex flex-col gap-4 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-1">
                <Button
                  variant={view === 'kanban' ? ('white' as any) : 'ghost'}
                  size="sm"
                  onClick={() => setView('kanban')}
                  className="font-semibold text-slate-900"
                >
                  <LayoutGrid className="mr-2 h-4 w-4 text-blue-800" /> Kanban
                </Button>
                <Button
                  variant={view === 'table' ? ('white' as any) : 'ghost'}
                  size="sm"
                  onClick={() => setView('table')}
                  className="font-semibold text-slate-900"
                >
                  <ListFilter className="mr-2 h-4 w-4 text-blue-800" /> Tabela
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[240px] flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar empresa ou negócio..."
                  className="min-h-10 border-slate-300 pl-9"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadOpportunities}
                className="border-slate-300 font-semibold text-slate-700"
                disabled={fetchState === 'loading'}
              >
                <RefreshCw className={`h-4 w-4 ${fetchState === 'loading' ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>

          {/* MAIN KANBAN BOARD */}
          <CardContent className="p-4" data-testid="sales-pipeline-board">
            {fetchState !== 'success' ? (
              renderFetchStateContent()
            ) : view === 'kanban' ? (
              <div className="grid gap-3.5 overflow-x-auto pb-4 lg:grid-cols-4 xl:grid-cols-8 min-w-[1400px]">
                {STAGES.map((stage) => {
                  const stageDeals = (dealData[stage.key] || []).filter(visible);
                  const stageCents = stageDeals.reduce((sum, d) => sum + d.rawCents, 0);

                  return (
                    <section
                      key={stage.key}
                      data-testid={`stage-column-${stage.key}`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverStage(stage.key);
                      }}
                      onDragLeave={() => setDragOverStage(null)}
                      onDrop={() => handleDrop(stage.key)}
                      className={`flex min-h-[500px] flex-col rounded-xl border p-3 transition-colors ${
                        dragOverStage === stage.key
                          ? 'border-blue-600 bg-blue-50/80 shadow-md'
                          : 'border-slate-200/90 bg-slate-50/80'
                      }`}
                    >
                      {/* Column Header */}
                      <div className="mb-3 border-b border-slate-200/80 pb-2.5">
                        <div className="flex items-center justify-between">
                          <h2 className="text-xs font-extrabold uppercase tracking-wide text-slate-800">
                            {stage.label}
                          </h2>
                          <Badge
                            variant="outline"
                            className={`border ${stage.tone} text-[11px] font-bold`}
                          >
                            {stageDeals.length}
                          </Badge>
                        </div>
                        <p className="mt-1 text-[11px] font-bold text-blue-950">
                          R$ {(stageCents / 100).toLocaleString('pt-BR')}
                        </p>
                      </div>

                      {/* Cards Container */}
                      <div className="flex-1 space-y-2.5">
                        {stageDeals.map((deal) => (
                          <DealCard
                            key={deal.id}
                            deal={deal}
                            onOpen={() => setSelectedDeal(deal)}
                            onDragStart={(e) => handleDragStart(deal, stage.key)}
                          />
                        ))}

                        {stageDeals.length === 0 && (
                          <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-slate-300 p-3 text-center text-xs text-slate-400">
                            {search
                              ? 'Nenhuma oportunidade encontrada'
                              : 'Sem oportunidades neste estágio'}
                          </div>
                        )}
                      </div>
                    </section>
                  );
                })}
              </div>
            ) : (
              /* TABLE VIEW */
              <div className="overflow-x-auto">
                {allDeals.filter(visible).length === 0 ? (
                  <div className="py-16 text-center" data-testid="pipeline-empty">
                    <Building2 className="mx-auto h-10 w-10 text-slate-300" />
                    <p className="mt-3 font-semibold text-slate-700">
                      {search ? 'Nenhuma oportunidade encontrada para essa busca.' : 'Nenhuma oportunidade cadastrada.'}
                    </p>
                    {!search && (
                      <Button
                        onClick={() => setIsNewDealOpen(true)}
                        className="mt-4 bg-blue-900 font-semibold hover:bg-blue-950"
                      >
                        <Plus className="mr-2 h-4 w-4" /> Criar Primeira Oportunidade
                      </Button>
                    )}
                  </div>
                ) : (
                  <table className="w-full min-w-[800px] text-left text-xs">
                    <thead className="border-b border-slate-200 bg-slate-100 font-bold uppercase text-slate-700">
                      <tr>
                        <th className="p-3">Empresa</th>
                        <th className="p-3">Projeto / Plano</th>
                        <th className="p-3">Estágio</th>
                        <th className="p-3">Valor</th>
                        <th className="p-3">Probabilidade</th>
                        <th className="p-3">Contato</th>
                        <th className="p-3">Próximo Passo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {STAGES.flatMap((stage) =>
                        (dealData[stage.key] || []).filter(visible).map((deal) => (
                          <tr
                            key={deal.id}
                            onClick={() => setSelectedDeal(deal)}
                            className="cursor-pointer transition hover:bg-blue-50/50"
                          >
                            <td className="p-3 font-bold text-slate-900">{deal.company}</td>
                            <td className="p-3 text-slate-600">{deal.plan}</td>
                            <td className="p-3">
                              <Badge
                                variant="outline"
                                className="border-blue-300 bg-blue-50 text-blue-900 font-semibold"
                              >
                                {stage.label}
                              </Badge>
                            </td>
                            <td className="p-3 font-extrabold text-blue-950">{deal.value}</td>
                            <td className="p-3 font-semibold text-slate-700">{deal.probability}%</td>
                            <td className="p-3 text-slate-600">
                              {deal.contact || <span className="italic text-slate-400">Não informado</span>}
                            </td>
                            <td className="p-3 text-slate-500">
                              {deal.next || <span className="italic text-slate-400">—</span>}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* NEW OPPORTUNITY DIALOG */}
      <Dialog open={isNewDealOpen} onOpenChange={(open) => { setIsNewDealOpen(open); if (!open) setCreateError(null); }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Nova Oportunidade Comercial</DialogTitle>
            <DialogDescription>
              Cadastre um novo lead B2B diretamente no seu pipeline de vendas.
            </DialogDescription>
          </DialogHeader>

          {createError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
              <span>{createError}</span>
            </div>
          )}

          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-900">Nome da Oportunidade *</Label>
              <Input
                placeholder="Ex: Projeto Rooftop Solar 100kWp"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="border-slate-300"
                disabled={isCreating}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-900">Estágio Inicial</Label>
                <Select value={newStage} onValueChange={setNewStage} disabled={isCreating}>
                  <SelectTrigger className="border-slate-300">
                    <SelectValue placeholder="Selecione estágio" />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGES.filter((s) => s.key !== 'won' && s.key !== 'lost').map((s) => (
                      <SelectItem key={s.key} value={s.key}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-900">Valor Estimado (R$)</Label>
                <Input
                  placeholder="Ex: 150000"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="border-slate-300"
                  disabled={isCreating}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-900">Contato Principal</Label>
              <Input
                placeholder="Ex: João da Silva"
                value={newContact}
                onChange={(e) => setNewContact(e.target.value)}
                className="border-slate-300"
                disabled={isCreating}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNewDealOpen(false)}
              className="border-slate-300"
              disabled={isCreating}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateNewOpportunity}
              className="bg-blue-900 font-bold hover:bg-blue-950"
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
                </>
              ) : (
                'Salvar Oportunidade'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DEAL DETAIL SIDE DRAWER */}
      {selectedDeal && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-950/40"
          onClick={() => setSelectedDeal(null)}
        >
          <aside
            className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-2xl transition"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <Badge className="border-0 bg-blue-900 text-white font-bold">Oportunidade Comercial</Badge>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">{selectedDeal.company}</h2>
                <p className="text-sm text-slate-500">{selectedDeal.plan}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedDeal(null)}>
                <X className="h-5 w-5 text-slate-500" />
              </Button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-500">Valor do Negócio</p>
                <p className="mt-1 text-xl font-bold text-blue-950">{selectedDeal.value}</p>
              </div>
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-xs font-semibold uppercase text-blue-800">Probabilidade</p>
                <p className="mt-1 text-xl font-bold text-blue-900">{selectedDeal.probability}%</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 border-t border-slate-100 pt-5 space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">Ações Rápidas de Prospecção</h3>
              <div className="flex flex-wrap gap-2">
                {selectedDeal.phone && (
                  <a
                    href={`https://wa.me/55${selectedDeal.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="bg-emerald-700 font-bold hover:bg-emerald-800 text-white">
                      <MessageSquare className="mr-2 h-4 w-4" /> Abrir WhatsApp
                    </Button>
                  </a>
                )}
                {selectedDeal.email && (
                  <a href={`mailto:${selectedDeal.email}`}>
                    <Button variant="outline" className="border-slate-300 font-semibold">
                      <Mail className="mr-2 h-4 w-4 text-blue-800" /> Enviar E-mail
                    </Button>
                  </a>
                )}
                {!selectedDeal.phone && !selectedDeal.email && (
                  <Link href={`/dashboard/sales/accounts`}>
                    <Button variant="outline" className="border-slate-300 font-semibold">
                      <Users className="mr-2 h-4 w-4 text-blue-800" /> Ver Conta
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {/* Contact details */}
            <div className="mt-6 border-t border-slate-100 pt-5 space-y-3">
              <h3 className="font-bold text-slate-900 text-sm">Informações do Contato</h3>
              <div className="rounded-lg border border-slate-200 p-3 space-y-2 text-xs">
                <p className="flex justify-between">
                  <span className="text-slate-500">Nome:</span>
                  <span className="font-bold text-slate-900">
                    {selectedDeal.contact || <span className="italic text-slate-400">Não informado</span>}
                  </span>
                </p>
                <p className="flex justify-between">
                  <span className="text-slate-500">E-mail:</span>
                  <span className="font-medium text-slate-800">
                    {selectedDeal.email || <span className="italic text-slate-400">Não cadastrado</span>}
                  </span>
                </p>
                <p className="flex justify-between">
                  <span className="text-slate-500">Telefone:</span>
                  <span className="font-medium text-slate-800">
                    {selectedDeal.phone || <span className="italic text-slate-400">Não cadastrado</span>}
                  </span>
                </p>
                <p className="flex justify-between">
                  <span className="text-slate-500">Próxima ação:</span>
                  <span className="font-medium text-slate-800">
                    {selectedDeal.next || <span className="italic text-slate-400">Não agendada</span>}
                  </span>
                </p>
              </div>
            </div>
          </aside>
        </div>
      )}
    </DashboardLayout>
  );
}
