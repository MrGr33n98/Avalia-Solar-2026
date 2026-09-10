'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  Mail,
  MessageSquare,
  MousePointerClick,
  PhoneCall,
  RotateCw,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';
import CreateActivityModal from '@/components/sales/create/CreateActivityModal';
import CreateTaskModal from '@/components/sales/create/CreateTaskModal';
import SendEmailModal from '@/components/sales/create/SendEmailModal';

import { salesApi } from '@/lib/api/sales/client';

interface ContactDetail {
  id: number;
  first_name: string;
  last_name?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  job_title?: string | null;
  linkedin_url?: string | null;
  decision_role?: string | null;
  account?: {
    id: number;
    name: string;
    city?: string | null;
    state?: string | null;
  } | null;
  employments?: Array<{
    id: number;
    account_name?: string;
    job_title?: string;
    relationship_type?: string;
  }>;
  buying_opportunities?: Array<{
    id: number;
    opportunity_name?: string;
    role?: string;
    support_level?: string;
  }>;
}

interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  description?: string;
  subject?: string;
  body_snippet?: string;
  body_text?: string;
  body_html?: string;
  from_email?: string;
  to_email?: string;
  status?: string;
  opens_count?: number;
  clicks_count?: number;
  delivered_at?: string;
  first_opened_at?: string;
  last_opened_at?: string;
  occurred_at: string;
  actor?: { id: number; name: string } | null;
  actor_name?: string;
}

export default function Person360FullView({ contactId }: { contactId: string }) {
  const [contact, setContact] = useState<ContactDetail | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedEmails, setExpandedEmails] = useState<Record<string, boolean>>({});

  const toggleEmailExpand = (id: string) => {
    setExpandedEmails((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const [activeModal, setActiveModal] = useState<'call' | 'email' | 'task' | null>(null);
  const [noteText, setNoteText] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  const handleSaveNote = async () => {
    if (!noteText.trim() || !contact) return;
    setSubmittingNote(true);
    try {
      await salesApi.createActivity({
        activity_type: 'note',
        subject: 'Nota Comercial',
        body: noteText,
        sales_contact_id: contact.id,
      });
      setNoteText('');
      fetchPersonData();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar nota.');
    } finally {
      setSubmittingNote(false);
    }
  };

  const fetchPersonData = useCallback(() => {
    setLoading(true);
    setError(null);

    Promise.all([
      fetch(`/api/v1/sales/contacts/${contactId}`, { credentials: 'include' }).then((r) => r.json()),
      fetch(`/api/v1/sales/contacts/${contactId}/timeline`, { credentials: 'include' }).then((r) => r.json()),
    ])
      .then(([contactRes, timelineRes]) => {
        setContact(contactRes.contact ?? null);
        setTimeline(timelineRes.timeline ?? []);
      })
      .catch((err) => {
        setError(err.message || 'Não foi possível carregar os detalhes do contato.');
      })
      .finally(() => setLoading(false));
  }, [contactId]);

  useEffect(() => {
    fetchPersonData();
  }, [fetchPersonData]);

  if (loading) {
    return (
      <SalesLayoutWrapper>
        <div className="py-20 text-center space-y-3">
          <RotateCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Carregando Perfil Person 360°...</p>
        </div>
      </SalesLayoutWrapper>
    );
  }

  if (error || !contact) {
    return (
      <SalesLayoutWrapper>
        <div className="py-16 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-red-600 mx-auto" />
          <p className="text-sm font-bold text-slate-900">{error || 'Pessoa não encontrada.'}</p>
          <Link href="/dashboard/sales/people">
            <Button variant="outline" size="sm" className="h-8 text-xs">
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Voltar para Pessoas
            </Button>
          </Link>
        </div>
      </SalesLayoutWrapper>
    );
  }

  const initials = [contact.first_name[0], contact.last_name?.[0]].filter(Boolean).join('').toUpperCase();

  return (
    <SalesLayoutWrapper>
      <div className="space-y-3 font-sans max-w-none">
        {/* Navigation back link */}
        <div>
          <Link href="/dashboard/sales/people" className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-indigo-900">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Voltar para lista de Pessoas
          </Link>
        </div>

        {/* Person Header Banner */}
        <div className="bg-white rounded-md border border-slate-200 px-3 py-2 shadow-none sticky top-0 z-20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-indigo-900 text-white font-bold flex items-center justify-center text-xs shrink-0 border-2 border-indigo-200">
                {initials}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-bold tracking-tight text-slate-900">{contact.name}</h1>
                  <Badge className="bg-indigo-100 text-indigo-900 border-indigo-200 text-xs font-semibold">
                    {contact.decision_role || 'Decision Maker'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 mt-1 flex items-center gap-2">
                  {contact.job_title && <span className="font-semibold text-slate-800">{contact.job_title}</span>}
                  {contact.account && (
                    <span className="flex items-center gap-1 text-blue-900 font-medium">
                      @ <Building2 className="w-3 h-3 text-blue-900" /> {contact.account.name}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Quick Action Rail */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                onClick={() => setActiveModal('call')}
                className="h-8 text-xs bg-indigo-900 hover:bg-indigo-950 text-white font-bold"
              >
                <PhoneCall className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Registrar Chamada
              </Button>

              <Button
                size="sm"
                onClick={() => setActiveModal('email')}
                className="h-8 text-xs bg-sky-700 hover:bg-sky-800 text-white font-bold"
              >
                <Mail className="w-3.5 h-3.5 mr-1" /> Enviar E-mail
              </Button>

              <Button
                size="sm"
                onClick={() => setActiveModal('task')}
                variant="outline"
                className="h-8 text-xs border-slate-300 text-slate-700 font-semibold"
              >
                <Calendar className="w-3.5 h-3.5 mr-1 text-slate-500" /> Agendar Tarefa
              </Button>
            </div>
          </div>
        </div>

        {/* 2-Column Content Grid */}
        <nav className="hidden lg:flex sticky top-14 flex-col gap-1 text-[11px]">
          {[["nota", "Nova nota"], ["timeline", "Timeline"], ["contato", "Contato"], ["oportunidades", "Oportunidades"]].map(([id, label]) => <a key={id} href={`#${id}`} className="rounded px-2 py-2 text-slate-600 hover:bg-slate-100">{label}</a>)}
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[145px_minmax(0,1fr)_280px] gap-3 items-start">
          {/* Main Column (2/3) */}
          <div className="lg:col-span-2 space-y-3">
            {/* Write Note Inline Composer */}
            <div id="nota" className="bg-amber-50/70 border border-amber-200 rounded-lg p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-amber-700" /> Write Note (Nova Nota Comercial)
                </h3>
              </div>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Escreva uma nota técnica ou observação de relacionamento..."
                className="w-full text-xs p-2.5 rounded-md border border-amber-200 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-800"
                rows={3}
              />
              <div className="flex items-center justify-end gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveNote}
                  disabled={submittingNote || !noteText.trim()}
                  className="h-7 text-xs bg-amber-800 hover:bg-amber-900 text-white font-bold px-3"
                >
                  {submittingNote ? <RotateCw className="w-3.5 h-3.5 animate-spin mr-1" /> : <Plus className="w-3.5 h-3.5 mr-1" />}
                  Salvar Nota
                </Button>
              </div>
            </div>

            {/* Timeline Events */}
            <div id="timeline" className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs">
              <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-700" />
                <span>Linha do Tempo de Atividades</span>
              </h2>

              {timeline.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">Nenhuma atividade registrada para esta pessoa.</p>
              ) : (
                <div className="relative border-l-2 border-slate-200 pl-4 space-y-4">
                  {timeline.map((event) => {
                    const isEmail = event.type === 'email';
                    const isCall = event.type === 'call';
                    const isTask = event.type === 'task';
                    const isExpanded = !!expandedEmails[event.id];

                    return (
                      <div key={event.id} className="relative group">
                        {/* Timeline Bullet Icon */}
                        <div
                          className={`absolute -left-[25px] top-1.5 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-xs ${
                            isEmail
                              ? 'bg-sky-600 text-white'
                              : isCall
                              ? 'bg-emerald-600 text-white'
                              : isTask
                              ? 'bg-amber-600 text-white'
                              : 'bg-indigo-600 text-white'
                          }`}
                        >
                          {isEmail ? (
                            <Mail className="w-2.5 h-2.5" />
                          ) : isCall ? (
                            <PhoneCall className="w-2.5 h-2.5" />
                          ) : isTask ? (
                            <Calendar className="w-2.5 h-2.5" />
                          ) : (
                            <div className="w-1.5 h-1.5 bg-white rounded-full" />
                          )}
                        </div>

                        {/* Event Content Card */}
                        {isEmail ? (
                          /* NUTSHELL-STYLE EMAIL CARD */
                          <div className="bg-white rounded-lg border border-sky-200/80 border-l-4 border-l-sky-600 p-3.5 shadow-xs space-y-2 hover:border-sky-300 transition-colors">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                    <Mail className="w-3.5 h-3.5 text-sky-600" />
                                    {event.subject || event.title || 'E-mail Comercial'}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500">
                                  De: <span className="font-medium text-slate-700">{event.from_email || 'Você'}</span> • Para:{' '}
                                  <span className="font-medium text-slate-700">{event.to_email || contact.email}</span>
                                </p>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {/* Email Status Badge */}
                                <Badge className="bg-sky-50 text-sky-800 border-sky-200 text-[10px] font-semibold capitalize">
                                  {event.status === 'delivered'
                                    ? 'Entregue'
                                    : event.status === 'sent'
                                    ? 'Enviado'
                                    : event.status === 'queued'
                                    ? 'Na fila'
                                    : event.status || 'Enviado'}
                                </Badge>

                                {/* Opens Tracking Badge */}
                                {event.opens_count !== undefined && event.opens_count > 0 && (
                                  <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-semibold flex items-center gap-1">
                                    <Eye className="w-2.5 h-2.5" /> Aberto {event.opens_count > 1 ? `${event.opens_count}x` : ''}
                                  </Badge>
                                )}

                                {/* Clicks Tracking Badge */}
                                {event.clicks_count !== undefined && event.clicks_count > 0 && (
                                  <Badge className="bg-purple-50 text-purple-800 border-purple-200 text-[10px] font-semibold flex items-center gap-1">
                                    <MousePointerClick className="w-2.5 h-2.5" /> Clicado
                                  </Badge>
                                )}

                                <span className="text-[11px] text-slate-400 font-medium ml-1">
                                  {new Date(event.occurred_at).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                            </div>

                            {/* Email Body Snippet / Full Text */}
                            <div className="text-xs text-slate-700 bg-slate-50/80 p-2.5 rounded border border-slate-100 mt-2 font-sans">
                              {isExpanded ? (
                                <div className="space-y-2">
                                  <p className="whitespace-pre-wrap leading-relaxed">{event.body_text || event.description}</p>
                                  <button
                                    type="button"
                                    onClick={() => toggleEmailExpand(event.id)}
                                    className="text-[11px] font-bold text-sky-700 hover:text-sky-900 inline-flex items-center gap-1 pt-1"
                                  >
                                    <ChevronUp className="w-3 h-3" /> Recolher mensagem
                                  </button>
                                </div>
                              ) : (
                                <div>
                                  <p className="line-clamp-2 leading-relaxed text-slate-600">
                                    {event.body_snippet || event.body_text || event.description}
                                  </p>
                                  {(event.body_text || event.description) && (
                                    <button
                                      type="button"
                                      onClick={() => toggleEmailExpand(event.id)}
                                      className="text-[11px] font-bold text-sky-700 hover:text-sky-900 inline-flex items-center gap-1 pt-1.5"
                                    >
                                      <ChevronDown className="w-3 h-3" /> Ver mensagem completa
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          /* STANDARD ACTIVITY CARD */
                          <div className="bg-slate-50/80 p-3 rounded-md border border-slate-100 hover:bg-slate-100/70 transition-colors">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900">{event.title}</span>
                              <span className="text-[11px] text-slate-400">
                                {new Date(event.occurred_at).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            {event.description && <p className="text-xs text-slate-600 mt-1 whitespace-pre-wrap">{event.description}</p>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Rail Column (1/3) */}
          <div className="space-y-3 lg:sticky lg:top-14">
            {/* Contact Info Card */}
            <div id="contato" className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-slate-400">Canais de Contato</h3>
              <div className="space-y-2 text-xs">
                {contact.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <a href={`mailto:${contact.email}`} className="text-indigo-600 hover:underline font-medium">
                      {contact.email}
                    </a>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center gap-2">
                    <PhoneCall className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-slate-700 font-medium">{contact.phone}</span>
                  </div>
                )}
                {contact.whatsapp && (
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                    <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-emerald-700 font-semibold hover:underline">
                      WhatsApp: {contact.whatsapp}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Buying Committee / Opportunities Card */}
            <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-slate-400">Comitê de Compra</h3>
              {contact.buying_opportunities && contact.buying_opportunities.length > 0 ? (
                <div className="space-y-2">
                  {contact.buying_opportunities.map((bo) => (
                    <div key={bo.id} className="p-2.5 rounded border border-slate-100 bg-slate-50/50 text-xs space-y-1">
                      <span className="font-bold text-slate-900 block">{bo.opportunity_name}</span>
                      <span className="text-[11px] text-indigo-900 font-medium block">Papel: {bo.role || 'Membro'}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Nenhuma oportunidade associada diretamente.</p>
              )}
            </div>
          </div>
        </div>

        {/* Modals for Quick Actions */}
        <CreateActivityModal
          open={activeModal === 'call'}
          onClose={() => setActiveModal(null)}
          contactId={contact.id}
          onSuccess={fetchPersonData}
        />

        <SendEmailModal
          open={activeModal === 'email'}
          onClose={() => setActiveModal(null)}
          contactId={contact.id}
          accountId={contact.account?.id}
          contactEmail={contact.email || ''}
          contactName={contact.name}
          companyName={contact.account?.name}
          onSuccess={fetchPersonData}
        />

        <CreateTaskModal
          open={activeModal === 'task'}
          onClose={() => setActiveModal(null)}
          onSuccess={fetchPersonData}
        />
      </div>
    </SalesLayoutWrapper>
  );
}
