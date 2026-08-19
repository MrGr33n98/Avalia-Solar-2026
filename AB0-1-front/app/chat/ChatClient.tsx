'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createConsumer } from '@rails/actioncable';
import {
  ArrowLeft,
  Building2,
  MoreVertical,
  ShieldAlert,
  X,
  MessageCircle,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { conversationsApi, type Conversation, type DirectMessage } from '@/lib/api';
import { isRealtimeEnabled, resolveCableUrl } from '@/lib/cable';
import { cn } from '@/lib/utils';
import { getFullImageUrl } from '@/utils/image';
import { RightChatSidebar } from './components/RightChatSidebar';
import { ConversationList } from './components/ConversationList';
import { MessageTimeline, type OptimisticMessage } from './components/MessageTimeline';
import { MessageComposer, type PendingAttachment } from './components/MessageComposer';
import { SLABadge } from './components/SLABadge';

type RealtimeStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'rejected';

type CableSubscription = {
  unsubscribe: () => void;
  perform?: (action: string, data?: Record<string, unknown>) => void;
};

export default function ChatClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const viewerRole: 'User' | 'Company' | 'Unknown' = useMemo(() => {
    if (user?.role === 'company') return 'Company';
    if (user?.role === 'review') return 'User';
    return 'Unknown';
  }, [user]);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<OptimisticMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>('idle');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const cableRef = useRef<ReturnType<typeof createConsumer> | null>(null);
  const channelRef = useRef<CableSubscription | null>(null);
  const listChannelRef = useRef<CableSubscription | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  const fetchConversations = useCallback(async (preferredCompanyId?: number, preferredConvId?: number) => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const list = await conversationsApi.getAll();
      setConversations(list || []);

      if (preferredConvId) {
        const found = list.find((c) => c.id === preferredConvId);
        if (found) {
          setActiveConversation(found);
          setIsMobileOpen(true);
          return;
        }
      }

      if (preferredCompanyId) {
        const existing = list.find((c) => c.company_id === preferredCompanyId);
        if (existing) {
          setActiveConversation(existing);
          setIsMobileOpen(true);
        } else {
          const created = await conversationsApi.create(preferredCompanyId);
          setConversations((prev) => [created, ...prev]);
          setActiveConversation(created);
          setIsMobileOpen(true);
        }
      } else if (list.length > 0 && !activeConversation) {
        setActiveConversation(list[0]);
      }
    } catch (err: any) {
      setErrorMessage('Não foi possível carregar suas conversas no momento.');
    } finally {
      setLoading(false);
    }
  }, [activeConversation]);

  // Initial load
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/login?redirect=/chat');
      return;
    }

    const companyIdParam = searchParams.get('company_id');
    const convIdParam = searchParams.get('conversation_id');

    fetchConversations(
      companyIdParam ? Number(companyIdParam) : undefined,
      convIdParam ? Number(convIdParam) : undefined
    );
  }, [authLoading, isAuthenticated, searchParams, router, fetchConversations]);

  // Load messages for active conversation
  const loadMessages = useCallback(async (convId: number) => {
    try {
      setLoadingMessages(true);
      const data = await conversationsApi.getMessages(convId);
      setMessages(data || []);
      conversationsApi.markRead(convId).catch(() => {});
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (activeConversation?.id) {
      loadMessages(activeConversation.id);
    } else {
      setMessages([]);
    }
  }, [activeConversation?.id, loadMessages]);

  // ActionCable realtime
  useEffect(() => {
    if (!isRealtimeEnabled() || typeof window === 'undefined') return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const cableUrl = resolveCableUrl();
    const consumer = createConsumer(cableUrl);
    cableRef.current = consumer;
    setRealtimeStatus('connecting');

    // Subscribe to user/company list stream
    const listStreamName =
      viewerRole === 'Company'
        ? `conversation_list:company:${user?.company_id || user?.company?.id || user?.id}`
        : `conversation_list:user:${user?.id}`;

    listChannelRef.current = consumer.subscriptions.create(
      { channel: 'ConversationChannel', stream_name: listStreamName },
      {
        connected: () => setRealtimeStatus('connected'),
        disconnected: () => setRealtimeStatus('disconnected'),
        rejected: () => setRealtimeStatus('rejected'),
        received: (data: any) => {
          if (data.conversation) {
            setConversations((prev) => {
              const idx = prev.findIndex((c) => c.id === data.conversation.id);
              if (idx >= 0) {
                const updated = [...prev];
                updated[idx] = { ...updated[idx], ...data.conversation };
                return updated;
              }
              return [data.conversation, ...prev];
            });
          }
        },
      }
    ) as CableSubscription;

    return () => {
      listChannelRef.current?.unsubscribe();
      consumer.disconnect();
    };
  }, [user, viewerRole]);

  // ActionCable for active conversation stream
  useEffect(() => {
    if (!cableRef.current || !activeConversation?.id) return;

    channelRef.current?.unsubscribe();

    channelRef.current = cableRef.current.subscriptions.create(
      { channel: 'ConversationChannel', conversation_id: activeConversation.id },
      {
        received: (data: any) => {
          if (data.event === 'message.created' && data.message) {
            setMessages((prev) => {
              if (
                prev.some(
                  (m) =>
                    m.id === data.message.id ||
                    (data.message.client_message_id &&
                      m.client_message_id === data.message.client_message_id)
                )
              ) {
                return prev.map((m) =>
                  m.client_message_id === data.message.client_message_id || m.id === data.message.id
                    ? { ...m, ...data.message, sendStatus: 'delivered' }
                    : m
                );
              }
              return [...prev, { ...data.message, sendStatus: 'delivered' }];
            });
          } else if (data.event === 'message.read') {
            setMessages((prev) =>
              prev.map((m) => (m.sender_type === viewerRole ? { ...m, sendStatus: 'read' } : m))
            );
          }
        },
      }
    ) as CableSubscription;

    return () => {
      channelRef.current?.unsubscribe();
    };
  }, [activeConversation?.id, viewerRole]);

  // Optimistic Send Message Handler
  const handleSendMessage = async (body: string, attachmentsPayload?: PendingAttachment[]) => {
    if (!activeConversation) return;

    const clientMsgId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const optimisticMsg: OptimisticMessage = {
      id: 0,
      conversation_id: activeConversation.id,
      body,
      sender_type: viewerRole === 'Company' ? 'Company' : 'User',
      client_message_id: clientMsgId,
      created_at: new Date().toISOString(),
      read_at: null,
      delivered_at: null,
      sendStatus: 'sending',
      attachments: attachmentsPayload?.map((att) => ({
        id: 0,
        filename: att.filename,
        content_type: att.content_type,
        byte_size: 0,
        url: att.data,
      })) || [],
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const created = await conversationsApi.sendMessage(activeConversation.id, body, {
        client_message_id: clientMsgId,
        attachments: attachmentsPayload,
        client: 'pwa',
      });

      setMessages((prev) =>
        prev.map((m) => (m.client_message_id === clientMsgId ? { ...created, sendStatus: 'sent' } : m))
      );

      // Update conversation last message in list
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeConversation.id) {
            return {
              ...c,
              last_message_at: created.created_at,
              last_message: created.body,
            };
          }
          return c;
        })
      );
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) => (m.client_message_id === clientMsgId ? { ...m, sendStatus: 'failed' } : m))
      );
    }
  };

  const handleRetryMessage = async (msg: OptimisticMessage) => {
    if (!msg.body || !activeConversation) return;
    setMessages((prev) =>
      prev.map((m) => (m.client_message_id === msg.client_message_id ? { ...m, sendStatus: 'sending' } : m))
    );

    try {
      const created = await conversationsApi.sendMessage(activeConversation.id, msg.body, {
        client_message_id: msg.client_message_id || undefined,
        client: 'pwa',
      });

      setMessages((prev) =>
        prev.map((m) =>
          m.client_message_id === msg.client_message_id ? { ...created, sendStatus: 'sent' } : m
        )
      );
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) => (m.client_message_id === msg.client_message_id ? { ...m, sendStatus: 'failed' } : m))
      );
    }
  };

  const partnerName =
    viewerRole === 'Company'
      ? activeConversation?.user?.name || activeConversation?.user_name || 'Cliente'
      : activeConversation?.company?.name || activeConversation?.company_name || 'Empresa';

  const partnerAvatar =
    viewerRole === 'Company'
      ? activeConversation?.user?.avatar_url || activeConversation?.user_avatar_url || undefined
      : activeConversation?.company?.logo_url || activeConversation?.company_logo_url || undefined;

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-white">
      {/* Sidebar: Conversation List */}
      <div
        className={cn(
          'w-full md:w-80 lg:w-96 shrink-0 h-full',
          isMobileOpen ? 'hidden md:block' : 'block'
        )}
      >
        <ConversationList
          conversations={conversations}
          selectedId={activeConversation?.id || null}
          viewerRole={viewerRole}
          isLoading={loading}
          onSelect={(conv) => {
            setActiveConversation(conv);
            setIsMobileOpen(true);
          }}
          onRefresh={() => fetchConversations()}
        />
      </div>

      {/* Main Chat Area */}
      <div
        className={cn(
          'flex-1 flex flex-col h-full min-w-0 bg-white',
          !isMobileOpen ? 'hidden md:flex' : 'flex'
        )}
      >
        {activeConversation ? (
          <>
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-white shrink-0 shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setIsMobileOpen(false)}
                  className="md:hidden p-1 text-slate-500 hover:text-slate-900"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>

                <Avatar className="h-9 w-9 border border-slate-200 shrink-0">
                  <AvatarImage src={getFullImageUrl(partnerAvatar)} alt={partnerName} />
                  <AvatarFallback className="text-xs font-bold bg-slate-100 text-slate-700">
                    {partnerName.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-slate-900 truncate">{partnerName}</h3>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span className="capitalize">{activeConversation.status || 'aberta'}</span>
                    <span className="h-1 w-1 rounded-full bg-emerald-500" />
                    <span className="text-emerald-600 font-bold">{realtimeStatus}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activeConversation.sla_due_at && (
                  <SLABadge
                    slaDueAt={activeConversation.sla_due_at}
                    status={activeConversation.status}
                  />
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 rounded-lg">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44 text-xs font-medium">
                    {viewerRole === 'Company' && activeConversation.status !== 'resolved' && (
                      <DropdownMenuItem
                        onClick={async () => {
                          await conversationsApi.resolve(activeConversation.id);
                          setActiveConversation((prev) => (prev ? { ...prev, status: 'resolved' } : null));
                        }}
                      >
                        Marcar como Resolvida
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-700"
                      onClick={async () => {
                        const reason = prompt('Motivo do bloqueio:');
                        if (reason) {
                          await conversationsApi.block(activeConversation.id, reason);
                          setActiveConversation((prev) => (prev ? { ...prev, status: 'blocked' } : null));
                        }
                      }}
                    >
                      Bloquear Conversa
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Timeline */}
            <MessageTimeline
              messages={messages}
              viewerRole={viewerRole}
              partnerName={partnerName}
              partnerAvatar={partnerAvatar}
              onRetryMessage={handleRetryMessage}
            />

            {/* Composer */}
            <MessageComposer
              onSendMessage={handleSendMessage}
              disabled={activeConversation.status === 'blocked'}
              allowSavedReplies={viewerRole === 'Company'}
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/40">
            <MessageCircle className="h-12 w-12 text-slate-300 mb-3" />
            <h3 className="text-sm font-bold text-slate-800">Selecione uma conversa</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Escolha um atendimento na lista lateral para visualizar o histórico de mensagens e responder.
            </p>
          </div>
        )}
      </div>

      {/* Right Sidebar Details */}
      {activeConversation && (
        <RightChatSidebar
          activeConversation={activeConversation}
          messages={messages}
          isUser={viewerRole === 'User'}
          className="hidden lg:block w-72 shrink-0 border-l border-slate-200 bg-white"
        />
      )}
    </div>
  );
}
