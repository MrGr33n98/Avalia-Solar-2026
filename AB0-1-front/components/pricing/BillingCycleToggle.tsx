'use client';

import type { BillingPeriod } from '@/lib/pricing/billing';

export function BillingCycleToggle({
  value,
  onChange,
}: {
  value: BillingPeriod;
  onChange: (value: BillingPeriod) => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm" role="group" aria-label="Ciclo de cobrança">
      {(['six_months', 'twelve_months'] as const).map((period) => (
        <button
          key={period}
          type="button"
          aria-pressed={value === period}
          onClick={() => onChange(period)}
          className={`min-h-11 rounded-full px-5 py-2 text-xs font-bold transition-colors ${value === period ? 'bg-brand-blue text-white' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          {period === 'six_months' ? '6 meses' : '12 meses'}
          {period === 'twelve_months' && <span className="ml-1.5 text-[10px] font-semibold">· Melhor economia</span>}
        </button>
      ))}
    </div>
  );
}
