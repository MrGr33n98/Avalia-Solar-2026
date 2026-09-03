'use client';

import { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Mail,
  MessageSquare,
  Phone,
  RotateCw,
  Sparkles,
  Tag,
  User,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface TimelineEvent {
  id: string | number;
  type: 'activity' | 'call' | 'email' | 'note' | 'task' | 'stage_changed' | 'quote' | 'won' | 'lost' | 'website';
  title: string;
  description?: string;
  actor?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface UnifiedTimelineProps {
  events: TimelineEvent[];
  loading?: boolean;
  onRefresh?: () => void;
}

export default function UnifiedTimeline({ events, loading = false, onRefresh }: UnifiedTimelineProps) {
  const [filter, setFilter] = useState<string>('all');

  const filteredEvents = events.filter((ev) => {
    if (filter === 'all') return true;
    if (filter === 'activity') return ev.type === 'activity' || ev.type === 'call';
    if (filter === 'email') return ev.type === 'email';
    if (filter === 'note') return ev.type === 'note';
    if (filter === 'task') return ev.type === 'task';
    if (filter === 'quote') return ev.type === 'quote';
    if (filter === 'system') return ev.type === 'stage_changed' || ev.type === 'won' || ev.type === 'lost' || ev.type === 'website';
    return true;
  });

  const getEventBadge = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'call':
        return { icon: Phone, color: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'Ligação' };
      case 'email':
        return { icon: Mail, color: 'bg-sky-100 text-sky-800 border-sky-200', label: 'E-mail' };
      case 'note':
        return { icon: MessageSquare, color: 'bg-amber-100 text-amber-800 border-amber-200', label: 'Nota' };
      case 'task':
        return { icon: CheckCircle2, color: 'bg-indigo-100 text-indigo-800 border-indigo-200', label: 'Tarefa' };
      case 'quote':
        return { icon: FileText, color: 'bg-purple-100 text-purple-800 border-purple-200', label: 'Proposta' };
      case 'stage_changed':
        return { icon: Tag, color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Estágio' };
      case 'won':
        return { icon: Sparkles, color: 'bg-emerald-600 text-white border-emerald-700', label: 'Ganho' };
      case 'lost':
        return { icon: Clock, color: 'bg-red-100 text-red-800 border-red-200', label: 'Perdido' };
      default:
        return { icon: Calendar, color: 'bg-slate-100 text-slate-700 border-slate-200', label: 'Atividade' };
    }
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap gap-1 text-xs">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'activity', label: 'Ligações' },
            { id: 'email', label: 'E-mails' },
            { id: 'note', label: 'Notas' },
            { id: 'task', label: 'Tarefas' },
            { id: 'quote', label: 'Propostas' },
            { id: 'system', label: 'Sistema' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={`px-2.5 py-1 rounded-md transition-colors font-medium ${
                filter === item.id ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {onRefresh && (
          <Button variant="ghost" size="sm" onClick={onRefresh} className="h-7 text-xs text-slate-500">
            <RotateCw className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} /> Atualizar
          </Button>
        )}
      </div>

      {/* Timeline Stream */}
      {loading ? (
        <div className="py-8 text-center text-xs text-slate-500">Carregando linha do tempo...</div>
      ) : filteredEvents.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
          Nenhuma interação encontrada para os filtros selecionados.
        </div>
      ) : (
        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {filteredEvents.map((event) => {
            const badge = getEventBadge(event.type);
            const IconComp = badge.icon;
            return (
              <div key={event.id} className="relative flex items-start gap-3 text-xs group">
                <div className="absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white ring-4 ring-slate-50">
                  <div className={`h-3 w-3 rounded-full ${badge.color}`} />
                </div>

                <div className="flex-1 rounded-lg border border-slate-200 bg-white p-3 shadow-2xs hover:border-slate-300 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge className={`border text-[10px] px-1.5 py-0.5 ${badge.color}`}>
                        <IconComp className="w-3 h-3 mr-1" /> {badge.label}
                      </Badge>
                      <span className="font-bold text-slate-900">{event.title}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(event.timestamp).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {event.description && <p className="mt-1.5 text-slate-600 leading-relaxed">{event.description}</p>}

                  {event.actor && (
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400 border-t border-slate-100 pt-1.5">
                      <User className="w-3 h-3" />
                      <span>{event.actor}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
