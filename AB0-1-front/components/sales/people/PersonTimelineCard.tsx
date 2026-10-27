'use client';

import { useState } from 'react';
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  FileText,
  Mail,
  MousePointerClick,
  PhoneCall,
  RotateCw,
  Send,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface TimelineEvent {
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
  occurred_at: string;
  actor?: { id: number; name: string } | null;
  actor_name?: string;
}

interface PersonTimelineCardProps {
  timeline: TimelineEvent[];
  contactEmail?: string | null;
  noteText: string;
  onChangeNoteText: (val: string) => void;
  onSaveNote: () => Promise<void>;
  submittingNote: boolean;
}

export default function PersonTimelineCard({
  timeline = [],
  contactEmail,
  noteText,
  onChangeNoteText,
  onSaveNote,
  submittingNote,
}: PersonTimelineCardProps) {
  const [expandedEmails, setExpandedEmails] = useState<Record<string, boolean>>({});

  const toggleEmailExpand = (id: string) => {
    setExpandedEmails((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-4">
      {/* 1. Write Note Inline Composer */}
      <div id="write-note-composer" className="bg-amber-50/70 border border-amber-200/90 rounded-xl p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-amber-700" />
            <span>Write Note (Nova Nota Comercial)</span>
          </h3>
          <span className="text-[10px] text-amber-700 font-medium">Salva na linha do tempo</span>
        </div>

        <textarea
          value={noteText}
          onChange={(e) => onChangeNoteText(e.target.value)}
          placeholder="Escreva uma nota técnica, anotação de vistoria ou observação sobre o cliente..."
          className="w-full text-xs p-3 rounded-lg border border-amber-200 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 placeholder:text-slate-400 leading-relaxed resize-y"
          rows={3}
        />

        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-[11px] text-slate-400 italic">Dica: Notas ficam visíveis para toda a equipe comercial.</span>
          <Button
            size="sm"
            onClick={onSaveNote}
            disabled={submittingNote || !noteText.trim()}
            className="h-7 text-xs bg-amber-800 hover:bg-amber-900 text-white font-bold px-3 transition-colors"
          >
            {submittingNote ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5 mr-1.5" />
                <span>Salvar Nota</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 2. Timeline Activity Feed */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-700" />
          <span>Timeline & Histórico de Interações</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {timeline.length}
          </span>
        </h2>

        {timeline.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Nenhuma atividade ou comunicação registrada para esta pessoa.
          </div>
        ) : (
          <div className="relative border-l-2 border-slate-100 pl-4 space-y-4">
            {timeline.map((event) => {
              const isEmail = event.type === 'email';
              const isCall = event.type === 'call';
              const isTask = event.type === 'task';
              const isExpanded = !!expandedEmails[event.id];

              return (
                <div key={event.id} className="relative group">
                  {/* Timeline Icon Bullet */}
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
                      <FileText className="w-2.5 h-2.5" />
                    )}
                  </div>

                  {/* Content Card */}
                  {isEmail ? (
                    /* NUTSHELL-STYLE EMAIL CARD */
                    <div className="bg-white rounded-xl border border-sky-200/80 border-l-4 border-l-sky-600 p-3.5 shadow-2xs space-y-2 hover:border-sky-300 transition-colors">
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
                            <span className="font-medium text-slate-700">{event.to_email || contactEmail}</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Status Badge */}
                          <Badge className="bg-sky-50 text-sky-800 border-sky-200 text-[10px] font-semibold capitalize">
                            {event.status === 'delivered'
                              ? 'Entregue'
                              : event.status === 'sent'
                              ? 'Enviado'
                              : event.status === 'queued'
                              ? 'Na fila'
                              : event.status || 'Enviado'}
                          </Badge>

                          {/* Opens Badge */}
                          {event.opens_count !== undefined && event.opens_count > 0 && (
                            <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-semibold flex items-center gap-1">
                              <Eye className="w-2.5 h-2.5" /> Aberto {event.opens_count > 1 ? `${event.opens_count}x` : ''}
                            </Badge>
                          )}

                          {/* Clicks Badge */}
                          {event.clicks_count !== undefined && event.clicks_count > 0 && (
                            <Badge className="bg-purple-50 text-purple-800 border-purple-200 text-[10px] font-semibold flex items-center gap-1">
                              <MousePointerClick className="w-2.5 h-2.5" /> Clicado
                            </Badge>
                          )}

                          <span className="text-[11px] text-slate-400 font-medium ml-1">
                            {new Date(event.occurred_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Body Snippet / Full Text */}
                      <div className="text-xs text-slate-700 bg-slate-50/80 p-2.5 rounded-lg border border-slate-100 mt-2 font-sans">
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
                    /* ACTIVITY / NOTE CARD */
                    <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-100 hover:bg-slate-100/70 transition-colors">
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
                      {event.description && (
                        <p className="text-xs text-slate-600 mt-1 whitespace-pre-wrap leading-relaxed">
                          {event.description}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
