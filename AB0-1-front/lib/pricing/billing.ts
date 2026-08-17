export type BillingCycle = 'monthly' | 'yearly';

export interface PlanPricing {
  monthly: {
    amount: number;
  };
  yearly: {
    amount: number;
    monthlyEquivalent: number;
    savings: number;
  };
}

export const pricingByPlan = {
  essential: {
    monthly: { amount: 59 },
    yearly: {
      amount: 590,
      monthlyEquivalent: 590 / 12,
      savings: 59 * 12 - 590,
    },
  },
  pro: {
    monthly: { amount: 150 },
    yearly: {
      amount: 1500,
      monthlyEquivalent: 1500 / 12,
      savings: 150 * 12 - 1500,
    },
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

export const billingCycleFromQuery = (value: string | null): BillingCycle | null => {
  if (value === 'monthly' || value === 'yearly') return value;
  return null;
};
