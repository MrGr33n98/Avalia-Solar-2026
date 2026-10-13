'use client';

import {
  ArrowLeft,
  Bot,
  Building2,
  Calendar,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  FileQuestion,
  FileText,
  Loader2,
  MessageCircle,
  MessageSquare,
  MoreVertical,
  PanelLeft,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  User,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useCompanyContext } from '@/context/CompanyContext';
import { conversationsApi, type DirectMessage } from '@/lib/api';
import {
  inboxApi,
  unifiedInboxApi,
  uploadAttachmentFile,
  type InboxActivity,
  type InboxLead,
  type InboxMessage,
  type InboxMode,
  type UnifiedInboxCounts,
  type UnifiedInboxItem,
} from '@/lib/inbox-api';
import {
  getInboxSoundPreference,
  playNotificationSound,
  setInboxSoundPreference,
} from '@/lib/notification-sound';
import { cn } from '@/lib/utils';
import { useRealtimeConnection } from '@/hooks/useRealtimeConnection';
import { usePushNotifications } from '@/hooks/usePushNotifications';
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
  'live-inbox': 'ai_live_inbox',
};

const ALWAYS_VISIBLE_TABS = new Set<string>(['media']);

const EMPTY_COUNTS: UnifiedInboxCounts = { all: 0, unread: 0, waiting_reply: 0, archived: 0 };

type FilterType = 'all' | 'unread' | 'waiting_reply' | 'archived';
type ChannelFilter = 'all' | 'p2p' | 'ai';

interface FilterOption {
  value: FilterType;
  label: string;
  countKey: keyof UnifiedInboxCounts;
}

const FILTERS: FilterOption[] = [
  { value: 'all', label: 'Todas', countKey: 'all' },
  { value: 'unread', label: 'Não lidas', countKey: 'unread' },
  { value: 'waiting_reply', label: 'Aguardando resposta', countKey: 'waiting_reply' },
  { value: 'archived', label: 'Arquivadas / Resolvidas', countKey: 'archived' },
];

function formatRelativeTime(dateString?: string | null): string {
  if (!dateString) return 'agora';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));
    if (diffSeconds < 60) return 'agora';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} min`;
    if (diffSeconds < 86400) {
      if (date.getDate() === now.getDate()) {
        return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(date);
      }
      return 'Ontem';
    }
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(date);
  } catch {
    return 'agora';
  }
}

function getInitials(name?: string | null): string {
  if (!name) return 'CL';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function priorityBadge(score = 0) {
  if (score >= 75) return { label: 'Alta intenção', className: 'border-emerald-300 bg-emerald-50 text-emerald-800 font-bold' };
  if (score >= 40) return { label: 'Média intenção', className: 'border-amber-300 bg-amber-50 text-amber-800' };
  return { label: 'Informativo', className: 'border-slate-300 bg-slate-50 text-slate-700' };
}

// =========================================================================
// SUBCOMPONENT: Thread Card in List
// =========================================================================
function ThreadCard({
  item,
  active,
  onClick,
}: {
  item: UnifiedInboxItem;
  active: boolean;
  onClick: () => void;
}) {
  const isP2P = item.channel === 'p2p';
  const initials = getInitials(item.participant?.name);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full border-b border-slate-100 px-4 py-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600',
        active ? 'bg-blue-50/70 border-l-4 border-l-blue-600' : 'hover:bg-slate-50/60'
      )}
      aria-current={active ? 'true' : undefined}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative shrink-0 mt-0.5">
          <div
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-full text-xs font-bold text-white shadow-xs',
              isP2P ? 'bg-indigo-600' : 'bg-cyan-700'
            )}
          >
            {initials}
          </div>
          <span
            className={cn(
              'absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-white text-[9px] font-bold text-white',
              isP2P ? 'bg-blue-600' : 'bg-teal-600'
            )}
            title={isP2P ? 'Canal Comprador (P2P)' : 'Canal Chat IA / Lead'}
          >
            {isP2P ? <User className="h-2.5 w-2.5" /> : <Bot className="h-2.5 w-2.5" />}
          </span>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1.5">
            <span className="truncate text-[14px] font-bold text-slate-900 leading-tight">
              {item.participant?.name || (isP2P ? 'Comprador Solar' : 'Visitante IA')}
            </span>
            <span className="shrink-0 text-[11px] text-slate-500 font-medium">
              {formatRelativeTime(item.updated_at)}
            </span>
          </div>

          {/* Proposal Reference or Channel Pill */}
          <div className="mt-1 flex items-center gap-1.5 flex-wrap">
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase',
                isP2P
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-cyan-50 text-cyan-800 border border-cyan-200'
              )}
            >
              {isP2P ? 'Comprador' : 'Chat IA'}
            </span>

            {item.marketplace_proposal_reference && (
              <span className="inline-flex items-center gap-0.5 rounded-sm bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                Proposta #{item.marketplace_proposal_reference}
              </span>
            )}
          </div>

          {/* Last message snippet */}
          <p className="mt-1.5 line-clamp-1 text-xs text-slate-600 leading-normal">
            {item.last_message?.body ? (
              <span>
                {item.last_message.sender_type === 'Company' ? (
                  <span className="font-semibold text-slate-700">Você: </span>
                ) : null}
                {item.last_message.body}
              </span>
            ) : (
              <span className="italic text-slate-400">Conversa aberta</span>
            )}
          </p>
        </div>

        {/* Unread badge */}
        {item.unread_count > 0 && (
          <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[11px] font-black text-white shadow-xs">
            {item.unread_count}
          </span>
        )}
      </div>
    </button>
  );
}

// =========================================================================
// SUBCOMPONENT: Right Contextual Details Panel
// =========================================================================
function RightContextPanel({
  item,
  activities,
  onTakeover,
  onReturnToBot,
  onResolveP2P,
  onReopenP2P,
  onClose,
}: {
  item: UnifiedInboxItem;
  activities: InboxActivity[];
  onTakeover?: () => Promise<void>;
  onReturnToBot?: () => Promise<void>;
  onResolveP2P?: () => Promise<void>;
  onReopenP2P?: () => Promise<void>;
  onClose?: () => void;
}) {
  const isP2P = item.channel === 'p2p';
  const lead = item.lead;
  const phone = lead?.phone?.replace(/\D/g, '') || item.participant?.phone?.replace(/\D/g, '') || '';
  const whatsappPhone = phone.startsWith('55') ? phone : `55${phone}`;
  const whatsappLink = phone
    ? `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
        `Olá ${lead?.name || item.participant?.name}! Sou da equipe de atendimento da sua cotação solar no Avalia Solar.`
      )}`
    : null;

  return (
    <aside className="h-full overflow-y-auto bg-white p-5 text-slate-900 border-l border-slate-200 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-700">
            {isP2P ? 'Contexto do Comprador' : 'Ficha do Lead IA'}
          </span>
          <h2 className="mt-1 text-base font-bold text-slate-900 leading-tight">
            {item.participant?.name || 'Contato'}
          </h2>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Fechar painel de detalhes"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* P2P: Linked Proposals Card */}
      {isP2P && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <FileText className="h-4 w-4 text-blue-600" />
            <span>Propostas Comerciais Vinculadas</span>
          </div>

          {item.linked_proposals && item.linked_proposals.length > 0 ? (
            <div className="space-y-2">
              {item.linked_proposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className="rounded-lg border border-slate-200 bg-white p-3 shadow-2xs space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-900 font-bold">
                      Proposta #{proposal.reference || proposal.id}
                    </span>
                    <span className="rounded-sm bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-700 font-bold uppercase">
                      {proposal.status || 'Ativa'}
                    </span>
                  </div>

                  {proposal.value ? (
                    <p className="text-xs text-slate-600">
                      Valor:{' '}
                      <strong className="text-slate-900">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                          proposal.value
                        )}
                      </strong>
                    </p>
                  ) : null}

                  {proposal.power_kwp ? (
                    <p className="text-xs text-slate-600">
                      Potência: <strong>{proposal.power_kwp} kWp</strong>
                    </p>
                  ) : null}

                  <a
                    href={`/dashboard/propostas?id=${proposal.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 pt-1"
                  >
                    <span>Abrir proposta no dashboard</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              ))}
            </div>
          ) : item.marketplace_proposal_reference ? (
            <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-2xs space-y-1">
              <span className="text-xs font-bold text-slate-900">
                Proposta #{item.marketplace_proposal_reference}
              </span>
              <p className="text-xs text-slate-500">Conversa comercial vinculada à proposta.</p>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Nenhuma proposta vinculada a esta conversa direta.</p>
          )}

          {/* Quick P2P Actions */}
          <div className="pt-2 border-t border-slate-200 space-y-2">
            {item.status === 'resolved' ? (
              onReopenP2P && (
                <button
                  type="button"
                  onClick={onReopenP2P}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Reabrir conversa
                </button>
              )
            ) : (
              onResolveP2P && (
                <button
                  type="button"
                  onClick={onResolveP2P}
                  className="w-full rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-800 transition-colors flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Concluir / Resolver negociação
                </button>
              )
            )}
          </div>
        </div>
      )}

      {/* AI Lead Card */}
      {!isP2P && lead && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <span className="block text-[10px] font-extrabold uppercase text-slate-500">
                Intent Score
              </span>
              <strong className="text-lg font-black text-slate-900">{lead.score || 0}/100</strong>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <span className="block text-[10px] font-extrabold uppercase text-slate-500">
                Prioridade
              </span>
              <strong className="text-xs font-bold">{priorityBadge(lead.score).label}</strong>
            </div>
          </div>

          <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white p-3 text-xs">
            {[
              ['WhatsApp', lead.phone],
              ['E-mail', lead.email],
              ['Cidade/UF', [lead.city, lead.state].filter(Boolean).join('/')],
              [
                'Fatura mensal',
                lead.monthly_bill ? `R$ ${Number(lead.monthly_bill).toLocaleString('pt-BR')}` : null,
              ],
              ['Solução', lead.solution_type || lead.project_type],
              ['Próxima ação recomendada', lead.recommended_next_action],
            ].map(([label, value]) => (
              <div key={label} className="py-2.5 first:pt-1 last:pb-1">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</dt>
                <dd className="mt-0.5 break-words font-medium text-slate-900">
                  {value || 'Não informado'}
                </dd>
              </div>
            ))}
          </dl>

          {/* AI Takeover controls */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3.5 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
              <Bot className="h-4 w-4 text-blue-700" />
              <span>Controle do Assistente</span>
            </div>

            <p className="text-[11px] text-blue-800 leading-relaxed">
              Você pode pausar a IA e assumir o atendimento humano desta conversa a qualquer momento.
            </p>

            <div className="flex gap-2">
              {item.capabilities?.can_takeover && onTakeover && (
                <button
                  type="button"
                  onClick={onTakeover}
                  className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors"
                >
                  Assumir conversa
                </button>
              )}
              {item.capabilities?.can_return_to_bot && onReturnToBot && (
                <button
                  type="button"
                  onClick={onReturnToBot}
                  className="flex-1 rounded-lg border border-blue-300 bg-white px-3 py-2 text-xs font-bold text-blue-800 hover:bg-blue-50 transition-colors"
                >
                  Devolver ao bot
                </button>
              )}
            </div>
          </div>

          {/* WhatsApp CTA */}
          {whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition-colors"
            >
              <Smartphone className="h-4 w-4" />
              <span>Contatar via WhatsApp</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      )}

      {/* Activity Timeline */}
      {!isP2P && activities && activities.length > 0 && (
        <div className="border-t border-slate-100 pt-4 space-y-3">
          <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
            Histórico da Sessão
          </h3>
          <div className="relative border-l-2 border-slate-200 ml-2 space-y-3 pb-2">
            {activities.map((act) => (
              <div key={act.id} className="relative pl-3.5">
                <span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-blue-600" />
                <p className="text-[10px] text-slate-500">{formatRelativeTime(act.created_at)}</p>
                <p className="text-xs font-medium text-slate-800">{act.type}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Safety & Trust Note */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-600 space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-slate-800">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Canal Empresarial Seguro</span>
        </div>
        <p className="text-[10px] leading-relaxed">
          Histórico e trocas de mensagens armazenados com criptografia e isolamento restrito à sua empresa.
        </p>
      </div>
    </aside>
  );
}

// =========================================================================
// MAIN COMPONENT: LiveInbox
// =========================================================================
export default function LiveInbox() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { activeCompany, isLoading: companyLoading } = useCompanyContext();

  const companyId = activeCompany ? Number(activeCompany.id) : null;
  const companyIdStr = activeCompany?.id ? String(activeCompany.id) : '';

  const { stats: dashboardStats, featureAccess } = useCompanyDashboardData(companyIdStr);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isSupported, isSubscribed, subscribe } = usePushNotifications();

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
          (tabId) => ALWAYS_VISIBLE_TABS.has(tabId) || !isFeatureHiddenEntry(tabAccessEntries[tabId])
        ),
    [tabAccessEntries]
  );

  // Filter & Search states
  const [items, setItems] = useState<UnifiedInboxItem[]>([]);
  const [counts, setCounts] = useState<UnifiedInboxCounts>(EMPTY_COUNTS);
  const [channelsStatus, setChannelsStatus] = useState<{
    p2p: { enabled: boolean; reason?: string };
    ai: { enabled: boolean; reason?: string };
  }>({ p2p: { enabled: true }, ai: { enabled: true } });

  const [filter, setFilter] = useState<FilterType>('all');
  const [channel, setChannel] = useState<ChannelFilter>('all');
  const [query, setQuery] = useState('');

  // Selected thread (Composite ID: "p2p:<id>" or "ai:<id>")
  const initialSelectedId = useMemo(() => {
    const rawConv = searchParams.get('conversation_id');
    if (rawConv) return `p2p:${rawConv}`;
    const rawSession = searchParams.get('session_id');
    if (rawSession) return `ai:${rawSession}`;
    const rawId = searchParams.get('id');
    if (rawId) return rawId.includes(':') ? rawId : `p2p:${rawId}`;
    return null;
  }, [searchParams]);

  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // Messages in active thread
  const [threadMessages, setThreadMessages] = useState<
    Array<{
      id: number;
      body: string;
      sender_type: 'Company' | 'User' | 'Bot' | 'System';
      sender_name?: string | null;
      created_at: string;
      attachments?: Array<{ id: number; filename: string; url: string; content_type: string }>;
      status?: 'sending' | 'sent' | 'read' | 'failed';
    }>
  >([]);

  const [activities, setActivities] = useState<InboxActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Current selected item
  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) || null,
    [items, selectedId]
  );

  // Sound preference on mount
  useEffect(() => {
    setSoundEnabled(getInboxSoundPreference());
  }, []);

  const toggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    setInboxSoundPreference(nextVal);
  };

  // Auth redirect protection
  useEffect(() => {
    if (authLoading || companyLoading) return;
    if (!user) router.replace('/login?return_to=%2Fdashboard%2Finbox');
    else if (user.role === 'review') router.replace('/review-dashboard');
    else if (!companyId && user.role !== 'admin') router.replace('/select-company');
  }, [authLoading, companyId, companyLoading, router, user]);

  // =========================================================================
  // Load unified items list (P0-A, P0-B, P1-A)
  // =========================================================================
  const loadItems = useCallback(
    async (isLoadMore = false) => {
      if (!companyId) return;

      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }

      try {
        const response = await unifiedInboxApi.list({
          companyId,
          channel,
          filter,
          q: query,
          cursor: isLoadMore ? nextCursor || undefined : undefined,
          limit: 30,
        });

        if (isLoadMore) {
          setItems((prev) => {
            const map = new Map<string, UnifiedInboxItem>();
            prev.forEach((it) => map.set(it.id, it));
            response.items.forEach((it) => map.set(it.id, it));
            return Array.from(map.values());
          });
        } else {
          setItems(response.items);
          setCounts(response.counts);
          setChannelsStatus(response.channels_status);

          // Select first item if none selected on desktop
          if (!selectedId && response.items.length > 0 && typeof window !== 'undefined' && window.innerWidth >= 1200) {
            setSelectedId(response.items[0].id);
          }
        }

        setNextCursor(response.pagination.next_cursor || null);
        setHasMore(response.pagination.has_next_page);
      } catch (err: any) {
        console.error('[UnifiedInbox] Falha ao carregar lista:', err);
        setError(
          err?.status === 403
            ? 'Você não possui permissão para acessar as mensagens desta empresa.'
            : 'Não foi possível carregar as conversas da empresa no momento.'
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    // nextCursor is intentionally omitted from dependencies to avoid refetch loop!
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [companyId, channel, filter, query]
  );

  // Refetch when company, channel, filter or query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      void loadItems(false);
    }, query ? 300 : 0);
    return () => clearTimeout(timer);
  }, [loadItems, query]);

  // Realtime reconnect
  useRealtimeConnection(() => {
    void loadItems(false);
  });

  // =========================================================================
  // Load messages for the selected thread (Discriminated by channel)
  // =========================================================================
  const loadThreadMessages = useCallback(async () => {
    if (!companyId || !selectedItem) {
      setThreadMessages([]);
      setActivities([]);
      return;
    }

    setLoadingMessages(true);
    setMessagesError(null);

    try {
      if (selectedItem.channel === 'p2p') {
        const rawP2PMessages = await conversationsApi.getMessages(selectedItem.raw_id);
        const mapped = (rawP2PMessages || []).map((m: DirectMessage) => ({
          id: m.id,
          body: m.body,
          sender_type: (m.sender_type === 'Company' ? 'Company' : 'User') as 'Company' | 'User',
          sender_name: m.sender_type === 'Company' ? 'Sua Empresa' : selectedItem.participant.name,
          created_at: m.created_at,
          attachments: (m.attachments || []).map((att: any, idx: number) => ({
            id: att.id || idx,
            filename: att.filename || 'Arquivo',
            url: att.url || '',
            content_type: att.content_type || 'application/octet-stream',
          })),
          status: (m.read_at ? 'read' : 'sent') as 'read' | 'sent',
        }));

        setThreadMessages(mapped);
        setActivities([]);

        // Mark read
        if (selectedItem.unread_count > 0) {
          await conversationsApi.markRead(selectedItem.raw_id);
          setItems((current) =>
            current.map((it) => (it.id === selectedItem.id ? { ...it, unread_count: 0 } : it))
          );
        }
      } else {
        // AI Session channel
        const response = await inboxApi.messages(companyId, selectedItem.raw_id);
        const mapped = (response.messages || []).map((m: InboxMessage) => ({
          id: m.id,
          body: m.content,
          sender_type: (m.role === 'agent'
            ? 'Company'
            : m.role === 'assistant'
            ? 'Bot'
            : m.role === 'system'
            ? 'System'
            : 'User') as 'Company' | 'User' | 'Bot' | 'System',
          sender_name: m.sender_name || (m.role === 'assistant' ? 'Assistente IA' : selectedItem.participant.name),
          created_at: m.created_at,
          attachments: m.attachments,
          status: 'sent' as const,
        }));

        setThreadMessages(mapped);

        // Fetch session activities
        try {
          const actRes = await inboxApi.activities(companyId, selectedItem.raw_id);
          setActivities(actRes.activities || []);
        } catch {
          // ignore activities failure
        }

        // Mark read
        if (selectedItem.unread_count > 0) {
          await inboxApi.markRead(companyId, selectedItem.raw_id);
          setItems((current) =>
            current.map((it) => (it.id === selectedItem.id ? { ...it, unread_count: 0 } : it))
          );
        }
      }
    } catch (err) {
      console.error('[UnifiedInbox] Falha ao carregar mensagens:', err);
      setMessagesError('Não foi possível carregar as mensagens desta conversa.');
    } finally {
      setLoadingMessages(false);
    }
  }, [companyId, selectedItem]);

  useEffect(() => {
    void loadThreadMessages();
  }, [loadThreadMessages]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (threadMessages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [threadMessages.length]);

  // =========================================================================
  // Send Message (Discriminated by channel)
  // =========================================================================
  const handleSendMessage = async () => {
    const text = draft.trim();
    if (!text || !selectedItem || !companyId || sending) return;

    setSending(true);
    const clientMsgId =
      globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).substring(2)}`;

    // Optimistic message
    const optimisticMsg = {
      id: Date.now(),
      body: text,
      sender_type: 'Company' as const,
      sender_name: 'Sua Empresa',
      created_at: new Date().toISOString(),
      status: 'sending' as const,
    };

    setThreadMessages((prev) => [...prev, optimisticMsg]);
    setDraft('');

    try {
      if (selectedItem.channel === 'p2p') {
        const sent = await conversationsApi.sendMessage(selectedItem.raw_id, text, {
          client_message_id: clientMsgId,
        });

        setThreadMessages((prev) =>
          prev.map((m) =>
            m.id === optimisticMsg.id
              ? {
                  id: sent.id,
                  body: sent.body,
                  sender_type: 'Company',
                  sender_name: 'Sua Empresa',
                  created_at: sent.created_at,
                  status: 'sent',
                }
              : m
          )
        );
      } else {
        // AI Session
        const sent = await inboxApi.send(companyId, selectedItem.raw_id, text, clientMsgId);
        setThreadMessages((prev) =>
          prev.map((m) =>
            m.id === optimisticMsg.id
              ? {
                  id: sent.id,
                  body: sent.content,
                  sender_type: 'Company',
                  sender_name: 'Sua Empresa',
                  created_at: sent.created_at,
                  status: 'sent',
                }
              : m
          )
        );
      }

      if (soundEnabled) {
        playNotificationSound();
      }
    } catch (err) {
      console.error('[UnifiedInbox] Falha ao enviar mensagem:', err);
      setThreadMessages((prev) =>
        prev.map((m) => (m.id === optimisticMsg.id ? { ...m, status: 'failed' } : m))
      );
    } finally {
      setSending(false);
    }
  };

  // =========================================================================
  // File Upload (Verified active storage upload)
  // =========================================================================
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !companyId || !selectedItem) return;

    setUploading(true);
    try {
      const { id: attachmentId, filename } = await uploadAttachmentFile(companyId, file);

      if (selectedItem.channel === 'p2p') {
        // For P2P, send with attachment reference
        await conversationsApi.sendMessage(
          selectedItem.raw_id,
          `Arquivo compartilhado: ${filename}`
        );
      } else {
        // For AI session
        const clientMsgId =
          globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).substring(2)}`;
        await inboxApi.send(
          companyId,
          selectedItem.raw_id,
          `Arquivo anexado: ${filename}`,
          clientMsgId,
          [attachmentId]
        );
      }

      void loadThreadMessages();
    } catch (err: any) {
      console.error('[UnifiedInbox] Falha no upload:', err);
      alert(err?.message || 'Falha ao enviar arquivo. Verifique o tipo e tamanho (máx 15MB).');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Mode takeover & actions
  const handleTakeover = async () => {
    if (!companyId || !selectedItem || selectedItem.channel !== 'ai') return;
    try {
      await inboxApi.updateMode(companyId, selectedItem.raw_id, 'human_manual');
      setItems((prev) =>
        prev.map((it) =>
          it.id === selectedItem.id
            ? { ...it, capabilities: { ...it.capabilities, can_takeover: false, can_return_to_bot: true, can_reply: true } }
            : it
        )
      );
      void loadThreadMessages();
    } catch (err) {
      console.error('Falha ao assumir atendimento:', err);
    }
  };

  const handleReturnToBot = async () => {
    if (!companyId || !selectedItem || selectedItem.channel !== 'ai') return;
    try {
      await inboxApi.updateMode(companyId, selectedItem.raw_id, 'bot_only');
      setItems((prev) =>
        prev.map((it) =>
          it.id === selectedItem.id
            ? { ...it, capabilities: { ...it.capabilities, can_takeover: true, can_return_to_bot: false, can_reply: true } }
            : it
        )
      );
      void loadThreadMessages();
    } catch (err) {
      console.error('Falha ao devolver ao bot:', err);
    }
  };

  const handleResolveP2P = async () => {
    if (!selectedItem || selectedItem.channel !== 'p2p') return;
    try {
      await conversationsApi.resolve(selectedItem.raw_id);
      setItems((prev) =>
        prev.map((it) => (it.id === selectedItem.id ? { ...it, status: 'resolved' } : it))
      );
    } catch (err) {
      console.error('Falha ao resolver conversa:', err);
    }
  };

  const handleReopenP2P = async () => {
    if (!selectedItem || selectedItem.channel !== 'p2p') return;
    try {
      await conversationsApi.reopen(selectedItem.raw_id);
      setItems((prev) =>
        prev.map((it) => (it.id === selectedItem.id ? { ...it, status: 'open' } : it))
      );
    } catch (err) {
      console.error('Falha ao reabrir conversa:', err);
    }
  };

  if (authLoading || companyLoading || (!companyId && user?.role !== 'admin')) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" aria-label="Carregando caixa de entrada" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col md:flex-row">
      {/* Enterprise Sidebar */}
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

      <div className="flex-1 pl-[var(--enterprise-sidebar-width,64px)] transition-[padding] duration-200 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex min-h-[56px] items-center justify-between bg-[#0f172a] px-4 py-2.5 text-white shadow-md">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="grid h-10 w-10 place-items-center rounded-xl text-white transition-colors hover:bg-white/10 md:hidden"
              aria-label={sidebarOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
            >
              <PanelLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-400" />
              <h1 className="text-base font-bold text-white tracking-wide">
                Mensagens & Inbox Empresarial
              </h1>
              {counts.unread > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1.5 text-[11px] font-black text-white">
                  {counts.unread}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Realtime sound toggle */}
            <button
              type="button"
              onClick={toggleSound}
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              title={soundEnabled ? 'Silenciar alertas de som' : 'Ativar alertas de som'}
              aria-label={soundEnabled ? 'Silenciar som' : 'Ativar som'}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-slate-500" />}
            </button>

            {/* Refresh list button */}
            <button
              type="button"
              onClick={() => void loadItems(false)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Atualizar lista de conversas"
              aria-label="Atualizar conversas"
            >
              <RefreshCw className="h-4 w-4" />
            </button>

            {/* User Avatar */}
            <div className="h-8 w-8 overflow-hidden rounded-full bg-blue-600 text-xs font-bold text-white flex items-center justify-center ring-2 ring-white/10 relative">
              {user?.avatar_url ? (
                <Image src={user.avatar_url} alt="User" fill sizes="32px" className="object-cover" />
              ) : (
                getInitials(user?.name)
              )}
            </div>
          </div>
        </header>

        {/* 3-Column Enterprise Grid Layout */}
        <div className="mx-auto grid h-[calc(100dvh-56px)] w-full grid-cols-1 overflow-hidden bg-white lg:grid-cols-[minmax(310px,340px)_minmax(400px,1fr)_minmax(300px,330px)]">
          {/* ========================================================= */}
          {/* COLUMN 1: Conversation List */}
          {/* ========================================================= */}
          <section
            className={cn(
              'min-h-0 flex flex-col border-r border-slate-200 bg-white',
              selectedId && 'hidden lg:flex'
            )}
            aria-label="Lista de conversas"
          >
            {/* Search & Channel Switch */}
            <div className="p-3 border-b border-slate-100 space-y-2.5 shrink-0">
              <label className="flex h-10 items-center gap-2 border border-slate-200 rounded-xl px-3 focus-within:ring-2 focus-within:ring-blue-600 bg-slate-50/70">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-xs outline-none text-slate-900 placeholder:text-slate-400"
                  placeholder="Buscar por comprador, lead ou mensagem..."
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </label>

              {/* Segmented Channel Control */}
              <div className="flex rounded-lg bg-slate-100 p-0.5 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setChannel('all')}
                  className={cn(
                    'flex-1 py-1.5 text-center rounded-md transition-all',
                    channel === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => setChannel('p2p')}
                  className={cn(
                    'flex-1 py-1.5 text-center rounded-md transition-all',
                    channel === 'p2p'
                      ? 'bg-white text-blue-700 shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  Compradores
                </button>
                <button
                  type="button"
                  onClick={() => setChannel('ai')}
                  className={cn(
                    'flex-1 py-1.5 text-center rounded-md transition-all',
                    channel === 'ai'
                      ? 'bg-white text-cyan-800 shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  Chat IA
                </button>
              </div>

              {/* Horizontal Status Pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                {FILTERS.map((item) => {
                  const isActive = filter === item.value;
                  const count = counts[item.countKey];
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setFilter(item.value)}
                      className={cn(
                        'flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors shrink-0',
                        isActive
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      )}
                    >
                      <span>{item.label}</span>
                      {count > 0 && (
                        <span
                          className={cn(
                            'inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-black',
                            isActive ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                          )}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* List items container */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {loading ? (
                <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
                  <Loader2 className="h-7 w-7 animate-spin text-blue-600 mb-2" />
                  <p className="text-xs">Carregando conversas...</p>
                </div>
              ) : error ? (
                <div className="p-6 text-center text-xs text-red-700 space-y-2">
                  <p className="font-semibold">{error}</p>
                  <button
                    type="button"
                    onClick={() => void loadItems(false)}
                    className="rounded-full bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-700"
                  >
                    Tentar novamente
                  </button>
                </div>
              ) : items.length > 0 ? (
                <>
                  {items.map((item) => (
                    <ThreadCard
                      key={item.id}
                      item={item}
                      active={item.id === selectedId}
                      onClick={() => setSelectedId(item.id)}
                    />
                  ))}

                  {/* Load more */}
                  {hasMore && (
                    <div className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => void loadItems(true)}
                        disabled={loadingMore}
                        className="rounded-full border border-slate-300 px-4 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        {loadingMore ? 'Carregando mais...' : 'Carregar conversas anteriores'}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500 my-auto">
                  <MessageSquare className="h-10 w-10 text-slate-300 mb-2.5" />
                  <h4 className="text-sm font-bold text-slate-800">Nenhuma conversa encontrada</h4>
                  <p className="mt-1 text-xs text-slate-500 max-w-[220px]">
                    {query
                      ? 'Nenhum resultado com o termo pesquisado.'
                      : filter === 'unread'
                      ? 'Nenhuma mensagem não lida no momento.'
                      : 'Suas novas conversas de propostas e leads aparecerão aqui.'}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* ========================================================= */}
          {/* COLUMN 2: Active Thread View */}
          {/* ========================================================= */}
          <section
            className={cn(
              'relative flex min-h-0 flex-col bg-slate-50/70',
              !selectedId && 'hidden lg:flex'
            )}
            aria-label="Conversa ativa"
          >
            {selectedItem ? (
              <>
                {/* Thread Header */}
                <header className="flex min-h-[56px] items-center justify-between gap-3 bg-[#0f172a] px-3.5 py-2.5 text-white shadow-sm shrink-0">
                  <div className="flex min-w-0 items-center gap-2.5">
                    {/* Back button for mobile */}
                    <button
                      type="button"
                      onClick={() => setSelectedId(null)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white hover:bg-white/10 lg:hidden"
                      aria-label="Voltar para a lista de conversas"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>

                    {/* Participant avatar */}
                    <div
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-2xs',
                        selectedItem.channel === 'p2p' ? 'bg-indigo-600' : 'bg-cyan-700'
                      )}
                    >
                      {getInitials(selectedItem.participant?.name)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h2 className="truncate text-sm font-bold text-white leading-tight">
                          {selectedItem.participant?.name || 'Contato'}
                        </h2>
                        <span
                          className={cn(
                            'rounded-xs px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider',
                            selectedItem.channel === 'p2p'
                              ? 'bg-blue-600 text-white'
                              : 'bg-cyan-800 text-cyan-100'
                          )}
                        >
                          {selectedItem.channel === 'p2p' ? 'Comprador' : 'Chat IA'}
                        </span>
                      </div>
                      <p className="truncate text-[11px] text-slate-300 font-medium">
                        {selectedItem.marketplace_proposal_reference
                          ? `Proposta #${selectedItem.marketplace_proposal_reference}`
                          : selectedItem.participant?.email || 'Canal comercial oficial'}
                      </p>
                    </div>
                  </div>

                  {/* Header Actions */}
                  <div className="flex items-center gap-2">
                    {/* Open contextual drawer on tablet/mobile */}
                    <button
                      type="button"
                      onClick={() => setDetailsOpen(true)}
                      className="flex h-8 items-center gap-1.5 rounded-lg border border-white/20 px-2.5 text-xs font-semibold text-white hover:bg-white/10 lg:hidden"
                      aria-label="Ver detalhes e proposta"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                      <span>Detalhes</span>
                    </button>
                  </div>
                </header>

                {/* Proposal Banner inside thread (if proposal reference exists) */}
                {selectedItem.marketplace_proposal_reference && (
                  <div className="border-b border-amber-200 bg-amber-50/90 px-4 py-2 text-xs text-amber-900 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-600 shrink-0" />
                      <span>
                        Conversa vinculada à{' '}
                        <strong>Proposta #{selectedItem.marketplace_proposal_reference}</strong>
                      </span>
                    </div>
                    {selectedItem.marketplace_proposal_id && (
                      <a
                        href={`/dashboard/propostas?id=${selectedItem.marketplace_proposal_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-amber-800 hover:underline text-[11px]"
                      >
                        <span>Ver Proposta</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                )}

                {/* Messages Timeline Container */}
                <div
                  className="flex-1 space-y-3 overflow-y-auto p-4 pb-28 sm:pb-4"
                  aria-live="polite"
                >
                  {loadingMessages ? (
                    <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600 mb-2" />
                      <p className="text-xs">Carregando histórico...</p>
                    </div>
                  ) : messagesError ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 text-center space-y-2">
                      <p className="font-semibold">{messagesError}</p>
                      <button
                        type="button"
                        onClick={() => void loadThreadMessages()}
                        className="underline font-bold text-red-900"
                      >
                        Tentar novamente
                      </button>
                    </div>
                  ) : threadMessages.length > 0 ? (
                    threadMessages.map((msg, idx) => {
                      const isOwn = msg.sender_type === 'Company';
                      const isBot = msg.sender_type === 'Bot';
                      const isSystem = msg.sender_type === 'System';

                      if (isSystem) {
                        return (
                          <div key={msg.id || idx} className="flex justify-center my-2">
                            <span className="rounded-full bg-slate-200/80 px-3 py-1 text-[10px] font-semibold text-slate-700">
                              {msg.body}
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={msg.id || idx}
                          className={cn('flex w-full mb-2', isOwn ? 'justify-end' : 'justify-start')}
                        >
                          <div
                            className={cn(
                              'max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-2xs',
                              isOwn
                                ? 'bg-blue-600 text-white rounded-br-2px'
                                : isBot
                                ? 'bg-cyan-950 text-cyan-50 rounded-bl-2px'
                                : 'bg-white text-slate-800 border border-slate-200 rounded-bl-2px'
                            )}
                          >
                            {/* Attachments if any */}
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="mb-2 space-y-1">
                                {msg.attachments.map((att) => (
                                  <a
                                    key={att.id}
                                    href={att.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={cn(
                                      'flex items-center gap-1.5 rounded-lg p-2 text-xs font-semibold underline underline-offset-2',
                                      isOwn
                                        ? 'bg-blue-700/60 text-white'
                                        : 'bg-slate-100 text-blue-700'
                                    )}
                                  >
                                    <FileText className="h-3.5 w-3.5 shrink-0" />
                                    <span className="truncate">{att.filename}</span>
                                    <ExternalLink className="h-3 w-3 shrink-0 ml-auto" />
                                  </a>
                                ))}
                              </div>
                            )}

                            <p className="whitespace-pre-wrap break-words">{msg.body}</p>

                            <div
                              className={cn(
                                'mt-1 flex items-center justify-end gap-1 text-[10px]',
                                isOwn ? 'text-blue-100' : 'text-slate-400'
                              )}
                            >
                              <span>
                                {new Intl.DateTimeFormat('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                }).format(new Date(msg.created_at))}
                              </span>
                              {isOwn && (
                                <span className="ml-0.5 font-bold">
                                  {msg.status === 'sending' ? (
                                    '🕒'
                                  ) : msg.status === 'failed' ? (
                                    '❌'
                                  ) : msg.status === 'read' ? (
                                    <CheckCheck className="h-3 w-3 text-blue-200 inline" />
                                  ) : (
                                    <Check className="h-3 w-3 text-white inline" />
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center p-12 text-slate-400 text-center my-auto">
                      <MessageCircle className="h-10 w-10 text-slate-300 mb-2" />
                      <p className="text-xs text-slate-500">Nenhuma mensagem nesta conversa ainda.</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Envie uma resposta abaixo para iniciar o diálogo comercial.
                      </p>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Message Composer */}
                <div className="border-t border-slate-200 bg-white p-3 shadow-sm shrink-0">
                  <div className="flex items-center gap-2">
                    {/* Hidden file input */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                      accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                    />

                    {/* Attachment button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 transition-colors',
                        uploading
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-slate-50 text-blue-600 hover:bg-slate-100'
                      )}
                      title="Anexar documento ou imagem (máx 15MB)"
                      aria-label="Anexar arquivo"
                    >
                      {uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </button>

                    {/* Text input */}
                    <label className="min-w-0 flex-1">
                      <span className="sr-only">Mensagem para o cliente</span>
                      <input
                        type="text"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            void handleSendMessage();
                          }
                        }}
                        className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-xs outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                        placeholder="Escreva uma resposta profissional..."
                      />
                    </label>

                    {/* Send button */}
                    <button
                      type="button"
                      onClick={() => void handleSendMessage()}
                      disabled={sending || !draft.trim()}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition-opacity hover:bg-blue-700 disabled:opacity-40"
                      aria-label="Enviar mensagem"
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="m-auto max-w-sm p-8 text-center text-slate-500">
                <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Selecione uma conversa</h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  Escolha uma conversa na lista à esquerda para responder a compradores ou gerenciar
                  leads do chat IA.
                </p>
              </div>
            )}
          </section>

          {/* ========================================================= */}
          {/* COLUMN 3: Right Contextual Panel (Desktop >= 1200px) */}
          {/* ========================================================= */}
          <div className="hidden min-h-0 border-l border-slate-200 lg:block">
            {selectedItem ? (
              <RightContextPanel
                item={selectedItem}
                activities={activities}
                onTakeover={handleTakeover}
                onReturnToBot={handleReturnToBot}
                onResolveP2P={handleResolveP2P}
                onReopenP2P={handleReopenP2P}
              />
            ) : (
              <aside className="h-full bg-slate-50/50 p-6 flex flex-col justify-center text-center text-slate-400">
                <Building2 className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                <h4 className="text-sm font-bold text-slate-700">Painel de Contexto</h4>
                <p className="mt-1 text-xs text-slate-500 max-w-[220px] mx-auto">
                  Os detalhes comerciais do comprador, propostas vinculadas e dados do lead aparecerão
                  aqui.
                </p>
              </aside>
            )}
          </div>
        </div>

        {/* Modal Drawer for Mobile/Tablet context */}
        {detailsOpen && selectedItem && (
          <div
            className="fixed inset-0 z-50 bg-slate-950/60 lg:hidden"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setDetailsOpen(false);
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Detalhes da conversa"
              className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-hidden rounded-t-2xl bg-white shadow-xl pb-[env(safe-area-inset-bottom)]"
            >
              <RightContextPanel
                item={selectedItem}
                activities={activities}
                onTakeover={handleTakeover}
                onReturnToBot={handleReturnToBot}
                onResolveP2P={handleResolveP2P}
                onReopenP2P={handleReopenP2P}
                onClose={() => setDetailsOpen(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
