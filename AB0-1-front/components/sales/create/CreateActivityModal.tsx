'use client';

import { useState } from 'react';
import { PhoneCall, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import CRMModal from '@/components/sales/ui/CRMModal';

interface CreateActivityModalProps {
  open: boolean;
  onClose: () => void;
  accountId?: number;
  opportunityId?: number;
  contactId?: number;
  onSuccess?: () => void;
}

export default function CreateActivityModal({
  open,
  onClose,
  accountId,
  opportunityId,
  contactId,
  onSuccess,
}: CreateActivityModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [activityType, setActivityType] = useState('call');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return setError('Assunto é obrigatório');
    setLoading(true);
    setError(null);
    try {
      const endpoint = accountId
        ? `/api/v1/sales/accounts/${accountId}/activities`
        : '/api/v1/sales/activities';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          activity: {
            activity_type: activityType,
            subject,
            body: description,
            sales_account_id: accountId,
            sales_opportunity_id: opportunityId,
            sales_contact_id: contactId,
            occurred_at: new Date().toISOString(),
          },
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        const errMsg = errJson?.error?.message || errJson?.error || `Falha ao registrar atividade (${res.status})`;
        throw new Error(typeof errMsg === 'string' ? errMsg : 'Falha ao registrar atividade');
      }

      const data = await res.json().catch(() => ({}));
      if (!data.activity?.id && !data.id) {
        throw new Error('Servidor não retornou recibo de persistência da atividade');
      }

      setSuccessMsg('Atividade registrada com sucesso!');
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
        setSubject('');
        setDescription('');
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
      title="Registrar Atividade Comercial"
      size="md"
      heroIcon={<PhoneCall className="w-8 h-8 text-indigo-600" />}
      showCustomizeFields={true}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Cancelar
          </button>
          <Button
            type="submit"
            form="create-activity-form"
            disabled={loading}
            className="h-9 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-2xs"
          >
            {loading ? <RotateCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null} Salvar Atividade
          </Button>
        </>
      }
    >
      <form id="create-activity-form" onSubmit={handleSubmit} className="space-y-4 font-sans">
        {error && <p className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-md">{error}</p>}
        {successMsg && <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 p-2.5 rounded-md">{successMsg}</p>}

        <div className="space-y-1">
          <Label className="text-xs font-normal text-slate-600">Tipo de atividade</Label>
          <select
            value={activityType}
            onChange={(e) => setActivityType(e.target.value)}
            className="w-full h-9 text-xs rounded-md border border-slate-200 bg-white px-3 text-slate-700 focus:border-indigo-500"
          >
            <option value="call">Ligação Telefônica</option>
            <option value="meeting">Reunião Comercial</option>
            <option value="email">E-mail Enviado</option>
            <option value="whatsapp">Mensagem de WhatsApp</option>
            <option value="note">Anotação / Nota</option>
          </select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-normal text-slate-600">Assunto</Label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Ex: Alinhamento de payback e requisitos técnicos com CTO"
            className="h-9 text-xs border-slate-200 focus:border-indigo-500 rounded-md"
            required
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-normal text-slate-600">Notas / Detalhes</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Resuma os pontos decisivos, objeções e próximos passos acordados..."
            className="text-xs border-slate-200 focus:border-indigo-500 rounded-md resize-none"
            rows={3}
          />
        </div>
      </form>
    </CRMModal>
  );
}
