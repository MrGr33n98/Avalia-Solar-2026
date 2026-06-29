'use client';

import { useMemo, useState } from 'react';
import { BadgeCheck, Calculator, Coins, Gauge, ShieldCheck, SunMedium, TrendingUp } from 'lucide-react';

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
    <section className="bg-white pb-14 sm:pb-20" aria-labelledby="solar-diagnostic-title">
      <div className="mx-auto max-w-[1320px] px-5 sm:px-6 lg:px-8 xl:px-10">
        <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 text-white shadow-[0_28px_70px_-46px_rgba(15,23,42,.9)]">
          <div className="grid grid-cols-1 lg:grid-cols-[.9fr_1.1fr]">
            <div className="border-b border-white/10 p-6 sm:p-8 lg:border-b-0 lg:border-r">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.13em] text-amber-300">
                Diagnóstico Solar
              </div>
              <h2 id="solar-diagnostic-title" className="max-w-lg text-3xl font-black leading-tight tracking-tight sm:text-4xl">
                Descubra o potencial econômico do seu projeto
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-300 sm:text-base">
                Ajuste sua conta mensal para visualizar uma estimativa de economia, investimento e retorno.
              </p>

              <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.05] p-5">
                <div className="mb-5 flex items-end justify-between gap-4">
                  <label htmlFor="energy-bill-slider" className="text-sm font-bold text-slate-200">
                    Valor da conta de luz
                  </label>
                  <span className="text-2xl font-black tabular-nums text-white">
                    R$ {bill.toLocaleString('pt-BR')}
                    <span className="text-xs font-semibold text-slate-400">/mês</span>
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
                  className="[&_[role=slider]]:border-white [&_[role=slider]]:bg-amber-400"
                />
                <div className="mt-3 flex justify-between text-xs font-semibold text-slate-400">
                  <span>R$ 100</span>
                  <span>R$ 5.000+</span>
                </div>
              </div>

              <div className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-slate-400">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                <p>
                  Estimativa educativa baseada em tarifa média. Irradiação, consumo e condições do imóvel alteram o resultado final.
                </p>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <div key={bill} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Metric
                  icon={SunMedium}
                  label="Economia anual estimada"
                  value={`R$ ${stats.yearly.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`}
                />
                <Metric
                  icon={Coins}
                  label="Economia em 25 anos"
                  value={`R$ ${stats.total.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`}
                />
                <Metric
                  icon={TrendingUp}
                  label="Investimento estimado"
                  value={`R$ ${stats.investmentMin.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} – ${stats.investmentMax.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`}
                />
                <Metric
                  icon={Gauge}
                  label="Retorno estimado"
                  value={`${stats.paybackMin.toFixed(1)} – ${stats.paybackMax.toFixed(1)} anos`}
                />
              </div>

              <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-300">Raio-X de Confiança Solar</p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      Compare empresas compatíveis com esta faixa de projeto.
                    </p>
                  </div>
                  <BadgeCheck className="h-8 w-8 shrink-0 text-emerald-300" aria-hidden="true" />
                </div>
              </div>

              <Button
                type="button"
                onClick={handleConsultation}
                className="mt-6 h-12 w-full bg-amber-400 font-extrabold text-slate-950 hover:bg-amber-300"
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

function Metric({ icon: Icon, label, value }: { icon: typeof SunMedium; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">{label}</p>
        <Icon className="h-5 w-5 shrink-0 text-amber-300" aria-hidden="true" />
      </div>
      <p className="mt-3 text-xl font-black tabular-nums text-white sm:text-2xl">{value}</p>
    </div>
  );
}
