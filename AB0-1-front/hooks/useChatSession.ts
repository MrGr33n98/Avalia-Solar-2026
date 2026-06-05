import { useState, useEffect, useCallback } from 'react';
import { fetchApiSafe } from '../lib/api-client';
import { buildApiUrl } from '../lib/api-config';
import { getCurrentUTMs } from '../lib/analytics/utm';
import { track } from '../lib/analytics/lazy';

export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  intent_detected?: string;
  latency_ms?: number;
  feedback?: number;
  metadata?: any;
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

  // Load session from sessionStorage on mount
  useEffect(() => {
    const savedSession = sessionStorage.getItem('as_chat_session') || localStorage.getItem('as_chat_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setSession(parsed);
        sessionStorage.setItem('as_chat_session', savedSession);
        localStorage.removeItem('as_chat_session'); // Migrate existing to sessionStorage
        // Load messages for this session
        fetchSessionMessages(parsed.id);
      } catch (e) {
        sessionStorage.removeItem('as_chat_session');
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
        sessionStorage.setItem('as_chat_session', JSON.stringify(nextSession));
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
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    let currentSession = session;
    setIsLoading(true);

    // If no session exists, start one first
    if (!currentSession) {
      await startSession();
      // Re-read from state after async startSession
      const saved = sessionStorage.getItem('as_chat_session');
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

    track('chat_message_sent', {
      session_id: currentSession.id,
      content_length: content.length
    });

    try {
      const url = buildApiUrl(`chat/sessions/${currentSession.id}/messages`);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
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
            
            if (chunk.startsWith('data: ')) {
              const dataStr = chunk.replace('data: ', '').trim();
              if (dataStr === '[DONE]') continue;
              
              try {
                const data = JSON.parse(dataStr);
                
                if (data.error) {
                  throw new Error(data.chunk);
                }
                
                if (data.is_final && data.metadata) {
                  // Final metadata event
                  setMessages(prev => {
                    const filtered = prev.filter(m => m.id !== tempUserMsg.id && m.id !== (officialMsg?.id || -1));
                    return [...filtered, data.metadata.message, data.metadata.response];
                  });

                  if (data.metadata.should_trigger_lead && !hasLeadCaptured) {
                    setShowLeadForm(true);
                    track('chat_lead_form_triggered', { session_id: currentSession!.id });
                  }
                } else if (data.chunk) {
                  // Incremental chunk
                  setMessages(prev => {
                    const filtered = prev.filter(m => m.id !== tempUserMsg.id);
                    
                    if (!officialMsg) {
                      officialMsg = {
                        id: Date.now() + 1,
                        role: 'assistant',
                        content: data.chunk,
                        created_at: new Date().toISOString()
                      };
                      return [...filtered, tempUserMsg, officialMsg];
                    } else {
                      officialMsg.content += data.chunk;
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
              } catch (e) {
                // Ignore malformed JSON chunk
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('[Chat] Failed to send message:', error);
      // Append fallback AI error response
      const errorMsg: ChatMessage = {
        id: Date.now() + 2,
        role: 'assistant',
        content: 'Desculpe, estou com alguma instabilidade para processar sua mensagem agora. Por favor, tente novamente em instantes ou fale conosco diretamente pelo WhatsApp!',
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev.filter(m => m.id !== tempUserMsg.id), errorMsg]);
      track('chat_message_failed', { session_id: currentSession.id });
    } finally {
      setIsLoading(false);
    }
  }, [session, startSession, hasLeadCaptured]);

  const sendFeedback = useCallback(async (messageId: number, score: number) => {
    try {
      await fetchApiSafe(`chat/messages/${messageId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    metadata?: any;
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
        headers: { 'Content-Type': 'application/json' },
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
    sessionStorage.removeItem('as_chat_session');
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
    setHasLeadCaptured,
    startSession,
    sendMessage,
    sendFeedback,
    submitLead,
    clearSession
  };
}
