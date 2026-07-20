'use client';

import { createConsumer } from '@rails/actioncable';
import { type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  MessageCircle,
  MessageSquare,
  X,
  Send,
  Paperclip,
  CheckCheck,
  Search,
  ArrowLeft,
  Loader2,
  Inbox,
  Minus
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { conversationsApi, type Conversation, type DirectMessage } from '@/lib/api';
import { resolveCableUrl } from '@/lib/cable';
import { cn } from '@/lib/utils';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuth } from '@/contexts/AuthContext';

type CableSubscription = {
  unsubscribe: () => void;
  perform?: (action: string, data?: Record<string, unknown>) => void;
};
type RealtimeStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'rejected';
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
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatConversationDate(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  
  const now = new Date();
  const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  
  if (isToday) {
    return date.toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
  
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear();
  
  if (isYesterday) {
    return 'Ontem';
  }
  
  return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export default function ReviewUserChatWidget() {
  const { isChatOpen, toggleChat } = useNotificationStore();
  const { user } = useAuth();
  const enabled = !!user && user.role === 'review';

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [reply, setReply] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>('idle');
  const [typingByCompany, setTypingByCompany] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<PendingAttachment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'priority' | 'other'>('priority');

  const cableRef = useRef<ReturnType<typeof createConsumer> | null>(null);
  const channelRef = useRef<CableSubscription | null>(null);
  const listChannelRef = useRef<CableSubscription | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedConversationId) || null,
    [conversations, selectedConversationId]
  );

  const filteredConversations = useMemo(() => {
    return conversations.filter(c => {
      if (searchQuery) {
        return (c.company_name || '').toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true; // Simple filtering for now, all in one list
    });
  }, [conversations, searchQuery]);

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
        current.map((c) =>
          c.id === conversationId
            ? { ...c, last_message: message.body, unread_count: 0, last_message_at: message.created_at }
            : c
        )
      );
    }
  }, []);

  const applyReadReceipt = useCallback((payload: ChatCablePayload) => {
    if (!payload.read_at) return;
    setMessages((current) =>
      current.map((message) => {
        const matchesExplicitId = payload.message_ids?.includes(message.id);
        const matchesReaderSide = payload.reader_type === 'Company' && message.sender_type === 'User';
        return matchesExplicitId || matchesReaderSide
          ? { ...message, read_at: message.read_at || payload.read_at || null }
          : message;
      })
    );
  }, []);

  const handleRealtimePayload = useCallback(
    (payload: ChatCablePayload) => {
      if (payload.conversation) upsertConversation(payload.conversation);

      if (payload.event === 'message.created' && payload.message) {
        appendMessage(payload.message, payload.conversation_id || selectedConversationId);
        setTypingByCompany(false);
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
        appendMessage(payload as DirectMessage, selectedConversationId);
      }
    },
    [appendMessage, applyReadReceipt, selectedConversationId, upsertConversation]
  );

  const loadConversations = async () => {
    if (!enabled) return;
    setLoadingConversations(true);
    try {
      const data = await conversationsApi.getAll();
      setConversations(data);
    } catch {
      console.error('Failed to load conversations');
    } finally {
      setLoadingConversations(false);
    }
  };

  useEffect(() => {
    if (enabled && isChatOpen) {
      loadConversations();
    }
  }, [enabled, isChatOpen]);

  useEffect(() => {
    if (!enabled || !isChatOpen) {
      listChannelRef.current?.unsubscribe();
      listChannelRef.current = null;
      return;
    }
    if (!cableRef.current) cableRef.current = createConsumer(resolveCableUrl());

    listChannelRef.current?.unsubscribe();
    listChannelRef.current = cableRef.current.subscriptions.create(
      { channel: 'ConversationListChannel' },
      {
        received: (payload: ChatCablePayload) => {
          if (payload.conversation) upsertConversation(payload.conversation);
        },
      }
    );
  }, [enabled, isChatOpen, upsertConversation]);

  useEffect(() => {
    if (!selectedConversationId || !enabled || !isChatOpen) {
      setMessages([]);
      channelRef.current?.unsubscribe();
      channelRef.current = null;
      return;
    }

    const loadMessages = async () => {
      setLoadingMessages(true);
      try {
        const data = await conversationsApi.getMessages(selectedConversationId);
        setMessages(data);
        setConversations((current) =>
          current.map((c) => (c.id === selectedConversationId ? { ...c, unread_count: 0 } : c))
        );
      } catch {
        console.error('Failed to load messages');
      } finally {
        setLoadingMessages(false);
      }
    };
    loadMessages();
  }, [enabled, selectedConversationId, isChatOpen]);

  useEffect(() => {
    if (!selectedConversationId || !enabled || !isChatOpen) return;

    channelRef.current?.unsubscribe();
    setRealtimeStatus('connecting');
    if (!cableRef.current) cableRef.current = createConsumer(resolveCableUrl());

    channelRef.current = cableRef.current.subscriptions.create(
      { channel: 'ConversationChannel', conversation_id: selectedConversationId },
      {
        connected: () => {
          setRealtimeStatus('connected');
          void conversationsApi.getMessages(selectedConversationId).then(setMessages).catch(console.warn);
        },
        disconnected: () => setRealtimeStatus('disconnected'),
        rejected: () => setRealtimeStatus('rejected'),
        received: (payload: ChatCablePayload) => handleRealtimePayload(payload),
      }
    );

    return () => {
      channelRef.current?.unsubscribe();
      channelRef.current = null;
    };
  }, [enabled, handleRealtimePayload, selectedConversationId, isChatOpen]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, typingByCompany]);

  const createClientMessageId = () => {
    return typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `chat-${Date.now()}-${Math.random().toString(16).slice(2)}`;
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
    if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type)) return;
    if (file.size > 10 * 1024 * 1024) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPendingAttachment({ data: reader.result, filename: file.name, content_type: file.type });
      }
    };
    reader.readAsDataURL(file);
  };

  const sendReply = async () => {
    const body = reply.trim();
    if (!selectedConversationId || (!body && !pendingAttachment) || sending) return;

    setSending(true);
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
      console.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (!enabled || !isChatOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white sm:bottom-4 sm:right-4 sm:top-auto sm:left-auto sm:h-[600px] sm:w-[380px] sm:rounded-2xl sm:border sm:border-slate-200 sm:shadow-2xl">
      {selectedConversation ? (
        // MESSAGE VIEW
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 p-3 shadow-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedConversationId(null)}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-black text-blue-700 relative">
                {(selectedConversation.company_name || 'E').slice(0, 1).toUpperCase()}
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500"></span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black text-slate-900 line-clamp-1">{selectedConversation.company_name}</span>
                <span className="text-xs text-slate-500">{typingByCompany ? 'Digitando...' : 'Online'}</span>
              </div>
            </div>
            <button
              onClick={() => toggleChat(false)}
              className="rounded-full p-2 text-slate-500 hover:bg-slate-100 sm:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 space-y-4">
            {loadingMessages ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <MessageCircle className="mb-3 h-10 w-10 text-slate-300" />
                <p className="text-sm font-semibold text-slate-900">Inicie a conversa</p>
                <p className="mt-1 text-xs text-slate-500 max-w-[200px]">
                  Tire dúvidas, envie documentos ou negocie diretamente com a empresa.
                </p>
              </div>
            ) : (
              messages.map((message) => {
                const isUser = message.sender_type === 'User';
                const attachmentList = (message.attachments || []).length > 0 ? (message.attachments as any[]) : message.attachment_url ? [{ url: message.attachment_url }] : [];
                return (
                  <div key={message.id} className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
                    <div
                      className={cn(
                        'max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm text-[15px]',
                        isUser
                          ? 'bg-blue-600 text-white rounded-tr-sm'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'
                      )}
                    >
                      {message.body && <p className="whitespace-pre-wrap leading-relaxed">{message.body}</p>}
                      {attachmentList.map((att, i) => (
                        <a key={i} href={att.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 mt-2 bg-black/10 rounded px-2 py-1 text-xs hover:bg-black/20">
                          <Paperclip className="h-3 w-3" /> Anexo
                        </a>
                      ))}
                      <div className={cn("flex items-center justify-end gap-1 mt-1 text-[10px]", isUser ? "text-blue-200" : "text-slate-400")}>
                        {formatMessageTime(message.created_at)}
                        {isUser && <CheckCheck className={cn("h-3 w-3", message.read_at && "text-white")} />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-slate-100 bg-white p-3">
             {pendingAttachment && (
                <div className="mb-2 flex items-center justify-between rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                  <span className="truncate">{pendingAttachment.filename}</span>
                  <button onClick={() => setPendingAttachment(null)}><X className="h-3 w-3" /></button>
                </div>
              )}
            <div className="flex items-end gap-2 bg-slate-50 rounded-2xl border border-slate-200 p-1 pl-2">
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleAttachmentChange} />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
              >
                <Paperclip className="h-5 w-5" />
              </button>
              <textarea
                value={reply}
                onChange={(e) => handleReplyChange(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="max-h-[100px] min-h-[40px] flex-1 resize-none bg-transparent py-2.5 text-sm outline-none placeholder:text-slate-400"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendReply();
                  }
                }}
              />
              <button
                onClick={sendReply}
                disabled={(!reply.trim() && !pendingAttachment) || sending}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        // LIST VIEW
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 p-4">
            <h3 className="text-lg font-black text-slate-900">Mensagens</h3>
            <div className="flex items-center gap-2">
              <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full sm:hidden" onClick={() => toggleChat(false)}>
                <X className="h-5 w-5" />
              </button>
              <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full hidden sm:block" onClick={() => toggleChat(false)}>
                <Minus className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar mensagens"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            
            <div className="mt-4 flex gap-4 border-b border-slate-200">
              <button
                className={cn("pb-2 text-sm font-semibold transition-colors relative", activeTab === 'priority' ? "text-blue-600" : "text-slate-500 hover:text-slate-900")}
                onClick={() => setActiveTab('priority')}
              >
                Prioritárias
                {activeTab === 'priority' && <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></span>}
              </button>
              <button
                className={cn("pb-2 text-sm font-semibold transition-colors relative", activeTab === 'other' ? "text-blue-600" : "text-slate-500 hover:text-slate-900")}
                onClick={() => setActiveTab('other')}
              >
                Outras
                {activeTab === 'other' && <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></span>}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {loadingConversations ? (
              <div className="flex justify-center p-4"><Loader2 className="h-5 w-5 animate-spin text-slate-300" /></div>
            ) : filteredConversations.length > 0 ? (
              <div className="space-y-1">
                {filteredConversations.map(conversation => {
                  const unreadCount = conversation.unread_count ?? 0;
                  return (
                    <button
                      key={conversation.id}
                      onClick={() => setSelectedConversationId(conversation.id)}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-black text-blue-700 relative">
                          {(conversation.company_name || 'E').slice(0, 1).toUpperCase()}
                          <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500"></span>
                        </div>
                        <div className="min-w-0 flex-col flex justify-center">
                          <span className="text-sm font-bold text-slate-900 truncate">{conversation.company_name}</span>
                          <span className="text-xs text-slate-500 truncate line-clamp-1">{conversation.last_message || 'Nova conversa'}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                        <span className="text-[11px] font-semibold text-slate-400">{formatConversationDate(conversation.last_message_at || conversation.updated_at)}</span>
                        {unreadCount > 0 && (
                          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
               <div className="flex h-full flex-col items-center justify-center text-center p-4">
                  <Inbox className="mb-3 h-10 w-10 text-slate-200" />
                  <p className="text-sm font-semibold text-slate-900">Nenhuma conversa</p>
                  <p className="mt-1 text-xs text-slate-500">As suas conversas com empresas aparecerão aqui.</p>
               </div>
            )}
            
            {filteredConversations.length > 0 && (
              <div className="pt-4 pb-2 text-center border-t border-slate-100 mt-2">
                <button className="text-xs font-bold text-blue-600 hover:text-blue-700">Ver todas as mensagens</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
