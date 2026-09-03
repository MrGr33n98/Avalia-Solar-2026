'use client';

import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Flame,
  Mail,
  MessageSquare,
  Phone,
  RotateCw,
  Sparkles,
  Target,
  User,
  Users,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import UnifiedTimeline, { TimelineEvent } from '@/components/sales/UnifiedTimeline';
import CreateActivityModal from '@/components/sales/create/CreateActivityModal';
import CreateQuoteModal from '@/components/sales/create/CreateQuoteModal';
import CreateTaskModal from '@/components/sales/create/CreateTaskModal';
import SendEmailModal from '@/components/sales/create/SendEmailModal';
import { salesApi } from '@/lib/api/sales/client';

interface Opportunity360ViewProps {
  opportunityId: number | null;
  onClose: () => void;
  onUpdated?: () => void;
}

export default function Opportunity360View({ opportunityId, onClose, onUpdated }: Opportunity360ViewProps) {
  const [opp, setOpp] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'quotes' | 'tasks' | 'ai'>('overview');
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  // Modals state
  const [activeModal, setActiveModal] = useState<'call' | 'email' | 'task' | 'quote' | null>(null);

  const fetchOpportunityData = async (id: number) => {
    setLoading(true);
    try {
      const data = await salesApi.getOpportunity(id);
      setOpp(data);

      // Fetch real canonical timeline
      const rawTimeline = await salesApi.getOpportunityTimeline(id);
      const formattedEvents: TimelineEvent[] = rawTimeline.map((item: any) => ({
        id: String(item.id),
        type: item.type,
        title: item.title,
        description: item.description,
        timestamp: item.occurred_at || new Date().toISOString(),
        actor: item.actor || 'Sistema',
      }));
      setEvents(formattedEvents);

      // Extract quotes and tasks from timeline or API
      setQuotes(rawTimeline.filter((t: any) => t.type === 'quote'));
      setTasks(rawTimeline.filter((t: any) => t.type === 'task'));
    } catch {
      setOpp(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (opportunityId) {
      fetchOpportunityData(opportunityId);
    }
  }, [opportunityId]);

  if (!opportunityId) return null;

  const handleMarkWon = async () => {
    if (!opp) return;
    try {
      await salesApi.markOpportunityWon(opp.id);
      fetchOpportunityData(opp.id);
      onUpdated?.();
    } catch (err: any) {
      alert(err.message || 'Erro ao marcar ganho');
    }
  };

  const handleMarkLost = async () => {
    if (!opp) return;
    try {
      await salesApi.markOpportunityLost(opp.id);
      fetchOpportunityData(opp.id);
      onUpdated?.();
    } catch (err: any) {
      alert(err.message || 'Erro ao marcar perdido');
    }
  };

  const valueFormatted = opp?.value_cents
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(opp.value_cents / 100)
    : 'R$ 0,00';

  // Calculate real stage age dynamically
  const stageEnteredAt = opp?.stage_entered_at ? new Date(opp.stage_entered_at) : new Date(opp?.created_at || Date.now());
  const daysInStage = Math.max(0, Math.floor((new Date().getTime() - stageEnteredAt.getTime()) / (1000 * 60 * 60 * 24)));
  const stageAgeText = daysInStage === 0 ? 'Entrou hoje no estágio' : `${daysInStage} dia${daysInStage > 1 ? 's' : ''} no estágio atual`;

  return (
    <>
      <Dialog open={!!opportunityId} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-[960px] max-h-[88vh] overflow-y-auto p-6 font-sans">
          {loading || !opp ? (
            <div className="py-16 text-center space-y-3">
              <RotateCw className="mx-auto h-8 w-8 animate-spin text-blue-900" />
              <p className="text-sm font-semibold text-slate-600">Carregando Ficha 360° da Oportunidade...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header Workspace */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-900 text-white font-bold border-0">Opportunity 360°</Badge>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      ID #{opp.id}
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900 mt-1">{opp.name}</h1>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-blue-800" />
                    <span>{opp.account?.name || 'Empresa não informada'}</span>
                    <span>·</span>
                    <span>Probabilidade: {opp.probability || 50}%</span>
                  </p>
                </div>

                <div className="text-right flex flex-col items-end">
                  <span className="text-2xl font-extrabold text-blue-950">{valueFormatted}</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md mt-1 border border-emerald-200">
                    Estágio: {opp.stage_key || 'Prospect'} ({opp.status?.toUpperCase()})
                  </span>
                </div>
              </div>

              {/* Quick Actions Bar */}
              <div className="flex flex-wrap items-center gap-2 bg-slate-100/70 p-2.5 rounded-lg border border-slate-200 text-xs">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveModal('call')}
                  className="bg-white hover:bg-slate-50 text-slate-800 font-semibold border-slate-300"
                >
                  <Phone className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> Registrar Chamada
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveModal('email')}
                  className="bg-white hover:bg-slate-50 text-slate-800 font-semibold border-slate-300"
                >
                  <Mail className="w-3.5 h-3.5 mr-1.5 text-sky-600" /> Enviar E-mail
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveModal('task')}
                  className="bg-white hover:bg-slate-50 text-slate-800 font-semibold border-slate-300"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-indigo-600" /> Agendar Tarefa
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveModal('quote')}
                  className="bg-white hover:bg-slate-50 text-slate-800 font-semibold border-slate-300"
                >
                  <FileText className="w-3.5 h-3.5 mr-1.5 text-purple-600" /> Criar Proposta Solar
                </Button>
                <div className="ml-auto flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleMarkWon}
                    disabled={opp.status === 'won'}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                  >
                    Ganho (Won)
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleMarkLost}
                    disabled={opp.status === 'lost'}
                    className="font-bold"
                  >
                    Perdido (Lost)
                  </Button>
                </div>
              </div>

              {/* Main Content Grid: Tabs Left (65%) + Right Rail (35%) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column (8 cols) */}
                <div className="lg:col-span-8 space-y-4">
                  {/* Nav Tabs */}
                  <div className="flex border-b border-slate-200 gap-4 text-xs font-semibold text-slate-600">
                    {[
                      { id: 'overview', label: 'Visão Geral' },
                      { id: 'timeline', label: `Timeline (${events.length})` },
                      { id: 'quotes', label: `Propostas (${quotes.length})` },
                      { id: 'tasks', label: `Tarefas (${tasks.length})` },
                      { id: 'ai', label: 'Avalia AI Intelligence' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`pb-2 border-b-2 transition-colors ${
                          activeTab === tab.id
                            ? 'border-blue-900 text-blue-950 font-bold'
                            : 'border-transparent hover:text-slate-900'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  {activeTab === 'overview' && (
                    <div className="space-y-4 text-xs">
                      <Card className="border-slate-200 bg-white shadow-2xs">
                        <CardContent className="p-4 space-y-3">
                          <h3 className="font-bold text-slate-900 text-sm">Resumo da Negociação</h3>
                          <div className="grid grid-cols-2 gap-3 text-slate-700">
                            <div>
                              <span className="text-slate-400 block text-[11px]">Empresa Vinculada</span>
                              <span className="font-semibold text-slate-900">{opp.account?.name || '—'}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[11px]">Contato Principal</span>
                              <span className="font-semibold text-slate-900">{opp.contact_name || '—'}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[11px]">Previsão de Fechamento</span>
                              <span className="font-semibold text-slate-900">{opp.expected_close_date || 'A definir'}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[11px]">Origem / Lead Source</span>
                              <span className="font-semibold text-slate-900">{opp.source || 'Não informado'}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {activeTab === 'timeline' && <UnifiedTimeline events={events} />}

                  {activeTab === 'quotes' && (
                    <div className="space-y-2 text-xs">
                      {quotes.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-lg">
                          Nenhuma proposta solar enviada para esta oportunidade.
                        </div>
                      ) : (
                        quotes.map((q) => (
                          <div key={q.id} className="p-3 border border-slate-200 rounded-lg bg-white flex items-center justify-between">
                            <div>
                              <p className="font-bold text-slate-900">{q.title}</p>
                              <p className="text-slate-500">{q.description}</p>
                            </div>
                            <Badge variant="outline" className="text-xs font-semibold">Proposta</Badge>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === 'tasks' && (
                    <div className="space-y-2 text-xs">
                      {tasks.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-lg">
                          Nenhuma tarefa pendente associada.
                        </div>
                      ) : (
                        tasks.map((t) => (
                          <div key={t.id} className="p-3 border border-slate-200 rounded-lg bg-white flex items-center justify-between">
                            <div>
                              <p className="font-bold text-slate-900">{t.title}</p>
                              <p className="text-slate-500">{t.description}</p>
                            </div>
                            <Badge variant="outline" className="text-xs font-semibold">Tarefa</Badge>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === 'ai' && (
                    <div className="p-4 rounded-lg bg-purple-50/60 border border-purple-200 space-y-3 text-xs">
                      <div className="flex items-center gap-2 text-purple-950 font-bold">
                        <Sparkles className="w-4 h-4 text-purple-700" />
                        <span>Análise Contextual Avalia AI</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        Inteligência Solar IA não configurada para esta oportunidade. Configure os parâmetros do projeto solar para gerar recomendações automatizadas.
                      </p>
                    </div>
                  )}
                </div>

                {/* Right Rail (4 cols) */}
                <div className="lg:col-span-4 space-y-4 text-xs">
                  <Card className="border-slate-200 bg-slate-50/70 shadow-2xs">
                    <CardContent className="p-4 space-y-3">
                      <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] text-slate-500">
                        Próxima Ação & Estagnação
                      </h3>

                      {tasks.length === 0 ? (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md space-y-1">
                          <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            <span>Tratativa Sem Próxima Ação</span>
                          </div>
                          <p className="text-amber-800 text-[11px]">
                            Nenhuma ligação ou follow-up agendado para esta oportunidade.
                          </p>
                        </div>
                      ) : (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md space-y-1">
                          <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Próxima Ação Agendada</span>
                          </div>
                          <p className="text-emerald-800 text-[11px]">
                            {tasks.length} tarefa(s) registrada(s) no pipeline.
                          </p>
                        </div>
                      )}

                      <div className="p-3 bg-white border border-slate-200 rounded-md space-y-1">
                        <span className="text-slate-400 block text-[11px]">Idade no Estágio</span>
                        <span className="font-bold text-slate-900 text-sm">{stageAgeText}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Quick Action Modals */}
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
    </>
  );
}
