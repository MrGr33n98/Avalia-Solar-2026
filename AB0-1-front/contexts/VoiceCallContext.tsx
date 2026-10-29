'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { salesApi } from '@/lib/api/sales/client';

export type CallStatus = 'idle' | 'initiating' | 'ringing' | 'connected' | 'completed' | 'failed';

export interface ActiveCallInfo {
  phoneNumber: string;
  contactName?: string;
  contactId?: number;
  accountId?: number;
  opportunityId?: number;
}

interface VoiceCallContextType {
  status: CallStatus;
  activeCall: ActiveCallInfo | null;
  durationSeconds: number;
  isMuted: boolean;
  error: string | null;
  startCall: (info: ActiveCallInfo) => Promise<void>;
  hangUp: () => void;
  toggleMute: () => void;
  saveCallLog: (data: { notes?: string; outcome?: string; subject?: string }) => Promise<void>;
  dismissSummary: () => void;
}

const VoiceCallContext = createContext<VoiceCallContextType | null>(null);

export function VoiceCallProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<CallStatus>('idle');
  const [activeCall, setActiveCall] = useState<ActiveCallInfo | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deviceRef = useRef<any>(null);
  const callRef = useRef<any>(null);
  const callSidRef = useRef<string | null>(null);
  const timerRef = useRef<any>(null);

  // Limpa timer ao desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (callRef.current) callRef.current.disconnect();
      if (deviceRef.current) deviceRef.current.destroy();
    };
  }, []);

  // Inicia contador de segundos quando conectado
  useEffect(() => {
    if (status === 'connected') {
      setDurationSeconds(0);
      timerRef.current = setInterval(() => {
        setDurationSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [status]);

  const startCall = useCallback(async (info: ActiveCallInfo) => {
    setError(null);
    setActiveCall(info);
    setIsMuted(false);
    callSidRef.current = null;
    setStatus('initiating');

    try {
      // 1. Obtém o token do backend
      const tokenRes = await salesApi.getVoiceToken();
      if (!tokenRes.configured || !tokenRes.token) {
        throw new Error(tokenRes.error || 'Twilio não configurado no servidor.');
      }

      // 2. Import dinâmico do SDK da Twilio (somente no browser)
      const { Device, Call } = await import('@twilio/voice-sdk');

      if (!deviceRef.current) {
        const device = new Device(tokenRes.token, {
          codecPreferences: [Call.Codec.Opus, Call.Codec.PCMU],
          logLevel: 1,
        });

        device.on('error', (err: any) => {
          console.error('[Twilio Device Error]', err);
          setError(err?.message || 'Erro de conexão Twilio.');
          setStatus('failed');
        });

        deviceRef.current = device;
      } else {
        deviceRef.current.updateToken(tokenRes.token);
      }

      // 3. Efetua a chamada outbound diretamente (sem device.register() obrigatório)
      setStatus('ringing');
      const params = {
        To: info.phoneNumber,
      };

      const call = await deviceRef.current.connect({ params });
      callRef.current = call;

      if (call?.parameters?.CallSid) {
        callSidRef.current = call.parameters.CallSid;
      }

      call.on('accept', () => {
        if (call?.parameters?.CallSid) {
          callSidRef.current = call.parameters.CallSid;
        }
        setStatus('connected');
      });

      call.on('disconnect', () => {
        setStatus('completed');
        callRef.current = null;
      });

      call.on('cancel', () => {
        setStatus('completed');
        callRef.current = null;
      });

      call.on('reject', () => {
        setStatus('completed');
        callRef.current = null;
      });

      call.on('error', (err: any) => {
        console.error('[Twilio Call Error]', err);
        setError(err?.message || 'Falha na chamada.');
        setStatus('failed');
      });

      call.on('mute', (muted: boolean) => {
        setIsMuted(muted);
      });
    } catch (err: any) {
      console.error('[VoiceCall] Falha ao iniciar chamada:', err);
      setError(err?.message || 'Não foi possível completar a chamada.');
      setStatus('failed');
    }
  }, []);

  const hangUp = useCallback(() => {
    if (callRef.current) {
      callRef.current.disconnect();
    }
    setStatus('completed');
  }, []);

  const toggleMute = useCallback(() => {
    if (callRef.current) {
      const nextMute = !isMuted;
      callRef.current.mute(nextMute);
      setIsMuted(nextMute);
    }
  }, [isMuted]);

  const saveCallLog = useCallback(async (data: { notes?: string; outcome?: string; subject?: string }) => {
    if (!activeCall) return;

    try {
      await salesApi.logCall({
        phone_number: activeCall.phoneNumber,
        sales_contact_id: activeCall.contactId,
        sales_account_id: activeCall.accountId,
        sales_opportunity_id: activeCall.opportunityId,
        duration_seconds: durationSeconds,
        outcome: data.outcome || (durationSeconds > 0 ? 'completed' : 'no_answer'),
        notes: data.notes,
        subject: data.subject || `Ligação para ${activeCall.contactName || activeCall.phoneNumber}`,
        call_sid: callSidRef.current || undefined,
      });
      setStatus('idle');
      setActiveCall(null);
      setDurationSeconds(0);
      callSidRef.current = null;
    } catch (err: any) {
      console.error('[VoiceCall] Falha ao salvar log da chamada:', err);
      throw err;
    }
  }, [activeCall, durationSeconds]);

  const dismissSummary = useCallback(() => {
    setStatus('idle');
    setActiveCall(null);
    setDurationSeconds(0);
    callSidRef.current = null;
  }, []);

  return (
    <VoiceCallContext.Provider
      value={{
        status,
        activeCall,
        durationSeconds,
        isMuted,
        error,
        startCall,
        hangUp,
        toggleMute,
        saveCallLog,
        dismissSummary,
      }}
    >
      {children}
    </VoiceCallContext.Provider>
  );
}

export function useVoiceCall() {
  const context = useContext(VoiceCallContext);
  if (!context) {
    throw new Error('useVoiceCall deve ser usado dentro de um VoiceCallProvider');
  }
  return context;
}

export function useVoiceCallOptional() {
  return useContext(VoiceCallContext);
}
