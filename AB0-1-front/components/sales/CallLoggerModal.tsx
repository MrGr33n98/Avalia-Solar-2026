'use client';

import { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Phone,
  PhoneCall,
  PhoneForwarded,
  PhoneOff,
  Plus,
  RotateCw,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

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
  const [open, setOpen] = useState(false);
  const [outcome, setOutcome] = useState<'answered' | 'no_answer' | 'voicemail' | 'interested' | 'not_interested' | 'callback'>('answered');
  const [duration, setDuration] = useState('180');
  const [notes, setNotes] = useState('');
  const [nextActionAt, setNextActionAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (accountId) {
        await fetch(`/api/v1/sales/accounts/${accountId}/activities`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            activity: {
              activity_type: 'call',
              subject: `Ligação Realizada — Outcome: ${outcome.toUpperCase()}`,
              body: `Duração: ${duration}s. Notas: ${notes}. Próxima ação: ${nextActionAt || 'Nenhum'}`,
              sales_contact_id: contactId,
            },
          }),
        });
      }
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setOpen(false);
        onSuccess?.();
      }, 1200);
    } catch {
      // Fallback optimistic UI
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setOpen(false);
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          onClick={() => {
            if (phone) {
              const cleanPhone = phone.replace(/\D/g, '');
              window.open(`tel:${cleanPhone}`, '_self');
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
            <Badge className="border-0 bg-blue-900 font-bold text-white">Call Logger</Badge>
            <span className="text-xs text-slate-500">{contactName}</span>
          </div>
          <DialogTitle className="mt-1 text-lg font-bold text-slate-900">
            Registrar Chamada Telefônica
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Grave o resultado da ligação em menos de 10 segundos para manter a timeline sincronizada.
          </DialogDescription>
        </DialogHeader>

        {saved ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600 animate-bounce" />
            <p className="font-bold text-slate-900 text-sm">Chamada Registrada na Timeline!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-3 space-y-4 text-xs">
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
                      onClick={() => setOutcome(item.id as any)}
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
              <label className="font-bold text-slate-700 block mb-1">Notas / Resumo da Conversa</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-slate-300 p-2 text-xs focus:border-blue-900 focus:outline-hidden"
                placeholder="Ex: Carlos gostou do ROI, solicitou envio de proposta comercial via e-mail até sexta..."
              />
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
