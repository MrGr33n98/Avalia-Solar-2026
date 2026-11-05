import type { BillingPeriod } from '@/lib/pricing/billing';
import { formatBRL, pricingByPlan } from '@/lib/pricing/billing';
import type { BillingPlan, PlanSlug } from '@/lib/api/billing';
import { pricingFeatureGroups } from '@/lib/pricing/catalog';

export interface EntitlementEntry {
  state: string;
  value: string | number | boolean | null;
  group?: string;
  reason?: string;
  source?: string;
}

export interface CompanyEntitlements {
  plan: { id: number | null; name: string | null; tier: string };
  features: Record<string, EntitlementEntry>;
}

const dictionary = new Map(
  pricingFeatureGroups.flatMap(group => group.rows.map(row => [row.key, row.label] as const))
);

const validStates = new Set(['enabled', 'trial', 'limited', 'locked', 'hidden', 'disabled']);

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

/** Validates the actual EntitlementService.call payload; missing fields never imply a cancelled plan. */
export function parseCompanyEntitlements(raw: unknown): CompanyEntitlements | null {
  const object = record(raw);
  const plan = record(object?.plan);
  const features = record(object?.features);
  if (!plan || !features || typeof plan.tier !== 'string') return null;

  const parsedFeatures: Record<string, EntitlementEntry> = {};
  for (const [key, entry] of Object.entries(features)) {
    const value = record(entry);
    if (!value || typeof value.state !== 'string' || !validStates.has(value.state)) continue;
    const rawValue = value.value;
    parsedFeatures[key] = {
      state: value.state,
      value: ['boolean', 'number', 'string'].includes(typeof rawValue)
        ? rawValue as string | number | boolean
        : null,
      group: typeof value.group === 'string' ? value.group : undefined,
      reason: typeof value.reason === 'string' ? value.reason : undefined,
      source: typeof value.source === 'string' ? value.source : undefined,
    };
  }

  return {
    plan: {
      id: typeof plan.id === 'number' ? plan.id : null,
      name: typeof plan.name === 'string' ? plan.name : null,
      tier: plan.tier.toLowerCase(),
    },
    features: parsedFeatures,
  };
}

export function featureLabel(key: string): string {
  return dictionary.get(key) || key.replace(/_/g, ' ').replace(/\b\p{L}/gu, letter => letter.toUpperCase());
}

export function isFeatureEnabled(entry: EntitlementEntry): boolean {
  if (!['enabled', 'trial', 'limited'].includes(entry.state)) return false;
  if (entry.value === false || entry.value === null) return false;
  return typeof entry.value !== 'number' || entry.value > 0;
}

export function referencePrice(plan: Pick<BillingPlan, 'slug'>, period: BillingPeriod): {
  total: string;
  equivalent: string | null;
  note: string;
} {
  if (plan.slug === 'free') return { total: 'Gratuito', equivalent: null, note: 'Sem cobrança' };
  if (plan.slug === 'enterprise') return { total: 'Sob consulta', equivalent: null, note: 'Proposta personalizada' };
  if (plan.slug !== 'essential' && plan.slug !== 'pro') {
    return { total: 'Consultar condições', equivalent: null, note: 'Valor informado na contratação' };
  }
  const details = pricingByPlan[plan.slug][period];
  return {
    total: formatBRL(details.amount),
    equivalent: formatBRL(details.monthlyEquivalent),
    note: period === 'six_months' ? 'Cobrança a cada 6 meses' : 'Cobrança a cada 12 meses',
  };
}

export function isKnownTier(tier: string): tier is PlanSlug {
  return tier === 'free' || tier === 'essential' || tier === 'pro' || tier === 'enterprise';
}

export const PLAN_RANK: Record<PlanSlug, number> = {
  free: 0,
  essential: 1,
  pro: 2,
  enterprise: 3,
};

export function parseBillingStatus(value: string | null | undefined): string {
  switch (value) {
    case 'active': return 'Ativa';
    case 'trialing': return 'Em período de teste';
    case 'past_due': return 'Pagamento pendente';
    case 'unpaid': return 'Pagamento não realizado';
    case 'canceled': return 'Cancelada';
    case 'incomplete': return 'Incompleta';
    case 'enterprise_lead': return 'Proposta solicitada';
    default: return 'Não informado';
  }
}

export function formatBillingDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
}
