'use client';

export function BillingCycleToggle({
  value,
  onChange,
}: {
  value: 'monthly' | 'yearly';
  onChange: (value: 'monthly' | 'yearly') => void;
}) {
  return (
    <div
      className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm"
      aria-label="Ciclo de cobrança"
    >
      {(['monthly', 'yearly'] as const).map((cycle) => (
        <button
          key={cycle}
          type="button"
          aria-pressed={value === cycle}
          onClick={() => onChange(cycle)}
          className={`rounded-full px-5 py-2 text-xs font-bold ${value === cycle ? 'bg-brand-blue text-white' : 'text-slate-600'}`}
        >
          {cycle === 'monthly' ? 'Mensal' : 'Anual'}
        </button>
      ))}
    </div>
  );
}
