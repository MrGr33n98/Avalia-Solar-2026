'use client';

import { useState } from 'react';
import { Mail, Plus, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import CRMModal from '@/components/sales/ui/CRMModal';

interface SendEmailModalProps {
  open: boolean;
  onClose: () => void;
  opportunityId?: number;
  contactEmail?: string;
  onSuccess?: () => void;
}

export default function SendEmailModal({ open, onClose, opportunityId, contactEmail, onSuccess }: SendEmailModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [toEmail, setToEmail] = useState(contactEmail || '');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toEmail.trim() || !subject.trim() || !body.trim()) {
      return setError('Todos os campos obrigatórios precisam ser preenchidos');
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/sales/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: {
            to_email: toEmail,
            subject: subject,
            body: body,
            sales_opportunity_id: opportunityId,
          },
        }),
      });
      if (!res.ok) throw new Error('Falha ao enviar e-mail');
      setSuccessMsg('E-mail enviado e registrado no CRM!');
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
        setSubject('');
        setBody('');
        onSuccess?.();
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar e-mail');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CRMModal
      open={open}
      onClose={onClose}
      title="Enviar E-mail Comercial"
      description="Enviar proposta ou mensagem direta gravada no histórico da oportunidade."
      icon={<Mail className="w-5 h-5 text-purple-700" />}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-md">{error}</p>}
        {successMsg && <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 p-2.5 rounded-md">{successMsg}</p>}

        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-700">Para (Destinatário) *</Label>
          <Input
            type="email"
            value={toEmail}
            onChange={(e) => setToEmail(e.target.value)}
            placeholder="cliente@empresa.com.br"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-700">Assunto *</Label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Ex: Proposta Técnica Comercial Solar — Avalia Solar"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-700">Mensagem / Conteúdo *</Label>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Escreva sua mensagem aqui..."
            className="min-h-[140px] text-xs"
            required
          />
        </div>

        <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} className="bg-purple-700 text-white hover:bg-purple-800 font-bold">
            {loading ? <RotateCw className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />} Enviar E-mail
          </Button>
        </div>
      </form>
    </CRMModal>
  );
}
