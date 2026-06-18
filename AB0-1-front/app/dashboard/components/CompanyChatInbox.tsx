'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Inbox, MessageCircle, RefreshCw, Send, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { conversationsApi, type Conversation, type DirectMessage } from '@/lib/api';
import { cn } from '@/lib/utils';

interface CompanyChatInboxProps {
  enabled: boolean;
}

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

export default function CompanyChatInbox({ enabled }: CompanyChatInboxProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [reply, setReply] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId) || null,
    [conversations, selectedConversationId]
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
    if (!selectedConversationId || !enabled) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      setLoadingMessages(true);
      setError(null);
      try {
        const data = await conversationsApi.getMessages(selectedConversationId);
        setMessages(data);
      } catch {
        setError('Não foi possível carregar as mensagens desta conversa.');
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
  }, [enabled, selectedConversationId]);

  const sendReply = async () => {
    const body = reply.trim();
    if (!selectedConversationId || !body || sending) return;

    setSending(true);
    setError(null);
    try {
      const newMessage = await conversationsApi.sendMessage(selectedConversationId, body);
      setMessages((current) => [...current, newMessage]);
      setReply('');
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === selectedConversationId
            ? { ...conversation, last_message: body }
            : conversation
        )
      );
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

            <div className="max-h-[500px] overflow-y-auto p-3">
              {loadingConversations ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-20 rounded-2xl" />
                  ))}
                </div>
              ) : conversations.length > 0 ? (
                <div className="space-y-2">
                  {conversations.map((conversation) => {
                    const active = conversation.id === selectedConversationId;
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
                            <p className="truncate text-sm font-black text-slate-950">
                              {conversation.user_name || 'Cliente'}
                            </p>
                            <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
                              {conversation.last_message || 'Nova conversa iniciada.'}
                            </p>
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
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                Canal ativo
              </span>
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
                            <p className="whitespace-pre-wrap text-sm leading-relaxed">
                              {message.body}
                            </p>
                            <p
                              className={cn(
                                'mt-1 text-[11px]',
                                isCompany ? 'text-blue-100' : 'text-slate-400'
                              )}
                            >
                              {formatMessageTime(message.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
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
              <div className="flex items-end gap-3">
                <textarea
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  disabled={!selectedConversation || sending}
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
                  disabled={!selectedConversation || !reply.trim() || sending}
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
