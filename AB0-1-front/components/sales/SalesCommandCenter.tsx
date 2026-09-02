'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
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
  Mail,
  MessageSquare,
  MoreHorizontal,
  Phone,
  Plus,
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DashboardLayout from '@/app/dashboard/components/DashboardLayout';

type Deal = {
  id?: number;
  stageKey: string;
  company: string;
  plan: string;
  value: string;
  rawCents: number;
  probability: number;
  contact: string;
  email?: string;
  phone?: string;
  next: string;
  score: number | null;
};

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
      data-testid={`deal-card-${deal.id || deal.company.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
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
          {deal.contact}
        </span>
        <span className="flex items-center gap-1 text-[11px] text-slate-400">
          <CalendarClock className="h-3 w-3" />
          {deal.next}
        </span>
      </div>
    </div>
  );
}

export default function SalesCommandCenter({ pipelineOnly = false }: { pipelineOnly?: boolean }) {
  const [view, setView] = useState<'kanban' | 'table'>('kanban');
  const [dragged, setDragged] = useState<{ deal: Deal; stageKey: string } | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [dealData, setDealData] = useState<Record<string, Deal[]>>({
    prospect: [
      { id: 101, stageKey: 'prospect', company: 'Solar Tech Indústria', plan: 'Projeto B2B 150kWp', value: 'R$ 450.000', rawCents: 45000000, probability: 20, contact: 'Carlos Mendes', email: 'carlos@solartech.com.br', phone: '(11) 98877-6655', next: 'Enviar Apresentação', score: 85 },
      { id: 102, stageKey: 'prospect', company: 'Mercado Real LTDA', plan: 'Sistema Rooftop 45kWp', value: 'R$ 135.000', rawCents: 13500000, probability: 15, contact: 'Fernanda Lima', next: 'Primeiro contato', score: 70 },
    ],
    contacted: [
      { id: 103, stageKey: 'contacted', company: 'Hospital São Lucas', plan: 'Usina Usufruída 300kWp', value: 'R$ 920.000', rawCents: 92000000, probability: 35, contact: 'Dr. Roberto', email: 'roberto@hospitalsaolucas.com.br', phone: '(21) 97654-3210', next: 'Reunião Técnica Agendada', score: 92 },
    ],
    qualified: [
      { id: 104, stageKey: 'qualified', company: 'Engenharia Sol Nascente', plan: 'Plano Assinatura Anual', value: 'R$ 78.000', rawCents: 7800000, probability: 50, contact: 'Marcos Souza', next: 'Validação Fatura Luz', score: 88 },
    ],
    discovery: [],
    proposal: [
      { id: 105, stageKey: 'proposal', company: 'Lumen Solar Distribuidora', plan: 'Projeto Comercial 80kWp', value: 'R$ 240.000', rawCents: 24000000, probability: 70, contact: 'Patrícia Rocha', next: 'Aguardando Aprovação Diretoria', score: 95 },
    ],
    negotiation: [],
    won: [
      { id: 106, stageKey: 'won', company: 'Condomínio Parque Solar', plan: 'Usina Solaria 100kWp', value: 'R$ 310.000', rawCents: 31000000, probability: 100, contact: 'Síndico Fernando', next: 'Contrato Assinado', score: 100 },
    ],
    lost: [],
  });

  const [search, setSearch] = useState('');
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isNewDealOpen, setIsNewDealOpen] = useState(false);

  // New Deal Form State
  const [newCompany, setNewCompany] = useState('');
  const [newPlan, setNewPlan] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newStage, setNewStage] = useState('prospect');
  const [newContact, setNewContact] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');

  // Fetch opportunities from Rails API if available
  useEffect(() => {
    if (typeof fetch === 'undefined') return;
    fetch('/api/v1/sales/opportunities', { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Failed');
        return res.json();
      })
      .then((data) => {
        if (!data?.opportunities || data.opportunities.length === 0) return;
        const grouped: Record<string, Deal[]> = {
          prospect: [],
          contacted: [],
          qualified: [],
          discovery: [],
          proposal: [],
          negotiation: [],
          won: [],
          lost: [],
        };
        data.opportunities.forEach((item: any) => {
          const key = item.stage_key || item.stage?.key || 'prospect';
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push({
            id: item.id,
            stageKey: key,
            company: item.account?.name || item.name || 'Empresa',
            plan: item.name || 'Projeto Solar B2B',
            value: item.value_cents ? `R$ ${(item.value_cents / 100).toLocaleString('pt-BR')}` : 'R$ 0',
            rawCents: item.value_cents || 0,
            probability: item.probability || 30,
            contact: item.contact_name || 'Contato não informado',
            next: item.next_activity_at || 'Follow-up agendado',
            score: item.score || null,
          });
        });
        setDealData(grouped);
      })
      .catch(() => undefined);
  }, []);

  const visible = (deal: Deal) => deal.company.toLowerCase().includes(search.toLowerCase());

  // Total Pipeline Calculations
  const allDeals = Object.values(dealData).flat();
  const totalCents = allDeals.reduce((sum, d) => sum + d.rawCents, 0);
  const weightedCents = allDeals.reduce((sum, d) => sum + Math.round((d.rawCents * d.probability) / 100), 0);
  const totalDealsCount = allDeals.length;

  const handleDragStart = (deal: Deal, stageKey: string) => {
    setDragged({ deal, stageKey });
  };

  const handleDrop = (targetStageKey: string) => {
    if (!dragged || dragged.stageKey === targetStageKey) {
      setDragOverStage(null);
      return;
    }

    const updatedDeal = { ...dragged.deal, stageKey: targetStageKey };
    setDealData((current) => ({
      ...current,
      [dragged.stageKey]: current[dragged.stageKey].filter((d) => d.id !== dragged.deal.id && d.company !== dragged.deal.company),
      [targetStageKey]: [...(current[targetStageKey] || []), updatedDeal],
    }));

    if (dragged.deal.id) {
      fetch(`/api/v1/sales/opportunities/${dragged.deal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ opportunity: { stage_key: targetStageKey } }),
      }).catch(() => undefined);
    }

    setDragged(null);
    setDragOverStage(null);
  };

  const handleCreateNewOpportunity = () => {
    if (!newCompany.trim()) return;

    const rawVal = parseFloat(newValue.replace(/[^0-9,.]/g, '').replace(',', '.')) || 50000;
    const valueCents = Math.round(rawVal * 100);

    const createdDeal: Deal = {
      id: Date.now(),
      stageKey: newStage,
      company: newCompany.trim(),
      plan: newPlan.trim() || 'Projeto Solar B2B',
      value: `R$ ${rawVal.toLocaleString('pt-BR')}`,
      rawCents: valueCents,
      probability: newStage === 'won' ? 100 : newStage === 'proposal' ? 70 : 30,
      contact: newContact.trim() || 'Contato Principal',
      email: newEmail.trim(),
      phone: newPhone.trim(),
      next: 'Primeiro follow-up',
      score: 80,
    };

    setDealData((current) => ({
      ...current,
      [newStage]: [...(current[newStage] || []), createdDeal],
    }));

    // Post to API
    fetch('/api/v1/sales/opportunities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        opportunity: {
          name: createdDeal.plan,
          stage_key: createdDeal.stageKey,
          value_cents: valueCents,
          probability: createdDeal.probability,
        },
      }),
    }).catch(() => undefined);

    setIsNewDealOpen(false);
    setNewCompany('');
    setNewPlan('');
    setNewValue('');
    setNewContact('');
    setNewEmail('');
    setNewPhone('');
  };

  return (
    <DashboardLayout className="bg-slate-50/70">
      <div className="mx-auto w-full max-w-[1700px] space-y-6">
        {/* Executive Header */}
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge className="border-0 bg-blue-900 font-bold text-white shadow-xs">Avalia Solar CRM</Badge>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Workspace do Founder</span>
            </div>
            <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              {pipelineOnly ? 'Pipeline Comercial (Kanban)' : 'Sales Command Center'}
            </h1>
            <p className="mt-0.5 text-sm text-slate-600">
              Prospecção ativa, gestão de oportunidades e relacionamento B2B da Avalia Solar.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link href="/dashboard/sales/import">
              <Button variant="outline" className="min-h-11 border-slate-300 bg-white font-semibold text-slate-800 shadow-xs hover:bg-slate-50">
                <FileSpreadsheet className="mr-2 h-4 w-4 text-blue-800" />
                Importar Leads (.CSV)
              </Button>
            </Link>

            <Button onClick={() => setIsNewDealOpen(true)} className="min-h-11 bg-blue-900 font-bold text-white shadow-sm hover:bg-blue-950">
              <Plus className="mr-2 h-4 w-4" /> Nova Oportunidade
            </Button>
          </div>
        </header>

        {/* Sales Workspace Top Sub-Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xs">
          <Link href="/dashboard/sales" className="flex-1 min-w-[130px]">
            <Button variant="secondary" className="w-full justify-start min-h-10 bg-blue-900 font-bold text-white hover:bg-blue-950">
              <LayoutGrid className="mr-2 h-4 w-4" /> Pipeline Kanban
            </Button>
          </Link>
          <Link href="/dashboard/sales/accounts" className="flex-1 min-w-[130px]">
            <Button variant="ghost" className="w-full justify-start min-h-10 text-slate-700 hover:bg-slate-100 font-semibold">
              <Users className="mr-2 h-4 w-4 text-blue-800" /> Contas / Prospects
            </Button>
          </Link>
          <Link href="/dashboard/sales/import" className="flex-1 min-w-[130px]">
            <Button variant="ghost" className="w-full justify-start min-h-10 text-slate-700 hover:bg-slate-100 font-semibold">
              <Database className="mr-2 h-4 w-4 text-blue-800" /> Importar Leads
            </Button>
          </Link>
          <Link href="/dashboard/sales/reports" className="flex-1 min-w-[130px]">
            <Button variant="ghost" className="w-full justify-start min-h-10 text-slate-700 hover:bg-slate-100 font-semibold">
              <BarChart3 className="mr-2 h-4 w-4 text-blue-800" /> Analytics & Reports
            </Button>
          </Link>
        </div>

        {/* Executive Metrics Overview */}
        {!pipelineOnly && (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <ExecutiveMetric
              icon={CircleDollarSign}
              label="Pipeline Total"
              value={`R$ ${(totalCents / 100).toLocaleString('pt-BR')}`}
              detail={`${totalDealsCount} oportunidades em aberto`}
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
              label="Follow-ups Pendentes"
              value="3 Tarefas"
              detail="1 ação prioritária hoje"
            />
          </div>
        )}

        {/* Pipeline Control Toolbar */}
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardHeader className="flex flex-col gap-4 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-1">
                <Button
                  variant={view === 'kanban' ? 'white' as any : 'ghost'}
                  size="sm"
                  onClick={() => setView('kanban')}
                  className="font-semibold text-slate-900"
                >
                  <LayoutGrid className="mr-2 h-4 w-4 text-blue-800" /> Kanban
                </Button>
                <Button
                  variant={view === 'table' ? 'white' as any : 'ghost'}
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
            </div>
          </CardHeader>

          {/* MAIN KANBAN BOARD */}
          <CardContent className="p-4" data-testid="sales-pipeline-board">
            {view === 'kanban' ? (
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
                          <h2 className="text-xs font-extrabold uppercase tracking-wide text-slate-800">{stage.label}</h2>
                          <Badge variant="outline" className={`border ${stage.tone} text-[11px] font-bold`}>
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
                            key={deal.id || deal.company}
                            deal={deal}
                            onOpen={() => setSelectedDeal(deal)}
                            onDragStart={(e) => handleDragStart(deal, stage.key)}
                          />
                        ))}

                        {stageDeals.length === 0 && (
                          <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-slate-300 p-3 text-center text-xs text-slate-400">
                            Sem oportunidades
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
                          key={deal.id || deal.company}
                          onClick={() => setSelectedDeal(deal)}
                          className="cursor-pointer transition hover:bg-blue-50/50"
                        >
                          <td className="p-3 font-bold text-slate-900">{deal.company}</td>
                          <td className="p-3 text-slate-600">{deal.plan}</td>
                          <td className="p-3">
                            <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-900 font-semibold">
                              {stage.label}
                            </Badge>
                          </td>
                          <td className="p-3 font-extrabold text-blue-950">{deal.value}</td>
                          <td className="p-3 font-semibold text-slate-700">{deal.probability}%</td>
                          <td className="p-3 text-slate-600">{deal.contact}</td>
                          <td className="p-3 text-slate-500">{deal.next}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* NEW OPPORTUNITY DIALOG */}
      <Dialog open={isNewDealOpen} onOpenChange={setIsNewDealOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Nova Oportunidade Comercial</DialogTitle>
            <DialogDescription>Cadastre um novo lead B2B diretamente no seu pipeline de vendas.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-900">Nome da Empresa / Prospect *</Label>
              <Input
                placeholder="Ex: Usina Usufruída Sol Solar"
                value={newCompany}
                onChange={(e) => setNewCompany(e.target.value)}
                className="border-slate-300"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-900">Projeto / Serviço</Label>
                <Input
                  placeholder="Ex: Rooftop 100kWp"
                  value={newPlan}
                  onChange={(e) => setNewPlan(e.target.value)}
                  className="border-slate-300"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-900">Valor Estimado (R$)</Label>
                <Input
                  placeholder="Ex: 150000"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="border-slate-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-900">Estágio Inicial</Label>
                <Select value={newStage} onValueChange={setNewStage}>
                  <SelectTrigger className="border-slate-300">
                    <SelectValue placeholder="Selecione estágio" />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGES.map((s) => (
                      <SelectItem key={s.key} value={s.key}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-900">Nome do Contato</Label>
                <Input
                  placeholder="Ex: João da Silva"
                  value={newContact}
                  onChange={(e) => setNewContact(e.target.value)}
                  className="border-slate-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-900">E-mail</Label>
                <Input
                  placeholder="joao@empresa.com.br"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="border-slate-300"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-900">Telefone / WhatsApp</Label>
                <Input
                  placeholder="(11) 99999-8888"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="border-slate-300"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewDealOpen(false)} className="border-slate-300">
              Cancelar
            </Button>
            <Button onClick={handleCreateNewOpportunity} className="bg-blue-900 font-bold hover:bg-blue-950">
              Salvar Oportunidade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DEAL DETAIL SIDE DRAWER */}
      {selectedDeal && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40" onClick={() => setSelectedDeal(null)}>
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
              </div>
            </div>

            {/* Contact details */}
            <div className="mt-6 border-t border-slate-100 pt-5 space-y-3">
              <h3 className="font-bold text-slate-900 text-sm">Informações do Contato</h3>
              <div className="rounded-lg border border-slate-200 p-3 space-y-2 text-xs">
                <p className="flex justify-between">
                  <span className="text-slate-500">Nome:</span>
                  <span className="font-bold text-slate-900">{selectedDeal.contact}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-slate-500">E-mail:</span>
                  <span className="font-medium text-slate-800">{selectedDeal.email || 'Não cadastrado'}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-slate-500">Telefone:</span>
                  <span className="font-medium text-slate-800">{selectedDeal.phone || 'Não cadastrado'}</span>
                </p>
              </div>
            </div>
          </aside>
        </div>
      )}
    </DashboardLayout>
  );
}
