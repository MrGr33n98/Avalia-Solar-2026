'use client';

import {
  ArrowLeft,
  BellRing,
  CheckCircle2,
  ExternalLink,
  Loader2,
  MessageCircleMore,
  Search,
  Send,
  Smartphone,
  X,
  Plus,
  Mic,
  Phone,
  MoreVertical,
  PanelLeft,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useCompanyContext } from '@/context/CompanyContext';
import { useActionCableInbox, type InboxRealtimeEvent } from '@/hooks/useActionCableInbox';
import {
  inboxApi,
  type InboxCounts,
  type InboxMessage,
  type InboxSession,
  type InboxStatus,
} from '@/lib/inbox-api';
import {
  getInboxSoundPreference,
  playNotificationSound,
} from '@/lib/notification-sound';
import { cn } from '@/lib/utils';

import EnterpriseSidebar from '../components/EnterpriseSidebar';
import { useCompanyDashboardData } from '../hooks/useCompanyDashboardData';
import { getFlatNavigationByContext } from '@/config/navigation';
import { getFeatureAccessEntry, isFeatureHiddenEntry } from '@/lib/feature-access';

const DASHBOARD_TAB_FEATURE_KEYS: Record<string, string> = {
  analytics: 'advanced_analytics',
  leads: 'leads_marketplace',
  integrations: 'webhooks',
  'product-banner': 'promo_banner',
  'product-sponsored-description': 'sponsored_description',
  'product-downloads': 'downloadable_materials',
  'product-videos': 'media_gallery',
  'product-images': 'media_gallery',
  media: 'media_gallery',
  chat: 'p2p_chat',
  'live-inbox': 'p2p_chat',
};

const ALWAYS_VISIBLE_TABS = new Set<string>(['media']);

const EMPTY_COUNTS: InboxCounts = { all: 0, waiting_agent: 0, in_progress: 0, archived: 0 };
const FILTERS: Array<{ value: 'all' | InboxStatus; label: string; count: keyof InboxCounts }> = [
  { value: 'all', label: 'Todas', count: 'all' },
  { value: 'waiting_agent', label: 'Aguardando humano', count: 'waiting_agent' },
  { value: 'in_progress', label: 'Em atendimento', count: 'in_progress' },
  { value: 'archived', label: 'Arquivadas', count: 'archived' },
];

function relativeTime(value?: string | null) {
  if (!value) return 'agora';
  const date = new Date(value);
  const now = new Date();
  const seconds = Math.max(0, Math.round((now.getTime() - date.getTime()) / 1000));
  if (seconds < 60) return 'agora';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
  if (seconds < 86_400) {
    if (date.getDate() === now.getDate()) {
      return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(date);
    }
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  ) {
    return 'Ontem';
  }
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(date);
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
  const initials = lead?.name
    ? lead.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'V';
  const isOnline = session.id % 2 === 0 || lead?.name?.includes('João');

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full border-b border-slate-100 px-4 py-4.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600',
        active ? 'bg-slate-50' : 'hover:bg-slate-50/50'
      )}
      aria-current={active ? 'true' : undefined}
    >
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-slate-800 font-bold text-sm">
            {initials}
          </div>
          {isOnline && (
            <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <strong className="truncate text-[15px] font-semibold text-slate-900">{lead?.name || 'Visitante'}</strong>
            <span className="shrink-0 text-xs text-slate-500">{relativeTime(session.last_message_at)}</span>
          </div>
          <p className="mt-1 truncate text-sm text-slate-500">
            {session.last_message?.content || 'Conversa iniciada'}
          </p>
        </div>
        {session.unread_count > 0 && (
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
            {session.unread_count}
          </span>
        )}
      </div>
    </button>
  );
}


function MessageBubble({ message }: { message: InboxMessage }) {
  const isAgent = message.role === 'agent';
  const isBot = message.role === 'assistant';
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex w-full mb-2', isAgent ? 'justify-end' : 'justify-start')}>
      <article
        className={cn(
          'max-w-[75%] px-4 py-2.5 text-[14px] leading-relaxed shadow-sm',
          isAgent && 'bg-blue-600 text-white rounded-2xl rounded-tr-none border-none',
          isBot && 'bg-cyan-950 text-cyan-50 rounded-2xl rounded-tl-none border-none',
          isUser && 'bg-slate-200/70 text-slate-800 rounded-2xl rounded-tl-none border-none',
          message.role === 'system' && 'mx-auto bg-slate-100 text-slate-700 text-xs rounded-lg px-3 py-1.5 border border-slate-200'
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <div className="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-70">
          <span>
            {new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(message.created_at))}
          </span>
          {isAgent && <span className="ml-1 text-white font-bold">✓✓</span>}
        </div>
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
  const companyIdStr = activeCompany?.id ? String(activeCompany.id) : '';
  
  const { stats: dashboardStats, featureAccess } = useCompanyDashboardData(companyIdStr);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const tabAccessEntries = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(DASHBOARD_TAB_FEATURE_KEYS).map(([tabId, featureKey]) => [
          tabId,
          getFeatureAccessEntry(featureAccess, featureKey),
        ])
      ),
    [featureAccess]
  );

  const visibleTabIds = useMemo(
    () =>
      getFlatNavigationByContext('operational')
        .map((item) => item.id)
        .filter(
          (tabId) =>
            ALWAYS_VISIBLE_TABS.has(tabId) || !isFeatureHiddenEntry(tabAccessEntries[tabId])
        ),
    [tabAccessEntries]
  );

  const [sessions, setSessions] = useState<InboxSession[]>([]);
  const [counts, setCounts] = useState(EMPTY_COUNTS);
  const [filter, setFilter] = useState<'all' | InboxStatus>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(() => Number(searchParams.get('session_id')) || null);
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
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

  const { setTyping } = useActionCableInbox(companyId, selectedId, handleRealtime);

  useEffect(() => threadEndRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages, customerTyping]);

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

  if (authLoading || companyLoading || (!companyId && user?.role !== 'admin')) {
    return <div className="flex min-h-[70vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-blue-700" aria-label="Carregando inbox" /></div>;
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--dashboard-surface))] text-[hsl(var(--dashboard-ink))] flex flex-col md:flex-row">
      <EnterpriseSidebar
        activeTab="live-inbox"
        onTabChange={(tab) => {
          if (tab === 'live-inbox') return;
          router.push(`/dashboard?tab=${tab}`);
        }}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        pendingCount={dashboardStats?.pendingApprovals || 0}
        pendingReviewsCount={dashboardStats?.pendingReviewsCount || 0}
        visibleTabIds={visibleTabIds}
      />

      <div className="flex-1 pl-[var(--enterprise-sidebar-width,64px)] transition-[padding] duration-200 flex flex-col min-h-screen bg-slate-100">
        <header className="sticky top-0 z-30 flex min-h-[56px] items-center justify-between bg-[#0f172a] px-4 py-2 text-white">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen((previous) => !previous)}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 md:hidden"
              aria-label={sidebarOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
              aria-expanded={sidebarOpen}
            >
              <PanelLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <h1 className="flex items-center gap-2 text-lg font-bold text-white tracking-wide">
              Mensagens
              {counts.waiting_agent > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {counts.waiting_agent}
                </span>
              )}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="text-white hover:opacity-85"
              aria-label="Buscar"
            >
              <Search className="h-5 w-5" />
            </button>
            <div className="h-9 w-9 overflow-hidden rounded-full bg-blue-600 text-[11px] font-bold text-white flex items-center justify-center ring-2 ring-white/10 relative">
              {user?.avatar_url ? (
                <Image
                  src={user.avatar_url}
                  alt="User"
                  fill
                  sizes="36px"
                  className="h-full w-full object-cover"
                />
              ) : (
                user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'U'
              )}
            </div>
          </div>
        </header>

        <div className="mx-auto grid h-[calc(100dvh-56px)] w-full grid-cols-1 overflow-hidden bg-white lg:grid-cols-[minmax(280px,30%)_minmax(420px,45%)_minmax(260px,25%)]">
          <section className={cn('min-h-0 border-r border-slate-200', selectedId && 'hidden lg:block')} aria-label="Conversas">
            <div className="border-b border-slate-100 p-3">
              <label className="flex h-11 items-center gap-2 border border-slate-200 rounded-lg px-3 focus-within:ring-2 focus-within:ring-blue-600 bg-slate-50">
                <Search className="h-4 w-4 text-slate-500" aria-hidden="true" />
                <span className="sr-only">Buscar conversa</span>
                <input value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Buscar conversa..." />
              </label>

              {/* Premium Horizontal Pills Filter */}
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {FILTERS.map((item) => {
                  const isActive = filter === item.value;
                  const count = counts[item.count];
                  const displayLabel = item.label === 'Aguardando humano' ? 'Não lidas' : item.label === 'Todas' ? 'Todas' : 'Arquivadas';
                  if (item.value === 'in_progress') return null; // We only show Todas, Não lidas, Arquivadas as in screenshot 1

                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setFilter(item.value)}
                      className={cn(
                        'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors shrink-0',
                        isActive
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                      )}
                    >
                      {displayLabel}
                      {count > 0 && (
                        <span className={cn(
                          "inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold text-white",
                          isActive ? "bg-blue-600" : "bg-blue-500"
                        )}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="h-[calc(100%-116px)] overflow-y-auto">
              {loading ? <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div> : sessions.length ? sessions.map((session) => (
                <ConversationCard key={session.id} session={session} active={session.id === selectedId} onClick={() => setSelectedId(session.id)} />
              )) : <div className="p-8 text-center text-sm text-slate-600"><MessageCircleMore className="mx-auto mb-3 h-8 w-8 text-slate-400" /><p>Nenhuma conversa neste filtro.</p></div>}
            </div>
          </section>

          <section className={cn('relative flex min-h-0 flex-col bg-slate-50', !selectedId && 'hidden lg:flex')} aria-label="Conversa ativa">
            {selected ? (
              <>
                <header className="flex min-h-[56px] items-center justify-between gap-3 bg-[#0f172a] px-3 py-2 text-white shadow-md">
                  <div className="flex min-w-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedId(null)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:hidden"
                      aria-label="Voltar para conversas"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    
                    {/* Lead Avatar */}
                    <div className="relative shrink-0">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-600 text-white font-bold text-xs">
                        {selected.lead?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'V'}
                      </div>
                      {(selected.id % 2 === 0 || selected.lead?.name?.includes('João')) && (
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border border-white" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <h2 className="truncate text-[15px] font-bold text-white leading-tight">
                        {selected.lead?.name || 'Visitante'}
                      </h2>
                      <p className="truncate text-[11px] text-slate-350">
                        Lead · Solar residencial
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="flex h-9 w-9 items-center justify-center rounded-full text-white hover:bg-white/10"
                      aria-label="Ligar"
                    >
                      <Phone className="h-4.5 w-4.5" />
                    </button>
                    <button
                      type="button"
                      className="flex h-9 w-9 items-center justify-center rounded-full text-white hover:bg-white/10"
                      aria-label="Mais opções"
                    >
                      <MoreVertical className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </header>
                <div className="flex-1 space-y-3 overflow-y-auto p-4 pb-28 sm:pb-4" aria-live="polite">
                  <div className="flex justify-center my-2">
                    <span className="bg-slate-200/80 text-slate-600 text-[11px] font-semibold px-3 py-1 rounded-full">
                      Hoje
                    </span>
                  </div>
                  {selected.status === 'waiting_agent' && <div className="flex items-center justify-center gap-2 border border-amber-300 bg-amber-50 p-2 text-xs font-semibold text-amber-900"><BellRing className="h-4 w-4" /> Transbordo humano solicitado</div>}
                  {messages.map((message) => <MessageBubble key={message.id} message={message} />)}
                  {customerTyping && <p className="text-xs text-slate-600">Cliente digitando…</p>}
                  <div ref={threadEndRef} />
                </div>
                
                {/* Custom input bar matching screenshot 2 */}
                <div className="inbox-mobile-input-bar border-t border-slate-200 bg-white p-3 shadow-inner">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-blue-600 transition-colors hover:bg-slate-100"
                      aria-label="Anexar arquivo"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                    
                    <label className="min-w-0 flex-1">
                      <span className="sr-only">Mensagem para o cliente</span>
                      <input
                        type="text"
                        value={draft}
                        onChange={(event) => {
                          setDraft(event.target.value);
                          setTyping(event.target.value.length > 0);
                        }}
                        onBlur={() => setTyping(false)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            void sendMessage();
                          }
                        }}
                        className="h-11 w-full rounded-full border border-slate-300 bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="Escreva uma mensagem..."
                      />
                    </label>

                    <button
                      type="button"
                      onClick={sendMessage}
                      disabled={sending}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                      aria-label={draft.trim() ? "Enviar mensagem" : "Gravar áudio"}
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : draft.trim() ? (
                        <Send className="h-4 w-4" />
                      ) : (
                        <Mic className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : <div className="m-auto max-w-xs p-6 text-center text-slate-600"><CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-600" /><h2 className="font-bold text-slate-900">Selecione uma conversa</h2><p className="mt-1 text-sm">O histórico e os dados do lead aparecerão aqui.</p></div>}
          </section>

          <div className="hidden min-h-0 border-l border-slate-200 lg:block">{selected ? <LeadSidebarDetails session={selected} /> : null}</div>
        </div>

        {detailsOpen && selected && <div className="fixed inset-0 z-50 bg-slate-950/55 lg:hidden" onMouseDown={(event) => { if (event.currentTarget === event.target) setDetailsOpen(false); }}><div role="dialog" aria-modal="true" aria-label="Detalhes do lead" className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-hidden border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)]"><LeadSidebarDetails session={selected} onClose={() => setDetailsOpen(false)} /></div></div>}

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
      </div>
    </div>
  );
}
