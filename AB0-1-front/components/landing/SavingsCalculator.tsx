'use client';

import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { track } from '@/lib/analytics/lazy';
import { openQuoteWizard } from '@/lib/quote-wizard';

export default function SavingsCalculator() {
  const [bill, setBill] = useState(350);

  const stats = useMemo(() => {
    const monthlySavings = bill * 0.95;
    const yearlySavings = monthlySavings * 12;
    const total = yearlySavings * 25;
    const investmentMin = bill * 36;
    const investmentMax = bill * 55;

    return {
      yearly: yearlySavings,
      total,
      investmentMin,
      investmentMax,
      paybackMin: investmentMin / yearlySavings,
      paybackMax: investmentMax / yearlySavings,
    };
  }, [bill]);

  const handleConsultation = () => {
    track('home_calculator_consultation_click', { bill_value: bill });
    openQuoteWizard({ source: 'home-calculator' });
  };

  return (
    <section className="bg-transparent pb-14 sm:pb-20" aria-labelledby="solar-diagnostic-title">
      <div className="mx-auto max-w-[1320px] px-5 sm:px-6 lg:px-8 xl:px-10">
        <div className="relative isolate overflow-hidden rounded-none border border-[#243044] bg-[#070B16] text-white shadow-[0_18px_45px_-38px_rgba(2,6,23,.85)]">
          <div
            className="pointer-events-none absolute inset-0 -z-10 opacity-60"
            aria-hidden="true"
            style={{
              backgroundImage:
                'radial-gradient(circle at 12% 15%, rgba(37,99,235,0.15), transparent 34%), radial-gradient(circle at 86% 78%, rgba(14,165,233,0.07), transparent 30%), radial-gradient(rgba(255,255,255,0.09) 0.65px, transparent 0.65px)',
              backgroundSize: 'auto, auto, 20px 20px',
            }}
          />
          <div className="grid grid-cols-1 lg:grid-cols-[.95fr_1.05fr]">
            <div className="border-b border-[#243044] p-6 sm:p-8 lg:border-b-0 lg:border-r lg:p-10">
              <div className="mb-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#FFC82C]">
                  Diagnóstico Solar
                </p>
                <span className="mt-3 block h-0.5 w-10 bg-[#FFC82C]" aria-hidden="true" />
              </div>
              <h2 id="solar-diagnostic-title" className="max-w-lg text-3xl font-medium leading-[1.16] tracking-[-0.025em] sm:text-4xl">
                Descubra o potencial econômico do seu projeto
              </h2>
              <p className="mt-4 max-w-lg text-sm font-normal leading-7 text-slate-300 sm:text-base">
                Ajuste sua conta mensal para visualizar uma estimativa de economia, investimento e retorno.
              </p>

              <div className="mt-8 rounded-none border border-[#243044] bg-white/[0.025] p-5 sm:p-6">
                <div className="mb-5 flex items-end justify-between gap-4">
                  <label htmlFor="energy-bill-slider" className="text-sm font-medium text-slate-200">
                    Valor da conta de luz
                  </label>
                  <span className="text-2xl font-semibold tabular-nums text-white">
                    R$ {bill.toLocaleString('pt-BR')}
                    <span className="ml-1 text-xs font-normal text-slate-400">/mês</span>
                  </span>
                </div>
                <Slider
                  id="energy-bill-slider"
                  value={[bill]}
                  min={100}
                  max={5000}
                  step={50}
                  onValueChange={(value) => setBill(value[0])}
                  aria-label="Valor da conta de luz mensal"
                  className="[&>span:first-child]:h-1 [&>span:first-child]:rounded-none [&>span:first-child]:bg-slate-700 [&>span:first-child>span]:bg-blue-500 [&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:rounded-none [&_[role=slider]]:border [&_[role=slider]]:border-white [&_[role=slider]]:bg-white [&_[role=slider]]:shadow-none"
                />
                <div className="mt-3 flex justify-between text-xs font-normal text-slate-400">
                  <span>R$ 100</span>
                  <span>R$ 5.000+</span>
                </div>
              </div>

              <p className="mt-5 text-xs font-normal leading-relaxed text-slate-400">
                Estimativa educativa baseada em tarifa média. Irradiação, consumo e condições do imóvel alteram o resultado final.
              </p>
            </div>

            <div className="p-6 sm:p-8 lg:p-10">
              <div key={bill} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Metric
                  label="Economia anual estimada"
                  value={`R$ ${stats.yearly.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`}
                />
                <Metric
                  label="Economia em 25 anos"
                  value={`R$ ${stats.total.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`}
                />
                <Metric
                  label="Investimento estimado"
                  value={`R$ ${stats.investmentMin.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} – ${stats.investmentMax.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`}
                />
                <Metric
                  label="Retorno estimado"
                  value={`${stats.paybackMin.toFixed(1)} – ${stats.paybackMax.toFixed(1)} anos`}
                />
              </div>

              <div className="mt-6 rounded-none border border-emerald-500/45 bg-emerald-950/35 p-4 sm:px-5">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-emerald-300">Raio-X de Confiança Solar</p>
                <p className="mt-2 text-sm font-normal leading-6 text-slate-100">
                  Compare empresas compatíveis com esta faixa de projeto.
                </p>
              </div>

              <Button
                type="button"
                onClick={handleConsultation}
                className="mt-6 h-12 w-full rounded-none border border-[#FFC82C] bg-[#FFC82C] font-medium text-[#0B0F1A] shadow-none hover:border-[#e8b51e] hover:bg-[#e8b51e]"
              >
                Comparar empresas para meu projeto
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-none border border-[#243044] bg-white/[0.025] p-5">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-4 text-xl font-semibold tabular-nums tracking-[-0.015em] text-white sm:text-2xl">{value}</p>
    </div>
  );
}
