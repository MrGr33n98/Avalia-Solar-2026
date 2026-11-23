'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { Bot, Loader2, MessageCircle, Send, UserRound } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { track } from '@/lib/analytics/lazy';
import {
  CommunicationSurfaceManager,
  useCommunicationSurface,
} from '@/lib/communication-surface-manager';
import { openQuoteWizard } from '@/lib/quote-wizard';

type Capability = { enabled: boolean; mode?: 'company' | 'general'; company_id?: number };
type ChatMessage = { id: number; role: 'user' | 'assistant'; content: string; created_at?: string };
type SessionResponse = { session_id: number; access_token: string; initial_message: ChatMessage };
type MessageResponse = {
  session_id: number;
  idempotent: boolean;
  awaiting_agent: boolean;
  user_message: ChatMessage;
  assistant_message?: ChatMessage;
  action?: { type: string; company_id?: number };
};

const surfaceId = 'company-brand-page-ai';

function requestToken(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
    return crypto.randomUUID();
  return `company-ai-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function CompanyAiWidget({
  companyId,
  companyName,
}: {
  companyId: number;
  companyName: string;
}) {
  const [capability, setCapability] = useState<Capability | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [content, setContent] = useState('');
  const [awaitingAgent, setAwaitingAgent] = useState(false);
  const { activeSurface } = useCommunicationSurface('company_ai');
  const inputRef = useRef<HTMLInputElement>(null);
  const widgetRef = useRef<HTMLElement>(null);
  const widgetViewed = useRef(false);
  const firstQuestionSent = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void fetchApi<Capability>(`/companies/${companyId}/ai_capability`, { silent: true, retries: 0 })
      .then((value) => {
        if (cancelled) return;
        setCapability(value);
      })
      .catch(() => {
        if (!cancelled) setCapability({ enabled: false });
      });
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  useEffect(() => {
    if (!capability?.enabled || capability.mode !== 'company' || widgetViewed.current) return;
    const element = widgetRef.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;

    let viewedTimer: ReturnType<typeof setTimeout> | null = null;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || entry.intersectionRatio < 0.5) {
          if (viewedTimer) clearTimeout(viewedTimer);
          viewedTimer = null;
          return;
        }
        if (widgetViewed.current || viewedTimer) return;
        viewedTimer = setTimeout(() => {
          viewedTimer = null;
          if (widgetViewed.current) return;
          widgetViewed.current = true;
          track('company_ai_widget_viewed', { company_id: companyId, surface_id: surfaceId });
          observer.disconnect();
        }, 1000);
      },
      { threshold: [0.5] }
    );
    observer.observe(element);
    return () => {
      if (viewedTimer) clearTimeout(viewedTimer);
      observer.disconnect();
    };
  }, [capability, companyId]);

  useEffect(() => {
    if (capability?.enabled && capability.mode === 'company' && activeSurface === 'none') {
      CommunicationSurfaceManager.open('company_ai');
    }
  }, [activeSurface, capability]);

  if (!capability?.enabled || capability.mode !== 'company') return null;

  const startSession = async () => {
    if (loading || session) return;
    setLoading(true);
    try {
      const value = await fetchApi<SessionResponse>(`/companies/${companyId}/ai_sessions`, {
        method: 'POST',
      });
      setSession(value);
      setMessages([value.initial_message]);
      track('company_ai_widget_opened', { company_id: companyId, surface_id: surfaceId });
      window.setTimeout(() => inputRef.current?.focus(), 0);
    } finally {
      setLoading(false);
    }
  };

  const toggle = () => {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen) void startSession();
  };

  const send = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = content.trim();
    if (!session || !trimmed || sending || awaitingAgent) return;
    const clientMessageId = requestToken();
    const requestId = requestToken();
    setSending(true);
    try {
      const value = await fetchApi<MessageResponse>(
        `/companies/${companyId}/ai_sessions/${session.session_id}/messages`,
        {
          method: 'POST',
          headers: { 'X-Chat-Session-Token': session.access_token },
          body: JSON.stringify({
            content: trimmed,
            client_message_id: clientMessageId,
            request_id: requestId,
          }),
        }
      );
      setContent('');
      setMessages((previous) => {
        const next = value.assistant_message
          ? [value.user_message, value.assistant_message]
          : [value.user_message];
        return value.idempotent ? previous : [...previous, ...next];
      });
      setAwaitingAgent(value.awaiting_agent);
      if (!firstQuestionSent.current && !value.idempotent) {
        firstQuestionSent.current = true;
        track('company_ai_first_question_sent', {
          company_id: companyId,
          session_correlation_id: String(session.session_id),
        });
      }
      track('company_ai_answer_rendered', {
        company_id: companyId,
        session_correlation_id: String(session.session_id),
        request_id: requestId,
      });
      if (value.action?.type === 'open_quote_wizard') {
        openQuoteWizard({ preferredCompanyId: companyId, source: 'company-ai-assistant' });
        track('company_ai_quote_started', {
          company_id: companyId,
          session_correlation_id: String(session.session_id),
        });
      }
      if (value.action?.type === 'handoff') {
        track('company_ai_handoff_requested', {
          company_id: companyId,
          session_correlation_id: String(session.session_id),
        });
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <section
      ref={widgetRef}
      aria-label={`Assistente virtual de ${companyName}`}
      className="my-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3 shadow-sm md:my-5 md:p-4"
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-600 text-white">
            <Bot className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-semibold text-slate-900">
              Assistente de {companyName}
            </span>
            <span className="block text-xs text-slate-600">
              Respostas baseadas nas informações públicas da empresa
            </span>
          </span>
        </span>
        <MessageCircle className="h-5 w-5 text-emerald-700" aria-hidden="true" />
      </button>

      {open && (
        <div className="mt-3 rounded-xl border border-emerald-100 bg-white p-3">
          {loading && (
            <div role="status" className="flex items-center gap-2 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Iniciando atendimento...
            </div>
          )}
          {!loading && (
            <>
              <div className="max-h-64 space-y-2 overflow-y-auto" aria-live="polite">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-2 text-sm ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <Bot className="mt-1 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
                    )}
                    <p
                      className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 ${message.role === 'user' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-800'}`}
                    >
                      {message.content}
                    </p>
                    {message.role === 'user' && (
                      <UserRound
                        className="mt-1 h-4 w-4 shrink-0 text-slate-500"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                ))}
              </div>
              {awaitingAgent ? (
                <p className="mt-3 text-xs text-slate-600">
                  A equipe foi acionada. Você receberá uma resposta por este atendimento.
                </p>
              ) : (
                <form onSubmit={send} className="mt-3 flex gap-2">
                  <input
                    ref={inputRef}
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    maxLength={2000}
                    placeholder="Digite sua pergunta"
                    aria-label="Pergunta para o assistente"
                    className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600"
                  />
                  <button
                    type="submit"
                    disabled={sending || !content.trim()}
                    aria-label="Enviar pergunta"
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-emerald-600 text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
