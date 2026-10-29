'use client';

import React, { useState } from 'react';
import { useVoiceCall } from '@/contexts/VoiceCallContext';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  RotateCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FloatingCallWidget() {
  const {
    status,
    activeCall,
    durationSeconds,
    isMuted,
    error,
    hangUp,
    toggleMute,
    saveCallLog,
    dismissSummary,
  } = useVoiceCall();

  const [notes, setNotes] = useState('');
  const [outcome, setOutcome] = useState('completed');
  const [saving, setSaving] = useState(false);

  if (status === 'idle') return null;

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveCallLog({ notes, outcome });
      setNotes('');
    } catch {
      // erro tratado no contexto
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden font-sans animate-in slide-in-from-bottom-5">
      {/* Header com Status */}
      <div
        className={cn(
          'p-3.5 flex items-center justify-between text-white transition-colors',
          status === 'connected'
            ? 'bg-emerald-600'
            : status === 'ringing' || status === 'initiating'
            ? 'bg-sky-600'
            : status === 'failed'
            ? 'bg-red-600'
            : 'bg-slate-800'
        )}
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-white/20 rounded-full">
            <Phone className={cn('w-4 h-4', (status === 'ringing' || status === 'initiating') && 'animate-pulse')} />
          </div>
          <div>
            <span className="text-xs font-bold block leading-none">
              {status === 'initiating'
                ? 'Conectando Twilio...'
                : status === 'ringing'
                ? 'Chamando...'
                : status === 'connected'
                ? 'Chamada em Andamento'
                : status === 'completed'
                ? 'Chamada Finalizada'
                : 'Falha na Chamada'}
            </span>
            <span className="text-[10px] text-white/80 block mt-0.5">
              {activeCall?.phoneNumber}
            </span>
          </div>
        </div>

        {status === 'connected' && (
          <div className="flex items-center gap-1 font-mono text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3" />
            <span>{formatTimer(durationSeconds)}</span>
          </div>
        )}

        {(status === 'completed' || status === 'failed') && (
          <button
            onClick={dismissSummary}
            className="p-1 rounded-full hover:bg-white/20 text-white/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Corpo do Widget */}
      <div className="p-4 space-y-3">
        {/* Identificação do Contato */}
        <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
          <User className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold truncate">
            {activeCall?.contactName || 'Contato sem nome'}
          </span>
        </div>

        {/* Erro */}
        {error && (
          <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-tight">{error}</p>
          </div>
        )}

        {/* Controles da Chamada Ativa */}
        {(status === 'initiating' || status === 'ringing' || status === 'connected') && (
          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              onClick={toggleMute}
              className={cn(
                'p-3 rounded-full border transition-all',
                isMuted
                  ? 'bg-amber-100 border-amber-300 text-amber-700'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              )}
              title={isMuted ? 'Desmutar' : 'Mutar microfone'}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <button
              onClick={hangUp}
              className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-all"
              title="Desligar chamada"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Formulário de Resumo Pós-Chamada */}
        {status === 'completed' && (
          <div className="space-y-3 pt-1 text-xs">
            <div className="flex items-center justify-between text-slate-500 font-medium">
              <span>Duração Total:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                {formatTimer(durationSeconds)} ({durationSeconds}s)
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Desfecho da Chamada
              </label>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-medium"
              >
                <option value="completed">Ligação atendida / Produtiva</option>
                <option value="no_answer">Não atendeu / Caixa postal</option>
                <option value="busy">Linha ocupada</option>
                <option value="meeting_scheduled">Reunião agendada</option>
                <option value="not_interested">Sem interesse</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Anotações da Conversa
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Principais pontos discutidos..."
                rows={2}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-200 resize-none focus:outline-hidden focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={dismissSummary}
                className="px-3 py-1.5 text-slate-500 hover:text-slate-800 text-xs font-semibold"
              >
                Descartar
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
              >
                {saving ? (
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                Salvar em Atividades
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
