'use client';

import { useState } from 'react';
import { Building2, Plus, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CRMModal from '@/components/sales/ui/CRMModal';
import { salesApi } from '@/lib/api/sales/client';

interface CreateCompanyModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateCompanyModal({ open, onClose, onSuccess }: CreateCompanyModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState('');
  const [companyDomain, setCompanyDomain] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return setError('Nome da empresa é obrigatório');
    setLoading(true);
    setError(null);
    try {
      await salesApi.createAccount({ name: companyName, domain: companyDomain, phone: companyPhone });
      setSuccessMsg('Empresa cadastrada com sucesso!');
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
        setCompanyName('');
        setCompanyDomain('');
        setCompanyPhone('');
        onSuccess?.();
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar empresa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CRMModal
      open={open}
      onClose={onClose}
      title="Criar Nova Empresa"
      description="Cadastrar nova conta B2B / cliente corporativo no CRM."
      icon={<Building2 className="w-5 h-5 text-blue-900" />}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-md">{error}</p>}
        {successMsg && <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 p-2.5 rounded-md">{successMsg}</p>}

        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-700">Nome da Empresa *</Label>
          <Input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Ex: Usinas & Engenharia Solar S/A"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">Domínio</Label>
            <Input
              value={companyDomain}
              onChange={(e) => setCompanyDomain(e.target.value)}
              placeholder="empresa.com.br"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">Telefone Comercial</Label>
            <Input
              value={companyPhone}
              onChange={(e) => setCompanyPhone(e.target.value)}
              placeholder="(11) 3000-0000"
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} className="bg-blue-900 text-white hover:bg-blue-950 font-bold">
            {loading ? <RotateCw className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />} Salvar Empresa
          </Button>
        </div>
      </form>
    </CRMModal>
  );
}
