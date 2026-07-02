'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useChatSession } from '@/hooks/useChatSession';
import { track } from '@/lib/analytics/lazy';
import { startDashboardTour } from '@/lib/tour';
import MarkdownRenderer from './MarkdownRenderer';

const CHAT_SUCCESS_INVITE_DISMISSED_KEY = 'mobivolt_success_invite_dismissed';
const CHAT_SUCCESS_INVITE_DELAY_MS = 2000;

interface SuccessAction {
  label: string;
  kind: 'tour' | 'message';
  message?: string;
}

export default function MobiVoltSuccessWidget() {
  const {
    isOpen,
    setIsOpen,
    session,
    messages,
    isLoading,
    startSession,
    sendMessage,
    sendFeedback,
    clearSession
  } = useChatSession('as_success_chat_session');

  const [input, setInput] = useState('');
  const [showInviteBubble, setShowInviteBubble] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Exibe balão de convite inicial após um delay
  useEffect(() => {
    if (isOpen || typeof window === 'undefined') return;
    if (window.sessionStorage.getItem(CHAT_SUCCESS_INVITE_DISMISSED_KEY) === 'true') return;

    const timer = window.setTimeout(() => {
      setShowInviteBubble(true);
    }, CHAT_SUCCESS_INVITE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [isOpen]);

  const dismissInviteBubble = useCallback(() => {
    setShowInviteBubble(false);
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(CHAT_SUCCESS_INVITE_DISMISSED_KEY, 'true');
    }
  }, []);

  // Inicializa a sessão com vertical 'success' na primeira abertura
  const handleToggle = async () => {
    if (!isOpen) {
      setShowInviteBubble(false);
      if (!session) {
        await startSession('success', window.location.href);
      }
    }
    setIsOpen(!isOpen);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput('');
  };

  // Trata ações interativas de onboarding
  const handleActionClick = async (action: SuccessAction) => {
    dismissInviteBubble();
    
    if (action.kind === 'tour') {
      setIsOpen(false); // Minimiza o chat para não cobrir a tela durante o tour
      track('mobivolt_success_tour_started', {});
      
      // Delay pequeno para o fechamento do chat completar a animação
      setTimeout(() => {
        startDashboardTour();
      }, 300);
    } else if (action.kind === 'message' && action.message) {
      setIsOpen(true);
      if (!session) {
        await startSession('success', window.location.href);
      }
      sendMessage(action.message);
    }
  };

  const successActions: SuccessAction[] = [
    {
      label: '🚀 Iniciar Tour do Painel',
      kind: 'tour'
    },
    {
      label: '⚙️ Configurar Meu Perfil',
      kind: 'message',
      message: 'Quero entender como configurar as informações gerais da minha empresa.'
    },
    {
      label: '🗺️ Definir Cidades de Cobertura',
      kind: 'message',
      message: 'Como faço para configurar os estados e cidades que minha empresa atende?'
    },
    {
      label: '⭐ Gerenciar Minhas Avaliações',
      kind: 'message',
      message: 'Como respondo e gerencio as avaliações dos meus clientes?'
    },
    {
      label: '📊 Entender Minhas Métricas',
      kind: 'message',
      message: 'Como faço para acompanhar minhas visualizações e taxa de conversão?'
    }
  ];

  return (
    <div className="fixed bottom-5 right-5 z-[1000] font-sans flex flex-col items-end pointer-events-none">
      
      {/* Chat Window */}
      {isOpen && (
        <div className="pointer-events-auto w-full max-w-[360px] sm:max-w-none sm:w-[420px] h-[480px] sm:h-[650px] max-h-[80vh] sm:max-h-[700px] bg-white dark:bg-zinc-900 rounded-lg shadow-2xl border border-zinc-200/80 dark:border-zinc-800 flex flex-col overflow-hidden transition-all duration-300 animate-in slide-in-from-bottom-5 ml-auto">
          
          {/* Header com Gradiente Premium Indigo/Cyan */}
          <div className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 text-white p-4 flex items-center justify-between shadow-md">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-white border border-white/20">
                  <img
                    src="/images/mobivolt-ai-avaliasolar.webp"
                    alt="MobiVolt Success Avatar"
                    className="w-full h-full object-cover filter saturate-150 hue-rotate-15"
                  />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-indigo-400 border-2 border-white dark:border-zinc-900 rounded-full animate-ping"></span>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-cyan-400 border-2 border-white dark:border-zinc-900 rounded-full"></span>
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-wide">MobiVolt Success</h3>
                <span className="text-xs text-white/80">Online • Onboarding & Sucesso</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-1">
              {messages.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm('Deseja iniciar um novo atendimento e limpar o histórico atual?')) {
                      clearSession();
                      startSession('success', window.location.href);
                    }
                  }}
                  className="text-white/80 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-full"
                  aria-label="Reiniciar atendimento"
                  title="Nova conversa"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-full"
                aria-label="Minimizar chat"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18 12H6" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50 dark:bg-zinc-950">
            {messages.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center min-h-full space-y-5 py-6 px-4 text-center animate-in fade-in zoom-in-95 duration-300">
                <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center border-2 border-indigo-500/20 shadow-inner">
                  <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-zinc-900 dark:text-white text-base">Central de Sucesso MobiVolt</h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-[280px]">
                    Olá! Sou o seu assistente de sucesso. Posso te ajudar no cadastro, no setup do perfil e a usar todo o potencial do seu painel!
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 pt-3">Ações de Onboarding Recomendadas</p>
                </div>

                <div className="flex flex-col w-full space-y-2.5 mt-2">
                  {successActions.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => handleActionClick(action)}
                      className="w-full bg-white dark:bg-zinc-800 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 text-zinc-700 dark:text-zinc-200 font-bold py-3 px-4 rounded-xl shadow-sm border border-zinc-200/60 dark:border-zinc-800 transition-all hover:scale-[1.01] hover:border-indigo-400/40 active:scale-95 flex items-center justify-between text-left text-xs group"
                    >
                      <span>{action.label}</span>
                      <svg className="w-4 h-4 text-indigo-500 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-start space-x-2`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-indigo-200 dark:border-zinc-700/80 mt-1 bg-white">
                    <img
                      src="/images/mobivolt-ai-avaliasolar.webp"
                      alt="MobiVolt Success"
                      className="w-full h-full object-cover filter saturate-150 hue-rotate-15"
                    />
                  </div>
                )}
                <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} space-y-1 w-full max-w-[85%]`}>
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm w-full ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-none'
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
                  </div>

                  {msg.role === 'assistant' && msg.id && (
                    <div className="flex items-center space-x-2 px-1 text-xs text-zinc-400 dark:text-zinc-500">
                      <span>Esta resposta ajudou?</span>
                      <button
                        onClick={() => sendFeedback(msg.id, 1)}
                        className={`hover:text-indigo-500 transition-colors ${msg.feedback === 1 ? 'text-indigo-500 font-bold' : ''}`}
                        aria-label="Ajudou"
                      >
                        👍
                      </button>
                      <button
                        onClick={() => sendFeedback(msg.id, -1)}
                        className={`hover:text-red-500 transition-colors ${msg.feedback === -1 ? 'text-red-500 font-bold' : ''}`}
                        aria-label="Não ajudou"
                      >
                        👎
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex justify-start items-start space-x-2">
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-indigo-200 dark:border-zinc-700/80 mt-1 bg-white">
                  <img
                    src="/images/mobivolt-ai-avaliasolar.webp"
                    alt="MobiVolt Success"
                    className="w-full h-full object-cover filter saturate-150 hue-rotate-15"
                  />
                </div>
                <div className="flex items-center space-x-2 bg-white dark:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-700 rounded-2xl rounded-tl-none px-4 py-3 max-w-[80px] shadow-sm">
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
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
              disabled={isLoading}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte ao MobiVolt Success..."
              className="flex-1 px-4 py-2 text-sm bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl p-2 transition-colors disabled:opacity-50 shadow-md shadow-indigo-600/10"
              aria-label="Enviar mensagem"
            >
              <svg className="w-5 h-5 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* Invite Bubble de Onboarding */}
      {!isOpen && showInviteBubble && (
        <div className="pointer-events-auto mb-3 w-full max-w-[340px] rounded-lg border border-indigo-100 dark:border-zinc-850 bg-white dark:bg-zinc-900 p-5 shadow-2xl shadow-indigo-950/10 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-slate-950 dark:text-white">🚀 Bem-vindo ao seu Painel!</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-zinc-400">
                Gostaria de um tour rápido para entender onde configurar seu perfil, ver leads e gerenciar avaliações?
              </p>
            </div>
            <button
              type="button"
              onClick={dismissInviteBubble}
              className="rounded-full p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors hover:bg-slate-100 dark:hover:bg-zinc-800"
              aria-label="Fechar convite"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => handleActionClick({ label: 'Iniciar Tour', kind: 'tour' })}
              className="flex-1 rounded-full bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-center text-xs font-bold text-white transition-all active:scale-95 shadow-md shadow-indigo-500/10"
            >
              Sim, iniciar tour!
            </button>
            <button
              type="button"
              onClick={() => handleActionClick({ label: 'Perguntar AI', kind: 'message', message: 'Como posso configurar as informações da minha empresa?' })}
              className="rounded-full border border-indigo-100 dark:border-zinc-800 bg-indigo-50/30 dark:bg-zinc-850 px-4 py-2 text-center text-xs font-bold text-indigo-600 dark:text-indigo-400 transition-all hover:bg-indigo-100/50 active:scale-95"
            >
              Perguntar AI 🤖
            </button>
          </div>
        </div>
      )}

      {/* Floating Launcher Button do MobiVolt Success */}
      {!isOpen && (
        <button
          onClick={handleToggle}
          className="pointer-events-auto h-[60px] w-[60px] rounded-lg shadow-2xl shadow-indigo-950/20 flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95 group relative border-2 border-indigo-500 bg-white dark:bg-zinc-900 overflow-hidden ring-4 ring-indigo-500/10"
          aria-label="Abrir MobiVolt Success"
        >
          {/* Notification Badge */}
          <span className="absolute -top-0.5 -right-0.5 z-10 rounded-full bg-indigo-600 px-2 py-0.5 text-[9px] font-black text-white border-2 border-white dark:border-zinc-900">
            SUCCESS
          </span>

          <img
            src="/images/mobivolt-ai-avaliasolar.webp"
            alt="MobiVolt Success Avatar"
            className="w-full h-full object-cover rounded-full filter saturate-150 hue-rotate-15"
          />
        </button>
      )}
    </div>
  );
}
