import type { TemplateBlock } from '@/components/sales/campaigns/templates/types';

export type CrmAiFeature =
  | 'email_first_touch'
  | 'email_rewrite'
  | 'subject_options'
  | 'template_create'
  | 'template_block_edit'
  | 'inbox_summary'
  | 'inbox_reply'
  | 'person_briefing'
  | 'account_briefing'
  | 'opportunity_recap'
  | 'opportunity_next_step'
  | 'sequence_planner'
  | 'campaign_preflight'
  | 'call_script'
  | 'whatsapp_followup'
  | 'call_organizer'
  | 'proposal_defense'
  | 'daily_digest';

export type CrmAiDecision = 'accepted' | 'edited' | 'rejected';

export interface OpenRouterCatalogModel {
  id: string;
  label: string;
  provider_family: string;
  tier: string;
  context_window: number;
  prompt_cost_per_1m_usd: number;
  completion_cost_per_1m_usd: number;
  supports_json: boolean;
  zdr_compatible: boolean;
  recommended_for: CrmAiFeature[];
}

export interface CrmAiProviderInfo {
  id: 'openrouter';
  name: string;
  base_url: string;
  is_primary: boolean;
  enabled: boolean;
  configured: boolean;
  credential_source: 'tenant_vault' | 'env_fallback' | 'none';
  masked_key?: string | null;
  key_status: 'unconfigured' | 'active' | 'invalid' | 'revoked' | 'error';
  last_tested_at?: string | null;
  last_latency_ms?: number | null;
  last_error?: string | null;
  require_zdr: boolean;
  can_manage_credentials: boolean;
}

export interface CrmAiSetting {
  id: number;
  company_id: number;
  provider: 'openrouter';
  enabled: boolean;
  openrouter_configured: boolean;
  openrouter_masked_key?: string | null;
  openrouter_key_status: string;
  openrouter_last_tested_at?: string | null;
  openrouter_last_latency_ms?: number | null;
  openrouter_last_error?: string | null;
  monthly_budget_usd: number;
  daily_user_limit: number;
  fallback_enabled: boolean;
  require_zdr: boolean;
  allowed_models: string[];
  allowed_context_fields: string[];
  updated_at?: string | null;
}

export interface CrmAiModelProfile {
  id?: number;
  feature: CrmAiFeature;
  primary_model_id: string;
  fallback_model_id?: string | null;
  temperature: number;
  max_tokens: number;
  enabled: boolean;
  quota_daily: number;
  updated_at?: string | null;
}

export interface CrmAiWarning {
  code: string;
  severity: 'info' | 'warning' | 'error';
  message: string;
}

export interface CrmAiSubjectOption {
  subject: string;
  preheader?: string;
}

export interface CrmAiGenerationResultPayload {
  subject?: string;
  preheader?: string;
  subjects?: CrmAiSubjectOption[];
  body_html?: string;
  body_text?: string;
  name?: string;
  category?: string;
  subject_template?: string;
  body_json?: {
    version?: number;
    blocks: TemplateBlock[];
  };
  summary?: string;
  key_points?: string[];
  next_actions?: Array<{ title: string; reason: string }>;
  rationale?: string;

  // WhatsApp Smart Scripts (Quick Win 1)
  message_text?: string;
  variations?: string[];

  // Call Logger Scribe (Quick Win 2)
  main_objection?: string;
  next_action?: string;
  suggested_action_date?: string;
  sentiment?: 'positive' | 'neutral' | 'hesitant' | 'negative';
  formatted_notes?: string;

  // Solar Proposal Executive Defense (Quick Win 3)
  executive_summary?: string;
  tir_comparison?: string;
  cumulative_savings_25yr?: string;
  payback_years?: string;
  defense_points?: string[];
  recommended_closing_question?: string;
  full_defense_text?: string;

  // Daily Funnel Morning Digest (Quick Win 4)
  headline?: string;
  priorities?: Array<{
    opportunity_id?: number;
    title: string;
    contact_name?: string;
    reason: string;
    urgency: 'high' | 'medium' | 'low';
    suggested_action: string;
    channel?: 'whatsapp' | 'call' | 'email';
  }>;
  quick_tip?: string;
}

export interface CrmAiGenerationRequest {
  idempotency_key?: string;
  feature: CrmAiFeature;
  action?: string;
  instructions?: string;
  context?: {
    contact_id?: number | null;
    account_id?: number | null;
    opportunity_id?: number | null;
    thread_id?: number | null;
    campaign_id?: number | null;
    template_id?: number | null;
    quote_id?: number | null;
  };
  draft?: {
    subject?: string;
    preheader?: string;
    body_html?: string;
    selected_text?: string;
    blocks?: TemplateBlock[];
  };
  options?: {
    tone?: 'consultivo' | 'direto' | 'executivo' | 'followup';
    length?: 'short' | 'medium' | 'detailed';
    language?: 'pt-BR' | 'en';
    variants?: number;
  };
}

export interface CrmAiGenerationResponse {
  generation_id: string;
  id: number;
  status: 'completed' | 'fallback_completed' | 'failed';
  feature: CrmAiFeature;
  action: string;
  provider: 'openrouter';
  requested_model: string;
  resolved_model: string;
  fallback_used: boolean;
  prompt_version: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    estimated_cost_usd: number;
    latency_ms: number;
  };
  sources_used: string[];
  missing_fields: string[];
  warnings: CrmAiWarning[];
  result: CrmAiGenerationResultPayload;
  user_decision?: CrmAiDecision | null;
  created_at?: string;
}

export interface CrmAiUsageResponse {
  summary: {
    monthly_budget_usd: number;
    monthly_spent_usd: number;
    monthly_generations: number;
    monthly_failures: number;
    monthly_prompt_tokens: number;
    monthly_completion_tokens: number;
    avg_latency_ms: number;
    daily_user_limit: number;
    daily_user_used: number;
  };
  by_feature: Record<string, number>;
  by_model: Record<string, number>;
  by_decision: Record<string, number>;
  recent_generations: Array<{
    id: number;
    generation_id: string;
    feature: CrmAiFeature;
    action: string;
    status: string;
    requested_model: string;
    resolved_model: string;
    fallback_used: boolean;
    prompt_tokens: number;
    completion_tokens: number;
    estimated_cost_usd: number;
    latency_ms: number;
    user_decision?: CrmAiDecision | null;
    error_code?: string | null;
    created_at?: string;
  }>;
}

