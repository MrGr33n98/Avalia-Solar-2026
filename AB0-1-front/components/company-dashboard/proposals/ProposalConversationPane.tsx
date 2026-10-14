'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare,
  Send,
  Paperclip,
  Loader2,
  AlertCircle,
  ExternalLink,
  Check,
  CheckCheck,
  X,
  FileText,
  Clock,
} from 'lucide-react';
import {
  conversationsApi,
  type DirectMessage,
  type MarketplaceProposal,
} from '@/lib/api';
import { cn } from '@/lib/utils';

interface ProposalConversationPaneProps {
  proposal: MarketplaceProposal | null;
  companyId: number | string;
  onOpenFullInbox?: () => void;
  onCloseMobile?: () => void;
  className?: string;
}

export function ProposalConversationPane({
  proposal,
  companyId,
  onOpenFullInbox,
  onCloseMobile,
  className,
}: ProposalConversationPaneProps) {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState<{
    data: string;
    filename: string;
    content_type: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const conversationId = proposal?.conversation_id;

  const scrollToBottom = (smooth = true) => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
  };

  const loadMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await conversationsApi.getMessages(conversationId);
      setMessages(Array.isArray(data) ? data : []);
      // Marcar como lida em background
      conversationsApi.markRead(conversationId).catch(() => {});
    } catch {
      setError('Não foi possível carregar as mensagens desta conversa.');
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    scrollToBottom(false);
  }, [messages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('O anexo deve ter no máximo 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAttachment({
        data: result,
        filename: file.name,
        content_type: file.type || 'application/octet-stream',
      });
      setError(null);
    };
    reader.onerror = () => {
      setError('Erro ao carregar o arquivo para anexo.');
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conversationId) return;
    const trimmed = text.trim();
    if (!trimmed && !attachment) return;

    setSending(true);
    setError(null);

    try {
      const sent = await conversationsApi.sendMessage(conversationId, trimmed, {
        attachments: attachment ? [attachment] : undefined,
      });

      setMessages((prev) => [...prev, sent]);
      setText('');
      setAttachment(null);
      scrollToBottom();
    } catch {
      setError('Não foi possível enviar a mensagem. Tente novamente.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden',
        className
      )}
    >
      {/* Pane Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50/60 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-slate-900 truncate">
              {proposal?.lead?.name || 'Comprador'}
            </h3>
            <p className="text-[10px] text-slate-500 truncate">
              {proposal ? `Ref: ${proposal.reference}` : 'Nenhuma proposta selecionada'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenFullInbox && (
            <button
              type="button"
              onClick={onOpenFullInbox}
              title="Abrir na Caixa de Entrada completa"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          )}

          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 lg:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Pane Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 bg-slate-50/30">
        {!proposal ? (
          <div className="flex h-full flex-col items-center justify-center text-center p-6 text-slate-400">
            <MessageSquare className="h-8 w-8 mb-2 text-slate-300" />
            <p className="text-xs font-medium">Selecione uma proposta</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              O histórico de conversa do comprador será exibido aqui.
            </p>
          </div>
        ) : !conversationId ? (
          <div className="flex h-full flex-col items-center justify-center text-center p-6">
            <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2.5">
              <MessageSquare className="h-5 w-5" />
            </div>
            <p className="text-xs font-bold text-slate-800">
              Nenhuma conversa aberta para esta proposta
            </p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-[240px] leading-relaxed">
              O canal de mensagens diretas entre sua empresa e o comprador será iniciado assim que a proposta for visualizada ou respondida.
            </p>
          </div>
        ) : loading ? (
          <div className="flex h-full items-center justify-center text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center p-6 text-slate-400">
            <Clock className="h-8 w-8 mb-2 text-slate-300" />
            <p className="text-xs font-medium text-slate-700">Canal de conversa aberto</p>
            <p className="text-[11px] text-slate-400 mt-0.5 max-w-[220px]">
              Envie a primeira mensagem para esclarecer dúvidas sobre a proposta.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isCompany = msg.sender_type === 'Company';
            return (
              <div
                key={msg.id}
                className={cn('flex flex-col max-w-[85%]', isCompany ? 'ml-auto items-end' : 'mr-auto items-start')}
              >
                <span className="text-[10px] font-semibold text-slate-400 mb-0.5 px-1">
                  {isCompany ? 'Sua empresa' : proposal.lead?.name || 'Comprador'}
                </span>

                <div
                  className={cn(
                    'rounded-2xl px-3.5 py-2.5 text-xs shadow-sm leading-relaxed',
                    isCompany
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-sm'
                  )}
                >
                  {msg.body && <p className="whitespace-pre-wrap">{msg.body}</p>}

                  {/* Anexos */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {msg.attachments.map((att, index) => (
                        <a
                          key={index}
                          href={att.url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors',
                            isCompany
                              ? 'bg-blue-700 text-white hover:bg-blue-800'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          )}
                        >
                          <FileText className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate max-w-[160px]">
                            {att.filename || 'Anexo'}
                          </span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 mt-0.5 px-1 text-[10px] text-slate-400">
                  <span>
                    {msg.created_at
                      ? new Date(msg.created_at).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : ''}
                  </span>
                  {isCompany && (
                    <span>
                      {msg.read_at ? (
                        <CheckCheck className="h-3 w-3 text-blue-500" />
                      ) : (
                        <Check className="h-3 w-3 text-slate-400" />
                      )}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Pane Footer / Composer */}
      {conversationId && (
        <div className="border-t border-slate-100 p-3 bg-white shrink-0">
          {error && (
            <div className="mb-2 flex items-center gap-1.5 text-[11px] text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-100">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {attachment && (
            <div className="mb-2 flex items-center justify-between rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700">
              <span className="flex items-center gap-1.5 truncate max-w-[220px]">
                <FileText className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                <span className="truncate">{attachment.filename}</span>
              </span>
              <button
                type="button"
                onClick={() => setAttachment(null)}
                className="text-slate-400 hover:text-rose-600 p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex items-center gap-1.5">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Anexar documento ou imagem"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <Paperclip className="h-4 w-4" />
            </button>

            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escreva uma mensagem..."
              disabled={sending}
              className="flex-1 min-w-0 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
            />

            <button
              type="submit"
              disabled={sending || (!text.trim() && !attachment)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm hover:bg-blue-700 disabled:opacity-40 transition-all"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
