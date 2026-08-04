import type { FeatureAccessEntry } from '@/lib/api';

export type FeatureAccessMap = Record<string, FeatureAccessEntry> | null | undefined;

export const getFeatureAccessEntry = (
  featureAccess: FeatureAccessMap,
  key: string
): FeatureAccessEntry | null => {
  if (!featureAccess) return null;
  return featureAccess[key] || null;
};

export const isFeatureHiddenEntry = (entry: FeatureAccessEntry | null | undefined): boolean =>
  entry?.state === 'hidden';

export const isFeatureLockedEntry = (entry: FeatureAccessEntry | null | undefined): boolean =>
  entry?.state === 'locked';

export const isFeatureEnabledEntry = (entry: FeatureAccessEntry | null | undefined): boolean => {
  if (!entry || !['enabled', 'limited', 'trial'].includes(entry.state)) return false;

  if (entry.value === false || entry.value === null) return false;
  if (typeof entry.value === 'number') return entry.value > 0;
  if (typeof entry.value === 'string') return entry.value.trim().length > 0;

  return true;
};

export const isFeatureVisible = (featureAccess: FeatureAccessMap, key: string): boolean =>
  !isFeatureHiddenEntry(getFeatureAccessEntry(featureAccess, key));

export const isFeatureEnabled = (featureAccess: FeatureAccessMap, key: string): boolean =>
  isFeatureEnabledEntry(getFeatureAccessEntry(featureAccess, key));

export const isFeatureLocked = (featureAccess: FeatureAccessMap, key: string): boolean =>
  isFeatureLockedEntry(getFeatureAccessEntry(featureAccess, key));

/**
 * Retorna `true` se a empresa possui qualquer plano pago ativo ou é parceira premium.
 * Critérios (em ordem de prioridade):
 *  1. `featured` — empresa destacada manualmente pelo admin
 *  2. `plan_status === 'active'` — assinatura paga ativa
 *  3. `has_paid_plan` — flag explícita do serializer
 *  4. `slug === 'weg'` — exceção hardcoded de parceiro estratégico
 *  5. `trust.verification_status === 'premium'` — badge de verificação premium
 *  6. `feature_access.custom_ctas` habilitado — feature flag paga no ActiveAdmin
 *
 * Use esta função como única fonte de verdade para feature gates de orçamento nos cards.
 */
export function hasPaidPlan(company: {
  featured?: boolean | null;
  plan_status?: string | null;
  has_paid_plan?: boolean | null;
  slug?: string | null;
  trust?: { verification_status?: string | null } | null;
  feature_access?: FeatureAccessMap;
}): boolean {
  return Boolean(
    company.featured ||
    company.plan_status === 'active' ||
    company.has_paid_plan ||
    company.slug === 'weg' ||
    company.trust?.verification_status === 'premium' ||
    isFeatureEnabled(company.feature_access, 'custom_ctas')
  );
}
