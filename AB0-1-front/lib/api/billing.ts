import { fetchApiSafe } from '../api-client';

export type PlanSlug = 'free' | 'essential' | 'pro' | 'enterprise';

export interface BillingPlan {
  id: number;
  slug: PlanSlug;
  name: string;
  price_cents: number;
  price_formatted: string;
  price_label: string;
  stripe_product_id: string | null;
  stripe_price_id_monthly: string | null;
  stripe_price_id_yearly: string | null;
  features: Record<string, any>;
  highlights: string[];
  audience: string;
  summary: string;
  badge?: string;
  featured?: boolean;
}

export interface BillingSubscription {
  id: number;
  company_id: number;
  plan_id: number;
  plan: BillingPlan;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'enterprise_lead';
  trial_start: string | null;
  trial_end: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

const createIdempotencyKey = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `checkout-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
};

export const billingApi = {
  getPlans: async (): Promise<BillingPlan[]> => {
    return fetchApiSafe<BillingPlan[]>('billing/plans');
  },

  getSubscription: async (companyId: number): Promise<BillingSubscription | null> => {
    try {
      return await fetchApiSafe<BillingSubscription>(`billing/subscription?company_id=${companyId}`);
    } catch (err: any) {
      // Se retornar 404, significa que não tem assinatura ativa (o que é normal, ex: Free implícito)
      if (err?.status === 404) {
        return null;
      }
      throw err;
    }
  },

  createCheckoutSession: async (
    companyId: number,
    planId: number,
    successUrl?: string,
    cancelUrl?: string
  ): Promise<{ checkout_url: string }> => {
    return fetchApiSafe<{ checkout_url: string }>('billing/checkout', {
      method: 'POST',
      headers: {
        'Idempotency-Key': createIdempotencyKey(),
      },
      body: JSON.stringify({
        company_id: companyId,
        plan_id: planId,
        success_url: successUrl,
        cancel_url: cancelUrl,
      }),
    });
  },

  createPortalSession: async (companyId: number, returnUrl?: string): Promise<{ portal_url: string }> => {
    return fetchApiSafe<{ portal_url: string }>('billing/portal', {
      method: 'POST',
      body: JSON.stringify({
        company_id: companyId,
        return_url: returnUrl,
      }),
    });
  },

  createEnterpriseLead: async (
    companyId: number,
    planId: number,
    payload: { justification: string; phone_contact: string; estimated_mrr?: number }
  ): Promise<{ message: string; subscription_id: number }> => {
    return fetchApiSafe<{ message: string; subscription_id: number }>('billing/enterprise_leads', {
      method: 'POST',
      body: JSON.stringify({
        company_id: companyId,
        plan_id: planId,
        ...payload,
      }),
    });
  },
};
