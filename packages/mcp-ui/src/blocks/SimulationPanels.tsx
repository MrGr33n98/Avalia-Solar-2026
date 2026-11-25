import { useState } from 'react';
import { solarEstimate, financeEstimate } from '../domain/catalog';
const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const decimal = (value: number) => value.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
function NumberField({ label, value, change }: { label: string; value: number; change: (v: number) => void }) {
  return <label className="as-stack">{label}<input className="as-input" type="number" step="any"
    value={Number.isFinite(value) ? value : ''} onChange={e => change(e.target.valueAsNumber)} /></label>;
}
export function SolarCalculator() {
  const [i, set] = useState({ consumption: 500, tariff: 1, sunHours: 5, performanceRatio: .8, offset: .9 });
  const result = solarEstimate(i);
  return <section className="as-card as-stack" aria-label="Simulador solar">
    <h3 className="as-title-md">Simule seu sistema solar</h3>
    <NumberField label="Consumo mensal (kWh)" value={i.consumption} change={consumption => set(v => ({ ...v, consumption }))} />
    <NumberField label="Tarifa (R$/kWh)" value={i.tariff} change={tariff => set(v => ({ ...v, tariff }))} />
    <NumberField label="Horas de sol pleno por dia" value={i.sunHours} change={sunHours => set(v => ({ ...v, sunHours }))} />
    <NumberField label="Desempenho (0 a 1)" value={i.performanceRatio} change={performanceRatio => set(v => ({ ...v, performanceRatio }))} />
    <NumberField label="Fração de consumo compensada (0 a 1)" value={i.offset} change={offset => set(v => ({ ...v, offset }))} />
    <div aria-live="polite">{result ? <><p>Potência estimada: {decimal(result.capacityKw)} kWp</p>
      <p>Economia bruta anual estimada: {money(result.annualGrossSavings)}</p></> : 'Revise os valores informados.'}</div>
    <p className="as-meta">Premissas editáveis e ilustrativas. Não inclui sazonalidade, tarifa mínima, tributos ou regras de compensação. Não substitui projeto técnico.</p>
  </section>;
}
export function FinancingSimulator() {
  const [principal, setPrincipal] = useState(25000);
  const [rate, setRate] = useState(1);
  const [months, setMonths] = useState(60);
  const result = financeEstimate({ principal, monthlyRate: rate / 100, months });
  return <section className="as-card as-stack" aria-label="Simulador de financiamento">
    <h3 className="as-title-md">Simule parcelas</h3>
    <NumberField label="Valor financiado (R$)" value={principal} change={setPrincipal} />
    <NumberField label="Taxa mensal (%)" value={rate} change={setRate} />
    <NumberField label="Prazo (meses)" value={months} change={setMonths} />
    <div aria-live="polite">{result ? <><p>Parcela estimada: {money(result.payment)}</p><p>Total: {money(result.total)}</p></> : 'Revise os valores informados.'}</div>
    <p className="as-meta">Sistema Price, sem taxas adicionais. CET não informado. Não é uma proposta de crédito.</p>
  </section>;
}
