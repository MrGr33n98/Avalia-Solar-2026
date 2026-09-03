'use client';

import { useState } from 'react';
import { Plus, RotateCw, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CRMModal from '@/components/sales/ui/CRMModal';
import { salesApi } from '@/lib/api/sales/client';

interface CreateContactModalProps {
  open: boolean;
  onClose: () => void;
  accountId?: number;
  onSuccess?: () => void;
}

export default function CreateContactModal({ open, onClose, accountId, onSuccess }: CreateContactModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [contactFirstName, setContactFirstName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactJobTitle, setContactJobTitle] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactFirstName.trim()) return setError('Nome é obrigatório');
    setLoading(true);
    setError(null);
    try {
      await salesApi.createContact({
        sales_account_id: accountId,
        first_name: contactFirstName,
        email: contactEmail,
        job_title: contactJobTitle,
      });
      setSuccessMsg('Contato cadastrado com sucesso!');
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
        setContactFirstName('');
        setContactEmail('');
        setContactJobTitle('');
        onSuccess?.();
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar contato');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CRMModal
      open={open}
      onClose={onClose}
      title="Criar Novo Contato"
      description="Cadastrar novo decisor ou contato comercial no CRM."
      icon={<Users className="w-5 h-5 text-emerald-700" />}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-md">{error}</p>}
        {successMsg && <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 p-2.5 rounded-md">{successMsg}</p>}

        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-700">Nome do Contato *</Label>
          <Input
            value={contactFirstName}
            onChange={(e) => setContactFirstName(e.target.value)}
            placeholder="Ex: Carlos Silva"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">E-mail</Label>
            <Input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="carlos@empresa.com.br"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">Cargo / Função</Label>
            <Input
              value={contactJobTitle}
              onChange={(e) => setContactJobTitle(e.target.value)}
              placeholder="Diretor Operacional"
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} className="bg-emerald-700 text-white hover:bg-emerald-800 font-bold">
            {loading ? <RotateCw className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />} Salvar Contato
          </Button>
        </div>
      </form>
    </CRMModal>
  );
}
