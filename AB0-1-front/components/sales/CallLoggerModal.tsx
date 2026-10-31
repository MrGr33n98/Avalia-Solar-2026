'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Loader2,
  PhoneCall,
  PhoneForwarded,
  PhoneOff,
  Sparkles,
  Undo2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useVoiceCallOptional } from '@/contexts/VoiceCallContext';
import { createAiGeneration } from '@/lib/api/sales/ai';

export default function CallLoggerModal({
  accountId,
  contactId,
  contactName = 'Carlos Silva (CEO)',
  phone = '(47) 99887-1122',
  onSuccess,
}: {
  accountId?: number;
  contactId?: number;
  contactName?: string;
  phone?: string;
  onSuccess?: () => void;
}) {
  const voiceCall = useVoiceCallOptional();
  const [open, setOpen] = useState(false);
  const [isWrapUp, setIsWrapUp] = useState(false);
  const [outcome, setOutcome] = useState<'answered' | 'no_answer' | 'voicemail' | 'interested' | 'not_interested' | 'callback'>('answered');
  const [duration, setDuration] = useState('180');
  const [notes, setNotes] = useState('');
  const [nextActionAt, setNextActionAt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [rawNotes, setRawNotes] = useState<string | null>(null);
  const [organizingAi, setOrganizingAi] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{
    objection?: string;
    sentiment?: string;
    nextAction?: string;
  } | null>(null);

  const handleOrganizeNotesWithAi = async () => {
    if (!notes.trim()) return;
    setOrganizingAi(true);
    setError(null);
    try {
      setRawNotes(notes);
      const res = await createAiGeneration({
        feature: 'call_organizer',
        action: 'organize_notes',
        instructions: 'Organize as notas da ligação telefônica de forma executiva.',
        draft: { selected_text: notes },
        context: {
          contact_id: contactId || null,
          account_id: accountId || null,
        },
      });

      const formatted = res.result?.formatted_notes || res.result?.summary;
      if (formatted) {
        setNotes(formatted);
      }
      if (res.result?.suggested_action_date && !nextActionAt) {
        setNextActionAt(res.result.suggested_action_date);
      }
      setAiAnalysis({
        objection: res.result?.main_objection,
        sentiment: res.result?.sentiment,
        nextAction: res.result?.next_action,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao organizar notas com IA.';
      setError(msg);
    } finally {
      setOrganizingAi(false);
    }
  };

  const handleUndoOrganize = () => {
    if (rawNotes !== null) {
      setNotes(rawNotes);
      setRawNotes(null);
      setAiAnalysis(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) {
      setError('Contexto de empresa (conta) não encontrado para registrar a ligação.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/sales/accounts/${accountId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          activity: {
            activity_type: 'call',
            subject: `Ligação Realizada — Outcome: ${outcome.toUpperCase()}`,
            body: `Duração: ${duration}s. Notas: ${notes}. Próxima ação: ${nextActionAt || 'Nenhum'}`,
            sales_contact_id: contactId,
            sales_account_id: accountId,
          },
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        const errMsg = errJson?.error?.message || errJson?.error || `Falha ao registrar ligação (${res.status})`;
        throw new Error(typeof errMsg === 'string' ? errMsg : 'Falha ao registrar ligação');
      }

      const data = await res.json().catch(() => ({}));
      if (!data.activity?.id && !data.id) {
        throw new Error('Servidor não retornou confirmação de persistência da atividade.');
      }

      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setOpen(false);
        setIsWrapUp(false);
        setNotes('');
        onSuccess?.();
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro inesperado ao registrar chamada.';
      setError(msg);
      
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setError(null);
      setSaved(false);
      setIsWrapUp(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          onClick={() => {
            if (phone) {
              const cleanPhone = phone.replace(/\D/g, '');
              if (voiceCall) {
                void voiceCall.startCall({
                  phoneNumber: cleanPhone,
                  contactName,
                  contactId,
                  accountId,
                });
              } else {
                window.open(`tel:${cleanPhone}`, '_self');
              }
              // GAP-19: Arm wrap-up prompt immediately so it is ready when returning to app
              setIsWrapUp(true);
              setOpen(true);
            }
          }}
          className="h-8 bg-blue-900 font-bold text-white hover:bg-blue-950 text-xs shadow-xs"
        >
          <PhoneCall className="mr-1.5 h-3.5 w-3.5" /> Registrar Chamada
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md bg-white border-slate-200 p-6">
        <DialogHeader className="border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            {isWrapUp ? (
              <Badge className="border-0 bg-emerald-600 font-bold text-white flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> Pós-Chamada (Wrap-Up)
              </Badge>
            ) : (
              <Badge className="border-0 bg-blue-900 font-bold text-white">Call Logger</Badge>
            )}
            <span className="text-xs text-slate-500">{contactName}</span>
          </div>
          <DialogTitle className="mt-1 text-lg font-bold text-slate-900">
            {isWrapUp ? 'Pós-Chamada: Registrar Desfecho' : 'Registrar Chamada Telefônica'}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            {isWrapUp
              ? 'Ligação disparada no discador. Registre o resultado e notas enquanto o contexto está fresco.'
              : 'Grave o resultado da ligação em menos de 10 segundos para manter a timeline sincronizada.'}
          </DialogDescription>
        </DialogHeader>

        {saved ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600 animate-bounce" />
            <p className="font-bold text-slate-900 text-sm">Chamada Registrada na Timeline!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-3 space-y-4 text-xs">
            {error && (
              <p role="alert" className="p-2.5 rounded-md text-xs font-semibold text-red-700 bg-red-50 border border-red-200">
                {error}
              </p>
            )}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Resultado da Ligação (Outcome)</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'answered', label: 'Atendeu', icon: PhoneCall },
                  { id: 'interested', label: 'Interessado', icon: CheckCircle2 },
                  { id: 'no_answer', label: 'Não Atendeu', icon: PhoneOff },
                  { id: 'voicemail', label: 'Caixa Postal', icon: PhoneForwarded },
                  { id: 'callback', label: 'Retornar', icon: Clock },
                  { id: 'not_interested', label: 'Sem Interesse', icon: PhoneOff },
                ].map((item) => {
                  const Icon = item.icon;
                  const selected = outcome === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setOutcome(item.id as typeof outcome)}
                      className={`p-2 rounded-lg border text-center transition flex flex-col items-center gap-1 ${
                        selected
                          ? 'border-blue-900 bg-blue-50 text-blue-900 font-bold'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-[10px]">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Duração (Segundos)</label>
                <Input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="min-h-9 text-xs"
                  placeholder="Ex: 180"
                />
                <div className="flex items-center gap-1 mt-1.5">
                  {[
                    { label: '30s', val: '30' },
                    { label: '1m', val: '60' },
                    { label: '3m', val: '180' },
                    { label: '5m', val: '300' },
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => setDuration(preset.val)}
                      className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                        duration === preset.val
                          ? 'bg-blue-900 text-white border-blue-900 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Agendar Próxima Ação</label>
                <Input
                  type="date"
                  value={nextActionAt}
                  onChange={(e) => setNextActionAt(e.target.value)}
                  className="min-h-9 text-xs"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700 block">Notas / Resumo da Conversa</label>
                <div className="flex items-center gap-1.5">
                  {rawNotes !== null && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleUndoOrganize}
                      className="h-6 px-1.5 text-[10px] text-slate-500 hover:text-slate-700 gap-1"
                    >
                      <Undo2 className="w-3 h-3" /> Desfazer
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void handleOrganizeNotesWithAi()}
                    disabled={!notes.trim() || organizingAi}
                    className="h-6 px-2 text-[10px] font-semibold text-blue-900 border-blue-200 hover:bg-blue-50 gap-1 bg-white"
                  >
                    {organizingAi ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin text-blue-800" />
                        Organizando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 text-blue-700" />
                        Organizar com IA
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full rounded-md border border-slate-300 p-2 text-xs focus:border-blue-900 focus:outline-hidden"
                placeholder="Ex: Carlos gostou do ROI, solicitou envio de proposta comercial via e-mail até sexta..."
              />
              {aiAnalysis && (
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  {aiAnalysis.objection && (
                    <Badge variant="outline" className="text-[10px] bg-amber-50 border-amber-200 text-amber-800">
                      Objeção: {aiAnalysis.objection}
                    </Badge>
                  )}
                  {aiAnalysis.sentiment && (
                    <Badge variant="outline" className="text-[10px] bg-slate-100 border-slate-200 text-slate-700 font-mono">
                      Sentimento: {aiAnalysis.sentiment}
                    </Badge>
                  )}
                  {aiAnalysis.nextAction && (
                    <span className="text-[10px] text-slate-500 italic truncate max-w-full">
                      Sugerido: {aiAnalysis.nextAction}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} size="sm" className="bg-blue-900 font-bold text-white hover:bg-blue-950">
                {loading ? 'Salvando...' : 'Salvar Chamada'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
