'use client';

import { createConsumer } from '@rails/actioncable';
import { type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Ban,
  CheckCheck,
  CheckCircle2,
  Clock,
  Flag,
  Inbox,
  MessageCircle,
  Paperclip,
  RefreshCw,
  Send,
  ShieldCheck,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { conversationsApi, type Conversation, type DirectMessage } from '@/lib/api';
import { resolveCableUrl } from '@/lib/cable';
import { cn } from '@/lib/utils';

interface CompanyChatInboxProps {
  enabled: boolean;
}

type CableSubscription = {
  unsubscribe: () => void;
  perform?: (action: string, data?: Record<string, unknown>) => void;
};
type RealtimeStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'rejected';
type QueueFilter = 'active' | 'unread' | 'sla' | 'resolved' | 'blocked';
type PendingAttachment = {
  data: string;
  filename: string;
  content_type: string;
};
type ChatCablePayload = Partial<DirectMessage> & {
  event?: string;
  conversation_id?: number;
  message?: DirectMessage;
  conversation?: Conversation;
  reader_type?: 'User' | 'Company';
  read_at?: string;
  message_ids?: number[];
  actor_type?: 'User' | 'Company';
};

function formatMessageTime(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getRealtimeLabel(status: RealtimeStatus) {
  if (status === 'connected') return 'Ao vivo';
  if (status === 'connecting') return 'Conectando';
  if (status === 'disconnected') return 'Reconectando';
  if (status === 'rejected') return 'Offline';
  return 'Aguardando';
}

export default function CompanyChatInbox({ enabled }: CompanyChatInboxProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [reply, setReply] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>('idle');
  const [queueFilter, setQueueFilter] = useState<QueueFilter>('active');
  const [typingByUser, setTypingByUser] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<PendingAttachment | null>(null);
  const cableRef = useRef<ReturnType<typeof createConsumer> | null>(null);
  const channelRef = useRef<CableSubscription | null>(null);
  const listChannelRef = useRef<CableSubscription | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId) || null,
    [conversations, selectedConversationId]
  );

  const filteredConversations = useMemo(() => {
    return conversations.filter((conversation) => {
      const unread = (conversation.unread_count || 0) > 0;
      const slaDue = conversation.sla_due_at ? new Date(conversation.sla_due_at).getTime() <= Date.now() + 60 * 60 * 1000 : false;

      if (queueFilter === 'unread') return unread;
      if (queueFilter === 'sla') return slaDue && conversation.status !== 'resolved' && conversation.status !== 'blocked';
      if (queueFilter === 'resolved') return conversation.status === 'resolved';
      if (queueFilter === 'blocked') return conversation.status === 'blocked';
      return conversation.status !== 'resolved' && conversation.status !== 'blocked';
    });
  }, [conversations, queueFilter]);

  const upsertConversation = useCallback((conversation: Conversation) => {
    setConversations((current) => {
      const next = current.some((item) => item.id === conversation.id)
        ? current.map((item) => (item.id === conversation.id ? { ...item, ...conversation } : item))
        : [conversation, ...current];

      return [...next].sort((a, b) => {
        const dateA = new Date(a.last_message_at || a.updated_at || a.created_at).getTime();
        const dateB = new Date(b.last_message_at || b.updated_at || b.created_at).getTime();
        return dateB - dateA;
      });
    });
  }, []);

  const appendMessage = useCallback((message: DirectMessage, conversationId?: number | null) => {
    setMessages((current) => {
      if (current.some((item) => item.id === message.id || (message.client_message_id && item.client_message_id === message.client_message_id))) return current;
      return [...current, message];
    });

    if (conversationId) {
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === conversationId
            ? { ...conversation, last_message: message.body, unread_count: 0, last_message_at: message.created_at }
            : conversation
        )
      );
    }
  }, []);

  const applyReadReceipt = useCallback((payload: ChatCablePayload) => {
    if (!payload.read_at) return;

    setMessages((current) =>
      current.map((message) => {
        const matchesExplicitId = payload.message_ids?.includes(message.id);
        const matchesReaderSide =
          payload.reader_type === 'User' && message.sender_type === 'Company';

        return matchesExplicitId || matchesReaderSide
          ? { ...message, read_at: message.read_at || payload.read_at || null }
          : message;
      })
    );
  }, []);

  const handleRealtimePayload = useCallback(
    (payload: ChatCablePayload) => {
      if (payload.conversation) {
        upsertConversation(payload.conversation);
      }

      if (payload.event === 'message.created' && payload.message) {
        appendMessage(payload.message, payload.conversation_id || selectedConversationId);
        setTypingByUser(false);
        return;
      }

      if (payload.event === 'message.read') {
        applyReadReceipt(payload);
        return;
      }

      if (payload.event === 'typing.started' && payload.actor_type === 'User') {
        setTypingByUser(true);
        return;
      }

      if (payload.event === 'typing.stopped' && payload.actor_type === 'User') {
        setTypingByUser(false);
        return;
      }

      if (!payload.event && payload.id) {
        appendMessage(payload as DirectMessage, selectedConversationId);
      }
    },
    [appendMessage, applyReadReceipt, selectedConversationId, upsertConversation]
  );

  const loadConversations = async () => {
    if (!enabled) return;

    setLoadingConversations(true);
    setError(null);
    try {
      const data = await conversationsApi.getAll();
      setConversations(data);
      setSelectedConversationId((current) => current || data[0]?.id || null);
    } catch {
      setError('Não foi possível carregar as conversas agora.');
    } finally {
      setLoadingConversations(false);
    }
  };

  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
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
          if (payload.conversation) upsertConversation(payload.conversation);
        },
      }
    );

    return () => {
      listChannelRef.current?.unsubscribe();
      listChannelRef.current = null;
    };
  }, [enabled, upsertConversation]);

  useEffect(() => {
    if (!selectedConversationId || !enabled) {
      setMessages([]);
      channelRef.current?.unsubscribe();
      channelRef.current = null;
      return;
    }

    const loadMessages = async () => {
      setLoadingMessages(true);
      setError(null);
      try {
        const data = await conversationsApi.getMessages(selectedConversationId);
        setMessages(data);
        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === selectedConversationId
              ? { ...conversation, unread_count: 0 }
              : conversation
          )
        );
      } catch {
        setError('Não foi possível carregar as mensagens desta conversa.');
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
  }, [enabled, selectedConversationId]);

  useEffect(() => {
    if (!selectedConversationId || !enabled) return;

    channelRef.current?.unsubscribe();
    setRealtimeStatus('connecting');

    if (!cableRef.current) {
      cableRef.current = createConsumer(resolveCableUrl());
    }

    channelRef.current = cableRef.current.subscriptions.create(
      { channel: 'ConversationChannel', conversation_id: selectedConversationId },
      {
        connected: () => {
          setRealtimeStatus('connected');
          void conversationsApi
            .getMessages(selectedConversationId)
            .then(setMessages)
            .catch((reconcileError) => {
              console.warn('[P2PChat:CompanyInbox] Could not reconcile messages', reconcileError);
            });
        },
        disconnected: () => {
          setRealtimeStatus('disconnected');
        },
        rejected: () => {
          setRealtimeStatus('rejected');
          console.warn('[P2PChat:CompanyInbox] ActionCable rejected', {
            conversationId: selectedConversationId,
          });
        },
        received: (payload: ChatCablePayload) => {
          handleRealtimePayload(payload);
        },
      }
    );

    return () => {
      channelRef.current?.unsubscribe();
      channelRef.current = null;
    };
  }, [enabled, handleRealtimePayload, selectedConversationId]);

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

    return `dashboard-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  };

  const handleReplyChange = (value: string) => {
    setReply(value);
    if (!selectedConversationId || realtimeStatus !== 'connected') return;

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
      setError('Anexe apenas imagem ou PDF.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('O anexo deve ter no máximo 10MB.');
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

  const updateConversation = async (action: 'resolve' | 'reopen' | 'block' | 'report') => {
    if (!selectedConversationId) return;

    try {
      let updated: Conversation | null = null;
      if (action === 'resolve') updated = await conversationsApi.resolve(selectedConversationId);
      if (action === 'reopen') updated = await conversationsApi.reopen(selectedConversationId);
      if (action === 'block') {
        const reason = window.prompt('Motivo do bloqueio');
        if (reason === null) return;
        updated = await conversationsApi.block(selectedConversationId, reason);
      }
      if (action === 'report') {
        const details = window.prompt('Descreva o problema');
        if (details === null) return;
        const result = await conversationsApi.report(selectedConversationId, 'other', details);
        updated = result.conversation;
      }

      if (updated) upsertConversation(updated);
    } catch {
      setError('Não foi possível atualizar esta conversa.');
    }
  };

  const sendReply = async () => {
    const body = reply.trim();
    if (!selectedConversationId || (!body && !pendingAttachment) || sending) return;
    if (selectedConversation?.status === 'blocked') {
      setError('Esta conversa está bloqueada.');
      return;
    }

    setSending(true);
    setError(null);
    try {
      const attachment = pendingAttachment;
      const newMessage = await conversationsApi.sendMessage(selectedConversationId, body, {
        client_message_id: createClientMessageId(),
        attachments: attachment ? [attachment] : undefined,
        client: 'dashboard',
      });
      appendMessage(newMessage, selectedConversationId);
      setReply('');
      setPendingAttachment(null);
      channelRef.current?.perform?.('typing', { typing: false });
    } catch {
      setError('Não foi possível enviar a resposta.');
    } finally {
      setSending(false);
    }
  };

  if (!enabled) {
    return (
      <Card className="rounded-2xl border-amber-200 bg-amber-50/70 shadow-sm">
        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-600">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-950">Chat direto desativado</h3>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">
                Ative o chat da empresa no Active Admin para permitir conversas diretas no perfil
                público e liberar a caixa de atendimento no dashboard.
              </p>
            </div>
          </div>
          <span className="inline-flex w-fit items-center rounded-full bg-white px-3 py-1 text-xs font-black text-amber-700">
            Feature gate: p2p_chat_enabled
          </span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm">
      <CardContent className="p-0">
        <div className="grid min-h-[560px] lg:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="border-b border-slate-200 bg-slate-50/70 lg:border-b-0 lg:border-r">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-4">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wide text-slate-950">
                  Conversas
                </h3>
                <p className="text-xs text-slate-500">
                  {conversations.length} atendimento{conversations.length === 1 ? '' : 's'}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-xl"
                onClick={loadConversations}
                disabled={loadingConversations}
                aria-label="Atualizar conversas"
              >
                <RefreshCw className={cn('h-4 w-4', loadingConversations && 'animate-spin')} />
              </Button>
            </div>
            <div className="flex gap-2 overflow-x-auto border-b border-slate-200 p-3">
              {[
                ['active', 'Abertas'],
                ['unread', 'Não lidas'],
                ['sla', 'SLA'],
                ['resolved', 'Resolvidas'],
                ['blocked', 'Bloqueadas'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setQueueFilter(value as QueueFilter)}
                  className={cn(
                    'shrink-0 rounded-full px-3 py-1 text-xs font-black transition-colors',
                    queueFilter === value
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-100'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="max-h-[500px] overflow-y-auto p-3">
              {loadingConversations ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-20 rounded-2xl" />
                  ))}
                </div>
              ) : filteredConversations.length > 0 ? (
                <div className="space-y-2">
                  {filteredConversations.map((conversation) => {
                    const active = conversation.id === selectedConversationId;
                    const unreadCount = conversation.unread_count ?? 0;
                    const slaDue = conversation.sla_due_at ? new Date(conversation.sla_due_at).getTime() <= Date.now() : false;
                    return (
                      <button
                        key={conversation.id}
                        type="button"
                        onClick={() => setSelectedConversationId(conversation.id)}
                        className={cn(
                          'w-full rounded-2xl border p-3 text-left transition-colors',
                          active
                            ? 'border-blue-200 bg-white shadow-sm'
                            : 'border-transparent hover:border-slate-200 hover:bg-white'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-black text-blue-700">
                            {(conversation.user_name || 'C').slice(0, 1).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="truncate text-sm font-black text-slate-950">
                                {conversation.user_name || 'Cliente'}
                              </p>
                              {unreadCount > 0 && (
                                <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[10px] font-black text-white">
                                  {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
                              {conversation.last_message || 'Nova conversa iniciada.'}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase text-slate-500">
                                {conversation.status || 'open'}
                              </span>
                              {conversation.sla_due_at && conversation.status !== 'resolved' && (
                                <span
                                  className={cn(
                                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black',
                                    slaDue
                                      ? 'bg-red-50 text-red-700'
                                      : 'bg-amber-50 text-amber-700'
                                  )}
                                >
                                  <Clock className="h-3 w-3" />
                                  {formatMessageTime(conversation.sla_due_at)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center">
                  <Inbox className="mb-3 h-8 w-8 text-slate-300" />
                  <p className="text-sm font-black text-slate-950">Nenhuma conversa ainda</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    Quando um cliente iniciar chat pelo perfil público, ele aparecerá aqui.
                  </p>
                </div>
              )}
            </div>
          </aside>

          <section className="flex min-h-[560px] flex-col">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-4">
              <div>
                <h3 className="text-base font-black text-slate-950">
                  {selectedConversation?.user_name || 'Atendimento'}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedConversation
                    ? `Conversa iniciada em ${formatMessageTime(selectedConversation.created_at)}`
                    : 'Selecione uma conversa para responder'}
                  {typingByUser && ' · cliente digitando'}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                {selectedConversation && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => updateConversation(selectedConversation.status === 'resolved' ? 'reopen' : 'resolve')}
                    >
                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                      {selectedConversation.status === 'resolved' ? 'Reabrir' : 'Resolver'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateConversation('report')}
                      aria-label="Denunciar conversa"
                    >
                      <Flag className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateConversation('block')}
                      disabled={selectedConversation.status === 'blocked'}
                      aria-label="Bloquear conversa"
                    >
                      <Ban className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black',
                    realtimeStatus === 'connected'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-slate-100 text-slate-600'
                  )}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {getRealtimeLabel(realtimeStatus)}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50/40 p-4">
              {error && (
                <div className="mb-3 rounded-2xl border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">
                  {error}
                </div>
              )}

              {loadingMessages ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Skeleton key={index} className="h-14 rounded-2xl" />
                  ))}
                </div>
              ) : selectedConversation ? (
                messages.length > 0 ? (
                  <div className="space-y-3">
                    {messages.map((message) => {
                      const isCompany = message.sender_type === 'Company';
                      const attachmentList: Array<{ id?: number | string; filename?: string; url?: string; content_type?: string }> =
                        (message.attachments || []).length > 0
                          ? (message.attachments as any[])
                          : message.attachment_url
                            ? [{ id: 0, filename: 'Anexo', url: message.attachment_url, content_type: '' }]
                            : [];

                      return (
                        <div
                          key={message.id}
                          className={cn('flex', isCompany ? 'justify-end' : 'justify-start')}
                        >
                          <div
                            className={cn(
                              'max-w-[78%] rounded-2xl px-4 py-3 shadow-sm',
                              isCompany
                                ? 'bg-blue-700 text-white'
                                : 'border border-slate-200 bg-white text-slate-800'
                            )}
                          >
                            {message.body && (
                              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                                {message.body}
                              </p>
                            )}
                            {attachmentList.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {attachmentList.map((attachment, attIdx) => (
                                  <a
                                    key={attachment.id || attIdx}
                                    href={attachment.url || '#'}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={cn(
                                      'flex items-center gap-2 rounded-lg px-2 py-1 text-xs font-semibold',
                                      isCompany
                                        ? 'bg-white/15 text-white hover:bg-white/25'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    )}
                                  >
                                    <Paperclip className="h-3.5 w-3.5" />
                                    <span className="truncate">{attachment.filename || 'Anexo'}</span>
                                  </a>
                                ))}
                              </div>
                            )}
                            <p
                              className={cn(
                                'mt-1 flex items-center justify-end gap-1 text-[11px]',
                                isCompany ? 'text-blue-100' : 'text-slate-400'
                              )}
                            >
                              {formatMessageTime(message.created_at)}
                              {isCompany && (
                                <>
                                  <CheckCheck className="h-3 w-3" />
                                  {message.read_at ? 'Lida' : message.delivered_at ? 'Entregue' : 'Enviando'}
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    {selectedConversation.status === 'blocked' && (
                      <div className="rounded-2xl border border-red-100 bg-red-50 p-3 text-center text-sm font-semibold text-red-700">
                        Esta conversa está bloqueada. Reabra ou desbloqueie o fluxo antes de responder.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
                    <MessageCircle className="mb-3 h-10 w-10 text-slate-300" />
                    <p className="text-sm font-black text-slate-950">Sem mensagens ainda</p>
                    <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
                      Envie uma primeira resposta para iniciar o atendimento.
                    </p>
                  </div>
                )
              ) : (
                <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
                  <MessageCircle className="mb-3 h-10 w-10 text-slate-300" />
                  <p className="text-sm font-black text-slate-950">Selecione uma conversa</p>
                  <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
                    Use esta caixa para responder leads com rapidez e manter o histórico.
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 bg-white p-4">
              {pendingAttachment && (
                <div className="mb-3 flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
                  <span className="truncate">{pendingAttachment.filename}</span>
                  <button type="button" onClick={() => setPendingAttachment(null)} aria-label="Remover anexo">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              <div className="flex items-end gap-3">
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
                  className="h-12 w-12 rounded-2xl"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!selectedConversation || selectedConversation.status === 'blocked'}
                  aria-label="Anexar arquivo"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <textarea
                  value={reply}
                  onChange={(event) => handleReplyChange(event.target.value)}
                  disabled={!selectedConversation || sending || selectedConversation.status === 'blocked'}
                  rows={2}
                  placeholder={
                    selectedConversation
                      ? 'Escreva uma resposta clara e objetiva...'
                      : 'Selecione uma conversa para responder'
                  }
                  className="min-h-[48px] flex-1 resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400"
                />
                <Button
                  type="button"
                  onClick={sendReply}
                  disabled={
                    !selectedConversation ||
                    selectedConversation.status === 'blocked' ||
                    (!reply.trim() && !pendingAttachment) ||
                    sending
                  }
                  className="h-12 rounded-2xl bg-blue-700 px-5 font-black text-white hover:bg-blue-800"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Enviar
                </Button>
              </div>
            </div>
          </section>
        </div>
      </CardContent>
    </Card>
  );
}
