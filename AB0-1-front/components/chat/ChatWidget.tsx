'use client';

import { useState, useEffect, useRef } from 'react';
import { useChatSession } from '@/hooks/useChatSession';
import { usePathname } from 'next/navigation';
import { posthog } from '@/lib/posthog';

// Feature flags para controle do comportamento dos cards e CTAs
const MOBIVOLT_COMPANY_CARDS_ENABLED = true;

import ChatCompanyRecommendations from './ChatCompanyRecommendations';
import ChatComparisonModal from './ChatComparisonModal';
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
    submitLead,
    clearSession
  } = useChatSession();

  const [input, setInput] = useState('');
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Inactivity timeout (30 minutes)
  const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

  const resetInactivityTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    
    if (messages.length > 0) {
      idleTimerRef.current = setTimeout(() => {
        console.log('[Chat] Closing session due to inactivity');
        clearSession();
        setIsOpen(false);
      }, INACTIVITY_TIMEOUT);
    }
  }, [messages.length, clearSession, setIsOpen]);

  // Reset timer on messages change or when the widget is open/active
  useEffect(() => {
    if (isOpen) {
      resetInactivityTimer();
    }
    
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [isOpen, messages.length, resetInactivityTimer]);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    city: '',
    state: '',
    monthly_bill: '',
    property_type: 'Casa',
    consent_given: false
  });

  // Estados locais para telemetria de cliques comerciais e comparação
  const [clickedCompanyId, setClickedCompanyId] = useState<number | null>(null);
  const [selectedCompanyForQuote, setSelectedCompanyForQuote] = useState<number | null>(null);
  const [comparedCompanyIds, setComparedCompanyIds] = useState<number[]>([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);

  const pathname = usePathname();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const allCompanies = messages
    .filter(msg => msg.metadata?.type === 'company_recommendations')
    .flatMap(msg => msg.metadata.companies || []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, showLeadForm]);

  // Start session on first open
  const handleToggle = () => {
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
    'Quero energia solar',
    'Quero orçamento',
    'Tenho uma proposta',
    'Mobilidade elétrica'
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
            {messages.length === 0 && !isLoading && !hasAcceptedTerms && (
              <div className="flex flex-col items-center justify-center h-full space-y-5 py-10 px-6 text-center animate-in fade-in zoom-in-95 duration-300">
                <div className="w-16 h-16 bg-brand-blue/10 rounded-full flex items-center justify-center mb-1 border-2 border-brand-blue/20">
                   <svg className="w-8 h-8 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                   </svg>
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-zinc-900 dark:text-white text-base">Termos e Privacidade</h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    Para iniciar sua consultoria com o MobiVolt AI, ao clicar em <span className="font-bold text-zinc-900 dark:text-zinc-100">"Aceitar"</span>, você confirma que leu e concorda com nossos termos e condições de uso de dados.
                  </p>
                </div>
                
                <div className="flex flex-col w-full space-y-2 pt-2">
                  <button
                    onClick={() => setHasAcceptedTerms(true)}
                    className="w-full bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-3 rounded-xl shadow-lg shadow-brand-blue/20 transition-all active:scale-95"
                  >
                    Aceitar
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-full bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-medium py-2 rounded-xl text-xs transition-all"
                  >
                    Recusar
                  </button>
                </div>
                
                <a href="/termos" target="_blank" className="text-[10px] text-brand-blue hover:underline">
                  Ver documento completo
                </a>
              </div>
            )}

            {messages.length === 0 && !isLoading && hasAcceptedTerms && (
              <div className="flex flex-col items-center justify-center h-full space-y-4 py-10 px-6 text-center animate-in fade-in zoom-in-95 duration-300">
                <div className="w-16 h-16 bg-brand-blue/10 rounded-full flex items-center justify-center mb-2 border-2 border-brand-blue/20">
                   <img
                    src="/images/mobivolt-ai-avaliasolar.png"
                    alt="MobiVolt AI"
                    className="w-12 h-12 object-cover rounded-full"
                  />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-zinc-900 dark:text-white text-base">Oi, como posso te ajudar?</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Escolha uma área para iniciarmos sua consultoria gratuita:
                  </p>
                </div>
                
                <div className="grid grid-cols-1 gap-3 w-full mt-2">
                  <button
                    onClick={() => startSession('solar', window.location.href)}
                    className="w-full bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-750 text-zinc-800 dark:text-zinc-100 font-bold py-3.5 px-4 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">☀️</span>
                      <div className="text-left">
                        <span className="block text-sm">Energia Solar</span>
                        <span className="block text-[10px] font-medium text-zinc-500">Economia e Sustentabilidade</span>
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-brand-blue opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  <button
                    onClick={() => startSession('electric_mobility', window.location.href)}
                    className="w-full bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-750 text-zinc-800 dark:text-zinc-100 font-bold py-3.5 px-4 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">🚗</span>
                      <div className="text-left">
                        <span className="block text-sm">Mobilidade Elétrica</span>
                        <span className="block text-[10px] font-medium text-zinc-500">Carregadores e Frotas</span>
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-brand-blue opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 pt-2">
                  Consultoria especializada 100% gratuita.
                </p>
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
            {messages.length === 1 && !isLoading && (
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
                <form onSubmit={handleFormSubmit} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 font-medium ml-1">Nome completo</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: João da Silva"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2 space-y-1">
                      <label className="text-[10px] text-zinc-500 font-medium ml-1">Cidade</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: São Paulo"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-500 font-medium ml-1">UF</label>
                      <input
                        type="text"
                        required
                        maxLength={2}
                        placeholder="Ex: SP"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                        className="w-full text-xs px-3 py-2 text-center rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 font-medium ml-1">WhatsApp</label>
                    <input
                      type="tel"
                      required
                      placeholder="(11) 99999-9999"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 font-medium ml-1">Conta de luz (média mensal)</label>
                    <input
                      type="text"
                      required
                      placeholder="R$ 450,00"
                      value={formData.monthly_bill}
                      onChange={(e) => setFormData({ ...formData, monthly_bill: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 font-medium ml-1">Tipo de imóvel</label>
                    <select
                      value={formData.property_type}
                      onChange={(e) => setFormData({ ...formData, property_type: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    >
                      <option value="Casa">Casa</option>
                      <option value="Empresa">Empresa</option>
                      <option value="Rural">Rural</option>
                      <option value="Condominio">Condomínio</option>
                    </select>
                  </div>

                  <label className="flex items-start space-x-2 pt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={formData.consent_given}
                      onChange={(e) => setFormData({ ...formData, consent_given: e.target.checked })}
                      className="mt-0.5 rounded text-brand-blue focus:ring-brand-blue border-zinc-300 dark:border-zinc-700"
                    />
                    <span className="text-[10px] leading-tight text-zinc-500 dark:text-zinc-400">
                      Aceito compartilhar meus dados para receber contato e orçamentos das empresas parceiras do Avalia Solar, conforme a LGPD. <a href="#" className="text-brand-blue hover:underline">Saiba mais</a>
                    </span>
                  </label>

                  <div className="pt-2 space-y-2">
                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-brand-yellow to-amber-500 hover:from-amber-500 hover:to-amber-600 text-zinc-900 font-bold py-2 rounded-lg text-sm shadow-md transition-colors"
                    >
                      Continuar &rarr;
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowLeadForm(false)}
                      className="w-full border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-medium py-2 rounded-lg text-sm transition-colors"
                    >
                      Pular por enquanto
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Success State (Conversion) */}
            {hasLeadCaptured && (
              <div className="bg-white dark:bg-zinc-900 border border-emerald-500/30 rounded-2xl p-5 shadow-lg space-y-4 animate-in fade-in zoom-in-95 mt-4">
                <div className="flex flex-col items-center justify-center text-center space-y-2">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-500 mb-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="font-bold text-base text-zinc-800 dark:text-zinc-100">Seu interesse foi enviado com sucesso!</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-[250px]">
                    As melhores empresas vão entrar em contato com você em breve.
                  </p>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-950 rounded-xl p-3 space-y-2 text-xs border border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-start space-x-2">
                    <span className="text-zinc-400 mt-0.5">📍</span>
                    <div>
                      <span className="block text-zinc-500 dark:text-zinc-400 text-[10px]">Cidade</span>
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">{formData.city} - {formData.state}</span>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-zinc-400 mt-0.5">☀️</span>
                    <div>
                      <span className="block text-zinc-500 dark:text-zinc-400 text-[10px]">Interesse</span>
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">Analisar proposta solar</span>
                    </div>
                  </div>
                  {comparedCompanyIds.length > 0 && (
                    <div className="flex items-start space-x-2">
                      <span className="text-zinc-400 mt-0.5">🏢</span>
                      <div>
                        <span className="block text-zinc-500 dark:text-zinc-400 text-[10px]">Empresas selecionadas</span>
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">{comparedCompanyIds.length} empresa(s) selecionada(s)</span>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start space-x-2">
                    <span className="text-zinc-400 mt-0.5">⏱️</span>
                    <div>
                      <span className="block text-zinc-500 dark:text-zinc-400 text-[10px]">Próxima ação</span>
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">Empresas entrarão em contato pelo WhatsApp</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <a
                    href="https://wa.me/5511999999999?text=Olá,%20acabei%20de%20enviar%20meus%20dados%20pelo%20MobiVolt%20AI%20e%20gostaria%20de%20falar%20com%20um%20especialista!"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-lg text-sm shadow-md transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                    </svg>
                    <span>Falar no WhatsApp</span>
                  </a>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setHasLeadCaptured(false);
                      sendMessage("Gostaria de receber mais opções de empresas.");
                    }}
                    className="w-full border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-bold py-2 rounded-lg text-xs transition-colors"
                  >
                    Receber mais opções
                  </button>
                  
                  <button
                    type="button"
                    className="w-full text-brand-blue hover:underline font-medium py-1.5 text-xs transition-colors"
                  >
                    Salvar comparação
                  </button>
                </div>
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

          {/* Floating Compare Button when 2+ companies selected */}
          {comparedCompanyIds.length >= 2 && !showLeadForm && !hasLeadCaptured && (
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-40 animate-in slide-in-from-bottom-2 fade-in">
              <button
                onClick={() => setShowComparisonModal(true)}
                className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold px-4 py-2.5 rounded-full shadow-xl text-xs flex items-center space-x-2 hover:scale-105 transition-transform"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
                <span>Ver Comparação ({comparedCompanyIds.length})</span>
              </button>
            </div>
          )}

          <ChatComparisonModal
            isOpen={showComparisonModal}
            onClose={() => setShowComparisonModal(false)}
            companies={allCompanies}
            comparedCompanyIds={comparedCompanyIds}
            onRequestQuote={handleRequestQuote}
          />
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
