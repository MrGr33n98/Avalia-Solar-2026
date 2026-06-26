'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createConsumer } from '@rails/actioncable';
import {
  ArrowLeft,
  Ban,
  Building2,
  CheckCheck,
  Flag,
  MessageCircle,
  MoreVertical,
  Paperclip,
  RefreshCw,
  Send,
  ShieldAlert,
  X,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { conversationsApi, type Conversation, type DirectMessage } from '@/lib/api';
import { resolveCableUrl } from '@/lib/cable';
import { cn } from '@/lib/utils';

type Message = DirectMessage;
type RealtimeStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'rejected';
type PendingAttachment = {
  data: string;
  filename: string;
  content_type: string;
};

type ChatCablePayload = Partial<Message> & {
  event?: string;
  conversation_id?: number;
  message?: Message;
  conversation?: Conversation;
  reader_type?: 'User' | 'Company';
  read_at?: string;
  message_ids?: number[];
  actor_type?: 'User' | 'Company';
};

type ChatApiErrorShape = {
  status?: number;
  code?: string;
  message?: string;
  details?: {
    code?: string;
    error?: string;
    message?: string;
    reason?: string;
  };
  context?: {
    status?: number;
    details?: {
      code?: string;
      error?: string;
      message?: string;
      reason?: string;
    };
  };
};

type CableSubscription = {
  unsubscribe: () => void;
  perform?: (action: string, data?: Record<string, unknown>) => void;
};

function getChatErrorMessage(error: unknown) {
  const apiError = error as ChatApiErrorShape;
  const details = apiError.context?.details || apiError.details || {};
  const status = apiError.status || apiError.context?.status;
  const code = details.code || apiError.code;
  const reason = details?.reason;
  const message = details.error || details.message || apiError.message;

  if (status === 401) {
    return 'Faça login para iniciar uma conversa com esta empresa.';
  }

  if (status === 403 && code === 'P2P_CHAT_NOT_AVAILABLE') {
    return reason === 'upgrade_required'
      ? 'O chat direto não está disponível no plano atual desta empresa.'
      : 'O chat direto está bloqueado para esta empresa.';
  }

  if (status === 403 || message?.includes('Chat is disabled')) {
    return 'O chat direto está desativado para esta empresa.';
  }

  return 'Não foi possível carregar o chat agora. Tente novamente em instantes.';
}

function getRealtimeLabel(status: RealtimeStatus) {
  if (status === 'connected') return 'ao vivo';
  if (status === 'connecting') return 'conectando';
  if (status === 'disconnected') return 'reconectando';
  if (status === 'rejected') return 'offline';
  return 'aguardando';
}

function getConversationTime(conversation: Conversation) {
  const value = conversation.last_message_at || conversation.updated_at || conversation.created_at;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function dedupeConversations(conversations: Conversation[]) {
  const byCompany = new Map<string, Conversation>();

  conversations.forEach((conversation) => {
    const key = conversation.company_id
      ? `company-${conversation.company_id}`
      : `conversation-${conversation.id}`;
    const current = byCompany.get(key);

    if (!current || getConversationTime(conversation) >= getConversationTime(current)) {
      byCompany.set(key, conversation);
    }
  });

  return Array.from(byCompany.values()).sort(
    (a, b) => getConversationTime(b) - getConversationTime(a)
  );
}

function formatConversationTime(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const sameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (sameDay) {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function getConversationPreview(conversation: Conversation) {
  if (conversation.status === 'blocked') return 'Conversa bloqueada';
  if (conversation.status === 'resolved') return 'Conversa resolvida';
  return conversation.last_message || 'Iniciar conversa';
}

function getInitials(name?: string | null) {
  return (name || 'Empresa')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export default function ChatClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const canUseP2PChat = isAuthenticated && user?.role === 'review';

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>('idle');
  const [pendingAttachment, setPendingAttachment] = useState<PendingAttachment | null>(null);
  const [typingByCompany, setTypingByCompany] = useState(false);
  const [isMobileConversationOpen, setIsMobileConversationOpen] = useState(false);

  const cableRef = useRef<ReturnType<typeof createConsumer> | null>(null);
  const channelRef = useRef<CableSubscription | null>(null);
  const listChannelRef = useRef<CableSubscription | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const visibleConversations = useMemo(() => dedupeConversations(conversations), [conversations]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    window.setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
    }, 80);
  }, []);

  const appendMessage = useCallback((message: Message) => {
    setMessages((prev) => {
      if (
        prev.some(
          (item) =>
            item.id === message.id ||
            (message.client_message_id && item.client_message_id === message.client_message_id)
        )
      ) {
        return prev;
      }

      return [...prev, message];
    });
  }, []);

  const upsertConversation = useCallback((conversation: Conversation) => {
    setConversations((prev) => dedupeConversations([conversation, ...prev]));
    setActiveConversation((current) =>
      current?.id === conversation.id ? { ...current, ...conversation } : current
    );
  }, []);

  const applyReadReceipt = useCallback((payload: ChatCablePayload) => {
    if (!payload.read_at) return;

    setMessages((prev) =>
      prev.map((message) => {
        const matchesExplicitId = payload.message_ids?.includes(message.id);
        const matchesReaderSide =
          payload.reader_type === 'Company' && message.sender_type === 'User';

        return matchesExplicitId || matchesReaderSide
          ? { ...message, read_at: message.read_at || payload.read_at || null }
          : message;
      })
    );
  }, []);

  const handleConversationPayload = useCallback(
    (payload: ChatCablePayload) => {
      if (payload.conversation) {
        upsertConversation(payload.conversation);
      }

      if (payload.event === 'message.created' && payload.message) {
        appendMessage(payload.message);
        setTypingByCompany(false);
        scrollToBottom();
        return;
      }

      if (payload.event === 'message.read') {
        applyReadReceipt(payload);
        return;
      }

      if (payload.event === 'typing.started' && payload.actor_type === 'Company') {
        setTypingByCompany(true);
        return;
      }

      if (payload.event === 'typing.stopped' && payload.actor_type === 'Company') {
        setTypingByCompany(false);
        return;
      }

      if (!payload.event && payload.id) {
        appendMessage(payload as Message);
        scrollToBottom();
      }
    },
    [appendMessage, applyReadReceipt, scrollToBottom, upsertConversation]
  );

  const loadMessagesForConversation = useCallback(
    async (conversationId: number) => {
      const msgs = await conversationsApi.getMessages(conversationId);
      setMessages(msgs || []);
      scrollToBottom('auto');
    },
    [scrollToBottom]
  );

  const setupActionCable = useCallback(
    (conversationId: number) => {
      channelRef.current?.unsubscribe();
      setRealtimeStatus('connecting');

      if (!cableRef.current) {
        cableRef.current = createConsumer(resolveCableUrl());
      }

      channelRef.current = cableRef.current.subscriptions.create(
        { channel: 'ConversationChannel', conversation_id: conversationId },
        {
          connected: () => {
            setRealtimeStatus('connected');
            void loadMessagesForConversation(conversationId).catch((error) => {
              console.warn('[P2PChat] Could not reconcile messages after reconnect', error);
            });
          },
          disconnected: () => {
            setRealtimeStatus('disconnected');
          },
          rejected: () => {
            setRealtimeStatus('rejected');
            console.warn('[P2PChat] ActionCable rejected', { conversationId });
            setErrorMessage(
              'A conexão em tempo real caiu. Atualize a conversa se as mensagens demorarem.'
            );
          },
          received: (data: ChatCablePayload) => {
            handleConversationPayload(data);
          },
        }
      );
    },
    [handleConversationPayload, loadMessagesForConversation]
  );

  const selectConversation = useCallback(
    async (conversation: Conversation, options?: { openOnMobile?: boolean }) => {
      if (!canUseP2PChat) return;

      setActiveConversation(conversation);
      setIsMobileConversationOpen(options?.openOnMobile ?? true);
      setLoadingMessages(true);

      try {
        setErrorMessage(null);
        await loadMessagesForConversation(conversation.id);
        setupActionCable(conversation.id);
      } catch (error) {
        console.error('Error loading messages', error);
        setErrorMessage(getChatErrorMessage(error));
      } finally {
        setLoadingMessages(false);
      }
    },
    [canUseP2PChat, loadMessagesForConversation, setupActionCable]
  );

  const loadConversations = useCallback(async () => {
    if (!canUseP2PChat) {
      setLoading(false);
      return;
    }

    try {
      setErrorMessage(null);
      const data = await conversationsApi.getAll({ silent: true, silentStatusCodes: [401] });
      const dedupedData = dedupeConversations(data || []);
      setConversations(dedupedData);

      const companyId = searchParams.get('company_id');
      if (companyId) {
        let conversation = dedupedData.find((item) => item.company_id === Number(companyId));

        if (!conversation) {
          try {
            conversation = await conversationsApi.create(Number(companyId));
            setConversations((prev) =>
              conversation ? dedupeConversations([conversation, ...prev]) : prev
            );
          } catch (createError) {
            console.warn('Could not create conversation:', createError);
            setErrorMessage(getChatErrorMessage(createError));
          }
        }

        if (conversation) {
          await selectConversation(conversation, { openOnMobile: true });
        }
      } else if (dedupedData.length > 0) {
        await selectConversation(dedupedData[0], { openOnMobile: false });
      }
    } catch (error) {
      const status =
        (error as ChatApiErrorShape).status || (error as ChatApiErrorShape).context?.status;
      if (status !== 401) {
        console.error('Error loading conversations', error);
      }
      setErrorMessage(getChatErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [canUseP2PChat, searchParams, selectConversation]);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      setErrorMessage('Faça login para iniciar uma conversa.');
      setConversations([]);
      setActiveConversation(null);
      setMessages([]);
      setLoading(false);
      return;
    }

    if (!canUseP2PChat) {
      setErrorMessage(
        'O chat direto fica disponível apenas para usuários compradores cadastrados.'
      );
      setConversations([]);
      setActiveConversation(null);
      setMessages([]);
      setLoading(false);
      return;
    }

    void loadConversations();
  }, [authLoading, canUseP2PChat, isAuthenticated, loadConversations]);

  useEffect(() => {
    if (!canUseP2PChat) {
      listChannelRef.current?.unsubscribe();
      listChannelRef.current = null;
      return;
    }

    if (!cableRef.current) {
      cableRef.current = createConsumer(resolveCableUrl());
    }

    listChannelRef.current?.unsubscribe();
    listChannelRef.current = cableRef.current.subscriptions.create(
      { channel: 'ConversationListChannel' },
      {
        received: (payload: ChatCablePayload) => {
          if (payload.conversation) {
            upsertConversation(payload.conversation);
          }
        },
      }
    );

    return () => {
      listChannelRef.current?.unsubscribe();
      listChannelRef.current = null;
    };
  }, [canUseP2PChat, upsertConversation]);

  useEffect(() => {
    scrollToBottom('auto');
  }, [messages.length, scrollToBottom]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      channelRef.current?.unsubscribe();
      listChannelRef.current?.unsubscribe();
      cableRef.current?.disconnect();
    };
  }, []);

  const createClientMessageId = () => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }

    return `web-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  };

  const handleInputChange = (value: string) => {
    setInputMessage(value);

    if (!activeConversation || realtimeStatus !== 'connected') return;

    channelRef.current?.perform?.('typing', { typing: true });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      channelRef.current?.perform?.('typing', { typing: false });
    }, 1200);
  };

  const handleAttachmentChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type)) {
      setErrorMessage('Anexe apenas imagem ou PDF.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('O anexo deve ter no máximo 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPendingAttachment({
          data: reader.result,
          filename: file.name,
          content_type: file.type,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const blockConversation = async () => {
    if (!activeConversation) return;
    const reason = window.prompt('Motivo do bloqueio');
    if (reason === null) return;

    try {
      const updated = await conversationsApi.block(activeConversation.id, reason);
      upsertConversation(updated);
    } catch (error) {
      setErrorMessage(getChatErrorMessage(error));
    }
  };

  const reportConversation = async () => {
    if (!activeConversation) return;
    const details = window.prompt('Descreva o problema');
    if (details === null) return;

    try {
      const result = await conversationsApi.report(activeConversation.id, 'other', details);
      upsertConversation(result.conversation);
      setErrorMessage('Denúncia registrada para auditoria.');
    } catch (error) {
      setErrorMessage(getChatErrorMessage(error));
    }
  };

  const sendMessage = async () => {
    if (!canUseP2PChat || (!inputMessage.trim() && !pendingAttachment) || !activeConversation) {
      return;
    }

    if (activeConversation.status === 'blocked') {
      setErrorMessage('Esta conversa está bloqueada.');
      return;
    }

    try {
      setErrorMessage(null);
      const msgText = inputMessage;
      const attachment = pendingAttachment;
      setInputMessage('');
      setPendingAttachment(null);
      channelRef.current?.perform?.('typing', { typing: false });
      const newMessage = await conversationsApi.sendMessage(activeConversation.id, msgText, {
        client_message_id: createClientMessageId(),
        attachments: attachment ? [attachment] : undefined,
        client: 'web',
      });
      appendMessage(newMessage);
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message', error);
      setErrorMessage(getChatErrorMessage(error));
    }
  };

  const openLogin = () => {
    const returnTo =
      typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/chat';
    router.push(`/login?return_to=${encodeURIComponent(returnTo)}`);
  };

  const openRegister = () => {
    const returnTo =
      typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/chat';
    router.push(`/register?return_to=${encodeURIComponent(returnTo)}`);
  };

  if (loading) {
    return (
      <div className="mx-auto flex h-[calc(100dvh-4rem-4.75rem-var(--safe-area-inset-bottom))] w-full max-w-7xl items-center justify-center bg-[#F8FAFC] p-4 md:my-4 md:h-[calc(100vh-7rem)] md:rounded-2xl md:border md:border-slate-200 md:bg-white">
        <Skeleton className="h-full min-h-[420px] w-full max-w-4xl rounded-2xl" />
      </div>
    );
  }

  return (
    <main className="mx-auto flex h-[calc(100dvh-4rem-4.75rem-var(--safe-area-inset-bottom))] w-full max-w-7xl overflow-hidden bg-[#F8FAFC] text-[#111827] md:my-4 md:h-[calc(100vh-7rem)] md:rounded-2xl md:border md:border-slate-200 md:bg-white md:shadow-sm">
      <section
        className={cn(
          'h-full w-full flex-col bg-white md:flex md:w-[340px] md:shrink-0 md:border-r md:border-slate-200',
          isMobileConversationOpen ? 'hidden md:flex' : 'flex'
        )}
        aria-label="Lista de conversas"
      >
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#E5E7EB] bg-white px-4">
          <div>
            <h1 className="text-lg font-semibold tracking-normal text-[#111827]">Mensagens</h1>
            <p className="text-xs font-normal text-[#64748B]">
              {visibleConversations.length} conversa{visibleConversations.length === 1 ? '' : 's'}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full text-[#64748B]"
            onClick={() => void loadConversations()}
            aria-label="Atualizar conversas"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white">
          {errorMessage && (
            <div className="m-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-800">
              {errorMessage}
              {!isAuthenticated && (
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    className="h-9 rounded-full bg-[#0F3D8E] px-4 text-white hover:bg-[#1646A0]"
                    onClick={openLogin}
                  >
                    Entrar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 rounded-full"
                    onClick={openRegister}
                  >
                    Criar conta
                  </Button>
                </div>
              )}
            </div>
          )}

          {visibleConversations.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center text-[#64748B]">
              <MessageCircle className="mb-3 h-9 w-9 text-slate-300" />
              <p className="text-sm font-medium text-[#111827]">Nenhuma conversa encontrada</p>
              <p className="mt-1 text-xs leading-relaxed">
                Quando você iniciar um chat com uma empresa, ele aparecerá aqui.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#E5E7EB]">
              {visibleConversations.map((conversation) => {
                const active = activeConversation?.id === conversation.id;
                const unreadCount =
                  conversation.unread_count ?? conversation.user_unread_count ?? 0;
                const timeLabel = formatConversationTime(
                  conversation.last_message_at || conversation.updated_at || conversation.created_at
                );

                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => void selectConversation(conversation, { openOnMobile: true })}
                    className={cn(
                      'flex h-[72px] w-full items-center gap-3 bg-white px-4 text-left transition-colors hover:bg-slate-50',
                      active && 'md:bg-slate-50'
                    )}
                  >
                    <Avatar className="h-11 w-11 shrink-0 border border-[#E5E7EB] bg-slate-50">
                      <AvatarImage
                        src={conversation.company_logo || conversation.company_avatar || ''}
                      />
                      <AvatarFallback className="bg-slate-100 text-sm font-medium text-[#0F3D8E]">
                        {getInitials(conversation.company_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <p className="truncate text-sm font-medium text-[#111827]">
                          {conversation.company_name || 'Empresa'}
                        </p>
                        {timeLabel && (
                          <span className="ml-auto shrink-0 text-[11px] font-normal text-[#64748B]">
                            {timeLabel}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex min-w-0 items-center gap-2">
                        <p className="truncate text-xs font-normal leading-tight text-[#64748B]">
                          {getConversationPreview(conversation)}
                        </p>
                        {unreadCount > 0 && (
                          <span className="ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#2563EB] px-1.5 text-[10px] font-semibold leading-none text-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section
        className={cn(
          'h-full min-w-0 flex-1 flex-col bg-[#F8FAFC] md:flex',
          isMobileConversationOpen ? 'flex' : 'hidden md:flex'
        )}
        aria-label="Conversa"
      >
        {activeConversation ? (
          <>
            <header className="flex h-16 shrink-0 items-center gap-3 border-b border-[#E5E7EB] bg-white px-3 md:h-[72px] md:px-4">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10 shrink-0 rounded-full text-[#64748B] md:hidden"
                onClick={() => setIsMobileConversationOpen(false)}
                aria-label="Voltar para mensagens"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>

              <Avatar className="h-10 w-10 shrink-0 border border-[#E5E7EB] bg-slate-50">
                <AvatarImage
                  src={activeConversation.company_logo || activeConversation.company_avatar || ''}
                />
                <AvatarFallback className="bg-slate-100 text-sm font-medium text-[#0F3D8E]">
                  {getInitials(activeConversation.company_name)}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <h2 className="truncate text-sm font-semibold leading-tight text-[#111827] md:text-base">
                  {activeConversation.company_name || 'Empresa'}
                </h2>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs font-normal text-[#64748B]">
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full',
                      realtimeStatus === 'connected'
                        ? 'bg-emerald-500'
                        : realtimeStatus === 'connecting'
                          ? 'bg-amber-500'
                          : 'bg-slate-300'
                    )}
                  />
                  <span>{getRealtimeLabel(realtimeStatus)}</span>
                  {typingByCompany && <span className="text-[#2563EB]">digitando</span>}
                </p>
              </div>

              <div className="hidden items-center gap-2 md:flex">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-full border-[#E5E7EB] text-[#64748B]"
                  onClick={reportConversation}
                  aria-label="Denunciar conversa"
                >
                  <ShieldAlert className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-full border-[#E5E7EB] px-3 text-sm font-medium text-[#64748B]"
                  onClick={blockConversation}
                  disabled={activeConversation.status === 'blocked'}
                >
                  Bloquear
                </Button>
              </div>

              <div className="md:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-full text-[#64748B]"
                      aria-label="Abrir ações da conversa"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 rounded-xl border-[#E5E7EB]">
                    <DropdownMenuLabel className="text-xs font-medium text-[#64748B]">
                      Ações
                    </DropdownMenuLabel>
                    <DropdownMenuItem asChild className="gap-2 rounded-lg text-sm">
                      <Link href={`/companies/${activeConversation.company_id}`}>
                        <Building2 className="h-4 w-4" />
                        Ver empresa
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="gap-2 rounded-lg text-sm"
                      onClick={reportConversation}
                    >
                      <Flag className="h-4 w-4" />
                      Denunciar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="gap-2 rounded-lg text-sm text-red-600 focus:text-red-600"
                      disabled={activeConversation.status === 'blocked'}
                      onClick={blockConversation}
                    >
                      <Ban className="h-4 w-4" />
                      Bloquear
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#F8FAFC] px-4 py-3">
              {errorMessage && (
                <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
                  {errorMessage}
                </div>
              )}

              {loadingMessages ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Skeleton
                      key={index}
                      className={cn(
                        'h-11 rounded-2xl',
                        index % 2 === 0 ? 'mr-auto w-7/12' : 'ml-auto w-8/12'
                      )}
                    />
                  ))}
                </div>
              ) : messages.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {messages.map((message, index) => {
                    const isMine = message.sender_type === 'User';

                    return (
                      <div
                        key={message.id || message.client_message_id || index}
                        className={cn('flex', isMine ? 'justify-end' : 'justify-start')}
                      >
                        <div
                          className={cn(
                            'max-w-[82%] break-words rounded-2xl px-3.5 py-2 text-sm font-normal leading-relaxed md:max-w-[68%]',
                            isMine
                              ? 'rounded-br-md bg-[#1646A0] text-white'
                              : 'rounded-bl-md border border-[#E5E7EB] bg-white text-[#111827]'
                          )}
                        >
                          {message.body && (
                            <p className="whitespace-pre-wrap break-words">{message.body}</p>
                          )}
                          {(message.attachments || []).length > 0 && (
                            <div className="mt-2 space-y-1">
                              {(message.attachments || []).map((attachment) => (
                                <a
                                  key={attachment.id}
                                  href={attachment.url || '#'}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={cn(
                                    'flex items-center gap-2 rounded-lg px-2 py-1 text-xs font-medium',
                                    isMine
                                      ? 'bg-white/15 text-white'
                                      : 'bg-slate-100 text-slate-700'
                                  )}
                                >
                                  <Paperclip className="h-3.5 w-3.5 shrink-0" />
                                  <span className="truncate">{attachment.filename}</span>
                                </a>
                              ))}
                            </div>
                          )}
                          {isMine && (
                            <p className="mt-1 flex items-center justify-end gap-1 text-[11px] font-normal leading-none text-white/75">
                              <CheckCheck className="h-3 w-3" />
                              {message.read_at
                                ? 'Lida'
                                : message.delivered_at
                                  ? 'Entregue'
                                  : 'Enviando'}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {activeConversation.status === 'blocked' && (
                    <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-center text-sm font-medium text-red-700">
                      Esta conversa está bloqueada. Novas mensagens estão desativadas.
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
                  <MessageCircle className="mb-3 h-10 w-10 text-slate-300" />
                  <p className="text-sm font-medium text-[#111827]">Sem mensagens ainda</p>
                  <p className="mt-1 max-w-sm text-xs leading-relaxed text-[#64748B]">
                    Envie uma primeira mensagem para iniciar o atendimento.
                  </p>
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <footer className="shrink-0 border-t border-[#E5E7EB] bg-white px-3 py-2">
              {pendingAttachment && (
                <div className="mx-auto mb-2 flex max-w-4xl items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-medium text-[#0F3D8E]">
                  <span className="truncate">{pendingAttachment.filename}</span>
                  <button
                    type="button"
                    onClick={() => setPendingAttachment(null)}
                    aria-label="Remover anexo"
                    className="rounded-full p-1 text-[#64748B] hover:bg-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <div className="mx-auto flex max-w-4xl items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  onChange={handleAttachmentChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-full border-[#E5E7EB] text-[#64748B]"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={activeConversation.status === 'blocked'}
                  aria-label="Anexar arquivo"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Input
                  value={inputMessage}
                  onChange={(event) => handleInputChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      void sendMessage();
                    }
                  }}
                  placeholder="Digite sua mensagem..."
                  className="h-10 flex-1 rounded-full border-[#E5E7EB] bg-[#F8FAFC] px-4 text-sm font-normal focus-visible:ring-[#2563EB]/20"
                  disabled={activeConversation.status === 'blocked'}
                />
                <Button
                  type="button"
                  onClick={() => void sendMessage()}
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-full bg-[#0F3D8E] text-white hover:bg-[#1646A0]"
                  disabled={
                    activeConversation.status === 'blocked' ||
                    (!inputMessage.trim() && !pendingAttachment)
                  }
                  aria-label="Enviar mensagem"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </footer>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center text-[#64748B]">
            <MessageCircle className="mb-4 h-12 w-12 text-slate-300" />
            <p className="text-sm font-medium text-[#111827]">Selecione uma conversa</p>
            <p className="mt-1 max-w-sm text-xs leading-relaxed">
              No desktop, escolha uma conversa na lista para visualizar o histórico.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
