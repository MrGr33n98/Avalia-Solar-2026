'use client';

import { AnalyticsContext } from './types';

export const ANALYTICS_CONTRACT_VERSION = 'analytics_contract_v3';

type EventContract = {
  owner:
    | 'product'
    | 'growth'
    | 'lead_lifecycle'
    | 'company_activation'
    | 'billing'
    | 'inventory'
    | 'platform';
  kind: 'exposure' | 'microconversion' | 'form' | 'domain_fact' | 'performance' | 'diagnostic';
  required: string[];
};

const CONTRACTS: Record<string, EventContract> = {
  $pageview: { owner: 'platform', kind: 'exposure', required: ['pathname'] },
  company_ai_config_saved: { owner: 'product', kind: 'microconversion', required: ['company_id', 'surface'] },
  company_ai_workflow_draft_created: { owner: 'product', kind: 'microconversion', required: ['company_id', 'version'] },
  company_ai_workflow_published_ui: { owner: 'product', kind: 'microconversion', required: ['company_id', 'version'] },
  company_ai_widget_viewed: { owner: 'product', kind: 'exposure', required: ['company_id', 'surface_id'] },
  company_ai_widget_opened: { owner: 'product', kind: 'microconversion', required: ['company_id', 'surface_id'] },
  company_ai_first_question_sent: { owner: 'product', kind: 'microconversion', required: ['company_id', 'session_correlation_id'] },
  company_ai_answer_rendered: { owner: 'product', kind: 'microconversion', required: ['company_id', 'session_correlation_id', 'request_id'] },
  company_ai_source_opened: { owner: 'product', kind: 'microconversion', required: ['company_id', 'source_kind', 'source_id'] },
  company_ai_quote_started: { owner: 'lead_lifecycle', kind: 'microconversion', required: ['company_id', 'session_correlation_id'] },
  company_ai_handoff_requested: { owner: 'lead_lifecycle', kind: 'microconversion', required: ['company_id', 'session_correlation_id'] },
  company_profile_viewed: { owner: 'product', kind: 'exposure', required: ['company_id'] },
  company_cta_clicked: {
    owner: 'growth',
    kind: 'microconversion',
    required: ['company_id', 'cta_type'],
  },
  quote_wizard_started: { owner: 'lead_lifecycle', kind: 'microconversion', required: [] },
  quote_contact_submitted: { owner: 'lead_lifecycle', kind: 'form', required: [] },
  lead_created: {
    owner: 'lead_lifecycle',
    kind: 'domain_fact',
    required: ['lead_id', 'company_id'],
  },
  lead_confirmation_viewed: { owner: 'lead_lifecycle', kind: 'exposure', required: ['lead_id'] },
  company_profile_claimed: {
    owner: 'company_activation',
    kind: 'domain_fact',
    required: ['company_id'],
  },
  company_activated: { owner: 'company_activation', kind: 'domain_fact', required: ['company_id'] },
  checkout_started: { owner: 'billing', kind: 'microconversion', required: [] },
  subscription_activated: { owner: 'billing', kind: 'domain_fact', required: ['company_id'] },
  invoice_paid: { owner: 'billing', kind: 'domain_fact', required: ['company_id'] },
  review_published: { owner: 'product', kind: 'domain_fact', required: [] },
  banner_view: { owner: 'inventory', kind: 'exposure', required: ['banner_id'] },
  banner_viewable_impression: {
    owner: 'inventory',
    kind: 'exposure',
    required: ['banner_id', 'slot'],
  },
  web_vital: { owner: 'platform', kind: 'performance', required: ['metric_name', 'metric_value'] },
  web_vitals: { owner: 'platform', kind: 'performance', required: ['metric_name', 'metric_value'] },
};

const LEGACY_ALIASES: Record<string, string> = {
  wizard_started: 'quote_wizard_started',
  wizard_contact_submitted: 'quote_contact_submitted',
};

export type ContractResult = EventContract & {
  canonicalEventName: string;
  missing: string[];
  valid: boolean;
};

export function resolveEventContract(
  eventName: string,
  properties: Record<string, unknown>
): ContractResult {
  const canonicalEventName = LEGACY_ALIASES[eventName] || eventName;
  const contract = CONTRACTS[canonicalEventName] || {
    owner: 'platform' as const,
    kind: 'diagnostic' as const,
    required: [],
  };
  const missing = contract.required.filter(
    (key) => properties[key] === undefined || properties[key] === null || properties[key] === ''
  );

  return {
    ...contract,
    canonicalEventName,
    missing,
    valid: missing.length === 0,
  };
}

export function getSurfaceKind(pathname: string): NonNullable<AnalyticsContext['surface_kind']> {
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/crm')) return 'crm';
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/review-dashboard')) return 'app';
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/auth')
  )
    return 'auth';
  return 'public';
}

/**
 * Classificação da superfície por hostname antes de interpretar a rota.
 *
 * /login e /dashboard podem existir em mais de um domínio. Usar somente
 * pathname mistura CRM, portal empresarial e marketplace nos relatórios.
 */
export function getSurfaceKindForHostname(
  hostname: string,
  pathname: string
): NonNullable<AnalyticsContext['surface_kind']> {
  const host = hostname.toLowerCase().trim().replace(/\.$/, '').replace(/:\d+$/, '');
  if (host === 'crm.avaliasolar.com.br') return 'crm';
  if (host === 'app.avaliasolar.com.br') return 'app';
  return getSurfaceKind(pathname);
}
