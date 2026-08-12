import { useState, useEffect, useCallback, useRef } from 'react';
import { createConsumer, type Cable } from '@rails/actioncable';
import { fetchApiSafe } from '../lib/api-client';
import { buildApiUrl } from '../lib/api-config';
import { getCurrentUTMs } from '../lib/analytics/utm';
import { track } from '../lib/analytics/lazy';
import { isRealtimeEnabled } from '../lib/cable';

export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant' | 'agent' | 'system';
  content: string;
  intent_detected?: string;
  latency_ms?: number;
  feedback?: number;
  metadata?: ChatMessageMetadata;
  created_at: string;
  status?: 'sending' | 'sent' | 'failed';
}

export interface ChatSession {
  id: number;
  visitor_id: string;
  status: string;
  vertical?: string;
  message_count: number;
  realtime_token?: string;
  access_token?: string;
}

export interface ChatMessageMetadata {
  type?: string;
  companies?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

interface ChatStreamPayload {
  chunk?: string;
  error?: boolean;
  is_final?: boolean;
  metadata?: {
    message: ChatMessage;
    response?: ChatMessage | null;
    should_trigger_lead?: boolean;
  };
}

export function useChatSession(sessionKey = 'as_chat_session') {
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [hasLeadCaptured, setHasLeadCaptured] = useState(false);
  const [agentTyping, setAgentTyping] = useState(false);
  const agentTypingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cableRef = useRef<Cable | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const failedMessageRef = useRef<string | null>(null);
  const subscriptionRef = useRef<{
    unsubscribe?: () => void;
    perform?: (action: string, payload: Record<string, unknown>) => void;
  } | null>(null);

  useEffect(() => {
    if (!session?.id || !session.realtime_token || !isRealtimeEnabled()) return;

    const apiOrigin = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const cableUrl = `${apiOrigin.replace(/^http/, 'ws').replace(/\/api\/v1\/?$/, '')}/cable`;
    const cable = createConsumer(cableUrl);
    cableRef.current = cable;
    subscriptionRef.current = cable.subscriptions.create(
      {
        channel: 'ChatSessionChannel',
        session_id: session.id,
        session_token: session.realtime_token,
      },
      {
        received(event: {
          type?: string;
          actor?: 'customer' | 'agent';
          typing?: boolean;
          message?: ChatMessage;
        }) {
          if (event.type === 'inbox.typing' && event.actor === 'agent') {
            const typing = Boolean(event.typing);
            setAgentTyping(typing);
            if (agentTypingTimerRef.current) clearTimeout(agentTypingTimerRef.current);
            if (typing) {
              agentTypingTimerRef.current = setTimeout(() => setAgentTyping(false), 4000);
            }
            return;
          }
          if (event.type === 'inbox.message.created' && event.message?.role === 'agent') {
            setAgentTyping(false);
            setMessages((current) =>
              current.some((message) => message.id === event.message!.id)
                ? current
                : [...current, event.message!]
            );
          }
        },
      }
    );

    return () => {
      if (subscriptionRef.current) cable.subscriptions.remove(subscriptionRef.current);
      cable.disconnect();
      if (agentTypingTimerRef.current) clearTimeout(agentTypingTimerRef.current);
      subscriptionRef.current = null;
      cableRef.current = null;
    };
  }, [session?.id, session?.realtime_token]);

  const fetchSessionMessages = useCallback(async (sessionId: number) => {
    try {
      const response = await fetchApiSafe<{ messages: ChatMessage[]; realtime_token?: string; access_token?: string }>(`chat/sessions/${sessionId}`, { headers: session?.access_token ? { 'X-Chat-Session-Token': session.access_token } : {} });
      if (response && response.messages) {
        setMessages(response.messages);
        if (response.access_token || response.realtime_token) {
          setSession((current) => {
            if (!current || current.id !== sessionId) return current;
            const refreshed = { ...current, realtime_token: response.realtime_token || current.realtime_token, access_token: response.access_token || current.access_token };
            sessionStorage.setItem(sessionKey, JSON.stringify(refreshed));
            return refreshed;
          });
        }
      }
    } catch (error) {
      console.error('[Chat] Failed to fetch messages:', error);
    }
  }, [sessionKey]);

  // Load session from sessionStorage on mount
  useEffect(() => {
    const savedSession = sessionStorage.getItem(sessionKey) || localStorage.getItem(sessionKey);
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setSession(parsed);
        sessionStorage.setItem(sessionKey, savedSession);
        localStorage.removeItem(sessionKey); // Migrate existing to sessionStorage
        // Load messages for this session
        fetchSessionMessages(parsed.id);
      } catch {
        sessionStorage.removeItem(sessionKey);
        localStorage.removeItem(sessionKey);
      }
    }
  }, [sessionKey, fetchSessionMessages]);

  const startSession = useCallback(async (vertical?: string, pageUrl?: string) => {
    setIsLoading(true);
    try {
      const attribution = getCurrentUTMs();
      const payload = {
        vertical,
        page_url: pageUrl || (typeof window !== 'undefined' ? window.location.href : ''),
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
        const nextSession = { ...response.session, vertical: response.session.vertical || vertical };
        setSession(nextSession);
        setMessages(response.messages || []);
        sessionStorage.setItem(sessionKey, JSON.stringify(nextSession));
        track('chat_session_started', {
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
  }, [sessionKey]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    let currentSession = session;
    setIsLoading(true);

    // If no session exists, start one first
    if (!currentSession) {
      await startSession();
      // Re-read from state after async startSession
      const saved = sessionStorage.getItem(sessionKey);
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
      created_at: new Date().toISOString(),
      status: 'sending'
    };
    setMessages(prev => [...prev, tempUserMsg]);

    track('chat_message_sent', {
      session_id: currentSession.id,
      content_length: content.length
    });

    try {
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const clientMessageId = `chat-${currentSession.id}-${Date.now()}`;
      const url = buildApiUrl(`chat/sessions/${currentSession.id}/messages`);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(currentSession.access_token ? { 'X-Chat-Session-Token': currentSession.access_token } : {}) },
        body: JSON.stringify({ content, client_message_id: clientMessageId }),
        credentials: 'include',
        signal: controller.signal
      });

      if (!response.ok || !response.body) {
        throw new Error(`[Chat] Request failed: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      
      let done = false;
      let buffer = '';
      
      // Initialize an empty official message to be updated as chunks arrive
      let officialMsg: ChatMessage | null = null;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          
          let eolIndex;
          while ((eolIndex = buffer.indexOf('\n\n')) >= 0) {
            const chunk = buffer.slice(0, eolIndex).trim();
            buffer = buffer.slice(eolIndex + 2);
            
            const lines = chunk.split('\n');
            for (const line of lines) {
              const trimmedLine = line.trim();
              if (trimmedLine.startsWith('data: ')) {
                const dataStr = trimmedLine.replace('data: ', '').trim();
                if (dataStr === '[DONE]') continue;
                
                try {
                  const data = JSON.parse(dataStr) as ChatStreamPayload;
                  
                  if (data.error) {
                    throw new Error(data.chunk);
                  }
                  
                  if (data.is_final && data.metadata) {
                    // Final metadata event
                    const finalMetadata = data.metadata;
                    setMessages(prev => {
                      const filtered = prev.filter(m => m.id !== tempUserMsg.id && m.id !== (officialMsg?.id || -1));
                      const finalMessages: ChatMessage[] = [finalMetadata.message];
                      if (finalMetadata.response) finalMessages.push(finalMetadata.response);
                      return finalMessages.reduce<ChatMessage[]>((next, message) => {
                        if (next.some((current) => current.id === message.id)) return next;
                        return [...next, message];
                      }, filtered);
                    });

                    if (finalMetadata.should_trigger_lead && !hasLeadCaptured) {
                      setShowLeadForm(true);
                      track('chat_lead_form_triggered', { session_id: currentSession!.id });
                    }
                  } else if (data.chunk) {
                    // Incremental chunk
                    const chunkText = data.chunk;
                    setMessages(prev => {
                      const filtered = prev.filter(m => m.id !== tempUserMsg.id);
                      
                      if (!officialMsg) {
                        const newMessage: ChatMessage = {
                          id: Date.now() + 1,
                          role: 'assistant',
                          content: chunkText,
                          created_at: new Date().toISOString()
                        };
                        officialMsg = newMessage;
                        return [...filtered, tempUserMsg, newMessage];
                      } else {
                        officialMsg.content += chunkText;
                        // Find and update the existing message in the list
                        const msgIndex = filtered.findIndex(m => m.id === officialMsg!.id);
                        if (msgIndex >= 0) {
                          filtered[msgIndex] = { ...officialMsg };
                          return [...filtered];
                        } else {
                          return [...filtered, tempUserMsg, officialMsg];
                        }
                      }
                    });
                  }
                } catch {
                  // Ignore malformed JSON chunk
                }
              }
            }
          }
        }
      }
    } catch (error) {
      if ((error as DOMException)?.name === 'AbortError') return;
      console.error('[Chat] Failed to send message:', error);
      failedMessageRef.current = content;
      setMessages(prev => prev.map(m => m.id === tempUserMsg.id ? { ...m, status: 'failed' } : m));
      track('chat_message_failed', { session_id: currentSession.id });
    } finally {
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, [session, startSession, hasLeadCaptured, sessionKey]);

  const stopGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsLoading(false);
  }, []);

  const retryLastMessage = useCallback(() => {
    const content = failedMessageRef.current;
    if (!content) return;
    failedMessageRef.current = null;
    void sendMessage(content);
  }, [sendMessage]);

  const sendFeedback = useCallback(async (messageId: number, score: number) => {
    try {
      await fetchApiSafe(`chat/messages/${messageId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(session?.access_token ? { 'X-Chat-Session-Token': session.access_token } : {}) },
        body: JSON.stringify({ feedback: score })
      });
      // Update local state to reflect feedback
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, feedback: score } : m));
      track('chat_message_feedback', { message_id: messageId, score });
    } catch (error) {
      console.error('[Chat] Failed to send feedback:', error);
    }
  }, []);

  const submitLead = useCallback(async (leadData: {
    name: string;
    email?: string;
    phone: string;
    city?: string;
    state?: string;
    consent_given: boolean;
    metadata?: Record<string, unknown>;
  }) => {
    if (!session) return false;

    setIsLoading(true);
    try {
      const attribution = getCurrentUTMs();
      const payload = {
        chat_session_id: session.id,
        ...leadData,
        source_page: typeof window !== 'undefined' ? window.location.href : '',
        utm_source: attribution.utm_source || '',
        utm_medium: attribution.utm_medium || '',
        utm_campaign: attribution.utm_campaign || '',
      };

      const response = await fetchApiSafe<{ success?: boolean; lead_id?: number; id?: number }>('chat/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(session.access_token ? { 'X-Chat-Session-Token': session.access_token } : {}) },
        body: JSON.stringify(payload)
      });

      const leadId = response?.lead_id || response?.id;
      if (response && (response.success || leadId)) {
        setHasLeadCaptured(true);
        setShowLeadForm(false);
        track('chat_lead_submitted', {
          session_id: session.id,
          lead_id: leadId
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
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    failedMessageRef.current = null;
    sessionStorage.removeItem(sessionKey);
    localStorage.removeItem(sessionKey);
    setSession(null);
    setMessages([]);
    setShowLeadForm(false);
    setHasLeadCaptured(false);
    setAgentTyping(false);
  }, [sessionKey]);

  const setTyping = useCallback((typing: boolean) => {
    subscriptionRef.current?.perform?.('typing', { typing });
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
    agentTyping,
    setHasLeadCaptured,
    startSession,
    sendMessage,
    stopGeneration,
    retryLastMessage,
    sendFeedback,
    submitLead,
    setTyping,
    clearSession
  };
}
