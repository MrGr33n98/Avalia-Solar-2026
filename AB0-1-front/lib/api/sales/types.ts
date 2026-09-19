export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string[]>;
    request_id?: string;
  };
}

export interface ApiStage {
  id: number;
  name: string;
  key: string;
  position: number;
  probability?: number | null;
}

export interface ApiPipeline {
  id: number;
  name: string;
  key: string;
  active: boolean;
  stages: ApiStage[];
}

export interface ApiSource {
  id: number;
  name: string;
  slug: string;
}

export interface ApiCompetitor {
  id: number;
  name: string;
  website?: string;
}

export interface ApiAccount {
  id: number;
  name: string;
  domain?: string | null;
  website?: string | null;
  cnpj?: string | null;
  city?: string | null;
  state?: string | null;
  phone?: string | null;
  email?: string | null;
  status?: string | null;
  segment?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ApiContact {
  id: number;
  first_name: string;
  last_name?: string | null;
  name?: string;
  email?: string | null;
  phone?: string | null;
  job_title?: string | null;
  sales_account_id?: number | null;
  account_name?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ApiSavedView {
  id: number;
  name: string;
  resource_type: 'account' | 'contact' | 'opportunity';
  filters: Record<string, unknown>;
  sort: Record<string, unknown>;
  columns: string[];
  is_default?: boolean;
  is_pinned?: boolean;
  is_shared?: boolean;
  created_at?: string;
}

export interface ApiTag {
  id: number;
  name: string;
  slug: string;
  color: string;
  description?: string | null;
  entity_type: string;
  records_count?: number;
}

export interface ApiOpportunity {
  id: number;
  name: string;
  value_cents: number;
  probability?: number | null;
  status: string;
  stage_key?: string | null;
  sales_account_id?: number | null;
  sales_pipeline_id?: number | null;
  primary_contact_id?: number | null;
  account?: { id: number; name: string } | null;
  stage?: { id: number; key: string; name: string } | null;
  contact_name?: string | null;
  owner_id?: number | null;
  source?: string | null;
  stage_entered_at?: string | null;
  next_activity_at?: string | null;
  expected_close_date?: string | null;
  priority?: string | null;
  created_at?: string;
  updated_at?: string;
}

// No produto, um Lead comercial é persistido e serializado como Sales::Opportunity.
export type SalesLead = ApiOpportunity;

export interface CreateLeadPayload {
  name: string;
  sales_account_id?: number;
  primary_contact_id?: number;
  sales_pipeline_id: number;
  stage_key?: string;
  value_cents?: number;
  currency?: string;
  probability?: number;
  expected_close_date?: string | null;
  temperature?: 'cold' | 'warm' | 'hot';
  source_id?: number | null;
  competitor_ids?: number[];
  contact_ids?: number[];
  account?: {
    name: string;
    domain?: string;
  };
}

export interface PipelineBoardParams {
  search?: string;
  status?: string;
  owner_id?: number | 'unassigned';
  temperature?: string;
  stage_key?: string;
  value_min?: number;
  value_max?: number;
  tag_ids?: number[];
}

export interface ApiPipelineBoardCard {
  id: number;
  name: string;
  status: string;
  account?: { id: number; name: string } | null;
  primary_contact?: { id: number; name: string; email?: string; phone?: string; role?: string } | null;
  owner?: { id: number; name: string; email?: string; avatar_url?: string } | null;
  stage?: { id: number; key: string; name: string; position: number; probability: number } | null;
  value_cents: number;
  currency: string;
  probability: number;
  weighted_value_cents: number;
  priority: string;
  temperature: 'cold' | 'warm' | 'hot' | string;
  source?: string | null;
  qualification?: { score: number; bant_summary?: string; spin_summary?: string } | null;
  last_activity?: { id: number; type: string; description: string; occurred_at: string } | null;
  next_action?: { id: number; type: string; title: string; due_at?: string; overdue: boolean } | null;
  aging: { days_in_stage: number; stage_entered_at: string; stale: boolean };
  flags: { overdue: boolean; due_today: boolean; stale: boolean; hot: boolean; no_contact: boolean; no_owner: boolean };
  tags: Array<{ id: number; name: string; color?: string }>;
}

export interface ApiPipelineBoard {
  pipeline: {
    id: number;
    name: string;
    key: string;
  };
  stages: Array<{
    id: number;
    key: string;
    name: string;
    position: number;
    probability: number;
    total_cards: number;
    total_value_cents: number;
  }>;
  cards: ApiPipelineBoardCard[];
  totals: {
    total_cards: number;
    total_value_cents: number;
    total_weighted_value_cents: number;
  };
}

export interface ApiTask {
  id: number;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  task_type: string;
  due_at?: string | null;
  completed_at?: string | null;
  owner_id?: number | null;
  sales_account_id?: number | null;
  sales_opportunity_id?: number | null;
  sales_contact_id?: number | null;
  account_name?: string | null;
  contact_name?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ApiAnalytics {
  kpis: {
    pipeline_value_cents: number;
    weighted_pipeline_cents: number;
    won_revenue_cents: number;
    conversion_rate: number;
    average_ticket_cents: number;
    average_sales_cycle_days: number;
    open_deals: number;
    won_deals: number;
    lost_deals: number;
  };
  funnel: Array<{ stage: string; count: number; valor: number; value_cents: number }>;
  win_loss: Array<{ name: string; value: number; color?: string }>;
  revenue_by_month: Array<{ month: string; realizado: number; previsao: number; won_cents: number; pipeline_cents: number }>;
}
