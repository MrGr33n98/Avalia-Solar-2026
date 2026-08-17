'use client';

import type { BillingCycle } from '@/lib/pricing/billing';

export function BillingCycleToggle({
  value,
  onChange,
}: {
  value: BillingCycle;
  onChange: (value: BillingCycle) => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm" role="group" aria-label="Ciclo de cobrança">
      {(['monthly', 'yearly'] as const).map((cycle) => (
        <button
          key={cycle}
          type="button"
          aria-pressed={value === cycle}
          onClick={() => onChange(cycle)}
          className={`min-h-11 rounded-full px-5 py-2 text-xs font-bold transition-colors ${value === cycle ? 'bg-brand-blue text-white' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          {cycle === 'monthly' ? 'Mensal' : 'Anual'}
        </button>
      ))}
    </div>
  );
}
