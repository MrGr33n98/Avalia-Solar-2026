'use client';

import { useState, useEffect, useRef } from 'react';
import { useChatSession } from '@/hooks/useChatSession';
import { usePathname } from 'next/navigation';
import { posthog } from '@/lib/posthog';

// Feature flags para controle do comportamento dos cards e CTAs
const MOBIVOLT_COMPANY_CARDS_ENABLED = true;

import ChatCompanyRecommendations from './ChatCompanyRecommendations';
import MarkdownRenderer from './MarkdownRenderer';

export default function ChatWidget() {
  const {
    isOpen,
    setIsOpen,
    messages,
    isLoading,
    showLeadForm,
    setShowLeadForm,
    hasLeadCaptured,
    startSession,
    sendMessage,
    sendFeedback,
    submitLead
  } = useChatSession();

  const [input, setInput] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    consent_given: false
  });

  // Estados locais para telemetria de cliques comerciais e comparação
  const [clickedCompanyId, setClickedCompanyId] = useState<number | null>(null);
  const [selectedCompanyForQuote, setSelectedCompanyForQuote] = useState<number | null>(null);
  const [comparedCompanyIds, setComparedCompanyIds] = useState<number[]>([]);

  const pathname = usePathname();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, showLeadForm]);

  // Start session on first open
  const handleToggle = () => {
    if (!isOpen && messages.length === 0) {
      // Auto-detect vertical based on pathname
      const vertical = pathname.includes('mobilidade') || pathname.includes('electric') ? 'electric_mobility' : 'solar';
      startSession(vertical, window.location.href);
    }
    setIsOpen(!isOpen);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput('');
  };

  const handleQuickReply = (text: string) => {
    if (isLoading) return;
    sendMessage(text);
  };

  // Dispara mobivolt_company_card_viewed ao carregar as recomendações
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === 'assistant' && lastMsg.metadata?.type === 'company_recommendations') {
      const companies = lastMsg.metadata.companies || [];
      if (companies.length > 0) {
        posthog.capture('mobivolt_company_card_viewed', {
          session_id: lastMsg.id,
          companies_count: companies.length,
          company_ids: companies.map((c: any) => c.id)
        });
      }
    }
  }, [messages]);

  // Ao clicar no card para ver o perfil
  const handleCompanyClick = (companyId: number, type: 'profile' | 'whatsapp') => {
    setClickedCompanyId(companyId);
    
    if (type === 'profile') {
      posthog.capture('mobivolt_company_profile_clicked', {
        session_id: messages[0]?.id,
        company_id: companyId
      });
    } else if (type === 'whatsapp') {
      posthog.capture('mobivolt_whatsapp_clicked', {
        session_id: messages[0]?.id,
        company_id: companyId
      });
    }
  };

  // Ao clicar no botão "Quero orçamento" de algum card
  const handleRequestQuote = (companyId: number) => {
    setSelectedCompanyForQuote(companyId);
    setShowLeadForm(true);
    
    try {
      posthog.capture('mobivolt_quote_request_clicked', {
        session_id: messages[0]?.id,
        company_id: companyId
      });

      posthog.capture('mobivolt_lead_optin_started', {
        session_id: messages[0]?.id,
        company_id: companyId
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Ao clicar no botão "Comparar"
  const handleCompare = (companyId: number) => {
    setComparedCompanyIds(prev => {
      return prev.includes(companyId) 
        ? prev.filter(id => id !== companyId)
        : [...prev, companyId];
    });
    
    try {
      posthog.capture('mobivolt_compare_clicked', {
        session_id: messages[0]?.id,
        company_id: companyId,
        is_comparing: !comparedCompanyIds.includes(companyId)
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.consent_given) return;

    // Compila os metadados de RAG, cliques e LGPD
    const allRecommendedCompanyIds = messages
      .flatMap(m => m.metadata?.companies?.map((c: any) => c.id) || [])
      .filter((id): id is number => typeof id === 'number');
    
    const enrichedMetadata = {
      recommended_company_ids: allRecommendedCompanyIds,
      clicked_company_id: clickedCompanyId,
      quote_requested_company_id: selectedCompanyForQuote,
      comparison_company_ids: comparedCompanyIds,
      lgpd_consent_version: 'v1',
      lgpd_consent_text: 'Aceito compartilhar meus dados conforme a LGPD para me conectar com as melhores ofertas.'
    };

    const success = await submitLead({
      ...formData,
      metadata: enrichedMetadata
    });

    if (success) {
      setShowLeadForm(false);
      posthog.capture('mobivolt_lead_optin_completed', {
        session_id: messages[0]?.id,
        quote_requested_company_id: selectedCompanyForQuote
      });
    }
  };

  const initialQuickReplies = [
    'Como funciona a comparação de empresas?',
    'Simular financiamento de energia solar',
    'Indicar uma empresa confiável',
    'Dúvidas sobre manutenção solar'
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="w-[380px] max-w-[calc(100vw-2rem)] h-[580px] max-h-[calc(100vh-8rem)] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200/80 dark:border-zinc-800 flex flex-col overflow-hidden transition-all duration-300 animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-blue to-brand-cyan text-white p-4 flex items-center justify-between shadow-md">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-white border border-white/20">
                  <img
                    src="/images/mobivolt-ai-avaliasolar.png"
                    alt="MobiVolt AI Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-zinc-900 rounded-full"></span>
              </div>
              <div>
                <h3 className="font-semibold text-sm tracking-wide">MobiVolt AI</h3>
                <span className="text-xs text-white/80">Online • Assistente Avalia Solar</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full"
              aria-label="Minimizar chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18 12H6" />
              </svg>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50 dark:bg-zinc-950">
            {messages.length === 0 && !isLoading && (
              <div className="text-center py-6 text-zinc-500 dark:text-zinc-400">
                <p className="text-sm font-medium">Olá! Como posso te ajudar hoje?</p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-start space-x-2`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-amber-200 dark:border-zinc-700/80 mt-1 bg-white">
                    <img
                      src="/images/mobivolt-ai-avaliasolar.png"
                      alt="MobiVolt AI"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} space-y-1 w-full max-w-[85%]`}>
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm w-full ${
                      msg.role === 'user'
                        ? 'bg-brand-blue text-white rounded-tr-none'
                        : 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 border border-zinc-200/50 dark:border-zinc-700 rounded-tl-none'
                    }`}
                  >
                    <div className="max-h-64 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-600">
                      {msg.role === 'assistant' ? (
                        <MarkdownRenderer content={msg.content} />
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>

                    {/* Renderiza Cards de Empresas recomendadas pelo MobiVolt AI */}
                    {MOBIVOLT_COMPANY_CARDS_ENABLED && msg.role === 'assistant' && msg.metadata?.type === 'company_recommendations' && (
                      <ChatCompanyRecommendations
                        metadata={msg.metadata}
                        comparedCompanyIds={comparedCompanyIds}
                        onCompanyClick={handleCompanyClick}
                        onRequestQuote={handleRequestQuote}
                        onCompare={handleCompare}
                        onRequestPersonalizedSearch={() => {
                          setSelectedCompanyForQuote(null);
                          setShowLeadForm(true);
                        }}
                      />
                    )}
                  </div>

                  {/* Feedback Option for AI replies */}
                  {msg.role === 'assistant' && msg.id && (
                    <div className="flex items-center space-x-2 px-1 text-xs text-zinc-400 dark:text-zinc-500">
                      <span>Esta resposta foi útil?</span>
                      <button
                        onClick={() => sendFeedback(msg.id, 1)}
                        className={`hover:text-brand-blue transition-colors ${msg.feedback === 1 ? 'text-brand-blue font-bold' : ''}`}
                        aria-label="Útil"
                      >
                        👍
                      </button>
                      <button
                        onClick={() => sendFeedback(msg.id, -1)}
                        className={`hover:text-red-500 transition-colors ${msg.feedback === -1 ? 'text-red-500 font-bold' : ''}`}
                        aria-label="Não útil"
                      >
                        👎
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing Indicator & Skeleton Cards Loader */}
            {isLoading && (
              <div className="flex justify-start items-start space-x-2">
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-amber-200 dark:border-zinc-700/80 mt-1 bg-white">
                  <img
                    src="/images/mobivolt-ai-avaliasolar.png"
                    alt="MobiVolt AI"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col space-y-3 w-full max-w-[280px]">
                  {/* Pontinhos Animados */}
                  <div className="flex items-center space-x-2 bg-white dark:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-700 rounded-2xl rounded-tl-none px-4 py-3 max-w-[80px] shadow-sm">
                    <span className="w-2 h-2 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-2 h-2 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>

                  {/* Skeleton Pulsante de Busca Comercial do Matcher */}
                  <div className="p-3.5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 shadow-sm space-y-3 animate-pulse">
                    <div className="flex space-x-3">
                      <div className="w-12 h-12 rounded-lg bg-zinc-200 dark:bg-zinc-850 flex-shrink-0"></div>
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-3.5 bg-zinc-200 dark:bg-zinc-850 rounded w-3/4"></div>
                        <div className="h-2.5 bg-zinc-200 dark:bg-zinc-850 rounded w-1/2"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-zinc-200 dark:bg-zinc-850 rounded w-full"></div>
                      <div className="h-2 bg-zinc-200 dark:bg-zinc-850 rounded w-5/6"></div>
                    </div>
                    <div className="flex space-x-2 pt-2">
                      <div className="h-7 bg-zinc-150 dark:bg-zinc-850 rounded flex-1"></div>
                      <div className="h-7 bg-zinc-150 dark:bg-zinc-850 rounded flex-1"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Replies */}
            {messages.length <= 1 && !isLoading && (
              <div className="flex flex-wrap gap-2 pt-2">
                {initialQuickReplies.map((reply, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickReply(reply)}
                    className="text-xs text-left bg-brand-blue/5 dark:bg-brand-blue/10 text-brand-blue dark:text-brand-blue-light border border-brand-blue/20 dark:border-brand-blue/30 hover:bg-brand-blue/10 dark:hover:bg-brand-blue/20 rounded-full px-3.5 py-1.5 transition-all font-medium duration-200"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}

            {/* Lead Form inside Messages */}
            {showLeadForm && !hasLeadCaptured && (
              <div className="bg-brand-blue/5 dark:bg-[#0F172A] border border-brand-blue/20 dark:border-zinc-700 rounded-2xl p-4 shadow-md space-y-3 animate-in fade-in zoom-in-95">
                <div className="text-center space-y-1">
                  <h4 className="font-semibold text-sm text-zinc-800 dark:text-zinc-100">Consultoria Personalizada Grátis</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Preencha seus dados para receber propostas e orçamentos recomendados.</p>
                </div>
                <form onSubmit={handleFormSubmit} className="space-y-2">
                  <input
                    type="text"
                    required
                    placeholder="Nome Completo"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="tel"
                      required
                      placeholder="WhatsApp (com DDD)"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    />
                    <input
                      type="email"
                      required
                      placeholder="E-mail"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Cidade"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="col-span-2 w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    />
                    <input
                      type="text"
                      required
                      maxLength={2}
                      placeholder="UF"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                      className="w-full text-xs px-3 py-2 text-center rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    />
                  </div>

                  <label className="flex items-start space-x-2 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={formData.consent_given}
                      onChange={(e) => setFormData({ ...formData, consent_given: e.target.checked })}
                      className="mt-0.5 rounded text-brand-blue focus:ring-brand-blue border-zinc-300 dark:border-zinc-700"
                    />
                    <span className="text-[10px] leading-tight text-zinc-500 dark:text-zinc-400">
                      Aceito que a equipe Avalia Solar processe meus dados conforme a LGPD para me conectar com as melhores ofertas.
                    </span>
                  </label>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-brand-blue to-brand-cyan hover:from-brand-blue-dark hover:to-brand-blue text-white font-medium py-2 rounded-lg text-xs shadow-md transition-colors"
                  >
                    Receber Orçamentos
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLeadForm(false)}
                    className="w-full text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 font-medium py-1 text-[11px] transition-colors"
                  >
                    Continuar Apenas no Chat
                  </button>
                </form>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-3 border-t border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center space-x-2">
            <input
              type="text"
              value={input}
              disabled={isLoading || showLeadForm}
              onChange={(e) => setInput(e.target.value)}
              placeholder={showLeadForm ? "Preencha o formulário acima..." : "Escreva sua mensagem..."}
              className="flex-1 px-4 py-2 text-sm bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/50 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading || showLeadForm}
              className="bg-brand-blue hover:bg-brand-blue-dark text-white rounded-xl p-2 transition-colors disabled:opacity-50 shadow-md shadow-brand-blue/10"
              aria-label="Enviar mensagem"
            >
              <svg className="w-5 h-5 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={handleToggle}
          className="h-14 w-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95 group relative border-2 border-brand-blue bg-white dark:bg-zinc-900 overflow-hidden"
          aria-label="Abrir Chat IA"
        >
          {/* Notification Pulsing Badge */}
          <span className="absolute top-0 right-0 flex h-4 w-4 z-10">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-cyan opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-brand-blue border-2 border-white dark:border-zinc-900 text-[9px] font-bold items-center justify-center text-white">1</span>
          </span>

          {/* Avatar Image as launcher icon */}
          <img
            src="/images/mobivolt-ai-avaliasolar.png"
            alt="MobiVolt AI Avatar"
            className="w-full h-full object-cover rounded-full"
          />
        </button>
      )}
    </div>
  );
}
