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
  const [activeTopic, setActiveTopic] = useState<'proposal' | 'technical' | 'payment' | 'visit'>('proposal');

  const power =
    getProposalRawTerm(proposal, ['system_power', 'power_kwp', 'installed_power', 'potencia']) ||
    '8,25 kWp';
  const generation =
    getProposalRawTerm(proposal, ['monthly_generation', 'generation_kwh', 'geracao']) ||
    '960 kWh/mês';
  const price = getProposalDisplayPrice(proposal);
  const deadline =
    getProposalRawTerm(proposal, ['installation_deadline', 'prazo', 'installation_time']) ||
    '30 dias';

  // Mensagens do chat (iniciadas com o histórico contextual da proposta conforme Imagem 1)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'c1',
      sender: 'company',
      text: 'Olá! Obrigado pelo seu interesse!\nSegue em anexo a proposta comercial com todos os detalhes técnicos, equipamentos e condições de pagamento.',
      time: '10:24',
      attachment: {
        name: `Proposta_Comercial_${proposal.company.name.replace(/\s+/g, '_')}.pdf`,
        size: '1,4 MB',
      },
    },
    {
      id: 'c2',
      sender: 'company',
      text: 'Também incluímos a memória de cálculo e as condições de garantia.',
      time: '10:24',
    },
    {
      id: 'u1',
      sender: 'user',
      text: 'Ótimo! Poderiam confirmar se essa solução inclui os inversores e painéis conforme especificado? E qual o prazo estimado para instalação?',
      time: '10:26',
      read: true,
    },
    {
      id: 'c3',
      sender: 'company',
      text: `Sim! Essa proposta inclui todos os equipamentos homologados conforme especificado. O prazo de instalação estimado é de ${deadline} após a formalização. Qualquer outra dúvida, estamos à disposição!`,
      time: '10:27',
    },
  ]);

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
        // Fallback gracioso mantendo histórico contextualizado
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

  const sharedFiles = [
    {
      name: `Proposta_Comercial_${proposal.company.name.replace(/\s+/g, '_')}.pdf`,
      size: '1,4 MB',
    },
    { name: 'Projeto_Tecnico.pdf', size: '2,1 MB' },
    { name: 'Memoria_de_Calculo.pdf', size: '1,8 MB' },
  ];

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
            <div className="flex items-center gap-1 text-xs text-slate-600 font-semibold mt-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span>4,8</span>
              <span className="text-slate-400 font-normal">(32 avaliações)</span>
            </div>
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
                {proposal.version?.title || `Sistema Residencial ${power}`}
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
        {/* Coluna 1: Lista de Tópicos/Conversas (240px -> 3 cols no grid 12) */}
        <aside className="lg:col-span-3 rounded-2xl border border-slate-200/90 bg-white p-3 shadow-2xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 px-2 pt-1">Conversas</h3>

          <div className="space-y-1.5">
            {/* Tópico 1: Proposta Ativa */}
            <button
              type="button"
              onClick={() => setActiveTopic('proposal')}
              className={cn(
                'w-full text-left p-3 rounded-xl transition-all border',
                activeTopic === 'proposal'
                  ? 'border-blue-200 bg-blue-50/70 shadow-2xs'
                  : 'border-transparent hover:bg-slate-50'
              )}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                  <span>Proposta #{proposal.reference}</span>
                </span>
                <span className="text-[10px] text-slate-400 shrink-0">10:24</span>
              </div>
              <p className="text-[11px] text-blue-600 truncate mt-1 font-medium">
                Olá! Obrigado pelo seu interesse!
              </p>
            </button>

            {/* Tópico 2: Dúvida técnica */}
            <button
              type="button"
              onClick={() => setActiveTopic('technical')}
              className={cn(
                'w-full text-left p-3 rounded-xl transition-all border',
                activeTopic === 'technical'
                  ? 'border-blue-200 bg-blue-50/70 shadow-2xs'
                  : 'border-transparent hover:bg-slate-50'
              )}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-slate-700 truncate flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>Dúvida técnica</span>
                </span>
                <span className="text-[10px] text-slate-400 shrink-0">Ontem</span>
              </div>
              <p className="text-[11px] text-slate-500 truncate mt-1">
                Vocês trabalham com microinversores?
              </p>
            </button>

            {/* Tópico 3: Condições de pagamento */}
            <button
              type="button"
              onClick={() => setActiveTopic('payment')}
              className={cn(
                'w-full text-left p-3 rounded-xl transition-all border',
                activeTopic === 'payment'
                  ? 'border-blue-200 bg-blue-50/70 shadow-2xs'
                  : 'border-transparent hover:bg-slate-50'
              )}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-slate-700 truncate flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>Condições de pagamento</span>
                </span>
                <span className="text-[10px] text-slate-400 shrink-0">03/10</span>
              </div>
              <p className="text-[11px] text-slate-500 truncate mt-1">
                Podemos ajustar para 12x sem juros?
              </p>
            </button>

            {/* Tópico 4: Visita técnica */}
            <button
              type="button"
              onClick={() => setActiveTopic('visit')}
              className={cn(
                'w-full text-left p-3 rounded-xl transition-all border',
                activeTopic === 'visit'
                  ? 'border-blue-200 bg-blue-50/70 shadow-2xs'
                  : 'border-transparent hover:bg-slate-50'
              )}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-slate-700 truncate flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>Visita técnica</span>
                </span>
                <span className="text-[10px] text-slate-400 shrink-0">28/09</span>
              </div>
              <p className="text-[11px] text-slate-500 truncate mt-1">
                Quando é possível agendar vistoria?
              </p>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full h-9 rounded-xl border-dashed border-slate-300 text-xs font-semibold text-blue-600 hover:bg-blue-50/60 gap-1.5"
            onClick={() => handleSendMessage('Gostaria de abrir uma nova dúvida sobre o projeto.')}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Nova conversa</span>
          </Button>
        </aside>

        {/* Coluna 2: Chat Central (6 cols no grid 12) */}
        <div className="lg:col-span-5 flex flex-col h-[650px] rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
          {/* Header de Data */}
          <div className="border-b border-slate-100 py-2.5 text-center bg-slate-50/50">
            <span className="text-[11px] font-semibold text-slate-400">
              06 de outubro de 2026
            </span>
          </div>

          {/* Área de Mensagens com scroll */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-slate-100 bg-slate-100">
                <img
                  src="/energia-solar-avalia-solar.webp"
                  alt="Sistema instalado"
                  className="h-full w-full object-cover"
                />
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  {proposal.version?.title || `Sistema Residencial ${power}`}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">{getProposalLocation(proposal)}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="rounded-md bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 text-[10px] font-semibold">
                    On-grid
                  </span>
                  <span className="rounded-md bg-slate-100 text-slate-600 px-2 py-0.5 text-[10px] font-medium">
                    Residencial
                  </span>
                  <span className="rounded-md bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[10px] font-semibold">
                    Alta eficiência
                  </span>
                </div>
              </div>
            </div>

            {/* Linhas de KPIs técnicos */}
            <div className="divide-y divide-slate-100 border-t border-slate-100 pt-2 text-xs">
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-blue-600" />
                  <span>Potência do sistema</span>
                </span>
                <span className="font-bold text-slate-900">{power}</span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-blue-600" />
                  <span>Geração estimada</span>
                </span>
                <span className="font-bold text-slate-900">{generation}</span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-blue-600" />
                  <span>Valor total</span>
                </span>
                <span className="font-bold text-slate-900">{price.formatted}</span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-blue-600" />
                  <span>Prazo de instalação</span>
                </span>
                <span className="font-bold text-slate-900">{deadline}</span>
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
                <h3 className="text-base font-bold text-slate-900">Arquivos compartilhados (3)</h3>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400">
                <Download className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {sharedFiles.map((f) => (
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
              ))}
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
