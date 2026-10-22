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
 * Usa exclusivamente a decisão do backend sobre o plano pago.
 * Na ausência do campo, falha de forma segura e mantém o CTA oculto.
 */
export function hasPaidPlan(company: { has_paid_plan?: boolean | null }): boolean {
  return company.has_paid_plan === true;
}

/**
 * Verifica se a empresa pode exibir anúncios (Banner Ads) no perfil público.
 * Retorna false para empresas com plano pago ativo.
 */
export function canShowCompanyProfileAds(company: { has_paid_plan?: boolean | null }): boolean {
  return !hasPaidPlan(company);
}

export type ConversionFeature = 'quote' | 'whatsapp' | 'custom_cta';

const PAID_CONVERSION_FEATURE_KEYS: Record<ConversionFeature, string> = {
  quote: 'custom_ctas',
  whatsapp: 'custom_ctas',
  custom_cta: 'custom_ctas',
};

/** Paid conversion entitlement. Missing entitlement fails closed. */
export function canUsePaidConversion(
  company: { has_paid_plan?: boolean | null; feature_access?: FeatureAccessMap },
  feature: ConversionFeature
): boolean {
  if (!hasPaidPlan(company)) return false;
  const featureKey = PAID_CONVERSION_FEATURE_KEYS[feature];
  const entry = getFeatureAccessEntry(company.feature_access, featureKey);
  return Boolean(entry && isFeatureEnabledEntry(entry));
}

/**
 * Verifica se a empresa tem direito à exibição da galeria de mídia e vitrine de projetos.
 * O plano Free NÃO tem direito a esse recurso.
 * Falha fechada (fail closed) para planos free ou sem plano pago confirmado.
 */
export function canShowMediaGallery(company: {
  has_paid_plan?: boolean | null;
  plan_tier?: string | null;
  feature_access?: FeatureAccessMap;
}): boolean {
  if (company.plan_tier === 'free' || company.has_paid_plan === false) {
    return false;
  }

  if (company.feature_access) {
    return isFeatureEnabled(company.feature_access, 'media_gallery');
  }

  return hasPaidPlan(company);
}
