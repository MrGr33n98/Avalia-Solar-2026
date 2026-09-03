'use client';

import { useState } from 'react';
import { Phone, Plus, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import CRMModal from '@/components/sales/ui/CRMModal';

interface CreateActivityModalProps {
  open: boolean;
  onClose: () => void;
  opportunityId?: number;
  contactId?: number;
  onSuccess?: () => void;
}

export default function CreateActivityModal({ open, onClose, opportunityId, contactId, onSuccess }: CreateActivityModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [notes, setNotes] = useState('');
  const [outcome, setOutcome] = useState('answered');
  const [activityType, setActivityType] = useState('call');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) return setError('Resumo da interação é obrigatório');
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/sales/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          activity: {
            activity_type: activityType,
            description: notes,
            outcome: outcome,
            sales_opportunity_id: opportunityId,
            sales_contact_id: contactId,
            occurred_at: new Date().toISOString(),
          },
        }),
      });
      if (!res.ok) throw new Error('Falha ao registrar atividade');
      setSuccessMsg('Atividade registrada com sucesso!');
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
        setNotes('');
        onSuccess?.();
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Erro ao registrar atividade');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CRMModal
      open={open}
      onClose={onClose}
      title="Registrar Atividade / Chamada"
      description="Gravar histórico de ligação, reunião ou mensagem realizada."
      icon={<Phone className="w-5 h-5 text-rose-700" />}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-md">{error}</p>}
        {successMsg && <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 p-2.5 rounded-md">{successMsg}</p>}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">Tipo de Atividade</Label>
            <select
              value={activityType}
              onChange={(e) => setActivityType(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-slate-200 text-xs bg-white focus:outline-hidden"
            >
              <option value="call">Ligação Telefônica</option>
              <option value="meeting">Reunião Presencial/Online</option>
              <option value="whatsapp">WhatsApp / Mensagem</option>
              <option value="note">Anotação Interna</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">Resultado</Label>
            <select
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-slate-200 text-xs bg-white focus:outline-hidden"
            >
              <option value="answered">Atendida / Sucesso</option>
              <option value="no_answer">Sem Resposta</option>
              <option value="busy">Ocupado</option>
              <option value="scheduled_demo">Demonstração Agendada</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-700">Resumo da Interação *</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Descreva os pontos principais tratados com o cliente..."
            className="min-h-[100px] text-xs"
            required
          />
        </div>

        <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} className="bg-rose-700 text-white hover:bg-rose-800 font-bold">
            {loading ? <RotateCw className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />} Salvar Atividade
          </Button>
        </div>
      </form>
    </CRMModal>
  );
}
