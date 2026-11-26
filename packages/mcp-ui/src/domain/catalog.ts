import type { Integrator } from '../contracts/schemas';

export interface SolarInput {
  consumption: number; tariff: number; sunHours: number; performanceRatio: number; offset: number;
}
export interface FinanceInput { principal: number; monthlyRate: number; months: number }
const within = (n: number, min: number, max: number) => Number.isFinite(n) && n >= min && n <= max;
export function solarEstimate(i: SolarInput) {
  if (!within(i.consumption, 1, 1e7) || !within(i.tariff, 0, 100) ||
      !within(i.sunHours, .1, 24) || !within(i.performanceRatio, .01, 1) ||
      !within(i.offset, .01, 1)) return null;
  const monthlyGeneration = i.consumption * i.offset;
  return { capacityKw: monthlyGeneration / (30 * i.sunHours * i.performanceRatio),
    monthlyGeneration, annualGrossSavings: monthlyGeneration * i.tariff * 12 };
}
export function financeEstimate(i: FinanceInput) {
  if (!within(i.principal, 1, 1e9) || !within(i.monthlyRate, 0, 1) ||
      !within(i.months, 1, 600) || !Number.isInteger(i.months)) return null;
  const payment = i.monthlyRate === 0 ? i.principal / i.months :
    i.principal * i.monthlyRate / -Math.expm1(-i.months * Math.log1p(i.monthlyRate));
  return { payment, total: payment * i.months, interest: payment * i.months - i.principal };
}
export function selectRecommendations(companies: readonly Integrator[], category: string) {
  return companies.filter(c => !category || c.categories.some(cat => cat.slug === category));
}
export function summarizeDirectory(companies: readonly Integrator[]) {
  const unique = [...new Map(companies.map(c => [c.id, c])).values()];
  return { total: unique.length, verified: unique.filter(c => c.verification_state === 'platform_verified').length,
    reviewed: unique.filter(c => c.rating_count > 0).length };
}
