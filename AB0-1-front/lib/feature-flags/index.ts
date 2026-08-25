/**
 * PostHog Feature Flags Integration — Avalia Solar v2.0 Enterprise
 *
 * Mapeia as principais funcionalidades globais do produto para Feature Flags do PostHog:
 * - CHAT -> feature_chat_enabled
 * - COMPARE -> feature_compare_enabled
 * - SEARCH -> feature_search_enabled
 * - REVIEWS -> feature_reviews_enabled
 * - BLOG -> feature_blog_enabled
 */

import posthog from 'posthog-js';

export const FEATURE_FLAGS = {
  CHAT: 'feature_chat_enabled',
  COMPARE: 'feature_compare_enabled',
  SEARCH: 'feature_search_enabled',
  REVIEWS: 'feature_reviews_enabled',
  BLOG: 'feature_blog_enabled',
  GROUPS: 'feature_groups_enabled',
} as const;

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;

/**
 * Avalia se uma feature flag está ativa no PostHog, com fallback gracioso para variáveis de ambiente.
 */
export function isFeatureFlagEnabled(flag: FeatureFlagKey): boolean {
  const flagName = FEATURE_FLAGS[flag];
  const envKey = `NEXT_PUBLIC_FEATURE_${flag}`;
  const legacyEnvKey = `NEXT_PUBLIC_${flag}_ENABLED`;

  if (typeof window === 'undefined') {
    const envVal = process.env[envKey] ?? process.env[legacyEnvKey];
    return envVal !== 'false';
  }

  // Verifica se o SDK do PostHog está carregado no navegador
  if (posthog.__loaded || (window.__analyticsPosthog?.isLoaded?.())) {
    try {
      const isEnabled = posthog.isFeatureEnabled(flagName);
      if (typeof isEnabled === 'boolean') {
        return isEnabled;
      }
    } catch {
      // Ignora e faz fallback
    }
  }

  // Fallback para variáveis de ambiente locais
  const configuredEnv = process.env[envKey] ?? process.env[legacyEnvKey];
  return configuredEnv !== 'false';
}
