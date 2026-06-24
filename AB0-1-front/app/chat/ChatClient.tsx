'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MessageCircle, Send, ArrowLeft } from 'lucide-react';
import { createConsumer } from '@rails/actioncable';
import { getApiBaseUrl } from '@/lib/api-config';
import { conversationsApi, type Conversation, type DirectMessage } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type Message = DirectMessage;

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

export default function ChatClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const canUseP2PChat = isAuthenticated && user?.role === 'review';

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputMessage, setInputMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const cableRef = useRef<ReturnType<typeof createConsumer> | null>(null);
  const channelRef = useRef<CableSubscription | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const appendMessage = useCallback((message: Message) => {
    setMessages((prev) => {
      if (prev.some((item) => item.id === message.id)) return prev;
      return [...prev, message];
    });
  }, []);

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
      setErrorMessage('O chat direto fica disponível apenas para usuários compradores cadastrados.');
      setConversations([]);
      setActiveConversation(null);
      setMessages([]);
      setLoading(false);
      return;
    }

    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, canUseP2PChat, isAuthenticated, router, user?.role]);

  const loadConversations = async () => {
    if (!canUseP2PChat) {
      setLoading(false);
      return;
    }

    try {
      setErrorMessage(null);
      const data = await conversationsApi.getAll({ silent: true, silentStatusCodes: [401] });
      setConversations(data || []);

      // Somente compradores (review) podem iniciar uma nova conversa via company_id na URL
      const companyId = searchParams.get('company_id');
      if (companyId) {
        let conv = data.find((c) => c.company_id === Number(companyId));
        if (!conv) {
          try {
            conv = await conversationsApi.create(Number(companyId));
            setConversations((prev) => (conv ? [conv, ...prev] : prev));
          } catch (createError) {
            // Se não conseguir criar (403 feature gate), apenas mostra as conversas existentes
            console.warn('Could not create conversation:', createError);
            setErrorMessage(getChatErrorMessage(createError));
          }
        }
        if (conv) selectConversation(conv);
      } else if (data.length > 0) {
        selectConversation(data[0]);
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
  };

  const selectConversation = async (conv: Conversation) => {
    if (!canUseP2PChat) return;

    setActiveConversation(conv);
    try {
      setErrorMessage(null);
      const msgs = await conversationsApi.getMessages(conv.id);
      setMessages(msgs || []);
      setupActionCable(conv.id);
    } catch (error) {
      console.error('Error loading messages', error);
      setErrorMessage(getChatErrorMessage(error));
    }
  };

  const setupActionCable = async (conversationId: number) => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
    }
    if (!cableRef.current) {
      // Cookies are sent by the browser during the WebSocket handshake; avoid reading HttpOnly cookies in JS.
      const wsUrl = getApiBaseUrl().replace('http', 'ws').replace('/api/v1', '/cable');
      cableRef.current = createConsumer(wsUrl);
    }

    channelRef.current = cableRef.current.subscriptions.create(
      { channel: 'ConversationChannel', conversation_id: conversationId },
      {
        rejected: () => {
          console.warn('[P2PChat] ActionCable rejected', { conversationId });
        },
        received: (data: Message) => {
          appendMessage(data);
          scrollToBottom();
        },
      }
    );
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (
      !canUseP2PChat ||
      !inputMessage.trim() ||
      !activeConversation
    ) {
      return;
    }
    try {
      setErrorMessage(null);
      const msgText = inputMessage;
      setInputMessage('');
      const newMessage = await conversationsApi.sendMessage(activeConversation.id, msgText);
      appendMessage(newMessage);
    } catch (error) {
      console.error('Error sending message', error);
      setErrorMessage(getChatErrorMessage(error));
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Skeleton className="h-[400px] w-full max-w-4xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-80px)] w-full max-w-7xl flex-col bg-white md:flex-row md:border md:shadow-sm">
      {/* Sidebar */}
      <div className="w-full border-r border-slate-200 md:w-1/3 md:max-w-xs flex-col flex">
        <div className="border-b p-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-bold">Mensagens</h2>
          </div>
        </div>
        <ScrollArea className="flex-1">
          {errorMessage && (
            <div className="m-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">
              {errorMessage}
              {!isAuthenticated && (
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    className="bg-blue-600 text-white hover:bg-blue-700"
                    onClick={() =>
                      router.push(
                        `/login?return_to=${encodeURIComponent(window.location.pathname + window.location.search)}`
                      )
                    }
                  >
                    Entrar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      router.push(
                        `/register?return_to=${encodeURIComponent(window.location.pathname + window.location.search)}`
                      )
                    }
                  >
                    Criar conta
                  </Button>
                </div>
              )}
            </div>
          )}
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-slate-500">Nenhuma conversa encontrada.</div>
          ) : (
            <div className="flex flex-col">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv)}
                  className={`flex w-full items-center gap-3 border-b p-4 text-left transition-colors hover:bg-slate-50 ${activeConversation?.id === conv.id ? 'bg-slate-50' : ''}`}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={conv.company_logo || ''} />
                    <AvatarFallback>{(conv.company_name || 'C').charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <div className="font-semibold truncate text-sm">
                      {conv.company_name || 'Empresa'}
                    </div>
                    <div className="truncate text-xs text-slate-500">
                      {conv.last_message || 'Iniciar conversa'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat Window */}
      <div className="flex flex-1 flex-col bg-slate-50">
        {activeConversation ? (
          <>
            <div className="flex items-center gap-3 border-b bg-white p-4 shadow-sm">
              <Avatar className="h-10 w-10">
                <AvatarImage src={activeConversation.company_logo || ''} />
                <AvatarFallback>
                  {(activeConversation.company_name || 'C').charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="font-bold">
                {activeConversation.company_name || 'Empresa'}
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="flex flex-col gap-3">
                {messages.map((msg, idx) => {
                  const isMine = msg.sender_type === 'User';
                  return (
                    <div key={idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                          isMine
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-slate-800 shadow-sm border border-slate-100'
                        }`}
                      >
                        {msg.body}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="border-t bg-white p-4">
              <div className="mx-auto flex max-w-4xl items-center gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Escreva sua mensagem..."
                  className="flex-1"
                />
                <Button onClick={sendMessage} size="icon" className="bg-blue-600 hover:bg-blue-700">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-slate-400">
            <MessageCircle className="mb-4 h-12 w-12 opacity-50" />
            <p>Selecione uma conversa para começar</p>
          </div>
        )}
      </div>
    </div>
  );
}
