'use client';

import {
  Archive,
  ArrowLeft,
  BellRing,
  Bot,
  CheckCircle2,
  ChevronDown,
  CircleUserRound,
  ExternalLink,
  Info,
  Loader2,
  MessageCircleMore,
  Search,
  Send,
  Smartphone,
  UserRoundCheck,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCompanyContext } from '@/context/CompanyContext';
import { useActionCableInbox, type InboxRealtimeEvent } from '@/hooks/useActionCableInbox';
import {
  inboxApi,
  type InboxCounts,
  type InboxMessage,
  type InboxMode,
  type InboxSession,
  type InboxStatus,
} from '@/lib/inbox-api';
import {
  getInboxSoundPreference,
  playNotificationSound,
  setInboxSoundPreference,
} from '@/lib/notification-sound';
import { cn } from '@/lib/utils';

const EMPTY_COUNTS: InboxCounts = { all: 0, waiting_agent: 0, in_progress: 0, archived: 0 };
const FILTERS: Array<{ value: 'all' | InboxStatus; label: string; count: keyof InboxCounts }> = [
  { value: 'all', label: 'Todas', count: 'all' },
  { value: 'waiting_agent', label: 'Aguardando humano', count: 'waiting_agent' },
  { value: 'in_progress', label: 'Em atendimento', count: 'in_progress' },
  { value: 'archived', label: 'Arquivadas', count: 'archived' },
];

function relativeTime(value?: string | null) {
  if (!value) return 'agora';
  const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return 'agora';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)} h`;
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(new Date(value));
}

function priority(score = 0) {
  if (score >= 75) return { label: '🔥 ICP Match Alto', className: 'border-emerald-300 bg-emerald-50 text-emerald-800 font-bold' };
  if (score >= 40) return { label: 'Média intenção', className: 'border-amber-300 bg-amber-50 text-amber-800' };
  return { label: 'Informativo', className: 'border-slate-300 bg-slate-50 text-slate-700' };
}

function ConversationCard({
  session,
  active,
  onClick,
}: {
  session: InboxSession;
  active: boolean;
  onClick: () => void;
}) {
  const lead = session.lead;
  const level = priority(lead?.score);
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full border-b border-slate-200 px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600',
        active ? 'border-l-2 border-l-amber-500 bg-amber-50/60' : 'hover:bg-slate-50'
      )}
      aria-current={active ? 'true' : undefined}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-slate-200 bg-white text-slate-700">
          <CircleUserRound className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <strong className="truncate text-sm text-slate-950">{lead?.name || 'Visitante'}</strong>
            <span className="shrink-0 text-[11px] text-slate-600">{relativeTime(session.last_message_at)}</span>
          </div>
          <p className="mt-1 truncate text-xs text-slate-600">
            {session.last_message?.content || 'Conversa iniciada'}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className={cn('border px-1.5 py-0.5 text-[10px] font-semibold', level.className)}>
              {level.label} · {lead?.score || 0}
            </span>
            {session.unread_count > 0 && (
              <span className="ml-auto min-w-5 bg-red-600 px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
                {session.unread_count}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function ModeToggleSwitch({
  mode,
  busy,
  onChange,
}: {
  mode: InboxMode;
  busy: boolean;
  onChange: (mode: InboxMode) => void;
}) {
  const human = mode === 'human_manual';
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => onChange(human ? 'bot_only' : 'human_manual')}
      className={cn(
        'inline-flex min-h-11 items-center gap-2 border px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-60',
        human ? 'border-amber-400 bg-amber-50 text-amber-900' : 'border-emerald-300 bg-emerald-50 text-emerald-900'
      )}
      aria-pressed={human}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : human ? <UserRoundCheck className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      {human ? 'Atendente assumiu' : 'IA respondendo'}
    </button>
  );
}

function MessageBubble({ message }: { message: InboxMessage }) {
  const isAgent = message.role === 'agent';
  const isBot = message.role === 'assistant';
  return (
    <div className={cn('flex', isAgent ? 'justify-end' : 'justify-start')}>
      <article
        className={cn(
          'max-w-[82%] border px-3 py-2 text-sm leading-6',
          isAgent && 'border-amber-500 bg-amber-400 text-slate-950',
          isBot && 'border-cyan-800 bg-cyan-950 text-cyan-50',
          message.role === 'user' && 'border-slate-700 bg-slate-800 text-white',
          message.role === 'system' && 'mx-auto border-slate-300 bg-slate-100 text-slate-700'
        )}
      >
        <header className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider opacity-80">
          {isAgent ? <UserRoundCheck className="h-3 w-3" /> : isBot ? <Bot className="h-3 w-3" /> : null}
          {isAgent ? message.sender_name || 'Atendente' : isBot ? 'MobiVolt' : message.role === 'user' ? 'Cliente' : 'Sistema'}
        </header>
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <time className="mt-1 block text-right text-[10px] opacity-65">
          {new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(message.created_at))}
        </time>
      </article>
    </div>
  );
}

function LeadSidebarDetails({ session, onClose }: { session: InboxSession; onClose?: () => void }) {
  const lead = session.lead;
  const phone = lead?.phone?.replace(/\D/g, '') || '';
  const whatsappPhone = phone.startsWith('55') ? phone : `55${phone}`;
  const whatsapp = phone
    ? `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(`Olá ${lead?.name || ''}! Recebi seu contato pelo Avalia Solar.`)}`
    : null;
  return (
    <aside className="h-full overflow-y-auto bg-white p-5 text-slate-900">
      <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700">Ficha do lead</span>
          <h2 className="mt-1 text-lg font-bold">{lead?.name || 'Visitante'}</h2>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center border border-slate-300" aria-label="Fechar detalhes do lead">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-px border border-slate-200 bg-slate-200">
        <div className="bg-white p-3"><span className="block text-[10px] uppercase text-slate-500">Intent score</span><strong className="text-xl">{lead?.score || 0}/100</strong></div>
        <div className="bg-white p-3"><span className="block text-[10px] uppercase text-slate-500">Prioridade</span><strong className="text-sm">{priority(lead?.score).label}</strong></div>
      </div>
      <dl className="divide-y divide-slate-200 border-b border-slate-200 text-sm">
        {[
          ['WhatsApp', lead?.phone],
          ['E-mail', lead?.email],
          ['Cidade', [lead?.city, lead?.state].filter(Boolean).join('/')],
          ['Fatura mensal', lead?.monthly_bill ? `R$ ${Number(lead.monthly_bill).toLocaleString('pt-BR')}` : null],
          ['Solução', lead?.solution_type || lead?.project_type],
          ['Próxima ação', lead?.recommended_next_action],
        ].map(([label, value]) => (
          <div key={label} className="py-3">
            <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</dt>
            <dd className="mt-1 break-words font-medium">{value || 'Não informado'}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 space-y-2">
        <a
          href={whatsapp || undefined}
          target="_blank"
          rel="noreferrer"
          aria-disabled={!whatsapp}
          className={cn('flex min-h-11 w-full items-center justify-center gap-2 bg-emerald-700 px-4 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500', !whatsapp && 'pointer-events-none opacity-50')}
        >
          <Smartphone className="h-4 w-4" /> Abrir no WhatsApp <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </aside>
  );
}

export default function LiveInbox() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { activeCompany, isLoading: companyLoading } = useCompanyContext();
  const companyId = activeCompany ? Number(activeCompany.id) : null;
  const [sessions, setSessions] = useState<InboxSession[]>([]);
  const [counts, setCounts] = useState(EMPTY_COUNTS);
  const [filter, setFilter] = useState<'all' | InboxStatus>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(() => Number(searchParams.get('session_id')) || null);
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [modeBusy, setModeBusy] = useState(false);
  const [draft, setDraft] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [customerTyping, setCustomerTyping] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selected = useMemo(() => sessions.find((session) => session.id === selectedId) || null, [sessions, selectedId]);

  useEffect(() => setSoundEnabled(getInboxSoundPreference()), []);

  useEffect(() => {
    if (authLoading || companyLoading) return;
    if (!user) router.replace('/login?return_to=%2Fdashboard%2Finbox');
    else if (user.role === 'review') router.replace('/review-dashboard');
    else if (!companyId && user.role !== 'admin') router.replace('/select-company');
  }, [authLoading, companyId, companyLoading, router, user]);

  const loadSessions = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const response = await inboxApi.sessions(companyId, filter, query);
      setSessions(response.sessions);
      setCounts(response.counts);
      setSelectedId((current) => current && response.sessions.some((item) => item.id === current) ? current : response.sessions[0]?.id || null);
    } finally {
      setLoading(false);
    }
  }, [companyId, filter, query]);

  useEffect(() => {
    const timer = setTimeout(() => void loadSessions(), query ? 250 : 0);
    return () => clearTimeout(timer);
  }, [loadSessions, query]);

  useEffect(() => {
    if (!companyId || !selectedId) {
      setMessages([]);
      return;
    }
    void inboxApi.messages(companyId, selectedId).then((response) => {
      setMessages(response.messages);
      void inboxApi.markRead(companyId, selectedId);
    });
  }, [companyId, selectedId]);

  const handleRealtime = useCallback((event: InboxRealtimeEvent) => {
    if (event.type === 'inbox.message.created') {
      setSessions((current) => {
        const exists = current.some((session) => session.id === event.session.id);
        const next = exists
          ? current.map((session) => session.id === event.session.id ? { ...session, ...event.session, last_message: event.message } : session)
          : [{ ...event.session, last_message: event.message }, ...current];
        return next.sort((a, b) => new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime());
      });
      if (event.session.id === selectedId) {
        setMessages((current) => current.some((message) => message.id === event.message.id) ? current : [...current, event.message]);
        if (companyId) void inboxApi.markRead(companyId, selectedId);
      }
      if (event.message.role === 'user' && soundEnabled && (document.hidden || !document.hasFocus())) {
        playNotificationSound();
      }
    }
    if (event.type === 'inbox.session.updated') {
      setSessions((current) => current.map((session) => session.id === event.session.id ? { ...session, ...event.session } : session));
    }
    if (event.type === 'inbox.typing' && event.session_id === selectedId && event.actor === 'customer') {
      setCustomerTyping(event.typing);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (event.typing) typingTimerRef.current = setTimeout(() => setCustomerTyping(false), 4000);
    }
  }, [companyId, selectedId, soundEnabled]);

  const { connected, setTyping } = useActionCableInbox(companyId, selectedId, handleRealtime);

  useEffect(() => threadEndRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages, customerTyping]);

  const changeMode = async (mode: InboxMode) => {
    if (!companyId || !selectedId) return;
    setModeBusy(true);
    try {
      const updated = await inboxApi.updateMode(companyId, selectedId, mode);
      setSessions((current) => current.map((session) => session.id === updated.id ? { ...session, ...updated } : session));
    } finally {
      setModeBusy(false);
    }
  };

  const sendMessage = async () => {
    const content = draft.trim();
    if (!companyId || !selectedId || !content || sending) return;
    setSending(true);
    setDraft('');
    setTyping(false);
    try {
      const id = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
      const message = await inboxApi.send(companyId, selectedId, content, id);
      setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]);
    } finally {
      setSending(false);
    }
  };

  const archiveSelected = async () => {
    if (!companyId || !selectedId) return;
    await inboxApi.archive(companyId, selectedId);
    setSelectedId(null);
    await loadSessions();
  };

  if (authLoading || companyLoading || (!companyId && user?.role !== 'admin')) {
    return <div className="flex min-h-[70vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-blue-700" aria-label="Carregando inbox" /></div>;
  }

  return (
    <main className="min-h-[calc(100dvh-64px)] bg-slate-100 text-slate-950">
      <header className="border-b border-slate-300 bg-white px-4 py-3 lg:px-6">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-700">Atendimento ao vivo</p>
            <h1 className="text-xl font-bold">Inbox · {activeCompany?.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn('hidden items-center gap-1.5 text-xs sm:flex', connected ? 'text-emerald-700' : 'text-red-700')}>
              {connected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              {connected ? 'Tempo real' : 'Reconectando'}
            </span>
            <button
              type="button"
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                setInboxSoundPreference(next);
              }}
              className="flex h-11 w-11 items-center justify-center border border-slate-300 bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              aria-label={soundEnabled ? 'Desativar notificações sonoras' : 'Ativar notificações sonoras'}
              aria-pressed={soundEnabled}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid h-[calc(100dvh-129px)] max-w-[1600px] grid-cols-1 overflow-hidden border-x border-slate-300 bg-white lg:grid-cols-[minmax(280px,30%)_minmax(420px,45%)_minmax(260px,25%)]">
        <section className={cn('min-h-0 border-r border-slate-300', selectedId && 'hidden lg:block')} aria-label="Conversas">
          <div className="border-b border-slate-200 p-3">
            <label className="flex h-11 items-center gap-2 border border-slate-300 px-3 focus-within:ring-2 focus-within:ring-blue-600">
              <Search className="h-4 w-4 text-slate-500" aria-hidden="true" />
              <span className="sr-only">Buscar conversa</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Buscar conversa..." />
            </label>
            <label className="mt-2 flex h-11 items-center border border-slate-300 px-3 text-sm">
              <span className="sr-only">Filtrar conversas por status</span>
              <select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} className="h-full min-w-0 flex-1 appearance-none bg-transparent outline-none">
                {FILTERS.map((item) => <option key={item.value} value={item.value}>{item.label} ({counts[item.count]})</option>)}
              </select>
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </label>
          </div>
          <div className="h-[calc(100%-116px)] overflow-y-auto">
            {loading ? <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div> : sessions.length ? sessions.map((session) => (
              <ConversationCard key={session.id} session={session} active={session.id === selectedId} onClick={() => setSelectedId(session.id)} />
            )) : <div className="p-8 text-center text-sm text-slate-600"><MessageCircleMore className="mx-auto mb-3 h-8 w-8" /><p>Nenhuma conversa neste filtro.</p></div>}
          </div>
        </section>

        <section className={cn('relative flex min-h-0 flex-col bg-slate-50', !selectedId && 'hidden lg:flex')} aria-label="Conversa ativa">
          {selected ? (
            <>
              <header className="flex min-h-[64px] items-center justify-between gap-3 border-b border-slate-300 bg-white px-3 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <button type="button" onClick={() => setSelectedId(null)} className="flex h-11 w-11 shrink-0 items-center justify-center border border-slate-300 lg:hidden" aria-label="Voltar para conversas"><ArrowLeft className="h-4 w-4" /></button>
                  <div className="min-w-0"><h2 className="truncate text-sm font-bold">{selected.lead?.name || 'Visitante'}</h2><p className="truncate text-xs text-slate-600">{[selected.lead?.city, selected.lead?.state].filter(Boolean).join('/') || 'Local não informado'}</p></div>
                </div>
                <div className="flex items-center gap-2">
                  <ModeToggleSwitch mode={selected.mode} busy={modeBusy} onChange={changeMode} />
                  <button type="button" onClick={() => setDetailsOpen(true)} className="flex h-11 w-11 items-center justify-center border border-slate-300 lg:hidden" aria-label="Ver detalhes do lead"><Info className="h-4 w-4" /></button>
                  <button type="button" onClick={archiveSelected} className="hidden h-11 w-11 items-center justify-center border border-slate-300 sm:flex" aria-label="Arquivar conversa"><Archive className="h-4 w-4" /></button>
                </div>
              </header>
              <div className="flex-1 space-y-3 overflow-y-auto p-4 pb-28 sm:pb-4" aria-live="polite">
                {selected.status === 'waiting_agent' && <div className="flex items-center justify-center gap-2 border border-amber-300 bg-amber-50 p-2 text-xs font-semibold text-amber-900"><BellRing className="h-4 w-4" /> Transbordo humano solicitado</div>}
                {messages.map((message) => <MessageBubble key={message.id} message={message} />)}
                {customerTyping && <p className="text-xs text-slate-600">Cliente digitando…</p>}
                <div ref={threadEndRef} />
              </div>
              <div className="inbox-mobile-input-bar border-t border-slate-300 bg-white p-3">
                <div className="flex items-end gap-2">
                  <label className="min-w-0 flex-1"><span className="sr-only">Mensagem para o cliente</span><textarea value={draft} onChange={(event) => { setDraft(event.target.value); setTyping(event.target.value.length > 0); }} onBlur={() => setTyping(false)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }} rows={1} className="min-h-11 max-h-28 w-full resize-none border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600" placeholder="Digite sua mensagem..." /></label>
                  <button type="button" onClick={sendMessage} disabled={!draft.trim() || sending} className="flex h-11 w-11 shrink-0 items-center justify-center bg-blue-700 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50" aria-label="Enviar mensagem">{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</button>
                </div>
              </div>
            </>
          ) : <div className="m-auto max-w-xs p-6 text-center text-slate-600"><CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-600" /><h2 className="font-bold text-slate-900">Selecione uma conversa</h2><p className="mt-1 text-sm">O histórico e os dados do lead aparecerão aqui.</p></div>}
        </section>

        <div className="hidden min-h-0 border-l border-slate-300 lg:block">{selected ? <LeadSidebarDetails session={selected} /> : null}</div>
      </div>

      {detailsOpen && selected && <div className="fixed inset-0 z-50 bg-slate-950/55 lg:hidden" onMouseDown={(event) => { if (event.currentTarget === event.target) setDetailsOpen(false); }}><div role="dialog" aria-modal="true" aria-label="Detalhes do lead" className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-hidden border-t border-slate-300 bg-white pb-[env(safe-area-inset-bottom)]"><LeadSidebarDetails session={selected} onClose={() => setDetailsOpen(false)} /></div></div>}

      <style jsx global>{`
        @media (max-width: 1023px) {
          .inbox-mobile-input-bar {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 30;
            padding-bottom: max(12px, env(safe-area-inset-bottom));
            padding-left: max(16px, env(safe-area-inset-left));
            padding-right: max(16px, env(safe-area-inset-right));
          }
        }
      `}</style>
    </main>
  );
}
