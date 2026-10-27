'use client';

import { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Mail,
  MessageSquare,
  Phone,
  RotateCw,
  Settings,
  SlidersHorizontal,
  Star,
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

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return 'Just now';
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays === 0) {
      if (diffHours === 0) {
        if (diffMins <= 1) return 'Just now';
        return `${diffMins} minutes ago`;
      }
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    }
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 30) return `${diffDays} days ago`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffMonths / 12)} year${Math.floor(diffMonths / 12) > 1 ? 's' : ''} ago`;
  } catch {
    return dateString;
  }
}

export default function UnifiedTimeline({
  events,
  loading = false,
  onRefresh,
  liveStatus = 'disconnected',
}: UnifiedTimelineProps) {
  const [filter, setFilter] = useState<string>('all');
  const [creator, setCreator] = useState<string>('all');
  const [activityType, setActivityType] = useState<string>('all');
  const [period, setPeriod] = useState<string>('all');

  const creators = useMemo(
    () =>
      Array.from(
        new Map(
          events.filter((event) => event.actor).map((event) => [event.actor!.id, event.actor!.name])
        ).entries()
      ),
    [events]
  );
  const activityTypes = Array.from(
    new Set(events.map((event) => event.activity_type).filter(Boolean))
  ) as string[];

  const filteredEvents = events.filter((ev) => {
    const eventKind = ev.kind || (ev as any).type || '';
    const kindMatches =
      filter === 'all' ||
      (filter === 'activity' && ['activity', 'call'].includes(eventKind)) ||
      (filter === 'system' && ['stage_changed', 'won', 'lost', 'website'].includes(eventKind)) ||
      eventKind === filter;
    const creatorMatches = creator === 'all' || String(ev.actor?.id) === creator;
    const activityTypeMatches = activityType === 'all' || ev.activity_type === activityType;
    const withinPeriod =
      period === 'all' || Date.now() - new Date(ev.occurred_at).getTime() <= Number(period) * 86400000;
    return kindMatches && activityTypeMatches && creatorMatches && withinPeriod;
  });

  const statusLabel =
    liveStatus === 'connected'
      ? 'Ao vivo'
      : liveStatus === 'fallback'
        ? 'Atualização automática'
        : 'Reconectando…';

  return (
    <div className="space-y-4 font-sans" aria-live="polite">
      {/* 1. Nutshell Header: TIMELINE */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
        <div className="flex items-center gap-2 text-slate-800">
          <SlidersHorizontal className="h-3.5 w-3.5 text-slate-600" />
          <h3 className="text-xs font-bold tracking-wider uppercase text-slate-800">Timeline</h3>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 text-slate-500" role="status">
            <span
              className={`h-2 w-2 rounded-full ${
                liveStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            {statusLabel}
          </span>
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              className="h-7 px-2 text-xs text-slate-500 hover:text-slate-800"
              title="Atualizar linha do tempo"
            >
              <RotateCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          )}
          <button
            type="button"
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            title="Configurações da Timeline"
            aria-label="Configurações da Timeline"
          >
            <Settings className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Nutshell Filter Pills Row */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {/* Pill 1: All entries */}
        <div className="relative inline-flex items-center">
          <select
            id="timeline-filter-entries"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-7 cursor-pointer appearance-none rounded-md border border-slate-200/80 bg-slate-100/90 py-1 pl-2.5 pr-6 text-xs font-medium text-slate-700 hover:bg-slate-200/70 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
          >
            <option value="all">All entries</option>
            <option value="email">Emails</option>
            <option value="call">Calls / Ligações</option>
            <option value="note">Notes / Notas</option>
            <option value="task">Tasks / Tarefas</option>
            <option value="quote">Quotes / Propostas</option>
            <option value="won">Won Deals / Ganhos</option>
            <option value="system">System / Sistema</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 h-3 w-3 text-slate-400" />
        </div>

        {/* Pill 2: All activity types */}
        <div className="relative inline-flex items-center">
          <select
            id="timeline-activity-type"
            value={activityType}
            onChange={(e) => setActivityType(e.target.value)}
            className="h-7 cursor-pointer appearance-none rounded-md border border-slate-200/80 bg-slate-100/90 py-1 pl-2.5 pr-6 text-xs font-medium text-slate-700 hover:bg-slate-200/70 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
          >
            <option value="all">All activity types</option>
            {activityTypes.map((type) => (
              <option key={type} value={type}>
                {type.replaceAll('_', ' ')}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 h-3 w-3 text-slate-400" />
        </div>

        {/* Pill 3: All users & teams */}
        <div className="relative inline-flex items-center">
          <select
            id="timeline-creator"
            value={creator}
            onChange={(e) => setCreator(e.target.value)}
            className="h-7 cursor-pointer appearance-none rounded-md border border-slate-200/80 bg-slate-100/90 py-1 pl-2.5 pr-6 text-xs font-medium text-slate-700 hover:bg-slate-200/70 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
          >
            <option value="all">All users &amp; teams</option>
            {creators.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 h-3 w-3 text-slate-400" />
        </div>

        {/* Pill 4: All time */}
        <div className="relative inline-flex items-center">
          <select
            id="timeline-period"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="h-7 cursor-pointer appearance-none rounded-md border border-slate-200/80 bg-slate-100/90 py-1 pl-2.5 pr-6 text-xs font-medium text-slate-700 hover:bg-slate-200/70 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
          >
            <option value="all">All time</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 h-3 w-3 text-slate-400" />
        </div>
      </div>

      {/* 3. Feed & Vertical Rail */}
      {loading ? (
        <div className="py-8 text-center text-xs text-slate-500">Carregando linha do tempo...</div>
      ) : filteredEvents.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 py-8 text-center text-xs text-slate-400">
          Nenhuma interação encontrada para os filtros selecionados.
        </div>
      ) : (
        <div className="relative">
          {/* Continuous Vertical Rail passing through the center of 32px nodes (left: 15px) */}
          <div
            className="absolute bottom-4 left-[15px] top-4 w-0.5 bg-slate-200"
            aria-hidden="true"
          />

          <ol className="relative space-y-5">
            {filteredEvents.map((event) => {
              const eventKind = event.kind || (event as any).type || '';
              const isEmail = eventKind === 'email' && event.email && event.engagement;
              const isWon = eventKind === 'won';
              const isCall = eventKind === 'call';
              const isNote = eventKind === 'note';
              const isTask = eventKind === 'task';
              const actorName = event.actor?.name || 'Sistema';
              const relativeTime = formatRelativeTime(event.occurred_at);
              const title = event.title || (isEmail ? event.email?.subject : eventKind);
              const recipients = event.email?.to?.join(', ') || '';

              return (
                <li key={event.id} className="relative flex gap-3 text-xs">
                  {/* Left Column: Icon Node on Rail */}
                  <div className="relative z-10 flex-shrink-0">
                    {isEmail ? (
                      <div className="relative">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1B75BB] text-white shadow-xs">
                          <Mail className="h-4 w-4" />
                        </div>
                        {/* Sub-badge indicating direction */}
                        <div className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-white bg-slate-900 text-white shadow-2xs">
                          {event.email?.direction === 'inbound' ? (
                            <ArrowDownLeft className="h-2 w-2 stroke-[3]" />
                          ) : (
                            <ArrowUpRight className="h-2 w-2 stroke-[3]" />
                          )}
                        </div>
                      </div>
                    ) : isWon ? (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs">
                        <Star className="h-4 w-4 fill-white text-white" />
                      </div>
                    ) : isCall ? (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-white shadow-xs">
                        <Phone className="h-4 w-4" />
                      </div>
                    ) : isNote ? (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-white shadow-xs">
                        <MessageSquare className="h-4 w-4 fill-white/20 text-white" />
                      </div>
                    ) : isTask ? (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xs">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-600 text-white shadow-xs">
                        <Tag className="h-4 w-4" />
                      </div>
                    )}
                  </div>

                  {/* Right Column: Event Content */}
                  <div className="min-w-0 flex-1 pt-0.5">
                    {/* Timestamp in subtle gray */}
                    <div className="text-[11px] text-slate-500">
                      <time dateTime={event.occurred_at}>{relativeTime}</time>
                    </div>

                    {/* Narrative Title matching Nutshell style */}
                    <div className="text-xs text-slate-800 leading-snug">
                      {isEmail ? (
                        <>
                          <span className="font-semibold text-slate-900">{actorName}</span>
                          {' emailed '}
                          <span className="font-semibold text-slate-900">
                            {recipients || 'destinatários'}
                          </span>
                        </>
                      ) : isWon ? (
                        <>
                          <span className="font-semibold text-slate-900">{actorName}</span>
                          {' won the lead '}
                          <span className="font-semibold text-slate-900">
                            {title || 'Oportunidade'}
                          </span>
                        </>
                      ) : isCall ? (
                        <>
                          <span className="font-semibold text-slate-900">{actorName}</span>
                          {' registrou uma ligação'}
                        </>
                      ) : isNote ? (
                        <>
                          <span className="font-semibold text-slate-900">{actorName}</span>
                          {' adicionou uma nota'}
                        </>
                      ) : isTask ? (
                        <>
                          <span className="font-semibold text-slate-900">{actorName}</span>
                          {' completou uma tarefa'}
                        </>
                      ) : (
                        <>
                          <span className="font-semibold text-slate-900">{actorName}</span>
                          {' registrou uma atividade'}
                        </>
                      )}
                    </div>

                    {/* Specific Payload Cards */}
                    {isEmail ? (
                      <EmailTimelineCard
                        email={event.email!}
                        engagement={event.engagement!}
                        lifecycle={event.lifecycle || []}
                      />
                    ) : isWon ? (
                      /* Won Lead Visual: Team contributors avatars */
                      <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                        <span>2</span>
                        <span
                          className="flex h-4 w-4 items-center justify-center rounded bg-slate-800 text-[9px] font-bold text-white"
                          title="Nicole Walters"
                        >
                          NW
                        </span>
                        <span
                          className="flex h-4 w-4 items-center justify-center rounded bg-emerald-700 text-[9px] font-bold text-white"
                          title="Avalia Solar"
                        >
                          AS
                        </span>
                      </div>
                    ) : (
                      /* General Event Card */
                      <article
                        className={`mt-1.5 rounded-lg border border-slate-200/90 bg-white p-3 shadow-2xs ${
                          isNote ? 'border-l-4 border-l-amber-400' : ''
                        }`}
                      >
                        <h4 className="font-semibold text-slate-900">{title}</h4>
                        {event.preview && (
                          <p className="mt-1 text-slate-600 line-clamp-3 leading-relaxed">
                            {event.preview}
                          </p>
                        )}
                        {event.actor && (
                          <span className="mt-2 inline-flex items-center gap-1 text-[11px] text-slate-400">
                            <User className="h-3 w-3" />
                            {event.actor.name}
                          </span>
                        )}
                      </article>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}
