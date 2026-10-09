'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  CalendarClock,
  Check,
  CheckCheck,
  ChevronRight,
  Clock,
  Download,
  FileText,
  FileUp,
  MessageCircle,
  MoreHorizontal,
  Paperclip,
  Phone,
  Plus,
  Send,
  ShieldCheck,
  Smile,
  Star,
  Zap,
} from 'lucide-react';
import {
  conversationsApi,
  type Conversation,
  type DirectMessage,
  type MarketplaceProposal,
} from '@/lib/api';
import {
  formatDate,
  formatMoney,
  getProposalDisplayPrice,
  getProposalLocation,
  getProposalRawTerm,
} from '@/lib/marketplace-proposals';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CompanyMark } from './ProposalSummary';

interface ProposalConversationProps {
  proposal: MarketplaceProposal;
  onBack: () => void;
  onViewProposal: () => void;
  onMeeting?: () => void;
  onNegotiate?: () => void;
}

interface ChatMessage {
  id: string | number;
  sender: 'company' | 'user';
  text: string;
  time: string;
  attachment?: {
    name: string;
    size: string;
    url?: string;
  };
  read?: boolean;
}

export function ProposalConversation({
  proposal,
  onBack,
  onViewProposal,
  onMeeting,
  onNegotiate,
}: ProposalConversationProps) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);

  const power = getProposalRawTerm(proposal, [
    'system_power',
    'power_kwp',
    'installed_power',
    'potencia',
  ]);
  const generation = getProposalRawTerm(proposal, ['monthly_generation', 'generation_kwh', 'geracao']);
  const price = getProposalDisplayPrice(proposal);
  const deadline = getProposalRawTerm(proposal, [
    'installation_deadline',
    'prazo',
    'installation_time',
  ]);

  // O histórico começa vazio e é preenchido exclusivamente pela conversa persistida.
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Carregar ou inicializar conversa real da API caso disponível
  useEffect(() => {
    let active = true;
    conversationsApi
      .create(proposal.company.id, proposal.id)
      .then((conv) => {
        if (!active || !conv?.id) return;
        setConversation(conv);
        return conversationsApi.getMessages(conv.id);
      })
      .then((realMessages) => {
        if (!active || !realMessages || realMessages.length === 0) return;
        const mapped: ChatMessage[] = realMessages.map((m) => ({
          id: m.id,
          sender: m.sender_type === 'Company' ? 'company' : 'user',
          text: m.body,
          time: new Date(m.created_at).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          read: true,
        }));
        setMessages(mapped);
      })
      .catch(() => {
        // A tela permanece utilizável mesmo quando a conversa ainda não foi criada.
      });

    return () => {
      active = false;
    };
  }, [proposal.company.id, proposal.id, deadline]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend ?? inputMessage).trim();
    if (!text || sending) return;

    const newMsg: ChatMessage = {
      id: Date.now(),
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      read: true,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputMessage('');

    if (conversation?.id) {
      setSending(true);
      try {
        await conversationsApi.sendMessage(conversation.id, text);
      } catch {
        // Falha silenciosa no envio local
      } finally {
        setSending(false);
      }
    }
  };

  const quickReplies = [
    'Podemos melhorar o preço?',
    'Tem desconto à vista?',
    'Quais as condições de financiamento?',
  ];

  const sharedFiles = Array.from(
    new Map(
      messages
        .filter((message) => message.attachment)
        .map((message) => [message.attachment!.name, message.attachment!])
    ).values()
  );


  return (
    <div className="space-y-6">
      {/* 1. Header com botão Voltar, título e subtítulo */}
      <div className="space-y-1">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar para a proposta</span>
        </button>

        <div className="pt-2">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Conversa com a empresa
          </h1>
          <p className="text-xs text-slate-500 sm:text-sm mt-0.5">
            Tire dúvidas, negocie condições e acompanhe o andamento da sua proposta.
          </p>
        </div>
      </div>

      {/* 2. Context Card: Empresa (esq) + Proposta (dir) - Imagem 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card Empresa */}
        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
          <CompanyMark proposal={proposal} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-slate-900 truncate">
                {proposal.company.name}
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200/60">
                <Check className="h-3 w-3 stroke-[3]" />
                <span>Empresa verificada</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{getProposalLocation(proposal)}</p>
            {proposal.company.rating_avg ? (
              <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-slate-600">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span>{proposal.company.rating_avg.toFixed(1)}</span>
                {proposal.company.reviews_count ? (
                  <span className="font-normal text-slate-400">({proposal.company.reviews_count} avaliações)</span>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {/* Card Proposta */}
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 truncate">
                Proposta #{proposal.reference}
              </h3>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {proposal.version?.title || 'Título não informado'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Recebida em {formatDate(proposal.published_at || proposal.created_at)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={onViewProposal}
              className="h-8 rounded-xl border-slate-200 text-xs font-semibold text-blue-600 hover:bg-blue-50"
            >
              <span>Ver proposta</span>
              <span className="ml-1">↗</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-slate-600 rounded-xl"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 3. Área Central: 3 Colunas (Tópicos ~240px | Chat central 1fr | Aside ~320px) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Coluna 1: contexto da conversa */}
        <aside className="space-y-3 rounded-2xl border border-slate-200/90 bg-white p-3 shadow-2xs lg:col-span-3">
          <h3 className="px-2 pt-1 text-sm font-bold text-slate-900">Conversa</h3>
          <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3">
            <div className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 shrink-0 text-blue-600" />
              <span className="truncate text-xs font-bold text-slate-900">Proposta #{proposal.reference}</span>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
              {messages.length ? `${messages.length} mensagens registradas` : 'Nenhuma mensagem registrada ainda'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-full gap-1.5 rounded-xl border-dashed border-slate-300 text-xs font-semibold text-blue-600 hover:bg-blue-50/60"
            onClick={() => handleSendMessage('Gostaria de abrir uma nova dúvida sobre o projeto.')}
            disabled={!conversation}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Nova mensagem</span>
          </Button>
        </aside>

        {/* Coluna 2: Chat Central (6 cols no grid 12) */}
        <div className="lg:col-span-5 flex flex-col h-[650px] rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/50 py-2.5 text-center">
            <span className="text-[11px] font-semibold text-slate-400">Histórico da conversa</span>
          </div>

          {/* Área de Mensagens com scroll */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!messages.length && (
              <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                <MessageCircle className="h-8 w-8 text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-slate-700">Nenhuma mensagem ainda</p>
                <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-500">
                  Envie uma mensagem para iniciar a conversa com a empresa.
                </p>
              </div>
            )}
            {messages.map((m) => {
              const isCompany = m.sender === 'company';
              return (
                <div
                  key={m.id}
                  className={cn(
                    'flex items-end gap-2.5 max-w-[88%]',
                    isCompany ? 'self-start mr-auto' : 'self-end ml-auto flex-row-reverse'
                  )}
                >
                  {/* Avatar da empresa */}
                  {isCompany && (
                    <div className="h-7 w-7 shrink-0 rounded-full border border-slate-200 bg-white p-0.5 overflow-hidden shadow-2xs mb-1">
                      <CompanyMark proposal={proposal} />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    {/* Balão de mensagem */}
                    <div
                      className={cn(
                        'rounded-2xl p-3.5 text-xs leading-relaxed whitespace-pre-line shadow-2xs',
                        isCompany
                          ? 'rounded-bl-xs bg-slate-100/90 text-slate-800'
                          : 'rounded-br-xs bg-blue-600 text-white'
                      )}
                    >
                      <p>{m.text}</p>

                      {/* Card de anexo dentro da mensagem */}
                      {m.attachment && (
                        <div className="mt-2.5 flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-2.5 text-slate-800">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-500 text-[10px] font-extrabold text-white">
                              PDF
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold text-slate-900">
                                {m.attachment.name}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {m.attachment.size}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 text-slate-500 hover:text-blue-600"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Horário e status de leitura */}
                    <div
                      className={cn(
                        'flex items-center gap-1 text-[10px] px-1 text-slate-400 font-medium',
                        isCompany ? 'justify-start' : 'justify-end'
                      )}
                    >
                      <span>{m.time}</span>
                      {!isCompany && (
                        <CheckCheck className="h-3.5 w-3.5 text-blue-600" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Chips de Resposta Rápida */}
          <div className="border-t border-slate-100 px-4 py-2 bg-slate-50/50 flex items-center gap-2 overflow-x-auto scrollbar-none">
            {quickReplies.map((reply) => (
              <button
                key={reply}
                type="button"
                onClick={() => handleSendMessage(reply)}
                className="shrink-0 rounded-full border border-blue-200 bg-white px-3 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 transition-colors shadow-2xs"
              >
                {reply}
              </button>
            ))}
          </div>

          {/* Barra de Input Inferior */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSendMessage();
            }}
            className="border-t border-slate-100 p-3 bg-white flex items-center gap-2"
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-slate-400 hover:text-slate-600 rounded-xl"
            >
              <Paperclip className="h-4 w-4" />
            </Button>

            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
            />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-slate-400 hover:text-slate-600 rounded-xl"
            >
              <Smile className="h-4 w-4" />
            </Button>

            <Button
              type="submit"
              disabled={!inputMessage.trim() || sending}
              size="icon"
              className="h-9 w-9 shrink-0 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-2xs"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>

        {/* Coluna 3: Aside Lateral Direita (320px -> 4 cols no grid 12) */}
        <aside className="lg:col-span-4 space-y-4">
          {/* Card 1: Resumo da proposta */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <FileText className="h-4 w-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Resumo da proposta</h3>
            </div>

            {/* Foto e Título */}
            <div className="space-y-2">
              {proposal.company.banner_url ? (
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-slate-100 bg-slate-100">
                  <img
                    src={proposal.company.banner_url}
                    alt={`Imagem da proposta de ${proposal.company.name}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex aspect-[16/9] w-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
                  Imagem não informada
                </div>
              )}

              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  {proposal.version?.title || 'Título não informado'}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">{getProposalLocation(proposal)}</p>
                {proposal.request?.project_profile && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="rounded-md border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                      {proposal.request.project_profile}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Linhas de KPIs técnicos */}
            <div className="divide-y divide-slate-100 border-t border-slate-100 pt-2 text-xs">
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-blue-600" />
                  <span>Potência do sistema</span>
                </span>
                <span className="font-bold text-slate-900">{power || 'Não informado'}</span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-blue-600" />
                  <span>Geração estimada</span>
                </span>
                <span className="font-bold text-slate-900">{generation || 'Não informado'}</span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-blue-600" />
                  <span>Valor total</span>
                </span>
                <span className="font-bold text-slate-900">{price.isAvailable ? price.formatted : 'Não informado'}</span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-blue-600" />
                  <span>Prazo de instalação</span>
                </span>
                <span className="font-bold text-slate-900">{deadline || 'Não informado'}</span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={onViewProposal}
              className="w-full text-xs font-semibold text-blue-600 border-blue-200 hover:bg-blue-50 rounded-xl h-9"
            >
              <span>Ver proposta completa</span>
              <span className="ml-1">→</span>
            </Button>
          </div>

          {/* Card 2: Arquivos compartilhados */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <FileText className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Arquivos compartilhados ({sharedFiles.length})</h3>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400">
                <Download className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {sharedFiles.length ? sharedFiles.map((f) => (
                <div
                  key={f.name}
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-2.5"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500 text-[10px] font-extrabold text-white">
                      PDF
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{f.name}</p>
                      <p className="text-[10px] text-slate-400">{f.size}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-slate-500 hover:text-blue-600"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              )) : (
                <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-500">
                  Nenhum arquivo compartilhado nesta conversa.
                </p>
              )}
            </div>
          </div>

          {/* Card 3: Ações rápidas */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Ações rápidas
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onMeeting}
                className="h-9 px-2 text-[11px] font-semibold text-slate-700 border-slate-200 rounded-xl gap-1 hover:bg-slate-50"
              >
                <CalendarClock className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                <span className="truncate">Agendar reunião</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={onNegotiate}
                className="h-9 px-2 text-[11px] font-semibold text-slate-700 border-slate-200 rounded-xl gap-1 hover:bg-slate-50"
              >
                <FileText className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                <span className="truncate">Solicitar ajuste</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                asChild
                className="h-9 px-2 text-[11px] font-semibold text-slate-700 border-slate-200 rounded-xl gap-1 hover:bg-slate-50"
              >
                <a href={(proposal.company as { phone?: string | null }).phone ? `tel:${(proposal.company as { phone?: string | null }).phone}` : '#'}>
                  <Phone className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                  <span className="truncate">Ligar para empresa</span>
                </a>
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
