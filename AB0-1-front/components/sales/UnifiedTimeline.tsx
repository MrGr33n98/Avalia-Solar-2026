'use client';

import { useMemo, useState } from 'react';
import {
  Calendar,
  Clock,
  MessageSquare,
  Phone,
  RotateCw,
  Tag,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import EmailTimelineCard from '@/components/sales/EmailTimelineCard';
import type { SalesTimelineEvent } from '@/lib/api/sales/timeline-types';

export type TimelineEvent = SalesTimelineEvent;

interface UnifiedTimelineProps {
  events: TimelineEvent[];
  loading?: boolean;
  onRefresh?: () => void;
  liveStatus?: 'connected' | 'fallback' | 'disconnected';
}

export default function UnifiedTimeline({ events, loading = false, onRefresh, liveStatus = 'disconnected' }: UnifiedTimelineProps) {
  const [filter, setFilter] = useState<string>('all');
  const [creator, setCreator] = useState('all');
  const [activityType, setActivityType] = useState('all');
  const [period, setPeriod] = useState('all');

  const creators = useMemo(
    () => Array.from(new Map(events.filter((event) => event.actor).map((event) => [event.actor!.id, event.actor!.name])).entries()),
    [events]
  );
  const activityTypes = Array.from(new Set(events.map((event) => event.activity_type).filter(Boolean))) as string[];

  const filteredEvents = events.filter((ev) => {
    const kindMatches = filter === 'all' ||
      (filter === 'activity' && ['activity', 'call'].includes(ev.kind)) ||
      (filter === 'system' && ['stage_changed', 'won', 'lost', 'website'].includes(ev.kind)) ||
      ev.kind === filter;
    const creatorMatches = creator === 'all' || String(ev.actor?.id) === creator;
    const activityTypeMatches = activityType === 'all' || ev.activity_type === activityType;
    const withinPeriod = period === 'all' || Date.now() - new Date(ev.occurred_at).getTime() <= Number(period) * 86400000;
    return kindMatches && activityTypeMatches && creatorMatches && withinPeriod;
  });

  const statusLabel = liveStatus === 'connected' ? 'Ao vivo' : liveStatus === 'fallback' ? 'Atualização automática' : 'Reconectando…';

  return (
    <div className="space-y-4 font-sans" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap gap-1 text-xs">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'email', label: 'Emails' },
            { id: 'call', label: 'Ligações' },
            { id: 'note', label: 'Notas' },
            { id: 'task', label: 'Tarefas' },
            { id: 'quote', label: 'Propostas' },
            { id: 'system', label: 'Sistema' },
          ].map((item) => (
            <button key={item.id} type="button" onClick={() => setFilter(item.id)}
              aria-pressed={filter === item.id}
              className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                filter === item.id ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}>
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="timeline-activity-type">Tipo de atividade</label>
          <select id="timeline-activity-type" value={activityType} onChange={(event) => setActivityType(event.target.value)}
            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700">
            <option value="all">Atividade: todos</option>
            {activityTypes.map((type) => <option key={type} value={type}>{type.replaceAll('_', ' ')}</option>)}
          </select>
          <label className="sr-only" htmlFor="timeline-creator">Criador</label>
          <select id="timeline-creator" value={creator} onChange={(event) => setCreator(event.target.value)}
            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700">
            <option value="all">Criador: todos</option>
            {creators.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
          <label className="sr-only" htmlFor="timeline-period">Período</label>
          <select id="timeline-period" value={period} onChange={(event) => setPeriod(event.target.value)}
            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700">
            <option value="all">Período: todo</option>
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
          </select>
          <span className="inline-flex items-center gap-1 text-xs text-slate-500" role="status">
            <span className={`h-2 w-2 rounded-full ${liveStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {statusLabel}
          </span>
          {onRefresh && (
            <Button variant="ghost" size="sm" onClick={onRefresh} className="h-7 text-xs text-slate-500">
              <RotateCw className={`mr-1 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Atualizar
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-slate-500">Carregando linha do tempo...</div>
      ) : filteredEvents.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 py-8 text-center text-xs text-slate-400">
          Nenhuma interação encontrada para os filtros selecionados.
        </div>
      ) : (
        <ol className="relative space-y-4 pl-6 before:absolute before:bottom-2 before:left-2.5 before:top-2 before:w-0.5 before:bg-slate-200">
          {filteredEvents.map((event) => {
            const isEmail = event.kind === 'email' && event.email && event.engagement;
            const initials = event.actor?.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('') || '?';
            const title = event.title || (isEmail ? event.email?.subject : event.kind);
            const verb = event.kind === 'email' ? (event.email?.direction === 'inbound' ? 'recebeu um email' : 'enviou um email') : event.kind === 'call' ? 'registrou uma ligação' :
              event.kind === 'note' ? 'adicionou uma nota' : event.kind === 'task' ? 'criou uma tarefa' : 'registrou uma atividade';
            return (
              <li key={event.id} className="relative text-xs">
                <span className="absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white ring-4 ring-slate-50">
                  {event.kind === 'email' ? <MailIcon /> : event.kind === 'call' ? <Phone className="h-3 w-3 text-slate-600" /> :
                    event.kind === 'note' ? <MessageSquare className="h-3 w-3 text-amber-700" /> :
                      event.kind === 'stage_changed' ? <Tag className="h-3 w-3 text-blue-700" /> :
                        event.kind === 'task' ? <Clock className="h-3 w-3 text-indigo-700" /> :
                          <Calendar className="h-3 w-3 text-slate-600" />}
                </span>
                <div className="mb-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                  <time>{new Date(event.occurred_at).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</time>
                  <span>·</span>
                  <span className="font-medium text-slate-700">{event.actor?.name || 'Atividade automática'}</span>
                  <span>{verb}</span>
                </div>
                {isEmail ? (
                  <EmailTimelineCard email={event.email!} engagement={event.engagement!} lifecycle={event.lifecycle || []} actorInitials={initials} />
                ) : (
                  <article className={`rounded-lg border border-slate-200 bg-white p-3 shadow-2xs ${event.kind === 'note' ? 'border-l-4 border-l-amber-400' : ''}`}>
                    <h3 className="font-semibold text-slate-900">{title}</h3>
                    {event.preview && <p className="mt-1 text-slate-600">{event.preview}</p>}
                    {event.actor && <span className="mt-2 inline-flex items-center gap-1 text-[11px] text-slate-400"><User className="h-3 w-3" />{event.actor.name}</span>}
                  </article>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function MailIcon() {
  return <span className="text-[11px]" aria-hidden="true">✉</span>;
}
