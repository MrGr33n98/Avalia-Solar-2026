'use client';

import { useState } from 'react';
import { FileText, Plus, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CRMModal from '@/components/sales/ui/CRMModal';

interface CreateQuoteModalProps {
  open: boolean;
  onClose: () => void;
  opportunityId?: number;
  onSuccess?: () => void;
}

export default function CreateQuoteModal({ open, onClose, opportunityId, onSuccess }: CreateQuoteModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [quoteNumber, setQuoteNumber] = useState(`PROP-${Date.now().toString().slice(-5)}`);
  const [systemKw, setSystemKw] = useState('');
  const [totalPrice, setTotalPrice] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!systemKw || !totalPrice) return setError('Preencha os campos obrigatórios da proposta');
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/sales/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          quote: {
            number: quoteNumber,
            status: 'draft',
            sales_opportunity_id: opportunityId,
            system_size_kwp: parseFloat(systemKw),
            total_price_cents: Math.round(parseFloat(totalPrice) * 100),
          },
        }),
      });
      if (!res.ok) throw new Error('Falha ao gerar proposta comercial');
      setSuccessMsg('Proposta Solar gerada com sucesso!');
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
        onSuccess?.();
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar proposta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CRMModal
      open={open}
      onClose={onClose}
      title="Gerar Nova Proposta Comercial Solar"
      description="Criar minuta de proposta técnica e financeira vinculada ao projeto."
      icon={<FileText className="w-5 h-5 text-indigo-700" />}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-md">{error}</p>}
        {successMsg && <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 p-2.5 rounded-md">{successMsg}</p>}

        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-700">Número da Proposta *</Label>
          <Input
            value={quoteNumber}
            onChange={(e) => setQuoteNumber(e.target.value)}
            placeholder="PROP-10023"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">Potência (kWp) *</Label>
            <Input
              type="number"
              step="0.1"
              value={systemKw}
              onChange={(e) => setSystemKw(e.target.value)}
              placeholder="75.5"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">Valor Total (R$) *</Label>
            <Input
              type="number"
              step="100"
              value={totalPrice}
              onChange={(e) => setTotalPrice(e.target.value)}
              placeholder="280000"
              required
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} className="bg-indigo-700 text-white hover:bg-indigo-800 font-bold">
            {loading ? <RotateCw className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />} Criar Proposta
          </Button>
        </div>
      </form>
    </CRMModal>
  );
}
