'use client';

import { useEffect, useState } from 'react';
import { FileText, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CRMModal from '@/components/sales/ui/CRMModal';
import { salesApi } from '@/lib/api/sales/client';
import { ApiOpportunity } from '@/lib/api/sales/types';

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

  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string>(
    opportunityId ? String(opportunityId) : ''
  );
  const [opportunities, setOpportunities] = useState<ApiOpportunity[]>([]);
  const [loadingOpps, setLoadingOpps] = useState(false);

  const [quoteNumber, setQuoteNumber] = useState('');
  const [systemKw, setSystemKw] = useState('');
  const [totalPrice, setTotalPrice] = useState('');

  useEffect(() => {
    if (open) {
      setQuoteNumber(`PROP-${Date.now().toString().slice(-6)}`);
      setError(null);
      setSuccessMsg(null);
      if (opportunityId) {
        setSelectedOpportunityId(String(opportunityId));
      } else {
        setSelectedOpportunityId('');
        setLoadingOpps(true);
        salesApi
          .getOpportunities({ per_page: 50 })
          .then((opps) => setOpportunities(opps))
          .catch(() => setOpportunities([]))
          .finally(() => setLoadingOpps(false));
      }
    }
  }, [open, opportunityId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const oppIdNum = Number(selectedOpportunityId);
    if (!oppIdNum) {
      return setError('Selecione uma oportunidade válida para a proposta.');
    }
    if (!totalPrice || Number(totalPrice) <= 0) {
      return setError('Informe o valor total da proposta.');
    }
    if (!quoteNumber.trim()) {
      return setError('Informe o número da proposta.');
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/sales/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          quote: {
            number: quoteNumber.trim(),
            status: 'draft',
            opportunity_id: oppIdNum,
            total_cents: Math.round(parseFloat(totalPrice) * 100),
            currency: 'BRL',
          },
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || errorData?.message || 'Falha ao gerar proposta comercial.');
      }

      setSuccessMsg('Proposta comercial criada com sucesso!');
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
        onSuccess?.();
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar proposta comercial.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CRMModal
      open={open}
      onClose={onClose}
      title="Nova Proposta Comercial"
      size="md"
      heroIcon={<FileText className="w-8 h-8 text-indigo-600" />}
      showCustomizeFields={false}
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
            form="create-quote-form"
            disabled={loading}
            className="h-9 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-2xs"
          >
            {loading ? <RotateCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null} Salvar Proposta
          </Button>
        </>
      }
    >
      <form id="create-quote-form" onSubmit={handleSubmit} className="space-y-4 font-sans">
        {error && <p className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-md">{error}</p>}
        {successMsg && <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 p-2.5 rounded-md">{successMsg}</p>}

        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-700">Oportunidade Vinculada *</Label>
          {opportunityId ? (
            <div className="flex h-9 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 font-semibold">
              Oportunidade #{opportunityId}
            </div>
          ) : (
            <select
              value={selectedOpportunityId}
              onChange={(e) => setSelectedOpportunityId(e.target.value)}
              disabled={loadingOpps}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
              required
            >
              <option value="">{loadingOpps ? 'Carregando oportunidades...' : 'Selecione uma oportunidade...'}</option>
              {opportunities.map((opp) => (
                <option key={opp.id} value={opp.id}>
                  #{opp.id} - {opp.name || opp.account?.name || 'Oportunidade sem nome'}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-700">Número da Proposta *</Label>
          <Input
            value={quoteNumber}
            onChange={(e) => setQuoteNumber(e.target.value)}
            placeholder="PROP-10023"
            className="h-9 text-xs border-slate-200 focus:border-indigo-500 rounded-md"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs font-medium text-slate-700">Potência Estimada (kWp)</Label>
            <Input
              type="number"
              step="0.1"
              value={systemKw}
              onChange={(e) => setSystemKw(e.target.value)}
              placeholder="Ex: 75.5"
              className="h-9 text-xs border-slate-200 focus:border-indigo-500 rounded-md"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium text-slate-700">Valor Total (R$) *</Label>
            <Input
              type="number"
              step="1"
              min="1"
              value={totalPrice}
              onChange={(e) => setTotalPrice(e.target.value)}
              placeholder="Ex: 280000"
              className="h-9 text-xs border-slate-200 focus:border-indigo-500 rounded-md"
              required
            />
          </div>
        </div>
      </form>
    </CRMModal>
  );
}
