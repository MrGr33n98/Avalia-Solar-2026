'use client';

import {
  ArrowLeft,
  Bot,
  Building2,
  Calendar,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquare,
  Paperclip,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Smile,
  Sparkles,
  User,
  Video,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import EnterpriseSidebar from '../components/EnterpriseSidebar';
import DashboardToolbar from '../components/DashboardToolbar';
import ThemeToggle from '../components/ThemeToggle';
import { useCompanyDashboardData } from '../hooks/useCompanyDashboardData';
import { getFlatNavigationByContext } from '@/config/navigation';
import { getFeatureAccessEntry, isFeatureHiddenEntry } from '@/lib/feature-access';
import { SavedRepliesModal } from '@/app/chat/components/SavedRepliesModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
// SUBCOMPONENT: Thread Card in List (with real participant photo avatar)
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
  const isAI = item.channel === 'ai';
  const initials = getInitials(item.participant?.name);
  const avatarUrl = item.participant?.avatar_url;
  const [imgError, setImgError] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full border-b border-slate-100 px-4 py-3.5 text-left transition-colors flex items-start gap-3 relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600',
        active ? 'bg-blue-50/70 border-l-4 border-l-blue-600' : 'hover:bg-slate-50/60'
      )}
      aria-current={active ? 'true' : undefined}
    >
      {/* Avatar (Photo with fallback to initials/bot) */}
      <div className="relative shrink-0 mt-0.5">
        {avatarUrl && !imgError ? (
          <img
            src={avatarUrl}
            alt={item.participant?.name || 'Avatar'}
            onError={() => setImgError(true)}
            className="h-10 w-10 rounded-full object-cover ring-1 ring-slate-200"
          />
        ) : (
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white shadow-2xs',
              isP2P ? 'bg-indigo-600' : 'bg-cyan-700'
            )}
          >
            {isAI ? <Bot className="h-5 w-5" /> : initials}
          </div>
        )}

        {/* Small Channel or Online Indicator */}
        <span
          className={cn(
            'absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-white text-[9px] font-bold text-white',
            isP2P ? 'bg-blue-600' : 'bg-teal-600'
          )}
          title={isP2P ? 'Canal Comprador (P2P)' : 'Canal Chat IA / Lead'}
        >
          {isP2P ? <User className="h-2 w-2" /> : <Bot className="h-2 w-2" />}
        </span>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1.5">
          <span className="truncate text-xs font-bold text-slate-900 leading-tight">
            {item.participant?.name || (isP2P ? 'Comprador Solar' : 'Visitante IA')}
          </span>
          <span className="shrink-0 text-[10px] text-slate-400 font-medium">
            {formatRelativeTime(item.updated_at)}
          </span>
        </div>

        {/* Location / Subtitle / Proposal Tag */}
        <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
          <span className="truncate text-[11px] text-slate-500 font-medium">
            {item.lead?.city ? `${item.lead.city} - ${item.lead.state || 'UF'}` : isP2P ? 'Comprador' : 'Chat IA'}
          </span>

          {item.marketplace_proposal_reference && (
            <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-100 px-1.5 py-0.2 text-[10px] font-bold text-amber-800">
              Proposta #{item.marketplace_proposal_reference}
            </span>
          )}
        </div>

        {/* Last message snippet + Unread count */}
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="line-clamp-1 text-xs text-slate-600 leading-normal">
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

          {item.unread_count > 0 && (
            <span className="flex h-4 min-w-[18px] shrink-0 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white shadow-xs">
              {item.unread_count}
            </span>
          )}
        </div>
      </div>
    </button>
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

  // Filter & Search states (Strictly real data)
  const [items, setItems] = useState<UnifiedInboxItem[]>([]);
  const [counts, setCounts] = useState<UnifiedInboxCounts>(EMPTY_COUNTS);
  const [channelsStatus, setChannelsStatus] = useState<{
    p2p: { enabled: boolean; reason?: string };
    ai: { enabled: boolean; reason?: string };
  }>({ p2p: { enabled: true }, ai: { enabled: true } });

  const [filter, setFilter] = useState<FilterType>('all');
  const [channel, setChannel] = useState<ChannelFilter>('all');
  const [query, setQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'recent' | 'unread'>('recent');

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
  const [detailsCollapsed, setDetailsCollapsed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [activeComposerTab, setActiveComposerTab] = useState<'message' | 'attach' | 'templates'>('message');

  // Modals
  const [savedRepliesOpen, setSavedRepliesOpen] = useState(false);
  const [newConversationOpen, setNewConversationOpen] = useState(false);
  const [buyerProfileOpen, setBuyerProfileOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
  // Load unified items list from Real API
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

          // Auto-select first real item if desktop and none selected
          if (!selectedId && response.items.length > 0 && typeof window !== 'undefined' && window.innerWidth >= 1200) {
            setSelectedId(response.items[0].id);
          }
        }

        setNextCursor(response.pagination?.next_cursor || null);
        setHasMore(response.pagination?.has_next_page || false);
      } catch (err: any) {
        console.error('[UnifiedInbox] Falha ao carregar lista real:', err);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [companyId, channel, filter, query]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadItems(false);
    }, query ? 300 : 0);
    return () => clearTimeout(timer);
  }, [loadItems, query]);

  useRealtimeConnection(() => {
    void loadItems(false);
  });

  // =========================================================================
  // Load real messages for selected thread
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
          setCounts((prev) => ({ ...prev, unread: Math.max(0, prev.unread - selectedItem.unread_count) }));
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

        try {
          const actRes = await inboxApi.activities(companyId, selectedItem.raw_id);
          setActivities(actRes.activities || []);
        } catch {
          // ignore activities failure
        }

        if (selectedItem.unread_count > 0) {
          await inboxApi.markRead(companyId, selectedItem.raw_id);
          setItems((current) =>
            current.map((it) => (it.id === selectedItem.id ? { ...it, unread_count: 0 } : it))
          );
          setCounts((prev) => ({ ...prev, unread: Math.max(0, prev.unread - selectedItem.unread_count) }));
        }
      }
    } catch (err) {
      console.error('[UnifiedInbox] Falha ao carregar mensagens reais:', err);
      setMessagesError('Não foi possível carregar as mensagens desta conversa.');
    } finally {
      setLoadingMessages(false);
    }
  }, [companyId, selectedItem]);

  useEffect(() => {
    void loadThreadMessages();
  }, [loadThreadMessages]);

  useEffect(() => {
    if (threadMessages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [threadMessages.length]);

  // Send message
  const handleSendMessage = async () => {
    const text = draft.trim();
    if (!text || !selectedItem || !companyId || sending) return;

    setSending(true);
    const clientMsgId =
      globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).substring(2)}`;

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

  // Upload file
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !companyId || !selectedItem) return;

    const MAX_SIZE = 15 * 1024 * 1024; // 15MB
    if (file.size > MAX_SIZE) {
      alert('O arquivo excede o limite máximo permitido de 15MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploading(true);
    try {
      if (selectedItem.channel === 'p2p') {
        // Read file as base64 DataURL for direct, rock-solid P2P ActiveStorage attachment
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
          reader.readAsDataURL(file);
        });

        await conversationsApi.sendMessage(
          selectedItem.raw_id,
          `Segue proposta/anexo: ${file.name}`,
          {
            attachments: [
              {
                data: base64Data,
                filename: file.name,
                content_type: file.type || 'application/pdf',
              },
            ],
          }
        );
      } else {
        const { id: attachmentId, filename } = await uploadAttachmentFile(companyId, file);
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

      await loadThreadMessages();
    } catch (err: any) {
      console.error('[UnifiedInbox] Falha no upload:', err);
      const friendlyMsg = err?.message?.includes('500')
        ? 'Erro ao processar anexo no servidor. Verifique se o arquivo PDF/imagem está legível.'
        : err?.message || 'Falha ao enviar arquivo. Verifique o tipo e tamanho (máx 15MB).';
      alert(friendlyMsg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Actions
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

  const filterTabs: Array<{ value: FilterType; label: string; count: number; isRed?: boolean }> = [
    { value: 'all', label: 'Todas', count: counts.all },
    { value: 'unread', label: 'Não lidas', count: counts.unread, isRed: counts.unread > 0 },
    { value: 'waiting_reply', label: 'Aguardando resposta', count: counts.waiting_reply },
    { value: 'archived', label: 'Arquivadas', count: counts.archived },
  ];

  const participantAvatarUrl = selectedItem?.participant?.avatar_url;
  const leadPhone = selectedItem?.lead?.phone?.replace(/\D/g, '') || selectedItem?.participant?.phone?.replace(/\D/g, '') || '';
  const whatsappLink = leadPhone
    ? `https://wa.me/55${leadPhone}?text=${encodeURIComponent(
        `Olá ${selectedItem?.participant?.name || 'Cliente'}! Sou da equipe de atendimento da sua cotação solar no Avalia Solar.`
      )}`
    : null;

  if (authLoading || companyLoading || (!companyId && user?.role !== 'admin')) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" aria-label="Carregando caixa de entrada" />
      </div>
    );
  }

  return (
    <div className="h-screen h-[100dvh] max-h-screen overflow-hidden bg-[#F8FAFC] text-slate-900 flex flex-col md:flex-row antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
      />

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

      {/* Main Canvas Area - Pinned to 100% viewport */}
      <div className="flex-1 pl-[var(--enterprise-sidebar-width,64px)] transition-[padding] duration-200 flex flex-col h-full max-h-screen overflow-hidden">
        {/* Canonical Dashboard Navbar (Maintained as requested) */}
        <DashboardToolbar
          company={activeCompany ? { name: activeCompany.name, plan_tier: activeCompany.plan_tier } : null}
          onTabChange={(tabId) => {
            if (tabId === 'live-inbox' || tabId === 'chat') return;
            router.push(`/dashboard?tab=${tabId}`);
          }}
          onToggleNavigation={() => setSidebarOpen((prev) => !prev)}
          navigationOpen={sidebarOpen}
          themeToggle={<ThemeToggle />}
        />

        {/* Page Title & Subtitle Banner - Compact */}
        <div className="px-4 md:px-6 pt-1 pb-1.5 flex items-center justify-between gap-4 shrink-0">
          <div>
            <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight leading-tight">
              Mensagens
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Converse com compradores, gerencie oportunidades e acompanhe todo o histórico em um só lugar.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Realtime sound toggle */}
            <button
              type="button"
              onClick={toggleSound}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
              title={soundEnabled ? 'Silenciar alertas de som' : 'Ativar alertas de som'}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4 text-blue-600" /> : <VolumeX className="h-4 w-4 text-slate-400" />}
            </button>

            {/* Refresh list button */}
            <button
              type="button"
              onClick={() => void loadItems(false)}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
              title="Atualizar lista de conversas"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Action & Filter Bar (Sub-Header) - Compact */}
        <div className="px-4 md:px-6 pb-2 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 shrink-0">
          {/* Real Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 sm:pb-0 scrollbar-none">
            {filterTabs.map((tab) => {
              const isActive = filter === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setFilter(tab.value)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all shrink-0',
                    isActive
                      ? 'border-2 border-blue-600 bg-blue-50/70 text-blue-600 shadow-2xs'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  )}
                >
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      'text-xs font-bold',
                      tab.isRed ? 'text-red-500 font-black' : isActive ? 'text-blue-600' : 'text-slate-500'
                    )}
                  >
                    ({tab.count})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box & Actions */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 lg:w-64">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar conversas, empresas ou projetos..."
                className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-7 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-2xs transition-all outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Sort order toggle button */}
            <button
              type="button"
              onClick={() => setSortOrder((prev) => (prev === 'recent' ? 'unread' : 'recent'))}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs"
              title="Filtros avançados e ordenação"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>

            {/* Nova conversa CTA */}
            <button
              type="button"
              onClick={() => setNewConversationOpen(true)}
              className="flex h-9 items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] px-3.5 text-xs font-bold text-white shadow-sm transition-all shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Nova conversa</span>
            </button>
          </div>
        </div>

        {/* Master 3-Column Card Container */}
        <div className="px-4 md:px-6 pb-2.5 flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-[290px_1fr_305px] xl:grid-cols-[310px_1fr_325px] h-full">
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
              {/* Header */}
              <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight">Conversas</h2>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                    {items.length}
                  </span>
                </div>

                {/* Channel segmented selector */}
                <div className="flex rounded-lg bg-slate-100 p-0.5 text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setChannel('all')}
                    className={cn(
                      'px-2 py-1 rounded-md transition-all',
                      channel === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500'
                    )}
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => setChannel('p2p')}
                    className={cn(
                      'px-2 py-1 rounded-md transition-all',
                      channel === 'p2p' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-500'
                    )}
                  >
                    Compradores
                  </button>
                  <button
                    type="button"
                    onClick={() => setChannel('ai')}
                    className={cn(
                      'px-2 py-1 rounded-md transition-all',
                      channel === 'ai' ? 'bg-white text-cyan-800 shadow-2xs font-bold' : 'text-slate-500'
                    )}
                  >
                    Chat IA
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {loading ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
                    <Loader2 className="h-7 w-7 animate-spin text-blue-600 mb-2" />
                    <p className="text-xs">Carregando conversas reais...</p>
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

                    {hasMore && (
                      <div className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => void loadItems(true)}
                          disabled={loadingMore}
                          className="rounded-full border border-slate-300 px-4 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          {loadingMore ? 'Carregando mais...' : 'Carregar anteriores'}
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
                        : filter === 'waiting_reply'
                        ? 'Nenhuma conversa aguardando resposta.'
                        : filter === 'archived'
                        ? 'Nenhuma conversa arquivada.'
                        : 'Suas novas conversas com compradores e leads aparecerão aqui.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => void loadItems(false)}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Atualizar</span>
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* ========================================================= */}
            {/* COLUMN 2: Active Thread View */}
            {/* ========================================================= */}
            <section
              className={cn(
                'min-h-0 flex flex-col bg-white',
                !selectedId && 'hidden lg:flex'
              )}
              aria-label="Conversa ativa"
            >
              {selectedItem ? (
                <>
                  {/* Top Thread Header */}
                  <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Back button on mobile */}
                      <button
                        type="button"
                        onClick={() => setSelectedId(null)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 lg:hidden"
                        aria-label="Voltar para a lista"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </button>

                      {/* Participant Avatar (Photo with fallback) */}
                      <div className="relative shrink-0">
                        {participantAvatarUrl ? (
                          <img
                            src={participantAvatarUrl}
                            alt={selectedItem.participant?.name || 'Avatar'}
                            className="h-10 w-10 rounded-full object-cover ring-1 ring-slate-200"
                          />
                        ) : (
                          <div
                            className={cn(
                              'flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white shadow-2xs',
                              selectedItem.channel === 'p2p' ? 'bg-indigo-600' : 'bg-cyan-700'
                            )}
                          >
                            {selectedItem.channel === 'ai' ? (
                              <Bot className="h-5 w-5 text-white" />
                            ) : (
                              getInitials(selectedItem.participant?.name)
                            )}
                          </div>
                        )}
                        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                      </div>

                      {/* Name & Online / Channel Status */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h2 className="truncate text-sm font-bold text-slate-900 leading-tight">
                            {selectedItem.participant?.name || 'Contato'}
                          </h2>
                          <span
                            className={cn(
                              'rounded-xs px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider',
                              selectedItem.channel === 'p2p'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-cyan-100 text-cyan-800'
                            )}
                          >
                            {selectedItem.channel === 'p2p' ? 'Comprador' : 'Chat IA'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                          <span className="text-xs text-slate-500 font-medium">Online agora</span>
                        </div>
                      </div>
                    </div>

                    {/* Header Action Buttons */}
                    <div className="flex items-center gap-2">
                      {whatsappLink && (
                        <a
                          href={whatsappLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-emerald-700 hover:bg-emerald-50 transition-colors shadow-2xs"
                          title="Conversar via WhatsApp"
                        >
                          <Phone className="h-4 w-4" />
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          window.open('https://meet.google.com/new', '_blank');
                        }}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition-colors shadow-2xs"
                        title="Iniciar videochamada"
                      >
                        <Video className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setBuyerProfileOpen(true)}
                        className="flex items-center gap-1.5 rounded-xl border border-blue-600 text-blue-600 hover:bg-blue-50 px-3 py-1.5 text-xs font-bold transition-colors shadow-2xs"
                      >
                        <span>Ver perfil</span>
                      </button>

                      {/* Mobile Drawer Trigger for details */}
                      <button
                        type="button"
                        onClick={() => setDetailsOpen(true)}
                        className="flex h-9 items-center gap-1 rounded-xl border border-slate-200 px-2.5 text-xs font-bold text-slate-700 lg:hidden"
                      >
                        <span>Detalhes</span>
                      </button>
                    </div>
                  </div>

                  {/* Proposal Banner inside thread (if proposal reference exists) */}
                  {selectedItem.marketplace_proposal_reference && (
                    <div className="border-b border-amber-200 bg-amber-50/90 px-4 py-1.5 text-xs text-amber-900 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-amber-600 shrink-0" />
                        <span>
                          Conversa vinculada à{' '}
                          <strong>Proposta #{selectedItem.marketplace_proposal_reference}</strong>
                        </span>
                      </div>
                      {selectedItem.marketplace_proposal_id && (
                        <a
                          href={`/dashboard/proposals?id=${selectedItem.marketplace_proposal_id}`}
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

                  {/* Messages Timeline */}
                  <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3 bg-slate-50/20">
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
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold text-slate-600">
                                {msg.body}
                              </span>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={msg.id || idx}
                            className={cn('flex items-end gap-2.5', isOwn ? 'justify-end' : 'justify-start')}
                          >
                            {/* Interlocutor avatar photo */}
                            {!isOwn && (
                              <div className="relative shrink-0 mb-0.5">
                                {participantAvatarUrl ? (
                                  <img
                                    src={participantAvatarUrl}
                                    alt={msg.sender_name || 'Comprador'}
                                    className="h-8 w-8 rounded-full object-cover"
                                  />
                                ) : (
                                  <div
                                    className={cn(
                                      'flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-2xs',
                                      isBot ? 'bg-cyan-700' : 'bg-indigo-600'
                                    )}
                                  >
                                    {isBot ? <Bot className="h-4 w-4" /> : getInitials(msg.sender_name || selectedItem.participant.name)}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Message Bubble */}
                            <div
                              className={cn(
                                'max-w-[78%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-2xs',
                                isOwn
                                  ? 'bg-[#EAF2FF] border border-blue-100 text-slate-900 rounded-tr-none'
                                  : isBot
                                  ? 'bg-cyan-950 text-cyan-50 rounded-tl-none'
                                  : 'bg-slate-100 text-slate-800 rounded-tl-none'
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
                                        isOwn ? 'bg-blue-100/60 text-blue-900' : 'bg-white text-blue-700'
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
                                  'mt-1.5 flex items-center justify-end gap-1 text-[10px]',
                                  isOwn ? 'text-slate-400' : 'text-slate-400'
                                )}
                              >
                                <span>
                                  {new Intl.DateTimeFormat('pt-BR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  }).format(new Date(msg.created_at))}
                                </span>
                                {isOwn && (
                                  <span className="ml-0.5">
                                    {msg.status === 'read' ? (
                                      <CheckCheck className="h-3.5 w-3.5 text-blue-600 inline" />
                                    ) : (
                                      <Check className="h-3.5 w-3.5 text-slate-400 inline" />
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

                  {/* Message Composer Area */}
                  <div className="p-4 border-t border-slate-100 bg-white shrink-0">
                    {/* Action Tabs */}
                    <div className="flex items-center gap-2 pb-2.5">
                      <button
                        type="button"
                        onClick={() => setActiveComposerTab('message')}
                        className={cn(
                          'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all',
                          activeComposerTab === 'message'
                            ? 'border border-blue-200 bg-blue-50 text-blue-700 shadow-2xs font-bold'
                            : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        )}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>Mensagem</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveComposerTab('attach');
                          fileInputRef.current?.click();
                        }}
                        className={cn(
                          'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all',
                          activeComposerTab === 'attach'
                            ? 'border border-blue-200 bg-blue-50 text-blue-700 shadow-2xs font-bold'
                            : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        )}
                      >
                        <Paperclip className="h-3.5 w-3.5" />
                        <span>Anexar arquivo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveComposerTab('templates');
                          setSavedRepliesOpen(true);
                        }}
                        className={cn(
                          'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all',
                          activeComposerTab === 'templates'
                            ? 'border border-blue-200 bg-blue-50 text-blue-700 shadow-2xs font-bold'
                            : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        )}
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>Modelo de resposta</span>
                      </button>
                    </div>

                    {/* Composer Card */}
                    <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2 shadow-2xs focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 transition-all">
                      <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            void handleSendMessage();
                          }
                        }}
                        placeholder="Digite sua mensagem profissional..."
                        rows={2}
                        className="w-full text-xs text-slate-900 placeholder:text-slate-400 resize-none outline-none leading-relaxed"
                      />

                      {/* Bottom Toolbar inside card */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="Anexar documento ou imagem (máx 15MB)"
                          >
                            <Paperclip className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="Inserir imagem"
                          >
                            <ImageIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDraft((prev) => prev + ' 😊')}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="Inserir emoji"
                          >
                            <Smile className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Send button */}
                        <button
                          type="button"
                          onClick={() => void handleSendMessage()}
                          disabled={sending || !draft.trim()}
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all disabled:opacity-40"
                          title="Enviar mensagem"
                        >
                          {sending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="m-auto max-w-sm p-8 text-center text-slate-500">
                  <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-blue-600" />
                  <h3 className="font-bold text-slate-900 text-base">Selecione uma conversa</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Escolha uma conversa na lista à esquerda para responder a compradores ou gerenciar oportunidades.
                  </p>
                </div>
              )}
            </section>

            {/* ========================================================= */}
            {/* COLUMN 3: Right Contextual Panel */}
            {/* ========================================================= */}
            <aside
              className="hidden min-h-0 h-full border-l border-slate-200 bg-white lg:flex lg:flex-col overflow-hidden"
              aria-label="Detalhes da oportunidade"
            >
              {selectedItem ? (
                <>
                  {/* Pinned Header */}
                  <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <h3 className="text-sm font-bold text-slate-900">Detalhes da oportunidade</h3>
                    <button
                      type="button"
                      onClick={() => setDetailsCollapsed(!detailsCollapsed)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      {detailsCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                    </button>
                  </div>

                  {!detailsCollapsed && (
                    <>
                      {/* Scrollable details body */}
                      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
                        {/* Status */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-600">Status</span>
                          <span className="rounded-xl bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 shadow-2xs">
                            {selectedItem.status === 'resolved' ? 'Resolvido' : 'Aguardando proposta'}
                          </span>
                        </div>

                        {/* Informações do cliente */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                              <User className="h-3.5 w-3.5" />
                            </div>
                            <h4 className="text-xs font-bold text-slate-900">Informações do cliente</h4>
                          </div>

                          <div className="space-y-2 text-xs pl-8">
                            <div className="flex items-center gap-2.5 text-slate-700 font-semibold">
                              <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{selectedItem.participant?.name || 'Cliente'}</span>
                            </div>
                            {selectedItem.participant?.email && (
                              <div className="flex items-center gap-2.5 text-slate-600">
                                <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                <span className="truncate">{selectedItem.participant.email}</span>
                              </div>
                            )}
                            {(selectedItem.participant?.phone || selectedItem.lead?.phone) && (
                              <div className="flex items-center gap-2.5 text-slate-600">
                                <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                <span>{selectedItem.participant?.phone || selectedItem.lead?.phone}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2.5 text-slate-600">
                              <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">
                                {[selectedItem.lead?.city, selectedItem.lead?.state].filter(Boolean).join(' - ') || 'Brasil'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Projeto / Lead */}
                        <div className="space-y-3 pt-2 border-t border-slate-100">
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                              <Building2 className="h-3.5 w-3.5" />
                            </div>
                            <h4 className="text-xs font-bold text-slate-900">Projeto</h4>
                          </div>

                          <div className="grid grid-cols-2 gap-y-2.5 text-xs pl-8">
                            <div>
                              <span className="text-[10px] text-slate-400 block font-medium">Tipo</span>
                              <span className="font-semibold text-slate-800">
                                {selectedItem.lead?.solution_type || selectedItem.lead?.project_type || 'Residencial'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block font-medium">Consumo estimado</span>
                              <span className="font-semibold text-slate-800">
                                {selectedItem.lead?.monthly_bill ? `R$ ${Number(selectedItem.lead.monthly_bill).toLocaleString('pt-BR')}` : 'A calcular'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block font-medium">Interesse</span>
                              <span className="font-semibold text-slate-800">
                                {selectedItem.marketplace_proposal_reference ? `Proposta #${selectedItem.marketplace_proposal_reference}` : 'Sistema completo'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block font-medium">Prazo</span>
                              <span className="font-semibold text-slate-800">
                                {selectedItem.lead?.temperature === 'hot' ? 'Imediato' : 'Até 3 meses'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Propostas Vinculadas */}
                        {selectedItem.linked_proposals && selectedItem.linked_proposals.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-slate-100">
                            <span className="text-xs font-bold text-slate-900">Propostas Vinculadas</span>
                            {selectedItem.linked_proposals.map((prop) => (
                              <div key={prop.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-1 text-xs">
                                <div className="flex justify-between font-semibold">
                                  <span>Proposta #{prop.reference || prop.id}</span>
                                  <span className="uppercase text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-bold">
                                    {prop.status || 'Ativa'}
                                  </span>
                                </div>
                                {prop.value && (
                                  <p className="text-slate-600">
                                    Valor: <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(prop.value)}</strong>
                                  </p>
                                )}
                                <a
                                  href={`/dashboard/proposals?id=${prop.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 pt-1"
                                >
                                  <span>Abrir no dashboard</span>
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* AI Session Takeover Controls */}
                        {selectedItem.channel === 'ai' && (
                          <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3 space-y-2">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                              <Bot className="h-4 w-4 text-blue-700" />
                              <span>Controle do Assistente IA</span>
                            </div>
                            <div className="flex gap-2">
                              {selectedItem.capabilities?.can_takeover && (
                                <button
                                  type="button"
                                  onClick={handleTakeover}
                                  className="flex-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors"
                                >
                                  Assumir
                                </button>
                              )}
                              {selectedItem.capabilities?.can_return_to_bot && (
                                <button
                                  type="button"
                                  onClick={handleReturnToBot}
                                  className="flex-1 rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-bold text-blue-800 hover:bg-blue-50 transition-colors"
                                >
                                  Devolver ao Bot
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Pinned Bottom Actions */}
                      <div className="shrink-0 p-3 bg-white border-t border-slate-100 space-y-2">
                        {/* P2P Quick Actions */}
                        {selectedItem.channel === 'p2p' && (
                          <div>
                            {selectedItem.status === 'resolved' ? (
                              <button
                                type="button"
                                onClick={handleReopenP2P}
                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                              >
                                Reabrir conversa
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={handleResolveP2P}
                                className="w-full rounded-xl bg-emerald-700 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-800 transition-colors flex items-center justify-center gap-1.5"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Concluir negociação</span>
                              </button>
                            )}
                          </div>
                        )}

                        {/* Bottom CTA Button */}
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedItem?.marketplace_proposal_id) {
                              window.open(`/dashboard/proposals?id=${selectedItem.marketplace_proposal_id}`, '_blank');
                            } else {
                              router.push('/dashboard/proposals');
                            }
                          }}
                          className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 py-2.5 text-xs font-bold text-white shadow-sm transition-all"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Criar proposta</span>
                        </button>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="h-full bg-slate-50/50 p-6 flex flex-col justify-center text-center text-slate-400">
                  <Building2 className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                  <h4 className="text-sm font-bold text-slate-700">Painel de Contexto</h4>
                  <p className="mt-1 text-xs text-slate-500 max-w-[220px] mx-auto">
                    Os detalhes comerciais do comprador, propostas vinculadas e dados do lead aparecerão aqui.
                  </p>
                </div>
              )}
            </aside>
          </div>
        </div>

        {/* Modal: Saved Replies Templates */}
        <SavedRepliesModal
          open={savedRepliesOpen}
          onOpenChange={setSavedRepliesOpen}
          onSelectReply={(content) => {
            setDraft((prev) => (prev ? `${prev}\n\n${content}` : content));
          }}
        />

        {/* Modal: Nova Conversa */}
        <Dialog open={newConversationOpen} onOpenChange={setNewConversationOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900">
                Iniciar Nova Conversa
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <p className="text-xs text-slate-500">
                Selecione uma conversa ativa ou inicie diálogo com compradores de propostas.
              </p>
              {items.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {items.map((it) => (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() => {
                        setSelectedId(it.id);
                        setNewConversationOpen(false);
                      }}
                      className="w-full text-left p-3 rounded-xl border border-slate-200 hover:bg-blue-50/50 hover:border-blue-300 transition-all flex items-center justify-between"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{it.participant.name}</h4>
                        <p className="text-[11px] text-slate-500">
                          {it.marketplace_proposal_reference ? `Proposta #${it.marketplace_proposal_reference}` : it.participant.email}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Nenhum comprador disponível para iniciar chat no momento.</p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal: Ver Perfil do Comprador */}
        <Dialog open={buyerProfileOpen} onOpenChange={setBuyerProfileOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900">
                Perfil do Comprador
              </DialogTitle>
            </DialogHeader>
            {selectedItem && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  {participantAvatarUrl ? (
                    <img
                      src={participantAvatarUrl}
                      alt={selectedItem.participant?.name || 'Avatar'}
                      className="h-12 w-12 rounded-full object-cover ring-1 ring-slate-200"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                      {getInitials(selectedItem.participant?.name)}
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{selectedItem.participant?.name}</h3>
                    <p className="text-xs text-slate-500">{selectedItem.participant?.email || 'Canal comercial'}</p>
                    <span className="inline-block mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      Comprador Verificado no Avalia Solar
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">E-mail:</span>
                    <span className="font-semibold text-slate-900">{selectedItem.participant?.email || 'Não informado'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Telefone / WhatsApp:</span>
                    <span className="font-semibold text-slate-900">{selectedItem.participant?.phone || selectedItem.lead?.phone || 'Não informado'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Localidade:</span>
                    <span className="font-semibold text-slate-900">
                      {[selectedItem.lead?.city, selectedItem.lead?.state].filter(Boolean).join(' - ') || 'Brasil'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  {whatsappLink && (
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 text-xs transition-colors"
                    >
                      <Smartphone className="h-4 w-4" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setBuyerProfileOpen(false);
                      router.push('/dashboard/proposals');
                    }}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 text-xs transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Criar Proposta</span>
                  </button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal Drawer for Mobile Details */}
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
              aria-label="Detalhes da oportunidade"
              className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl pb-[env(safe-area-inset-bottom)] space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Detalhes da oportunidade</h3>
                <button
                  type="button"
                  onClick={() => setDetailsOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <p><strong>Nome:</strong> {selectedItem.participant?.name}</p>
                <p><strong>E-mail:</strong> {selectedItem.participant?.email || 'Não informado'}</p>
                <p><strong>Telefone:</strong> {selectedItem.participant?.phone || selectedItem.lead?.phone || 'Não informado'}</p>
                <p><strong>Canal:</strong> {selectedItem.channel === 'p2p' ? 'Comprador (P2P)' : 'Chat IA'}</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setDetailsOpen(false);
                  router.push('/dashboard/proposals');
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Criar proposta</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
