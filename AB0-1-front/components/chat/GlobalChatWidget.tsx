'use client';

import { createConsumer } from '@rails/actioncable';
import { type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { conversationsApi, type Conversation, type DirectMessage } from '@/lib/api';
import { resolveCableUrl } from '@/lib/cable';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuth } from '@/contexts/AuthContext';

import { FloatingChatTrigger } from './floating/FloatingChatTrigger';
import { FloatingChatHeader } from './floating/FloatingChatHeader';
import { FloatingChatTabs, type ChatTabType } from './floating/FloatingChatTabs';
import { FloatingConversationList } from './floating/FloatingConversationList';
import { FloatingChatMessageArea } from './floating/FloatingChatMessageArea';
import { FloatingChatInput, type PendingAttachment } from './floating/FloatingChatInput';

type CableSubscription = {
  unsubscribe: () => void;
  perform?: (action: string, data?: Record<string, unknown>) => void;
};
type RealtimeStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'rejected';

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

export default function GlobalChatWidget() {
  const { chatState, toggleChat, activeTab, setActiveTab } = useNotificationStore();
  const { user } = useAuth();
  const isUser = user?.role === 'review';
  const isCompany = user?.role === 'company' || user?.role === 'admin';
  const enabled = !!user && (isUser || isCompany);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [reply, setReply] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [, setError] = useState<string | null>(null);
  const [, setRealtimeStatus] = useState<RealtimeStatus>('idle');
  const [typingByCompany, setTypingByCompany] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<PendingAttachment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const cableRef = useRef<ReturnType<typeof createConsumer> | null>(null);
  const channelRef = useRef<CableSubscription | null>(null);
  const listChannelRef = useRef<CableSubscription | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedConversationId) || null,
    [conversations, selectedConversationId]
  );

  const totalUnread = useMemo(
    () => conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0),
    [conversations]
  );

  const tabCounts = useMemo(() => {
    let priority = 0;
    let budgets = 0;
    let other = 0;

    conversations.forEach((c) => {
      if (c.status === 'pending_user' || c.status === 'pending_company') {
        budgets++;
      } else if (c.unread_count && c.unread_count > 0) {
        priority++;
      } else {
        other++;
      }
    });

    return { priority, budgets, other };
  }, [conversations]);

  const filteredConversations = useMemo(() => {
    const seenKeys = new Set<string>();
    const uniqueList: Conversation[] = [];

    conversations.forEach((c) => {
      const key = isUser ? `company-${c.company_id}` : `user-${c.user_id}-${c.company_id}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        uniqueList.push(c);
      }
    });

    return uniqueList.filter((c) => {
      // 1. Busca textual
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchName = isUser ? c.company_name : c.user_name;
        if (!(matchName || '').toLowerCase().includes(query)) return false;
      }

      // 2. Abas de filtro
      if (activeTab === 'budgets') {
        return c.status === 'pending_user' || c.status === 'pending_company';
      }
      if (activeTab === 'other') {
        return c.status === 'resolved' || c.status === 'blocked';
      }
      // 'priority' ou default
      return true;
    });
  }, [conversations, searchQuery, isUser, activeTab]);

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
      if (
        current.some(
          (item) => item.id === message.id || (message.client_message_id && item.client_message_id === message.client_message_id)
        )
      ) {
        return current.map((item) =>
          item.id === message.id || (message.client_message_id && item.client_message_id === message.client_message_id)
            ? { ...item, ...message }
            : item
        );
      }
      return [...current, message];
    });

    if (conversationId) {
      setConversations((current) =>
        current.map((c) =>
          c.id === conversationId
            ? { ...c, last_message: message.body, unread_count: 0, last_message_at: message.created_at }
            : c
        )
      );
    }
  }, []);

  // Fetch lista de conversas
  useEffect(() => {
    if (!enabled) return;
    let isMounted = true;
    setLoadingConversations(true);

    conversationsApi
      .getAll()
      .then((data: Conversation[]) => {
        if (isMounted) {
          setConversations(data || []);
          setError(null);
        }
      })
      .catch((err: any) => {
        if (isMounted) setError(err?.message || 'Erro ao carregar conversas');
      })
      .finally(() => {
        if (isMounted) setLoadingConversations(false);
      });

    return () => {
      isMounted = false;
    };
  }, [enabled]);

  // Subscrição ActionCable para Lista de Conversas
  useEffect(() => {
    if (!enabled) return;
    const cableUrl = resolveCableUrl();
    if (!cableUrl) return;

    const consumer = createConsumer(cableUrl);
    cableRef.current = consumer;

    const listSub = consumer.subscriptions.create(
      { channel: 'ConversationListChannel' },
      {
        received: (data: ChatCablePayload) => {
          if (data.event === 'conversation_updated' && data.conversation) {
            upsertConversation(data.conversation);
          }
        },
      }
    ) as CableSubscription;

    listChannelRef.current = listSub;

    return () => {
      listSub.unsubscribe();
      consumer.disconnect();
    };
  }, [enabled, upsertConversation]);

  // Carregar mensagens da conversa selecionada
  useEffect(() => {
    if (!enabled || !selectedConversationId) {
      setMessages([]);
      return;
    }

    let isMounted = true;
    setLoadingMessages(true);

    conversationsApi
      .getMessages(selectedConversationId)
      .then((data) => {
        if (isMounted) {
          setMessages(data || []);
          conversationsApi.markRead(selectedConversationId).catch(() => {});
          setConversations((current) =>
            current.map((c) => (c.id === selectedConversationId ? { ...c, unread_count: 0 } : c))
          );
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoadingMessages(false);
      });

    const cableUrl = resolveCableUrl();
    if (!cableUrl || !cableRef.current) return;

    setRealtimeStatus('connecting');

    const convSub = cableRef.current.subscriptions.create(
      { channel: 'ConversationChannel', conversation_id: selectedConversationId },
      {
        connected: () => setRealtimeStatus('connected'),
        disconnected: () => setRealtimeStatus('disconnected'),
        rejected: () => setRealtimeStatus('rejected'),
        received: (data: ChatCablePayload) => {
          if (
            data.event === 'typing' ||
            data.event === 'typing.started' ||
            data.event === 'typing.stopped'
          ) {
            if (data.event === 'typing.stopped') {
              setTypingByCompany(false);
              return;
            }
            if (data.actor_type !== (isUser ? 'User' : 'Company')) {
              setTypingByCompany(true);
              if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
              typingTimeoutRef.current = setTimeout(() => setTypingByCompany(false), 3000);
            }
            return;
          }

          if (data.event === 'message_read' && data.read_at) {
            setMessages((current) =>
              current.map((m) => (data.message_ids?.includes(m.id) ? { ...m, read_at: data.read_at! } : m))
            );
            return;
          }

          const newMsg = data.message || (data.id ? (data as DirectMessage) : null);
          if (newMsg) {
            appendMessage(newMsg, selectedConversationId);
          }
        },
      }
    ) as CableSubscription;

    channelRef.current = convSub;

    return () => {
      isMounted = false;
      convSub.unsubscribe();
    };
  }, [enabled, selectedConversationId, appendMessage, isUser]);

  const handleAttachmentChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPendingAttachment({
        data: reader.result as string,
        filename: file.name,
        content_type: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleReplyChange = (value: string) => {
    setReply(value);
    channelRef.current?.perform?.('typing', { typing: value.length > 0 });
  };

  const sendReply = async () => {
    if ((!reply.trim() && !pendingAttachment) || !selectedConversationId || sending) return;

    const text = reply.trim();
    const tempId = -Date.now();
    const optimisticMsg: DirectMessage = {
      id: tempId,
      conversation_id: selectedConversationId,
      body: text,
      sender_type: isUser ? 'User' : 'Company',
      created_at: new Date().toISOString(),
      delivered_at: new Date().toISOString(),
    };

    appendMessage(optimisticMsg, selectedConversationId);
    setReply('');
    setPendingAttachment(null);
    setSending(true);

    try {
      const payloadOptions = pendingAttachment ? { attachments: [pendingAttachment] } : undefined;
      const newMessage = await conversationsApi.sendMessage(selectedConversationId, text, payloadOptions);
      setMessages((current) => current.map((m) => (m.id === tempId ? newMessage : m)));
      channelRef.current?.perform?.('typing', { typing: false });
    } catch {
      console.error('Failed to send message');
      setMessages((current) => current.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  if (!enabled || chatState === 'closed') return null;

  // ESTADO MINIMIZADO
  if (chatState === 'minimized') {
    return (
      <FloatingChatTrigger
        user={user}
        unreadCount={totalUnread}
        onExpand={() => toggleChat('expanded')}
      />
    );
  }

  // ESTADO EXPANDIDO (Painel Flutuante estilo LinkedIn)
  return (
    <div className="fixed bottom-[calc(4.5rem+var(--sab))] right-4 z-[9010] flex h-[65vh] max-h-[540px] w-[calc(100vw-2rem)] max-w-[380px] flex-col overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl transition-all duration-200 animate-in fade-in slide-in-from-bottom-5 md:bottom-4 md:h-[540px]">
      <FloatingChatHeader
        currentUser={user}
        activeConversation={
          selectedConversation
            ? {
                id: selectedConversation.id,
                title:
                  (isUser ? selectedConversation.company_name : selectedConversation.user_name) ||
                  'Conversa',
                avatar_url: isUser
                  ? selectedConversation.company_logo_url || selectedConversation.company_logo || selectedConversation.company_avatar
                  : selectedConversation.user_avatar_url || selectedConversation.user_avatar,
                isTyping: typingByCompany,
              }
            : null
        }
        onBack={selectedConversation ? () => setSelectedConversationId(null) : undefined}
        onMinimize={() => toggleChat('minimized')}
        onClose={() => toggleChat('closed')}
      />

      {selectedConversation ? (
        // CONVERSA ATIVA
        <div className="flex flex-1 flex-col overflow-hidden">
          <FloatingChatMessageArea
            messages={messages}
            loading={loadingMessages}
            isUser={isUser}
            isTyping={typingByCompany}
          />
          <FloatingChatInput
            reply={reply}
            onReplyChange={handleReplyChange}
            onSend={sendReply}
            pendingAttachment={pendingAttachment}
            onAttachmentChange={handleAttachmentChange}
            onRemoveAttachment={() => setPendingAttachment(null)}
            sending={sending}
          />
        </div>
      ) : (
        // LISTA DE CONVERSAS COM ABAS
        <div className="flex flex-1 flex-col overflow-hidden">
          <FloatingChatTabs
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeTab={activeTab}
            onTabChange={(tab: ChatTabType) => setActiveTab(tab)}
            counts={tabCounts}
          />
          <FloatingConversationList
            conversations={filteredConversations}
            selectedId={selectedConversationId}
            onSelect={(id) => setSelectedConversationId(id)}
            isUser={isUser}
            loading={loadingConversations}
          />
        </div>
      )}
    </div>
  );
}
