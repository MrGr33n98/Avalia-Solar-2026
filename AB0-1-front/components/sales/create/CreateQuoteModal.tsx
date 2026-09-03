'use client';

import { useState } from 'react';
import { FileText, RotateCw } from 'lucide-react';
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
    if (!systemKw || !totalPrice) return setError('Fill out all required solar quote fields');
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
      if (!res.ok) throw new Error('Failed to generate proposal');
      setSuccessMsg('Solar quote created successfully!');
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
        onSuccess?.();
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Error generating quote');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CRMModal
      open={open}
      onClose={onClose}
      title="Add a quote"
      size="md"
      heroIcon={<FileText className="w-8 h-8 text-indigo-600" />}
      showCustomizeFields={true}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>
          <Button
            type="submit"
            form="create-quote-form"
            disabled={loading}
            className="h-9 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-2xs"
          >
            {loading ? <RotateCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null} Add quote
          </Button>
        </>
      }
    >
      <form id="create-quote-form" onSubmit={handleSubmit} className="space-y-4 font-sans">
        {error && <p className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-md">{error}</p>}
        {successMsg && <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 p-2.5 rounded-md">{successMsg}</p>}

        <div className="space-y-1">
          <Label className="text-xs font-normal text-slate-600">Quote number</Label>
          <Input
            value={quoteNumber}
            onChange={(e) => setQuoteNumber(e.target.value)}
            placeholder="PROP-10023"
            className="h-9 text-xs border-slate-200 focus:border-indigo-500 rounded-md"
            required
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-normal text-slate-600">System capacity (kWp)</Label>
          <Input
            type="number"
            step="0.1"
            value={systemKw}
            onChange={(e) => setSystemKw(e.target.value)}
            placeholder="75.5"
            className="h-9 text-xs border-slate-200 focus:border-indigo-500 rounded-md"
            required
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-normal text-slate-600">Total price (R$)</Label>
          <Input
            type="number"
            step="100"
            value={totalPrice}
            onChange={(e) => setTotalPrice(e.target.value)}
            placeholder="280000"
            className="h-9 text-xs border-slate-200 focus:border-indigo-500 rounded-md"
            required
          />
        </div>
      </form>
    </CRMModal>
  );
}
