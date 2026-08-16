'use client';

import { useState } from 'react';

export function PricingRoiCalculator({ planPriceCents = 15000 }: { planPriceCents?: number }) {
  const [ticket, setTicket] = useState(15000);
  const [leads, setLeads] = useState(5);
  const [conversion, setConversion] = useState(20);
  const revenue = (ticket * leads * conversion) / 100;
  return (
    <section className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[1fr_300px]">
      <div>
        <h2 className="text-xl font-black text-slate-950">Calcule seu retorno potencial</h2>
        <p className="mt-1 text-sm text-slate-500">
          Simulação ilustrativa. Resultados variam conforme operação, mercado e conversão.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {[
            ['Ticket médio (R$)', ticket, setTicket, 1000, 100000],
            ['Novos contatos/mês', leads, setLeads, 1, 30],
            ['Taxa de conversão (%)', conversion, setConversion, 1, 100],
          ].map(([label, value, setter, min, max]) => (
            <label key={label as string} className="text-xs font-bold text-slate-700">
              {label as string}
              <input
                aria-label={label as string}
                type="number"
                min={min as number}
                max={max as number}
                value={value as number}
                onChange={(event) =>
                  (setter as (value: number) => void)(Number(event.target.value))
                }
                className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3"
              />
            </label>
          ))}
        </div>
      </div>
      <div className="rounded-xl bg-brand-blue p-5 text-white">
        <p className="text-xs text-blue-100">Receita potencial mensal</p>
        <strong className="mt-2 block text-3xl">R$ {revenue.toLocaleString('pt-BR')}</strong>
        <p className="mt-2 text-xs text-blue-100">
          Plano: R$ {(planPriceCents / 100).toLocaleString('pt-BR')}/mês
        </p>
      </div>
    </section>
  );
}
