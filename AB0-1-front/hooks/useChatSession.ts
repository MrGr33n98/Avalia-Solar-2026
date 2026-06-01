import { useState, useEffect, useCallback } from 'react';
import { fetchApiSafe } from '../lib/api-client';
import { getAttribution } from '../lib/analytics/utm';
import { posthog } from '../lib/posthog';

export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  intent_detected?: string;
  latency_ms?: number;
  feedback?: number;
  created_at: string;
}

export interface ChatSession {
  id: number;
  visitor_id: string;
  status: string;
  vertical?: string;
  message_count: number;
}

export function useChatSession() {
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [hasLeadCaptured, setHasLeadCaptured] = useState(false);

  // Load session from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('as_chat_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setSession(parsed);
        // Load messages for this session
        fetchSessionMessages(parsed.id);
      } catch (e) {
        localStorage.removeItem('as_chat_session');
      }
    }
  }, []);

  const fetchSessionMessages = async (sessionId: number) => {
    try {
      const response = await fetchApiSafe<{ messages: ChatMessage[] }>(`chat/sessions/${sessionId}`);
      if (response && response.messages) {
        setMessages(response.messages);
      }
    } catch (error) {
      console.error('[Chat] Failed to fetch messages:', error);
    }
  };

  const startSession = useCallback(async (vertical?: string, pageUrl?: string) => {
    setIsLoading(true);
    try {
      const attribution = getAttribution() || {};
      const payload = {
        vertical,
        page_url: pageUrl || typeof window !== 'undefined' ? window.location.href : '',
        referrer: typeof document !== 'undefined' ? document.referrer : '',
        utm_source: attribution.utm_source || '',
        utm_medium: attribution.utm_medium || '',
        utm_campaign: attribution.utm_campaign || '',
        metadata: {
          screen_width: typeof window !== 'undefined' ? window.innerWidth : null,
          screen_height: typeof window !== 'undefined' ? window.innerHeight : null,
        }
      };

      const response = await fetchApiSafe<{ session: ChatSession; messages: ChatMessage[] }>('chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response && response.session) {
        setSession(response.session);
        setMessages(response.messages || []);
        localStorage.setItem('as_chat_session', JSON.stringify(response.session));
        posthog.capture('chat_session_started', {
          session_id: response.session.id,
          vertical,
          page_url: payload.page_url
        });
      }
    } catch (error) {
      console.error('[Chat] Failed to start session:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    let currentSession = session;
    setIsLoading(true);

    // If no session exists, start one first
    if (!currentSession) {
      await startSession();
      // Re-read from state after async startSession
      const saved = localStorage.getItem('as_chat_session');
      if (saved) {
        currentSession = JSON.parse(saved);
      } else {
        setIsLoading(false);
        return;
      }
    }

    if (!currentSession) {
      setIsLoading(false);
      return;
    }

    // Pessimistically/optimistically add user message to list
    const tempUserMsg: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    posthog.capture('chat_message_sent', {
      session_id: currentSession.id,
      content_length: content.length
    });

    try {
      const res = await fetchApiSafe<{ message: ChatMessage; response: ChatMessage; should_trigger_lead?: boolean }>(
        `chat/sessions/${currentSession.id}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content })
        }
      );

      if (res && res.response) {
        // Replace list with updated messages to ensure IDs are correct
        setMessages(prev => {
          // Remove temp message and append official message + official response
          const filtered = prev.filter(m => m.id !== tempUserMsg.id);
          return [...filtered, res.message, res.response];
        });

        // Trigger lead form if LLM detected purchase intent or requested details
        if (res.should_trigger_lead && !hasLeadCaptured) {
          setShowLeadForm(true);
          posthog.capture('chat_lead_form_triggered', { session_id: currentSession.id });
        }
      }
    } catch (error) {
      console.error('[Chat] Failed to send message:', error);
      // Append fallback AI error response
      const errorMsg: ChatMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Desculpe, estou com alguma instabilidade para processar sua mensagem agora. Por favor, tente novamente em instantes ou fale conosco diretamente pelo WhatsApp!',
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
      posthog.capture('chat_message_failed', { session_id: currentSession.id });
    } finally {
      setIsLoading(false);
    }
  }, [session, startSession, hasLeadCaptured]);

  const sendFeedback = useCallback(async (messageId: number, score: number) => {
    try {
      await fetchApiSafe(`chat/messages/${messageId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score })
      });
      // Update local state to reflect feedback
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, feedback: score } : m));
      posthog.capture('chat_message_feedback', { message_id: messageId, score });
    } catch (error) {
      console.error('[Chat] Failed to send feedback:', error);
    }
  }, []);

  const submitLead = useCallback(async (leadData: {
    name: string;
    email: string;
    phone: string;
    city?: string;
    state?: string;
    consent_given: boolean;
  }) => {
    if (!session) return false;

    setIsLoading(true);
    try {
      const attribution = getAttribution() || {};
      const payload = {
        chat_session_id: session.id,
        ...leadData,
        source_page: typeof window !== 'undefined' ? window.location.href : '',
        utm_source: attribution.utm_source || '',
        utm_medium: attribution.utm_medium || '',
        utm_campaign: attribution.utm_campaign || '',
      };

      const response = await fetchApiSafe<{ success: boolean; lead_id: number }>('chat/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response && response.success) {
        setHasLeadCaptured(true);
        setShowLeadForm(false);
        posthog.capture('chat_lead_submitted', {
          session_id: session.id,
          lead_id: response.lead_id
        });
        
        // Add a friendly thank you system message from AI
        const systemThanks: ChatMessage = {
          id: Date.now(),
          role: 'assistant',
          content: `Obrigado pelos seus dados, ${leadData.name.split(' ')[0]}! Um de nossos consultores especializados vai analisar suas informações e entrar em contato em breve para te ajudar com seu projeto. Enquanto isso, fique à vontade para continuar tirando suas dúvidas comigo!`,
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, systemThanks]);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[Chat] Failed to submit lead:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  const clearSession = useCallback(() => {
    localStorage.removeItem('as_chat_session');
    setSession(null);
    setMessages([]);
    setShowLeadForm(false);
    setHasLeadCaptured(false);
  }, []);

  return {
    isOpen,
    setIsOpen,
    session,
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
  };
}
