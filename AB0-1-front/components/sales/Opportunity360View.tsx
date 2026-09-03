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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import UnifiedTimeline, { TimelineEvent } from '@/components/sales/UnifiedTimeline';
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

  useEffect(() => {
    if (!opportunityId) return;
    setLoading(true);
    fetch(`/api/v1/sales/opportunities/${opportunityId}`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.opportunity) {
          setOpp(data.opportunity);
          // Build initial timeline mock/real events
          const timeline: TimelineEvent[] = [
            {
              id: '1',
              type: 'stage_changed',
              title: `Oportunidade inserida no estágio: ${data.opportunity.stage_key || 'Prospect'}`,
              timestamp: data.opportunity.created_at || new Date().toISOString(),
              actor: 'Sistema / SDR',
            },
          ];
          setEvents(timeline);
        }
      })
      .catch(() => setOpp(null))
      .finally(() => setLoading(false));
  }, [opportunityId]);

  if (!opportunityId) return null;

  const valueFormatted = opp?.value_cents
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(opp.value_cents / 100)
    : 'R$ 0,00';

  return (
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
                  <span>{opp.account?.name || 'Empresa Comercial'}</span>
                  <span>·</span>
                  <span>Probability: {opp.probability || 50}%</span>
                </p>
              </div>

              <div className="text-right flex flex-col items-end">
                <span className="text-2xl font-extrabold text-blue-950">{valueFormatted}</span>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md mt-1 border border-emerald-200">
                  Estágio: {opp.stage_key || 'Prospect'}
                </span>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex flex-wrap items-center gap-2 bg-slate-100/70 p-2.5 rounded-lg border border-slate-200 text-xs">
              <Button size="sm" variant="outline" className="bg-white hover:bg-slate-50 text-slate-800 font-semibold border-slate-300">
                <Phone className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> Registrar Chamada
              </Button>
              <Button size="sm" variant="outline" className="bg-white hover:bg-slate-50 text-slate-800 font-semibold border-slate-300">
                <Mail className="w-3.5 h-3.5 mr-1.5 text-sky-600" /> Enviar E-mail
              </Button>
              <Button size="sm" variant="outline" className="bg-white hover:bg-slate-50 text-slate-800 font-semibold border-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-indigo-600" /> Agendar Tarefa
              </Button>
              <Button size="sm" variant="outline" className="bg-white hover:bg-slate-50 text-slate-800 font-semibold border-slate-300">
                <FileText className="w-3.5 h-3.5 mr-1.5 text-purple-600" /> Criar Proposta Solar
              </Button>
              <div className="ml-auto flex items-center gap-2">
                <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold">
                  Ganho (Won)
                </Button>
                <Button size="sm" variant="destructive" className="font-bold">
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
                    { id: 'timeline', label: 'Timeline Unificada' },
                    { id: 'quotes', label: 'Propostas (Quotes)' },
                    { id: 'tasks', label: 'Tarefas & Follow-ups' },
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
                            <span className="font-semibold text-slate-900">{opp.primary_contact?.first_name || '—'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">Previsão de Fechamento</span>
                            <span className="font-semibold text-slate-900">{opp.expected_close_date || 'A definir'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">Origem / Lead Source</span>
                            <span className="font-semibold text-slate-900">{opp.source || 'Inbound / Site'}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {activeTab === 'timeline' && <UnifiedTimeline events={events} />}

                {activeTab === 'quotes' && (
                  <div className="py-6 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-lg">
                    Nenhuma proposta solar enviada para esta oportunidade.
                  </div>
                )}

                {activeTab === 'tasks' && (
                  <div className="py-6 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-lg">
                    Nenhuma tarefa pendente associada.
                  </div>
                )}

                {activeTab === 'ai' && (
                  <div className="p-4 rounded-lg bg-purple-50/60 border border-purple-200 space-y-3 text-xs">
                    <div className="flex items-center gap-2 text-purple-950 font-bold">
                      <Sparkles className="w-4 h-4 text-purple-700" />
                      <span>Análise Contextual Avalia AI</span>
                    </div>
                    <p className="text-purple-900 leading-relaxed">
                      Oportunidade no estágio <strong>{opp.stage_key}</strong>. Recomendado enviar proposta comercial customizada com payback menor que 3,2 anos.
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

                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-md space-y-1">
                      <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Tratativa Sem Próxima Ação</span>
                      </div>
                      <p className="text-amber-800 text-[11px]">
                        Nenhuma ligação ou follow-up agendado para esta oportunidade.
                      </p>
                    </div>

                    <div className="p-3 bg-white border border-slate-200 rounded-md space-y-1">
                      <span className="text-slate-400 block text-[11px]">Idade no Estágio</span>
                      <span className="font-bold text-slate-900 text-sm">3 dias no estágio atual</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
