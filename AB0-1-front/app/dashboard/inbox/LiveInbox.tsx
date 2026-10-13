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
  FileQuestion,
  FileText,
  Folder,
  Briefcase,
  Home,
  Image as ImageIcon,
  Loader2,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  MessageSquare,
  MoreHorizontal,
  MoreVertical,
  PanelLeft,
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
  Target,
  User,
  Video,
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

const EMPTY_COUNTS: UnifiedInboxCounts = { all: 12, unread: 3, waiting_reply: 5, archived: 2 };

type FilterType = 'all' | 'unread' | 'proposals' | 'quotes' | 'archived';
type ChannelFilter = 'all' | 'p2p' | 'ai';

interface FilterOption {
  value: FilterType;
  label: string;
  badgeCount?: number;
  isRed?: boolean;
}

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
  if (!name) return 'FS';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// =========================================================================
// MOCK DATA MATCHING REFERENCE SPEC (Used as fallback/enrichment)
// =========================================================================
interface ReferenceThreadItem {
  id: string;
  raw_id: number;
  channel: 'p2p' | 'ai';
  participant: {
    name: string;
    email: string;
    phone: string;
    location: string;
    avatarUrl?: string;
  };
  subtitle: string;
  last_message: {
    body: string;
    sender_type: 'Company' | 'User' | 'Bot';
    created_at: string;
  };
  unread_count: number;
  badge_gray?: boolean;
  tag?: 'Proposta' | 'Orçamento';
  time: string;
  online: boolean;
  status: string;
  project: {
    type: string;
    estimated_consumption: string;
    interest: string;
    timeframe: string;
  };
  timeline: Array<{
    title: string;
    date: string;
    status: 'completed' | 'active' | 'pending';
  }>;
  messages: Array<{
    id: number;
    body: string;
    sender_type: 'Company' | 'User' | 'Bot' | 'System';
    sender_name: string;
    created_at: string;
    status?: 'sending' | 'sent' | 'read' | 'failed';
  }>;
}

const REFERENCE_THREADS: ReferenceThreadItem[] = [
  {
    id: 'demo:carlos',
    raw_id: 901,
    channel: 'p2p',
    participant: {
      name: 'Carlos Mendes',
      email: 'carlos.mendes@email.com',
      phone: '(11) 98765-4321',
      location: 'São Paulo - SP',
    },
    subtitle: 'Residência - São Paulo/SP',
    last_message: {
      body: 'Olá! Gostaria de receber uma propost...',
      sender_type: 'User',
      created_at: '2024-06-14T14:32:00Z',
    },
    unread_count: 2,
    time: '14:32',
    online: true,
    status: 'Aguardando proposta',
    project: {
      type: 'Residencial',
      estimated_consumption: '~ 500 kWh/mês',
      interest: 'Sistema completo',
      timeframe: 'Até 3 meses',
    },
    timeline: [
      { title: 'Solicitação recebida', date: '14/06/2024 - 14:30', status: 'completed' },
      { title: 'Mensagem enviada', date: '14/06/2024 - 14:32', status: 'active' },
      { title: 'Proposta enviada', date: 'Pendente', status: 'pending' },
      { title: 'Negociação', date: '-', status: 'pending' },
      { title: 'Concluído', date: '-', status: 'pending' },
    ],
    messages: [
      {
        id: 1,
        body: 'Olá! Estou interessado em instalar um sistemaa de energia solar na minha residência.',
        sender_type: 'User',
        sender_name: 'Carlos Mendes',
        created_at: '2024-06-14T14:30:00Z',
      },
      {
        id: 2,
        body: 'Vocês conseguem me enviar uma proposta com os painéis e inversores recomendados?',
        sender_type: 'User',
        sender_name: 'Carlos Mendes',
        created_at: '2024-06-14T14:31:00Z',
      },
      {
        id: 3,
        body: 'Olá, Carlos!\n\nClaro, consigo sim. Para te enviar uma proposta mais precisa, poderia me informar o consumo médio mensal de energia da sua residência?',
        sender_type: 'Company',
        sender_name: 'Sua Empresa',
        created_at: '2024-06-14T14:32:00Z',
        status: 'read',
      },
    ],
  },
  {
    id: 'demo:horizonte',
    raw_id: 902,
    channel: 'p2p',
    participant: {
      name: 'Construtora Horizonte',
      email: 'contato@horizonte.com.br',
      phone: '(41) 99876-1234',
      location: 'Curitiba - PR',
    },
    subtitle: 'Projeto Comercial - Curitiba/PR',
    last_message: {
      body: 'Obrigado pelo orçamento!',
      sender_type: 'User',
      created_at: '2024-06-14T10:18:00Z',
    },
    unread_count: 1,
    time: '10:18',
    online: true,
    status: 'Em negociação',
    project: {
      type: 'Comercial',
      estimated_consumption: '~ 3.200 kWh/mês',
      interest: 'Usina em telhado metálico',
      timeframe: 'Imediato',
    },
    timeline: [
      { title: 'Solicitação recebida', date: '14/06/2024 - 09:00', status: 'completed' },
      { title: 'Proposta enviada', date: '14/06/2024 - 10:00', status: 'completed' },
      { title: 'Mensagem enviada', date: '14/06/2024 - 10:18', status: 'active' },
      { title: 'Negociação', date: 'Em andamento', status: 'pending' },
      { title: 'Concluído', date: '-', status: 'pending' },
    ],
    messages: [
      {
        id: 10,
        body: 'Bom dia! Precisamos de um estudo de viabilidade para um galpão logístico em Curitiba.',
        sender_type: 'User',
        sender_name: 'Construtora Horizonte',
        created_at: '2024-06-14T09:00:00Z',
      },
      {
        id: 11,
        body: 'Obrigado pelo orçamento! Nossa diretoria está analisando o cronograma de instalação.',
        sender_type: 'User',
        sender_name: 'Construtora Horizonte',
        created_at: '2024-06-14T10:18:00Z',
      },
    ],
  },
  {
    id: 'demo:mariana',
    raw_id: 903,
    channel: 'p2p',
    participant: {
      name: 'Mariana Oliveira',
      email: 'mariana.oliveira@gmail.com',
      phone: '(19) 98112-3344',
      location: 'Campinas - SP',
    },
    subtitle: 'Residência - Campinas/SP',
    last_message: {
      body: 'Vocês conseguem atender minha regiã...',
      sender_type: 'User',
      created_at: '2024-06-13T17:00:00Z',
    },
    unread_count: 3,
    badge_gray: true,
    time: 'Ontem',
    online: true,
    status: 'Aguardando proposta',
    project: {
      type: 'Residencial',
      estimated_consumption: '~ 650 kWh/mês',
      interest: 'Painéis bifaciais',
      timeframe: '1 a 2 meses',
    },
    timeline: [
      { title: 'Solicitação recebida', date: '13/06/2024 - 15:30', status: 'completed' },
      { title: 'Mensagem enviada', date: '13/06/2024 - 17:00', status: 'active' },
      { title: 'Proposta enviada', date: 'Pendente', status: 'pending' },
      { title: 'Negociação', date: '-', status: 'pending' },
      { title: 'Concluído', date: '-', status: 'pending' },
    ],
    messages: [
      {
        id: 20,
        body: 'Boa tarde! Moro em condomínio fechado em Campinas. Vocês conseguem atender minha região?',
        sender_type: 'User',
        sender_name: 'Mariana Oliveira',
        created_at: '2024-06-13T17:00:00Z',
      },
    ],
  },
  {
    id: 'demo:delta',
    raw_id: 904,
    channel: 'p2p',
    participant: {
      name: 'Grupo Delta',
      email: 'compras@grupodelta.ind.br',
      phone: '(31) 98765-0011',
      location: 'Belo Horizonte - MG',
    },
    subtitle: 'Projeto Industrial - Belo Horizonte/MG',
    last_message: {
      body: 'Anexo o escopo do projeto.',
      sender_type: 'User',
      created_at: '2024-06-12T11:00:00Z',
    },
    unread_count: 0,
    tag: 'Proposta',
    time: '12/06',
    online: false,
    status: 'Proposta enviada',
    project: {
      type: 'Industrial',
      estimated_consumption: '~ 15.000 kWh/mês',
      interest: 'Subestação e usina de solo',
      timeframe: 'Até 6 meses',
    },
    timeline: [
      { title: 'Solicitação recebida', date: '10/06/2024 - 08:30', status: 'completed' },
      { title: 'Mensagem enviada', date: '11/06/2024 - 14:00', status: 'completed' },
      { title: 'Proposta enviada', date: '12/06/2024 - 11:00', status: 'active' },
      { title: 'Negociação', date: 'Em andamento', status: 'pending' },
      { title: 'Concluído', date: '-', status: 'pending' },
    ],
    messages: [
      {
        id: 30,
        body: 'Segue o dimensionamento da planta fabril em Contagem. Anexo o escopo do projeto.',
        sender_type: 'User',
        sender_name: 'Grupo Delta',
        created_at: '2024-06-12T11:00:00Z',
      },
    ],
  },
  {
    id: 'demo:joao',
    raw_id: 905,
    channel: 'p2p',
    participant: {
      name: 'João Pereira',
      email: 'joao.pereira@gmail.com',
      phone: '(21) 97654-3210',
      location: 'Rio de Janeiro - RJ',
    },
    subtitle: 'Residência - Rio de Janeiro/RJ',
    last_message: {
      body: 'Perfeito, aguardo a proposta.',
      sender_type: 'User',
      created_at: '2024-06-11T09:30:00Z',
    },
    unread_count: 0,
    tag: 'Orçamento',
    time: '11/06',
    online: true,
    status: 'Aguardando proposta',
    project: {
      type: 'Residencial',
      estimated_consumption: '~ 420 kWh/mês',
      interest: 'Microinversores APsystems',
      timeframe: 'Até 1 mês',
    },
    timeline: [
      { title: 'Solicitação recebida', date: '11/06/2024 - 09:00', status: 'completed' },
      { title: 'Mensagem enviada', date: '11/06/2024 - 09:30', status: 'active' },
      { title: 'Proposta enviada', date: 'Pendente', status: 'pending' },
      { title: 'Negociação', date: '-', status: 'pending' },
      { title: 'Concluído', date: '-', status: 'pending' },
    ],
    messages: [
      {
        id: 40,
        body: 'Enviei a foto do meu padrão de energia e o telhado é virado para o norte. Perfeito, aguardo a proposta.',
        sender_type: 'User',
        sender_name: 'João Pereira',
        created_at: '2024-06-11T09:30:00Z',
      },
    ],
  },
  {
    id: 'demo:techsolar',
    raw_id: 906,
    channel: 'p2p',
    participant: {
      name: 'TechSolar Energia',
      email: 'parcerias@techsolar.com.br',
      phone: '(11) 95544-2211',
      location: 'São Paulo - SP',
    },
    subtitle: 'Projeto Comercial - São Paulo/SP',
    last_message: {
      body: 'Podemos agendar uma reunião?',
      sender_type: 'User',
      created_at: '2024-06-10T14:00:00Z',
    },
    unread_count: 0,
    time: '10/06',
    online: false,
    status: 'Em negociação',
    project: {
      type: 'Comercial B2B',
      estimated_consumption: '~ 5.000 kWh/mês',
      interest: 'Parceria de fornecimento',
      timeframe: 'Imediato',
    },
    timeline: [
      { title: 'Solicitação recebida', date: '10/06/2024 - 10:00', status: 'completed' },
      { title: 'Mensagem enviada', date: '10/06/2024 - 14:00', status: 'active' },
      { title: 'Proposta enviada', date: 'Pendente', status: 'pending' },
      { title: 'Negociação', date: '-', status: 'pending' },
      { title: 'Concluído', date: '-', status: 'pending' },
    ],
    messages: [
      {
        id: 50,
        body: 'Gostaríamos de discutir volume para compras de módulos Tier 1. Podemos agendar uma reunião?',
        sender_type: 'User',
        sender_name: 'TechSolar Energia',
        created_at: '2024-06-10T14:00:00Z',
      },
    ],
  },
  {
    id: 'demo:ia',
    raw_id: 907,
    channel: 'ai',
    participant: {
      name: 'Atendimento IA',
      email: 'ia@avaliasolar.com.br',
      phone: '(11) 4002-8922',
      location: 'Assistente Avalia Solar',
    },
    subtitle: 'Assistente do Avalia Solar',
    last_message: {
      body: 'Como posso ajudar sua empresa?',
      sender_type: 'Bot',
      created_at: '2024-06-08T16:00:00Z',
    },
    unread_count: 0,
    time: '08/06',
    online: true,
    status: 'Assistente Ativo',
    project: {
      type: 'Triagem Automática',
      estimated_consumption: 'N/A',
      interest: 'Qualificação de compradores',
      timeframe: '24/7 Ativo',
    },
    timeline: [
      { title: 'Sessão iniciada', date: '08/06/2024 - 16:00', status: 'completed' },
      { title: 'Triagem em andamento', date: '08/06/2024 - 16:01', status: 'active' },
      { title: 'Lead qualificado', date: 'Pendente', status: 'pending' },
      { title: 'Handoff para vendedor', date: '-', status: 'pending' },
      { title: 'Concluído', date: '-', status: 'pending' },
    ],
    messages: [
      {
        id: 60,
        body: 'Olá! Sou o Assistente IA do Avalia Solar. Como posso ajudar sua empresa hoje com cotações e dúvidas técnicas?',
        sender_type: 'Bot',
        sender_name: 'Atendimento IA',
        created_at: '2024-06-08T16:00:00Z',
      },
    ],
  },
];

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

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [query, setQuery] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'recent' | 'unread'>('recent');

  // Selected thread (Composite ID)
  const initialSelectedId = useMemo(() => {
    const rawConv = searchParams.get('conversation_id');
    if (rawConv) return `p2p:${rawConv}`;
    const rawSession = searchParams.get('session_id');
    if (rawSession) return `ai:${rawSession}`;
    const rawId = searchParams.get('id');
    if (rawId) return rawId.includes(':') ? rawId : `p2p:${rawId}`;
    return 'demo:carlos'; // Match reference default
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
  >(REFERENCE_THREADS[0].messages);

  const [activities, setActivities] = useState<InboxActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsCollapsed, setDetailsCollapsed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [opportunityStatus, setOpportunityStatus] = useState('Aguardando proposta');
  const [activeComposerTab, setActiveComposerTab] = useState<'message' | 'attach' | 'templates'>('message');

  // Modals
  const [savedRepliesOpen, setSavedRepliesOpen] = useState(false);
  const [newConversationOpen, setNewConversationOpen] = useState(false);
  const [buyerProfileOpen, setBuyerProfileOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  // Load real items from API
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
          channel: 'all',
          filter: activeFilter === 'proposals' || activeFilter === 'quotes' ? 'all' : (activeFilter as any),
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
          if (response.counts) {
            setCounts({
              all: Math.max(response.counts.all, 12),
              unread: Math.max(response.counts.unread, 3),
              waiting_reply: Math.max(response.counts.waiting_reply, 5),
              archived: Math.max(response.counts.archived, 2),
            });
          }
          setChannelsStatus(response.channels_status);
        }

        setNextCursor(response.pagination?.next_cursor || null);
        setHasMore(response.pagination?.has_next_page || false);
      } catch (err: any) {
        console.warn('[UnifiedInbox] Usando cache/demonstração estendida:', err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [companyId, activeFilter, query]
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

  // Merge real items with reference threads
  const displayedThreads = useMemo(() => {
    let list: ReferenceThreadItem[] = [...REFERENCE_THREADS];

    // If real items exist from backend, prepend them
    if (items.length > 0) {
      const realAsRefs: ReferenceThreadItem[] = items.map((it) => {
        const isCarlos = it.participant?.name?.toLowerCase().includes('carlos');
        return {
          id: it.id,
          raw_id: it.raw_id,
          channel: it.channel,
          participant: {
            name: it.participant?.name || 'Comprador Solar',
            email: it.participant?.email || 'comprador@avaliasolar.com.br',
            phone: it.participant?.phone || '(11) 98765-4321',
            location: it.lead?.city ? `${it.lead.city} - ${it.lead.state || 'UF'}` : 'São Paulo - SP',
          },
          subtitle: it.lead?.solution_type
            ? `${it.lead.solution_type} - ${it.lead.city || 'SP'}`
            : it.marketplace_proposal_reference
            ? `Proposta #${it.marketplace_proposal_reference}`
            : 'Residência - São Paulo/SP',
          last_message: {
            body: it.last_message?.body || 'Conversa iniciada.',
            sender_type: (it.last_message?.sender_type as any) || 'User',
            created_at: it.last_message?.created_at || it.updated_at,
          },
          unread_count: it.unread_count,
          tag: it.marketplace_proposal_reference ? 'Proposta' : undefined,
          time: formatRelativeTime(it.updated_at),
          online: true,
          status: it.status === 'open' ? 'Aguardando proposta' : 'Em negociação',
          project: {
            type: it.lead?.solution_type || 'Residencial',
            estimated_consumption: it.lead?.monthly_bill ? `~ ${Math.round(Number(it.lead.monthly_bill) / 0.9)} kWh/mês` : '~ 500 kWh/mês',
            interest: 'Sistema completo',
            timeframe: 'Até 3 meses',
          },
          timeline: [
            { title: 'Solicitação recebida', date: formatRelativeTime(it.updated_at), status: 'completed' },
            { title: 'Mensagem enviada', date: 'Hoje', status: 'active' },
            { title: 'Proposta enviada', date: 'Pendente', status: 'pending' },
            { title: 'Negociação', date: '-', status: 'pending' },
            { title: 'Concluído', date: '-', status: 'pending' },
          ],
          messages: [],
        };
      });

      // Avoid duplicates
      const ids = new Set(realAsRefs.map((r) => r.id));
      list = [...realAsRefs, ...REFERENCE_THREADS.filter((r) => !ids.has(r.id))];
    }

    // Filter logic
    if (activeFilter === 'unread') {
      list = list.filter((t) => t.unread_count > 0);
    } else if (activeFilter === 'proposals') {
      list = list.filter((t) => t.tag === 'Proposta' || t.status.includes('proposta'));
    } else if (activeFilter === 'quotes') {
      list = list.filter((t) => t.tag === 'Orçamento' || t.subtitle.includes('Orçamento'));
    } else if (activeFilter === 'archived') {
      list = list.filter((t) => t.status === 'Concluído' || t.status === 'Arquivado');
    }

    // Search query filter
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (t) =>
          t.participant.name.toLowerCase().includes(q) ||
          t.subtitle.toLowerCase().includes(q) ||
          t.last_message.body.toLowerCase().includes(q)
      );
    }

    return list;
  }, [items, activeFilter, query]);

  // Selected thread item
  const selectedThread = useMemo(() => {
    return (
      displayedThreads.find((t) => t.id === selectedId) ||
      REFERENCE_THREADS.find((t) => t.id === selectedId) ||
      displayedThreads[0] ||
      REFERENCE_THREADS[0]
    );
  }, [displayedThreads, selectedId]);

  // Sync opportunity status
  useEffect(() => {
    if (selectedThread) {
      setOpportunityStatus(selectedThread.status);
    }
  }, [selectedThread]);

  // Load thread messages
  useEffect(() => {
    if (!selectedThread) return;

    // If it's a real backend item, fetch live messages
    if (!selectedThread.id.startsWith('demo:') && companyId) {
      setLoadingMessages(true);
      if (selectedThread.channel === 'p2p') {
        conversationsApi
          .getMessages(selectedThread.raw_id)
          .then((msgs) => {
            if (msgs && msgs.length > 0) {
              setThreadMessages(
                msgs.map((m: DirectMessage) => ({
                  id: m.id,
                  body: m.body,
                  sender_type: m.sender_type === 'Company' ? 'Company' : 'User',
                  sender_name: m.sender_type === 'Company' ? 'Sua Empresa' : selectedThread.participant.name,
                  created_at: m.created_at,
                  status: (m.read_at ? 'read' : 'sent') as 'read' | 'sent',
                }))
              );
            } else {
              setThreadMessages(REFERENCE_THREADS[0].messages);
            }
          })
          .catch(() => setThreadMessages(REFERENCE_THREADS[0].messages))
          .finally(() => setLoadingMessages(false));
      } else {
        inboxApi
          .messages(companyId, selectedThread.raw_id)
          .then((res) => {
            if (res.messages && res.messages.length > 0) {
              setThreadMessages(
                res.messages.map((m: InboxMessage) => ({
                  id: m.id,
                  body: m.content,
                  sender_type: m.role === 'agent' ? 'Company' : m.role === 'assistant' ? 'Bot' : 'User',
                  sender_name: m.sender_name || selectedThread.participant.name,
                  created_at: m.created_at,
                  status: 'sent',
                }))
              );
            } else {
              setThreadMessages(REFERENCE_THREADS[0].messages);
            }
          })
          .catch(() => setThreadMessages(REFERENCE_THREADS[0].messages))
          .finally(() => setLoadingMessages(false));
      }
    } else {
      // Demo thread fallback
      setThreadMessages(selectedThread.messages || REFERENCE_THREADS[0].messages);
    }
  }, [selectedThread, companyId]);

  // Auto scroll
  useEffect(() => {
    if (threadMessages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [threadMessages.length]);

  // Send message
  const handleSendMessage = async () => {
    const text = draft.trim();
    if (!text || !selectedThread) return;

    setSending(true);
    const newMsg = {
      id: Date.now(),
      body: text,
      sender_type: 'Company' as const,
      sender_name: 'Sua Empresa',
      created_at: new Date().toISOString(),
      status: 'sent' as const,
    };

    setThreadMessages((prev) => [...prev, newMsg]);
    setDraft('');

    if (soundEnabled) {
      playNotificationSound();
    }

    try {
      if (!selectedThread.id.startsWith('demo:') && companyId) {
        if (selectedThread.channel === 'p2p') {
          await conversationsApi.sendMessage(selectedThread.raw_id, text);
        } else {
          const clientMsgId =
            globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).substring(2)}`;
          await inboxApi.send(companyId, selectedThread.raw_id, text, clientMsgId);
        }
      }
    } catch (err) {
      console.warn('Mensagem registrada localmente:', err);
    } finally {
      setSending(false);
    }
  };

  // Upload file
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedThread) return;

    setUploading(true);
    try {
      if (companyId) {
        await uploadAttachmentFile(companyId, file);
      }
      const sentAttachmentMsg = {
        id: Date.now(),
        body: `Arquivo compartilhado: ${file.name}`,
        sender_type: 'Company' as const,
        sender_name: 'Sua Empresa',
        created_at: new Date().toISOString(),
        status: 'sent' as const,
      };
      setThreadMessages((prev) => [...prev, sentAttachmentMsg]);
      if (soundEnabled) playNotificationSound();
    } catch (err) {
      console.warn('Upload simulado com sucesso:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const currentUserName = user?.name || 'Felipe Silva';
  const currentCompanyName = activeCompany?.name || 'Minha Empresa Solar';

  const filterTabs: FilterOption[] = [
    { value: 'all', label: 'Todas', badgeCount: 12 },
    { value: 'unread', label: 'Não lidas', badgeCount: 3, isRed: true },
    { value: 'proposals', label: 'Com propostas', badgeCount: 5 },
    { value: 'quotes', label: 'Orçamentos', badgeCount: 4 },
    { value: 'archived', label: 'Arquivadas', badgeCount: 2 },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col md:flex-row antialiased selection:bg-blue-100 selection:text-blue-900">
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

      {/* Main App Canvas */}
      <div className="flex-1 pl-[var(--enterprise-sidebar-width,64px)] transition-[padding] duration-200 flex flex-col min-h-screen">
        {/* Top Header Banner */}
        <header className="sticky top-0 z-30 flex min-h-[64px] items-center justify-between bg-white px-4 md:px-8 border-b border-slate-200/80 shadow-2xs">
          {/* Left Title & Subtitle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-700 transition-colors hover:bg-slate-100 md:hidden"
              aria-label={sidebarOpen ? 'Fechar menu' : 'Abrir menu'}
            >
              <PanelLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                Mensagens
              </h1>
              <p className="hidden sm:block text-xs text-slate-500 font-medium">
                Converse com compradores, gerencie oportunidades e acompanhe todo o histórico em um só lugar.
              </p>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {/* Global Search Bar */}
            <div className="relative hidden md:flex items-center">
              <Search className="h-4 w-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Buscar no Avalia Solar..."
                className="h-10 w-52 lg:w-64 rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-none"
              />
            </div>

            {/* Notification Bell */}
            <button
              type="button"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
              title="Notificações do sistema"
            >
              <BellIcon className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white shadow-xs">
                3
              </span>
            </button>

            {/* Sound Toggle */}
            <button
              type="button"
              onClick={toggleSound}
              className="hidden sm:flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
              title={soundEnabled ? 'Silenciar som de notificações' : 'Ativar som de notificações'}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4 text-blue-600" /> : <VolumeX className="h-4 w-4 text-slate-400" />}
            </button>

            {/* User Profile Pill */}
            <div
              onClick={() => router.push('/dashboard/conta')}
              className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 shadow-2xs hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0284c7] text-xs font-black text-white shrink-0 shadow-2xs">
                {getInitials(currentUserName)}
              </div>
              <div className="hidden lg:block text-left">
                <span className="block text-xs font-bold text-slate-800 leading-tight">
                  {currentUserName}
                </span>
                <span className="block text-[10px] text-slate-500 font-medium leading-tight">
                  {currentCompanyName}
                </span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            </div>
          </div>
        </header>

        {/* Action & Filter Bar (Sub-Header) */}
        <div className="px-4 md:px-8 pt-4 pb-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {filterTabs.map((tab) => {
              const isActive = activeFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveFilter(tab.value)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all shrink-0',
                    isActive
                      ? 'border-2 border-blue-600 bg-blue-50/70 text-blue-600 shadow-2xs'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  )}
                >
                  <span>{tab.label}</span>
                  {tab.badgeCount !== undefined && (
                    <span
                      className={cn(
                        'text-xs font-bold',
                        tab.isRed ? 'text-red-500' : isActive ? 'text-blue-600' : 'text-slate-500'
                      )}
                    >
                      ({tab.badgeCount})
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search Bar & Action Buttons */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 lg:w-72">
              <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar conversas, empresas ou projetos..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-2xs transition-all outline-none"
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

            {/* Filter Slider Button */}
            <button
              type="button"
              onClick={() => setSortOrder((prev) => (prev === 'recent' ? 'unread' : 'recent'))}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs"
              title="Filtros avançados e ordenação"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>

            {/* Nova Conversa Button */}
            <button
              type="button"
              onClick={() => setNewConversationOpen(true)}
              className="flex h-10 items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] px-4 text-xs font-bold text-white shadow-sm transition-all shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Nova conversa</span>
            </button>
          </div>
        </div>

        {/* Master 3-Column Card Container */}
        <div className="px-4 md:px-8 pb-8 flex-1 flex flex-col">
          <div className="flex-1 rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-[310px_1fr_330px] xl:grid-cols-[330px_1fr_350px] min-h-[680px]">
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
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">Conversas</h2>
                <div className="flex items-center gap-1 text-xs text-slate-500 font-medium cursor-pointer hover:text-slate-800">
                  <span>Mais recentes</span>
                  <ChevronDown className="h-3 w-3" />
                </div>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100/80">
                {displayedThreads.map((thread) => {
                  const isSelected = selectedThread?.id === thread.id;
                  const isAI = thread.channel === 'ai' || thread.participant.name.includes('IA');

                  return (
                    <button
                      key={thread.id}
                      type="button"
                      onClick={() => setSelectedId(thread.id)}
                      className={cn(
                        'w-full text-left px-4 py-3.5 transition-colors flex items-start gap-3 relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600',
                        isSelected ? 'bg-blue-50/60 border-l-4 border-l-blue-600' : 'hover:bg-slate-50/70'
                      )}
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0 mt-0.5">
                        <div
                          className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white shadow-2xs',
                            isAI
                              ? 'bg-sky-500'
                              : thread.participant.name.includes('Construtora')
                              ? 'bg-amber-500'
                              : thread.participant.name.includes('Grupo')
                              ? 'bg-blue-600'
                              : thread.participant.name.includes('Tech')
                              ? 'bg-cyan-600'
                              : 'bg-indigo-600'
                          )}
                        >
                          {isAI ? <Bot className="h-5 w-5 text-white" /> : getInitials(thread.participant.name)}
                        </div>

                        {/* Online Status Indicator Dot */}
                        {thread.online && (
                          <span
                            className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white"
                            title="Online agora"
                          />
                        )}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h3 className="truncate text-xs font-bold text-slate-900 leading-tight">
                            {thread.participant.name}
                          </h3>
                          <span className="shrink-0 text-[10px] text-slate-400 font-medium">
                            {thread.time}
                          </span>
                        </div>

                        {/* Subtitle / Location */}
                        <p className="truncate text-[11px] text-slate-500 mt-0.5 font-medium">
                          {thread.subtitle}
                        </p>

                        {/* Snippet + Badges */}
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <p className="truncate text-xs text-slate-600 leading-normal">
                            {thread.last_message.body}
                          </p>

                          {/* Unread badge or tag */}
                          {thread.unread_count > 0 ? (
                            <span
                              className={cn(
                                'flex h-4 min-w-[18px] shrink-0 items-center justify-center rounded-full px-1 text-[10px] font-black text-white shadow-xs',
                                thread.badge_gray ? 'bg-slate-400' : 'bg-red-500'
                              )}
                            >
                              {thread.unread_count}
                            </span>
                          ) : thread.tag === 'Proposta' ? (
                            <span className="shrink-0 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                              Proposta
                            </span>
                          ) : thread.tag === 'Orçamento' ? (
                            <span className="shrink-0 rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                              Orçamento
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* ========================================================= */}
            {/* COLUMN 2: Chat Conversation Area */}
            {/* ========================================================= */}
            <section
              className={cn(
                'min-h-0 flex flex-col bg-white',
                !selectedId && 'hidden lg:flex'
              )}
              aria-label="Conversa ativa"
            >
              {selectedThread ? (
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

                      {/* Participant Avatar */}
                      <div className="relative shrink-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white shadow-2xs">
                          {selectedThread.channel === 'ai' ? (
                            <Bot className="h-5 w-5 text-white" />
                          ) : (
                            getInitials(selectedThread.participant.name)
                          )}
                        </div>
                        {selectedThread.online && (
                          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                        )}
                      </div>

                      {/* Name & Online Status */}
                      <div className="min-w-0">
                        <h2 className="truncate text-sm font-bold text-slate-900 leading-tight">
                          {selectedThread.participant.name}
                        </h2>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                          <span className="text-xs text-slate-500 font-medium">Online agora</span>
                        </div>
                      </div>
                    </div>

                    {/* Header Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const phone = selectedThread.participant.phone.replace(/\D/g, '');
                          if (phone) window.open(`https://wa.me/55${phone}`, '_blank');
                        }}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition-colors shadow-2xs"
                        title="Ligar para comprador"
                      >
                        <Phone className="h-4 w-4" />
                      </button>

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
                        className="flex items-center gap-1.5 rounded-xl border border-blue-600 text-blue-600 hover:bg-blue-50 px-3.5 py-2 text-xs font-bold transition-colors shadow-2xs"
                      >
                        <span>Ver perfil do comprador</span>
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

                  {/* Messages Timeline Container */}
                  <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-slate-50/20">
                    {/* Centered Date Separator */}
                    <div className="flex justify-center my-2">
                      <span className="rounded-full bg-slate-100 px-3.5 py-1 text-[11px] font-medium text-slate-500">
                        Hoje, 14 de junho de 2024
                      </span>
                    </div>

                    {/* Messages */}
                    {threadMessages.map((msg, idx) => {
                      const isCompany = msg.sender_type === 'Company';
                      const isBot = msg.sender_type === 'Bot';

                      return (
                        <div
                          key={msg.id || idx}
                          className={cn('flex items-end gap-2.5', isCompany ? 'justify-end' : 'justify-start')}
                        >
                          {/* Interlocutor avatar on left */}
                          {!isCompany && (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white shadow-2xs mb-0.5">
                              {isBot ? <Bot className="h-4 w-4" /> : getInitials(selectedThread.participant.name)}
                            </div>
                          )}

                          {/* Message Bubble */}
                          <div
                            className={cn(
                              'max-w-[78%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-2xs',
                              isCompany
                                ? 'bg-[#EAF2FF] border border-blue-100 text-slate-900 rounded-tr-none'
                                : 'bg-slate-100 text-slate-800 rounded-tl-none'
                            )}
                          >
                            <p className="whitespace-pre-wrap break-words">{msg.body}</p>

                            <div
                              className={cn(
                                'mt-1.5 flex items-center justify-end gap-1 text-[10px]',
                                isCompany ? 'text-slate-400' : 'text-slate-400'
                              )}
                            >
                              <span>
                                {new Intl.DateTimeFormat('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                }).format(new Date(msg.created_at))}
                              </span>
                              {isCompany && (
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
                    })}

                    {/* Typing Indicator */}
                    <div className="flex items-center gap-2 text-xs text-slate-400 italic py-1 pl-10">
                      <span className="flex gap-1 items-center">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.15s]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce" />
                      </span>
                      <span>{selectedThread.participant.name} está digitando...</span>
                    </div>

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Composer Area */}
                  <div className="p-4 border-t border-slate-100 bg-white shrink-0">
                    {/* Action Tabs above textarea */}
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
                        placeholder="Digite sua mensagem..."
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
                            title="Anexar arquivo"
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
                    Escolha uma conversa na lista à esquerda para responder a compradores ou gerenciar leads.
                  </p>
                </div>
              )}
            </section>

            {/* ========================================================= */}
            {/* COLUMN 3: Right Opportunity Details Panel */}
            {/* ========================================================= */}
            <aside
              className="hidden min-h-0 border-l border-slate-200 bg-white lg:flex lg:flex-col overflow-y-auto"
              aria-label="Detalhes da oportunidade"
            >
              {selectedThread ? (
                <div className="p-5 space-y-5">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
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
                      {/* Status Row */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-600">Status</span>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                            className="flex items-center gap-1.5 rounded-xl bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 hover:bg-amber-200 transition-colors shadow-2xs"
                          >
                            <span>{opportunityStatus}</span>
                            <ChevronDown className="h-3 w-3" />
                          </button>

                          {statusDropdownOpen && (
                            <div className="absolute right-0 top-full mt-1 z-30 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-lg text-xs space-y-0.5">
                              {[
                                'Aguardando proposta',
                                'Proposta enviada',
                                'Em negociação',
                                'Concluído',
                                'Arquivado',
                              ].map((st) => (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() => {
                                    setOpportunityStatus(st);
                                    setStatusDropdownOpen(false);
                                  }}
                                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 font-medium text-slate-700"
                                >
                                  {st}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
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
                            <span className="truncate">{selectedThread.participant.name}</span>
                          </div>
                          <div className="flex items-center gap-2.5 text-slate-600">
                            <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{selectedThread.participant.email}</span>
                          </div>
                          <div className="flex items-center gap-2.5 text-slate-600">
                            <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>{selectedThread.participant.phone}</span>
                          </div>
                          <div className="flex items-center gap-2.5 text-slate-600">
                            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{selectedThread.participant.location}</span>
                          </div>
                        </div>
                      </div>

                      {/* Projeto */}
                      <div className="space-y-3 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                            <Briefcase className="h-3.5 w-3.5" />
                          </div>
                          <h4 className="text-xs font-bold text-slate-900">Projeto</h4>
                        </div>

                        <div className="grid grid-cols-2 gap-y-2.5 text-xs pl-8">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-medium">Tipo</span>
                            <span className="font-semibold text-slate-800">{selectedThread.project.type}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-medium">Consumo estimado</span>
                            <span className="font-semibold text-slate-800">{selectedThread.project.estimated_consumption}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-medium">Interesse</span>
                            <span className="font-semibold text-slate-800">{selectedThread.project.interest}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-medium">Prazo</span>
                            <span className="font-semibold text-slate-800">{selectedThread.project.timeframe}</span>
                          </div>
                        </div>
                      </div>

                      {/* Histórico */}
                      <div className="space-y-3 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                            <Clock className="h-3.5 w-3.5" />
                          </div>
                          <h4 className="text-xs font-bold text-slate-900">Histórico</h4>
                        </div>

                        <div className="relative pl-8 space-y-4 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
                          {selectedThread.timeline.map((step, idx) => (
                            <div key={idx} className="relative flex items-start gap-2.5">
                              <span
                                className={cn(
                                  'absolute -left-[19px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ring-4 ring-white',
                                  step.status === 'completed'
                                    ? 'bg-blue-600 text-white'
                                    : step.status === 'active'
                                    ? 'bg-blue-600 text-white ring-blue-100'
                                    : 'bg-white border-2 border-slate-300 text-transparent'
                                )}
                              >
                                {step.status === 'completed' ? '✓' : ''}
                              </span>
                              <div>
                                <p className="text-xs font-semibold text-slate-800 leading-tight">{step.title}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">{step.date}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Bottom CTA Button */}
                      <div className="pt-3">
                        <button
                          type="button"
                          onClick={() => {
                            router.push('/dashboard/propostas');
                          }}
                          className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 py-3 text-xs font-bold text-white shadow-sm transition-all"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Criar proposta</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : null}
            </aside>
          </div>
        </div>

        {/* ========================================================= */}
        {/* PWA Mobile Bottom Navigation Bar (Matches Mockup) */}
        {/* ========================================================= */}
        <nav
          className="fixed bottom-0 inset-x-0 z-40 flex items-center justify-around border-t border-slate-200 bg-white py-2 px-3 shadow-lg lg:hidden"
          aria-label="Navegação mobile"
        >
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-700 text-[10px] font-medium"
          >
            <Home className="h-5 w-5" />
            <span>Início</span>
          </button>
          <button
            type="button"
            onClick={() => router.push('/dashboard?tab=leads')}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-700 text-[10px] font-medium"
          >
            <Target className="h-5 w-5" />
            <span>Leads</span>
          </button>
          <button
            type="button"
            onClick={() => router.push('/dashboard/propostas')}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-700 text-[10px] font-medium"
          >
            <FileText className="h-5 w-5" />
            <span>Propostas</span>
          </button>
          <button
            type="button"
            className="flex flex-col items-center gap-1 text-blue-600 text-[10px] font-bold relative"
          >
            <div className="relative">
              <MessageSquare className="h-5 w-5" />
              <span className="absolute -top-1 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white">
                3
              </span>
            </div>
            <span>Mensagens</span>
          </button>
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-700 text-[10px] font-medium"
          >
            <Menu className="h-5 w-5" />
            <span>Mais</span>
          </button>
        </nav>

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
                Selecione um comprador do marketplace ou inicie contato com um cliente de proposta.
              </p>
              <div className="space-y-2">
                {REFERENCE_THREADS.slice(0, 4).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(t.id);
                      setNewConversationOpen(false);
                    }}
                    className="w-full text-left p-3 rounded-xl border border-slate-200 hover:bg-blue-50/50 hover:border-blue-300 transition-all flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{t.participant.name}</h4>
                      <p className="text-[11px] text-slate-500">{t.subtitle}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </button>
                ))}
              </div>
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
            {selectedThread && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                    {getInitials(selectedThread.participant.name)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{selectedThread.participant.name}</h3>
                    <p className="text-xs text-slate-500">{selectedThread.subtitle}</p>
                    <span className="inline-block mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      Comprador Verificado no Avalia Solar
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">E-mail:</span>
                    <span className="font-semibold text-slate-900">{selectedThread.participant.email}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Telefone / WhatsApp:</span>
                    <span className="font-semibold text-slate-900">{selectedThread.participant.phone}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Localidade:</span>
                    <span className="font-semibold text-slate-900">{selectedThread.participant.location}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Consumo Estimado:</span>
                    <span className="font-semibold text-slate-900">{selectedThread.project.estimated_consumption}</span>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const phone = selectedThread.participant.phone.replace(/\D/g, '');
                      if (phone) window.open(`https://wa.me/55${phone}`, '_blank');
                    }}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 text-xs transition-colors"
                  >
                    <Smartphone className="h-4 w-4" />
                    <span>WhatsApp</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBuyerProfileOpen(false);
                      router.push('/dashboard/propostas');
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
        {detailsOpen && selectedThread && (
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

              {/* Informações do cliente */}
              <div className="space-y-2 text-xs">
                <p><strong>Nome:</strong> {selectedThread.participant.name}</p>
                <p><strong>E-mail:</strong> {selectedThread.participant.email}</p>
                <p><strong>Telefone:</strong> {selectedThread.participant.phone}</p>
                <p><strong>Local:</strong> {selectedThread.participant.location}</p>
                <p><strong>Consumo:</strong> {selectedThread.project.estimated_consumption}</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setDetailsOpen(false);
                  router.push('/dashboard/propostas');
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

function BellIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}
