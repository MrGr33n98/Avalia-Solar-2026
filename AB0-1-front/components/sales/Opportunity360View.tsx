'use client';

import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  DollarSign,
  FileText,
  Flame,
  Globe,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Pencil,
  Phone,
  Plus,
  RotateCw,
  Search,
  Send,
  Sparkles,
  Tag,
  Target,
  User,
  Users,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import UnifiedTimeline, { TimelineEvent } from '@/components/sales/UnifiedTimeline';
import CreateActivityModal from '@/components/sales/create/CreateActivityModal';
import CreateQuoteModal from '@/components/sales/create/CreateQuoteModal';
import CreateTaskModal from '@/components/sales/create/CreateTaskModal';
import SendEmailModal from '@/components/sales/create/SendEmailModal';
import AttachCompanyPersonModal from '@/components/sales/create/AttachCompanyPersonModal';
import { salesApi } from '@/lib/api/sales/client';

interface Opportunity360ViewProps {
  opportunityId: number | null;
  initialData?: any;
  onClose: () => void;
  onUpdated?: () => void;
}

export default function Opportunity360View({ opportunityId, initialData, onClose, onUpdated }: Opportunity360ViewProps) {
  const [opp, setOpp] = useState<any | null>(initialData || null);
  const [loading, setLoading] = useState(false);
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [activePipeline, setActivePipeline] = useState<any | null>(null);
  const [accountContacts, setAccountContacts] = useState<any[]>([]);
  const [isAddPersonModalOpen, setIsAddPersonModalOpen] = useState(false);
  
  // Navigation Tabs: 'recap' | 'sales_process' | 'tasks' | 'activities' | 'emails' | 'timeline'
  const [activeTab, setActiveTab] = useState<'recap' | 'sales_process' | 'tasks' | 'activities' | 'emails' | 'timeline'>('recap');
  const [recapSubTab, setRecapSubTab] = useState<'next_steps' | 'recent' | 'dossier' | 'open_questions'>('next_steps');
  
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [emails, setEmails] = useState<any[]>([]);
  
  // Modals & Action box state
  const [activeModal, setActiveModal] = useState<'call' | 'email' | 'task' | 'quote' | 'note' | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [quickNote, setQuickNote] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // Accordion section collapse state
  const [summaryExpanded, setSummaryExpanded] = useState(true);
  const [companiesExpanded, setCompaniesExpanded] = useState(true);
  const [revenueExpanded, setRevenueExpanded] = useState(true);
  const [documentsExpanded, setDocumentsExpanded] = useState(true);
  
  // Editable fields state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [oppTitle, setOppTitle] = useState(initialData?.name || '');
  const [isEditingValue, setIsEditingValue] = useState(false);
  const [oppValue, setOppValue] = useState(initialData?.value_cents ? (initialData.value_cents / 100).toString() : '0');

  const fetchOpportunityData = async (id: number) => {
    // If we have initial data, don't trigger blank loading screen!
    if (!opp) setLoading(true);
    try {
      // Parallel execution of all required APIs to eliminate waterfall latency
      const [data, fetchedPipelines, rawTimeline] = await Promise.all([
        salesApi.getOpportunity(id),
        salesApi.getPipelines(),
        salesApi.getOpportunityTimeline(id),
      ]);

      setOpp(data);
      setOppTitle(data.name || '');
      setOppValue(data.value_cents ? (data.value_cents / 100).toString() : '0');

      // Fetch contacts for account in parallel if account exists
      if (data.sales_account_id) {
        salesApi.getContacts({ sales_account_id: data.sales_account_id })
          .then((contacts) => setAccountContacts(contacts || []))
          .catch(() => setAccountContacts([]));
      } else {
        setAccountContacts([]);
      }

      setPipelines(fetchedPipelines);
      if (data.sales_pipeline_id) {
        const matchingPipe = fetchedPipelines.find((p: any) => p.id === data.sales_pipeline_id);
        setActivePipeline(matchingPipe || fetchedPipelines[0] || null);
      } else {
        setActivePipeline(fetchedPipelines[0] || null);
      }

      const formattedEvents: TimelineEvent[] = (rawTimeline || []).map((item: any) => ({
        id: String(item.id),
        type: item.type,
        title: item.title,
        description: item.description,
        timestamp: item.occurred_at || new Date().toISOString(),
        actor: item.actor || 'Sistema',
      }));
      setEvents(formattedEvents);

      setTasks((rawTimeline || []).filter((t: any) => t.type === 'task'));
      setActivities((rawTimeline || []).filter((t: any) => t.type === 'call' || t.type === 'activity'));
      setEmails((rawTimeline || []).filter((t: any) => t.type === 'email'));
      setQuotes((rawTimeline || []).filter((t: any) => t.type === 'quote'));
    } catch (err) {
      console.error('Erro ao carregar Oportunidade 360:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (opportunityId) {
      if (initialData) {
        setOpp(initialData);
        setOppTitle(initialData.name || '');
        setOppValue(initialData.value_cents ? (initialData.value_cents / 100).toString() : '0');
      }
      fetchOpportunityData(opportunityId);
    }
  }, [opportunityId]);

  if (!opportunityId) return null;

  const handleStageChange = async (stage: any) => {
    if (!opp || !stage) return;
    try {
      await salesApi.updateOpportunity(opp.id, {
        sales_stage_id: stage.id,
        stage_key: stage.key,
      });
      await fetchOpportunityData(opp.id);
      onUpdated?.();
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar estágio');
    }
  };

  const handleStatusChange = async (newStatus: 'open' | 'won' | 'lost') => {
    if (!opp) return;
    try {
      if (newStatus === 'won') {
        await salesApi.markOpportunityWon(opp.id);
      } else if (newStatus === 'lost') {
        await salesApi.markOpportunityLost(opp.id);
      } else {
        await salesApi.updateOpportunity(opp.id, { status: 'open' });
      }
      await fetchOpportunityData(opp.id);
      onUpdated?.();
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar status');
    }
  };

  const handleSaveTitle = async () => {
    if (!opp || !oppTitle.trim()) return;
    try {
      await salesApi.updateOpportunity(opp.id, { name: oppTitle });
      setIsEditingTitle(false);
      fetchOpportunityData(opp.id);
      onUpdated?.();
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar nome');
    }
  };

  const handleSaveValue = async () => {
    if (!opp) return;
    const valueCents = Math.round(parseFloat(oppValue || '0') * 100);
    try {
      await salesApi.updateOpportunity(opp.id, { value_cents: valueCents });
      setIsEditingValue(false);
      fetchOpportunityData(opp.id);
      onUpdated?.();
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar valor');
    }
  };

  const handleSetPrimaryContact = async (contactId: number) => {
    if (!opp) return;
    try {
      await salesApi.updateOpportunity(opp.id, { primary_contact_id: contactId });
      fetchOpportunityData(opp.id);
      onUpdated?.();
    } catch (err: any) {
      alert(err.message || 'Erro ao definir contato principal');
    }
  };

  const stagesList = activePipeline?.stages || [
    { id: 1, key: 'prospect', name: 'Qualify', position: 1 },
    { id: 2, key: 'proposal', name: 'Pitch', position: 2 },
    { id: 3, key: 'closed', name: 'Close', position: 3 },
  ];

  const currentStageKey = opp?.stage_key || opp?.stage?.key || 'prospect';
  const valueFormatted = opp?.value_cents
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(opp.value_cents / 100)
    : 'R$ 0,00';

  return (
    <>
      <Dialog open={!!opportunityId} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-[1240px] max-h-[92vh] overflow-y-auto p-0 font-sans bg-slate-50 border-slate-200">
          {loading || !opp ? (
            <div className="py-24 text-center space-y-3 bg-white">
              <RotateCw className="mx-auto h-8 w-8 animate-spin text-sky-600" />
              <p className="text-sm font-semibold text-slate-600">Carregando Lead 360° Benchmark Nutshell...</p>
            </div>
          ) : (
            <div className="flex flex-col min-h-[85vh] bg-white">
              {/* TOP HEADER BAR (Nutshell Header) */}
              <div className="bg-white border-b border-slate-200 px-6 py-4 space-y-4 sticky top-0 z-20">
                <div className="flex items-center justify-between gap-4">
                  {/* Left Title & ID */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400">ID #{opp.id}</span>
                    {isEditingTitle ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={oppTitle}
                          onChange={(e) => setOppTitle(e.target.value)}
                          className="h-8 text-lg font-bold w-72 border-slate-300"
                        />
                        <Button size="sm" onClick={handleSaveTitle} className="h-8 bg-sky-600 text-white font-bold">
                          Salvar
                        </Button>
                      </div>
                    ) : (
                      <h1
                        onClick={() => setIsEditingTitle(true)}
                        className="text-xl font-extrabold text-slate-900 tracking-tight hover:text-sky-600 cursor-pointer flex items-center gap-2"
                      >
                        {opp.name}
                        <Pencil className="w-3.5 h-3.5 text-slate-400 opacity-0 hover:opacity-100 transition-opacity" />
                      </h1>
                    )}
                  </div>

                  {/* Right Header Controls (Value Chip, Owner Avatar, Actions) */}
                  <div className="flex items-center gap-3">
                    <div
                      onClick={() => setIsEditingValue(!isEditingValue)}
                      title="Clique para editar o valor"
                      className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 hover:border-emerald-400 rounded-full text-emerald-800 font-extrabold text-sm cursor-pointer transition shadow-2xs group"
                    >
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      <span>{valueFormatted}</span>
                      <Pencil className="w-3 h-3 text-emerald-600 opacity-60 group-hover:opacity-100 ml-0.5" />
                    </div>

                    <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 text-xs font-semibold text-slate-700">
                      <div className="w-5 h-5 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center text-[10px]">
                        F
                      </div>
                      <span>{opp.owner?.name || 'Felipe'}</span>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStatusChange(opp.status === 'won' ? 'open' : 'won')}
                      className={`h-8 px-3 text-xs font-bold rounded-lg ${
                        opp.status === 'won' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-emerald-50'
                      }`}
                    >
                      {opp.status === 'won' ? '✓ Ganho' : 'Marcar Ganho'}
                    </Button>
                  </div>
                </div>

                {/* DYNAMIC PIPELINE STAGE CHEVRON BAR */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-sky-600" />
                      Pipeline: <strong className="text-slate-900">{activePipeline?.name || 'Default Pipeline'}</strong>
                    </span>
                    <span>Estágio atual: <strong className="text-sky-700">{opp.stage?.name || opp.stage_key}</strong></span>
                  </div>

                  <div className="flex items-center w-full overflow-x-auto rounded-lg border border-slate-200 bg-slate-100/80 p-0.5">
                    {stagesList.map((stg: any, index: number) => {
                      const isCurrent = stg.key === currentStageKey || stg.name === opp.stage?.name;
                      const isPassed = index <= stagesList.findIndex((s: any) => s.key === currentStageKey || s.name === opp.stage?.name);

                      return (
                        <button
                          key={stg.id || stg.key}
                          onClick={() => handleStageChange(stg)}
                          className={`flex-1 min-w-[110px] py-2 px-3 text-xs font-bold transition-all flex items-center justify-center gap-1 relative ${
                            isCurrent
                              ? 'bg-sky-600 text-white shadow-xs z-10 font-extrabold'
                              : isPassed
                              ? 'bg-sky-100 text-sky-900 hover:bg-sky-200'
                              : 'bg-white text-slate-600 hover:bg-slate-50 border-l border-slate-200'
                          }`}
                        >
                          <span>{stg.name}</span>
                          {isCurrent && <ChevronRight className="w-4 h-4 ml-1 opacity-80" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* QUICK ACTION TOOLBAR (Nutshell Quick Actions) */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveModal('call')}
                    className="h-8 text-xs font-semibold bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-2xs"
                  >
                    <Phone className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> Log activity
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveModal('note')}
                    className="h-8 text-xs font-semibold bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-2xs"
                  >
                    <Pencil className="w-3.5 h-3.5 mr-1.5 text-amber-600" /> Write note
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveModal('email')}
                    className="h-8 text-xs font-semibold bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-2xs"
                  >
                    <Mail className="w-3.5 h-3.5 mr-1.5 text-sky-600" /> Send email
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveModal('task')}
                    className="h-8 text-xs font-semibold bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-2xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-indigo-600" /> Schedule Task
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveModal('quote')}
                    className="h-8 text-xs font-semibold bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-2xs"
                  >
                    <FileText className="w-3.5 h-3.5 mr-1.5 text-purple-600" /> Proposta Solar
                  </Button>
                </div>
              </div>

              {/* MAIN CONTENT GRID (65% LEFT WORKSPACE / 35% RIGHT SIDEBAR) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 flex-1 bg-slate-50">
                {/* LEFT WORKSPACE (8 COLS / ~65% WIDTH) */}
                <div className="lg:col-span-8 p-6 space-y-6 border-r border-slate-200 bg-white">
                  {/* LEFT SUB-NAVIGATION TABS */}
                  <div className="flex items-center gap-1 border-b border-slate-200 pb-2 text-xs font-bold overflow-x-auto">
                    {[
                      { id: 'recap', label: '🪄 Recap', icon: Sparkles },
                      { id: 'sales_process', label: '🔀 Processo de Vendas', icon: Target },
                      { id: 'tasks', label: `📋 Tarefas (${tasks.length})`, icon: CheckCircle2 },
                      { id: 'activities', label: `📅 Atividades (${activities.length})`, icon: Phone },
                      { id: 'emails', label: `✉️ E-mails & Sequências (${emails.length})`, icon: Mail },
                      { id: 'timeline', label: `⏳ Linha do Tempo (${events.length})`, icon: Clock },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as any)}
                          className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                            activeTab === tab.id
                              ? 'bg-sky-50 text-sky-900 font-extrabold border border-sky-200'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* TAB 1: RECAP (AI Summary & Interactive Chat) */}
                  {activeTab === 'recap' && (
                    <div className="space-y-6">
                      {/* AI Recap Box */}
                      <Card className="border-purple-200 bg-purple-50/40 shadow-2xs">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                            <div className="flex items-center gap-2 text-purple-950 font-extrabold text-xs">
                              <Sparkles className="w-4 h-4 text-purple-700" />
                              <span>Recap Inteligente da Oportunidade</span>
                            </div>
                            <Badge className="bg-purple-200 text-purple-900 text-[10px] font-bold">Avalia AI</Badge>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed font-medium">
                            {opp.recap_summary ||
                              `Lead B2B qualificado de alta prioridade. Projeto solar estimado em ${valueFormatted} para ${
                                opp.account?.name || 'Empresa parceira'
                              }. Contato principal ${opp.contact_name || 'definido'}. Etapa atual exige envio de proposta técnica.`}
                          </p>

                          {/* Recap Sub-tabs */}
                          <div className="flex items-center gap-4 text-xs font-bold pt-2 text-slate-500 border-t border-purple-100">
                            {[
                              { id: 'next_steps', label: 'Próximos passos' },
                              { id: 'recent', label: 'Atividades recentes' },
                              { id: 'dossier', label: 'Dossiê técnico' },
                              { id: 'open_questions', label: 'Perguntas abertas' },
                            ].map((sub) => (
                              <button
                                key={sub.id}
                                onClick={() => setRecapSubTab(sub.id as any)}
                                className={`pb-1 transition-all ${
                                  recapSubTab === sub.id
                                    ? 'text-purple-900 font-extrabold border-b-2 border-purple-700'
                                    : 'hover:text-slate-800'
                                }`}
                              >
                                {sub.label}
                              </button>
                            ))}
                          </div>

                          {recapSubTab === 'next_steps' && (
                            <div className="p-3 bg-white rounded-lg border border-purple-100 text-xs text-slate-600 space-y-1">
                              <p className="font-bold text-slate-900">Recomendação IA:</p>
                              <p>Agendar apresentação técnica de ROI solar com o tomador de decisão até o final da semana.</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* AI Interactive Assistant Input */}
                      <div className="relative flex items-center">
                        <Input
                          placeholder="Pergunte algo sobre este lead (ex: qual o histórico de consumo da usina?)..."
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          className="pr-24 h-11 text-xs border-purple-200 focus:border-purple-500 rounded-xl bg-purple-50/20"
                        />
                        <div className="absolute right-1.5 flex items-center gap-1">
                          <Button size="sm" className="h-8 px-3 bg-purple-900 hover:bg-purple-950 text-white text-xs font-bold rounded-lg">
                            <Send className="w-3.5 h-3.5 mr-1" /> Enviar
                          </Button>
                        </div>
                      </div>

                      {/* Tasks & Activities Summary inside Recap */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Tarefas Pendentes ({tasks.length})</h3>
                          <button onClick={() => setActiveModal('task')} className="text-xs font-bold text-sky-700 hover:underline">
                            + Add task
                          </button>
                        </div>
                        {tasks.length === 0 ? (
                          <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            Nenhuma tarefa em aberto para este lead.
                          </div>
                        ) : (
                          tasks.map((t) => (
                            <div key={t.id} className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-slate-400 cursor-pointer hover:text-emerald-600" />
                                <span className="font-bold text-slate-800">{t.title}</span>
                              </div>
                              <Badge variant="outline" className="text-[10px]">{t.description || 'Pendente'}</Badge>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 2: SALES PROCESS */}
                  {activeTab === 'sales_process' && (
                    <div className="space-y-4 text-xs">
                      <Card className="border-slate-200 bg-white">
                        <CardContent className="p-4 space-y-3">
                          <h3 className="font-bold text-slate-900 text-sm">Etapa Atual: {opp.stage?.name || opp.stage_key}</h3>
                          <p className="text-slate-600">
                            Checklist e diretrizes comerciais configuradas para o pipeline <strong>{activePipeline?.name}</strong>.
                          </p>
                          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                            <label className="flex items-center gap-2 text-slate-800 font-semibold">
                              <input type="checkbox" defaultChecked className="accent-sky-600" /> Confirmar dados do cliente e fatura de energia
                            </label>
                            <label className="flex items-center gap-2 text-slate-800 font-semibold">
                              <input type="checkbox" className="accent-sky-600" /> Realizar dimensionamento preliminar no Software Solar
                            </label>
                            <label className="flex items-center gap-2 text-slate-800 font-semibold">
                              <input type="checkbox" className="accent-sky-600" /> Apresentar proposta comercial de investimento
                            </label>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* TAB 3: TASKS */}
                  {activeTab === 'tasks' && (
                    <div className="space-y-4 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <Badge className="bg-sky-900 text-white font-bold">Abertas ({tasks.length})</Badge>
                          <Badge variant="outline">Concluídas (0)</Badge>
                        </div>
                        <Button size="sm" onClick={() => setActiveModal('task')} className="bg-sky-700 text-white font-bold h-7 text-xs">
                          + Add task
                        </Button>
                      </div>
                      {tasks.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          Nenhuma tarefa cadastrada.
                        </div>
                      ) : (
                        tasks.map((t) => (
                          <div key={t.id} className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                            <span className="font-bold text-slate-800">{t.title}</span>
                            <span className="text-slate-500 text-[11px]">{t.description}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* TAB 4: ACTIVITIES */}
                  {activeTab === 'activities' && (
                    <div className="space-y-4 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <Badge className="bg-sky-900 text-white font-bold">Agendadas ({activities.length})</Badge>
                          <Badge variant="outline">Registradas ({activities.length})</Badge>
                        </div>
                        <Button size="sm" onClick={() => setActiveModal('call')} className="bg-sky-700 text-white font-bold h-7 text-xs">
                          + Schedule activity
                        </Button>
                      </div>
                      {activities.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          Nenhuma atividade registrada.
                        </div>
                      ) : (
                        activities.map((a) => (
                          <div key={a.id} className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                            <span className="font-bold text-slate-800">{a.title}</span>
                            <span className="text-slate-500 text-[11px]">{a.description}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* TAB 5: EMAILS */}
                  {activeTab === 'emails' && (
                    <div className="space-y-4 text-xs">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-sky-900 text-white font-bold">Histórico de E-mails ({emails.length})</Badge>
                        <Button size="sm" onClick={() => setActiveModal('email')} className="bg-sky-700 text-white font-bold h-7 text-xs">
                          + Send email
                        </Button>
                      </div>
                      {emails.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          Nenhum e-mail enviado.
                        </div>
                      ) : (
                        emails.map((e) => (
                          <div key={e.id} className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                            <span className="font-bold text-slate-800">{e.title}</span>
                            <span className="text-slate-500 text-[11px]">{e.description}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* TAB 6: TIMELINE */}
                  {activeTab === 'timeline' && <UnifiedTimeline events={events} />}
                </div>

                {/* RIGHT SIDEBAR (4 COLS / ~35% WIDTH - Nutshell Sidebar Cards) */}
                <div className="lg:col-span-4 p-5 space-y-4 text-xs bg-slate-50">
                  {/* CARD 1: SUMMARY (COLLAPSIBLE) */}
                  <Card className="border-slate-200 bg-white shadow-2xs">
                    <div
                      onClick={() => setSummaryExpanded(!summaryExpanded)}
                      className="p-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between cursor-pointer font-extrabold text-slate-800"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-sky-700" />
                        <span>Summary</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${summaryExpanded ? '' : '-rotate-90'}`} />
                    </div>
                    {summaryExpanded && (
                      <CardContent className="p-4 space-y-3.5">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-semibold">Status</span>
                          <select
                            value={opp.status || 'open'}
                            onChange={(e) => handleStatusChange(e.target.value as any)}
                            className="text-xs font-bold bg-slate-100 border border-slate-300 rounded-md px-2 py-1 text-slate-800"
                          >
                            <option value="open">🚩 Open</option>
                            <option value="won">🟢 Won</option>
                            <option value="lost">🔴 Lost</option>
                          </select>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-semibold">Opened by</span>
                          <span className="font-bold text-slate-800">{opp.owner?.name || 'Felipe'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-semibold">Opened on</span>
                          <span className="font-semibold text-slate-700">
                            {new Date(opp.created_at || Date.now()).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-semibold">Anticipated close date</span>
                          <span className="font-bold text-sky-700 cursor-pointer hover:underline">
                            {opp.expected_close_date || 'Set date...'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-semibold">Confidence</span>
                          <span className="font-bold text-slate-800">{opp.probability || 20}%</span>
                        </div>
                        <div className="pt-2 border-t border-slate-100">
                          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Tags</span>
                          <span className="text-sky-700 font-semibold cursor-pointer hover:underline">+ Add tags...</span>
                        </div>
                      </CardContent>
                    )}
                  </Card>

                  {/* CARD 2: LEAD RESEARCH */}
                  <Card className="border-purple-200 bg-purple-50/50 hover:bg-purple-50 transition cursor-pointer shadow-2xs">
                    <CardContent className="p-3.5 flex items-center justify-between text-purple-950 font-bold">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-700" />
                        <span>Lead research</span>
                      </div>
                      <span className="text-xs text-purple-700 font-extrabold flex items-center gap-1">
                        Start research <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </CardContent>
                  </Card>

                  {/* CARD 3: COMPANIES & PEOPLE */}
                  <Card className="border-slate-200 bg-white shadow-2xs">
                    <div
                      onClick={() => setCompaniesExpanded(!companiesExpanded)}
                      className="p-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between cursor-pointer font-extrabold text-slate-800"
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-sky-700" />
                        <span>Companies & people ({opp.account ? (accountContacts.length > 0 ? accountContacts.length : 1) : 0})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsAddPersonModalOpen(true);
                          }}
                          className="text-sky-700 text-xs font-bold hover:underline cursor-pointer"
                        >
                          + Add
                        </span>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${companiesExpanded ? '' : '-rotate-90'}`} />
                      </div>
                    </div>
                    {companiesExpanded && (
                      <CardContent className="p-4 space-y-3">
                        {opp.account ? (
                          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                                <Building2 className="w-4 h-4 text-sky-700" />
                                <span>{opp.account.name}</span>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setIsAddPersonModalOpen(true)}
                                className="h-6 px-2 text-[11px] font-bold text-sky-700 hover:bg-sky-100"
                              >
                                + Add Pessoa
                              </Button>
                            </div>

                            {/* Contacts List */}
                            {accountContacts && accountContacts.length > 0 ? (
                              <div className="space-y-2 pt-2 border-t border-slate-200">
                                <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Pessoas na Empresa</p>
                                {accountContacts.map((c: any) => {
                                  const contactFullName = c.name || `${c.first_name || ''} ${c.last_name || ''}`.trim();
                                  const isPrimary = opp.contact_id === c.id || opp.primary_contact_id === c.id;
                                  return (
                                    <div key={c.id} className="p-2 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                                      <div className="flex items-start gap-2">
                                        <User className="w-3.5 h-3.5 text-sky-600 mt-0.5 shrink-0" />
                                        <div>
                                          <div className="flex items-center gap-1.5 font-bold text-slate-900">
                                            <span>{contactFullName}</span>
                                            {isPrimary && (
                                              <Badge className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0">Principal</Badge>
                                            )}
                                          </div>
                                          {c.email && <p className="text-[11px] text-slate-500">{c.email}</p>}
                                          {c.job_title && <p className="text-[10px] text-slate-400">{c.job_title}</p>}
                                        </div>
                                      </div>
                                      {!isPrimary && (
                                        <button
                                          onClick={() => handleSetPrimaryContact(c.id)}
                                          className="text-[10px] text-sky-700 font-bold hover:underline bg-sky-50 px-2 py-0.5 rounded border border-sky-200"
                                        >
                                          Definir principal
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : opp.contact_name ? (
                              <div className="pl-3 space-y-1 text-slate-600 border-l-2 border-sky-400 ml-1">
                                <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-xs">
                                  <User className="w-3.5 h-3.5 text-sky-600" />
                                  <span>{opp.contact_name}</span>
                                  <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold ml-auto">Principal</Badge>
                                </div>
                                {opp.contact_email && <p className="text-[11px] text-slate-500">{opp.contact_email}</p>}
                              </div>
                            ) : (
                              <div className="pt-1 text-center space-y-2">
                                <p className="text-slate-500 text-xs">Nenhum contato cadastrado para esta empresa.</p>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setIsAddPersonModalOpen(true)}
                                  className="h-7 text-xs font-bold border-sky-300 text-sky-700 hover:bg-sky-50"
                                >
                                  + Adicionar Pessoa à Empresa
                                </Button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-4 space-y-2">
                            <p className="text-slate-500 text-xs">Nenhuma empresa ou contato vinculado.</p>
                            <Button
                              size="sm"
                              onClick={() => setIsAddPersonModalOpen(true)}
                              className="h-8 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white"
                            >
                              + Vincular Empresa & Adicionar Pessoa
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>

                  {/* CARD 4: REVENUE */}
                  <Card className="border-slate-200 bg-white shadow-2xs">
                    <div
                      onClick={() => setRevenueExpanded(!revenueExpanded)}
                      className="p-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between cursor-pointer font-extrabold text-slate-800"
                    >
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-emerald-600" />
                        <span>Revenue U.S. (USD / BRL)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsEditingValue(!isEditingValue);
                          }}
                          className="text-sky-700 text-xs font-bold hover:underline cursor-pointer"
                        >
                          + {isEditingValue ? 'Cancelar' : 'Editar / Add'}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${revenueExpanded ? '' : '-rotate-90'}`} />
                      </div>
                    </div>
                    {revenueExpanded && (
                      <CardContent className="p-4 text-center space-y-3">
                        {isEditingValue ? (
                          <div className="space-y-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-left">
                            <label className="block text-xs font-bold text-slate-700">Valor da Oportunidade (R$)</label>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-500">R$</span>
                              <Input
                                type="number"
                                step="0.01"
                                value={oppValue}
                                onChange={(e) => setOppValue(e.target.value)}
                                placeholder="0.00"
                                className="h-9 text-base font-bold border-slate-300"
                                autoFocus
                              />
                            </div>
                            <div className="flex items-center gap-2 justify-end pt-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setIsEditingValue(false);
                                  setOppValue(opp?.value_cents ? (opp.value_cents / 100).toString() : '0');
                                }}
                                className="h-8 text-xs"
                              >
                                Cancelar
                              </Button>
                              <Button
                                size="sm"
                                onClick={handleSaveValue}
                                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                              >
                                Salvar Valor
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => setIsEditingValue(true)}
                            className="group cursor-pointer p-3 rounded-lg hover:bg-emerald-50/60 transition border border-transparent hover:border-emerald-200"
                          >
                            <div className="flex items-center justify-center gap-2">
                              <p className="text-2xl font-extrabold text-slate-900">{valueFormatted}</p>
                              <Pencil className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">Clique para editar o valor estimado do negócio.</p>
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>

                  {/* CARD 5: SALES DOCUMENTS */}
                  <Card className="border-slate-200 bg-white shadow-2xs">
                    <div
                      onClick={() => setDocumentsExpanded(!documentsExpanded)}
                      className="p-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between cursor-pointer font-extrabold text-slate-800"
                    >
                      <div className="flex items-center gap-2">
                        <Paperclip className="w-4 h-4 text-sky-700" />
                        <span>Sales documents ({quotes.length})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sky-700 text-xs font-bold hover:underline">+ Add</span>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${documentsExpanded ? '' : '-rotate-90'}`} />
                      </div>
                    </div>
                    {documentsExpanded && (
                      <CardContent className="p-4 text-center space-y-2">
                        {quotes.length === 0 ? (
                          <p className="text-slate-400 text-[11px]">No quotes added</p>
                        ) : (
                          quotes.map((q) => (
                            <div key={q.id} className="p-2 border border-slate-200 rounded text-left">
                              <p className="font-bold text-slate-800">{q.title}</p>
                            </div>
                          ))
                        )}
                      </CardContent>
                    )}
                  </Card>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* QUICK ACTION MODALS */}
      <CreateActivityModal
        open={activeModal === 'call'}
        onClose={() => setActiveModal(null)}
        opportunityId={opp?.id}
        contactId={opp?.contact_id}
        onSuccess={() => {
          fetchOpportunityData(opp.id);
          onUpdated?.();
        }}
      />
      <SendEmailModal
        open={activeModal === 'email'}
        onClose={() => setActiveModal(null)}
        opportunityId={opp?.id}
        contactEmail={opp?.contact_email}
        onSuccess={() => {
          fetchOpportunityData(opp.id);
          onUpdated?.();
        }}
      />
      <CreateTaskModal
        open={activeModal === 'task'}
        onClose={() => setActiveModal(null)}
        opportunityId={opp?.id}
        accountId={opp?.sales_account_id}
        onSuccess={() => {
          fetchOpportunityData(opp.id);
          onUpdated?.();
        }}
      />
      <CreateQuoteModal
        open={activeModal === 'quote'}
        onClose={() => setActiveModal(null)}
        opportunityId={opp?.id}
        onSuccess={() => {
          fetchOpportunityData(opp.id);
          onUpdated?.();
        }}
      />
      {opp && (
        <AttachCompanyPersonModal
          open={isAddPersonModalOpen}
          onClose={() => setIsAddPersonModalOpen(false)}
          opportunityId={opp.id}
          currentAccount={opp.account}
          currentContactId={opp.contact_id || opp.primary_contact_id}
          onSuccess={() => {
            fetchOpportunityData(opp.id);
            onUpdated?.();
          }}
        />
      )}
    </>
  );
}
