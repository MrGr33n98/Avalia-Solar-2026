export type BillingPeriod = 'six_months' | 'twelve_months';

export interface PlanPricing {
  six_months: {
    amount: number;
    monthlyEquivalent: number;
  };
  twelve_months: {
    amount: number;
    monthlyEquivalent: number;
  };
}

export const pricingByPlan = {
  essential: {
    six_months: { amount: 330, monthlyEquivalent: 330 / 6 },
    twelve_months: { amount: 590, monthlyEquivalent: 590 / 12 },
  },
  pro: {
    six_months: { amount: 840, monthlyEquivalent: 840 / 6 },
    twelve_months: { amount: 1500, monthlyEquivalent: 1500 / 12 },
  },
} satisfies Record<'essential' | 'pro', PlanPricing>;

export const formatBRL = (amount: number): string =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(amount)
    .replace(/\u00a0/g, ' ');

export const formatBRLWithoutCents = (amount: number): string =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  })
    .format(amount)
    .replace(/\u00a0/g, ' ');

export const billingPeriodFromQuery = (value: string | null): BillingPeriod | null => {
  if (value === 'six_months' || value === 'twelve_months') return value;
  return null;
};
