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

export type OpportunityLostReason =
  | 'lost_to_competitor'
  | 'price_terms'
  | 'project_cancelled'
  | 'no_response'
  | 'other';

export interface MarkOpportunityLostPayload {
  lostReason: OpportunityLostReason;
  lostNotes?: string;
  competitorId?: number;
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
  owner?: { id: number; name?: string; email?: string } | null;
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
  owner_id?: number | 'unassigned' | 'me';
  temperature?: string;
  stage_key?: string;
  value_min?: number;
  value_max?: number;
  tag_ids?: number[];
  closing_this_week?: boolean | string;
  filters?: NutshellFilterCriteria;
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
  qualification?: {
    spin_completion?: number;
    bant_completion?: number;
    score?: number;
    bant_summary?: string;
    spin_summary?: string;
  } | null;
  last_activity?: { id: number; type: string; description: string; occurred_at: string } | null;
  next_action?: { id: number; type: string; title: string; due_at?: string; overdue: boolean } | null;
  aging: { days_in_stage: number; stage_entered_at: string; stale: boolean };
  flags: { overdue: boolean; due_today: boolean; stale: boolean; hot: boolean; no_contact: boolean; no_owner: boolean };
  created_at?: string;
  expected_close_date?: string | null;
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
    hot_deals?: number;
    hot_deals_cents?: number;
  };
  funnel: Array<{
    id?: number;
    stage: string;
    position?: number;
    count: number;
    valor?: number;
    value_cents?: number;
    conversion_rate_from_prev?: number;
    drop_off_rate?: number;
  }>;
  pipeline?: { id: number; name: string; key: string } | null;
  pipelines?: Array<{ id: number; name: string; key: string }>;
  win_loss: Array<{ name: string; value: number; color?: string }>;
  revenue_by_month: Array<{ month: string; realizado?: number; previsao?: number; won_cents?: number; pipeline_cents?: number }>;
  loss_reasons?: Array<{ name: string; count: number; value: number; color: string }>;
  team_performance?: Array<{
    owner_id: number;
    name: string;
    email: string;
    total_deals: number;
    won_deals: number;
    lost_deals: number;
    won_revenue_cents: number;
    win_rate: number;
  }>;
  email_metrics?: Record<'sent' | 'delivered' | 'open' | 'click' | 'replied' | 'bounce' | 'complaint', number>;
  stage_durations?: Array<{
    stage_id: number;
    stage_name: string;
    count: number;
    avg_days: number;
    avg_hours: number;
  }>;
  task_performance?: {
    total: number;
    completed: number;
    completed_on_time: number;
    completed_late: number;
    completed_without_due_date: number;
    pending: number;
    pending_on_time: number;
    pending_overdue: number;
    on_time_rate: number;
  };
  top_products?: Array<{
    product_id: number;
    name: string;
    category: string;
    deals_count: number;
    total_quantity: number;
    total_revenue_cents: number;
  }>;
  competitor_losses?: Array<{
    competitor_id: number;
    name: string;
    count: number;
    value: number;
    color: string;
  }>;
  quota_attainment?: {
    has_quota: boolean;
    target_cents: number;
    actual_cents: number;
    target_deals: number;
    actual_deals: number;
    attainment_percent: number;
    ideal_pace_percent: number;
    pace_status: 'on_track' | 'behind_pace' | 'no_quota';
    reps: Array<{
      user_id: number;
      user_name: string;
      target_cents: number;
      actual_cents: number;
      attainment_percent: number;
      target_deals: number;
      actual_deals: number;
    }>;
  };
  revenue_installments?: {
    has_installments: boolean;
    total_installments_count: number;
    collected_cents: number;
    planned_cents: number;
    overdue_cents: number;
    due_next_30d_cents: number;
    due_next_90d_cents: number;
  };
}

export type NutshellReportType = 'sales' | 'forecast' | 'new_leads';
export type NutshellGranularity = 'day' | 'week' | 'month' | 'quarter' | 'year';
export type NutshellMeasure = 'value' | 'quantity';
export type NutshellSegmentBy = 'none' | 'confidence' | 'assignee' | 'source';

export interface NutshellDataPoint {
  date: string;
  label: string;
  value: number;
  count: number;
  quota: number;
  target_pace: number;
}

export interface NutshellSummary {
  total_value: number;
  total_count: number;
  granularity_unit: string;
  avg_per_period_value: number;
  avg_per_period_count: number;
  avg_cycle_days: number;
  avg_lead_value: number;
}

export interface NutshellReportResponse {
  report_type: NutshellReportType;
  granularity: NutshellGranularity;
  measure: NutshellMeasure;
  segment_by: NutshellSegmentBy;
  date_range: {
    from: string;
    to: string;
  };
  series: NutshellDataPoint[];
  summary: NutshellSummary;
}

export interface FilterOptionItem {
  id: number | string;
  name: string;
  color?: string;
  key?: string;
  pipeline_id?: number;
  position?: number;
}

export interface ApiFilterOptions {
  assignees: FilterOptionItem[];
  pipelines: FilterOptionItem[];
  stages: FilterOptionItem[];
  sources: FilterOptionItem[];
  tags: FilterOptionItem[];
  competitors: FilterOptionItem[];
  products: FilterOptionItem[];
  states: FilterOptionItem[];
  outcomes: FilterOptionItem[];
  channels: FilterOptionItem[];
}

export interface FilterOptionsResponse {
  options: ApiFilterOptions;
}

export type FilterOperator = 'is' | 'is_not';

export interface CriterionSelection {
  operator: FilterOperator;
  selectedIds: (number | string)[];
}

export interface RangeCriterion {
  min?: number;
  max?: number;
  from?: string;
  to?: string;
  days?: number;
}

export interface NutshellFilterCriteria {
  assignee?: CriterionSelection;
  status?: CriterionSelection;
  pipeline?: CriterionSelection;
  priority?: CriterionSelection;
  closeDate?: RangeCriterion;
  createdVia?: CriterionSelection;
  lastContacted?: RangeCriterion;
  openDate?: RangeCriterion;
  outcome?: CriterionSelection;
  sources?: CriterionSelection;
  stage?: CriterionSelection;
  tags?: CriterionSelection;
  value?: RangeCriterion;
  tickets?: RangeCriterion;
  address?: CriterionSelection;
  age?: RangeCriterion;
  channels?: CriterionSelection;
  companies?: CriterionSelection;
  competitors?: CriterionSelection;
  confidence?: RangeCriterion;
  createdBy?: CriterionSelection;
  leadName?: string;
  market?: CriterionSelection;
  number?: string;
  products?: CriterionSelection;
  watchedBy?: CriterionSelection;
}

// -------------------------------------------------------------
// Snapshots: Pipeline Size & Win Rate Canonical Types
// -------------------------------------------------------------
export interface PipelineSnapshotSummary {
  avg_open_count: number | null;
  avg_open_value_cents: number | null;
  delta_open_count_pct: number | null;
  delta_open_value_pct: number | null;
  valid_snapshots_count: number;
}

export interface PipelineSnapshotPoint {
  date: string;
  open_count: number | null;
  open_value_cents: number | null;
  has_snapshot: boolean;
  is_live_estimated?: boolean;
}

export interface WinRateSnapshotSummary {
  won_count: number;
  lost_count: number;
  closed_count: number;
  win_rate_pct: number | null;
  win_rate_delta_pp: number | null;
}

export interface WinRateSnapshotPoint {
  date: string;
  won_count: number;
  lost_count: number;
  cancelled_count: number;
  closed_count: number;
  win_rate_pct: number | null;
}

export interface SnapshotsMeta {
  from: string;
  to: string;
  timezone: string;
  granularity: 'day' | 'week' | 'month';
  currency: string;
  historical_coverage_from: string | null;
  coverage: 'full' | 'partial' | 'none';
  as_of: string;
  definition_version: number;
}

export interface SnapshotsReportResponse {
  meta: SnapshotsMeta;
  pipeline: {
    summary: PipelineSnapshotSummary;
    series: PipelineSnapshotPoint[];
  };
  win_rate: {
    summary: WinRateSnapshotSummary;
    series: WinRateSnapshotPoint[];
  };
}

export interface SnapshotsReportParams {
  from?: string;
  to?: string;
  granularity?: 'day' | 'week' | 'month';
  pipeline_id?: number | string;
  owner_ids?: (number | string)[];
  format?: 'json' | 'csv';
}

export interface LeadsAnalyticsSummary {
  total_leads: number;
  total_value_cents: number;
  total_value_formatted: string;
  avg_value_cents: number;
  avg_value_formatted: string;
  avg_time_open_days: number;
  win_rate_percentage: number;
}

export interface LeadsTimeSeriesItem {
  period_label: string;
  start_date: string;
  quantity: number;
  value_cents: number;
}

export interface LeadsBreakdownItem {
  id?: number | null;
  label: string;
  count: number;
  percentage: number;
  status?: string;
  color?: string;
}

export interface LeadsBreakdowns {
  assignee: LeadsBreakdownItem[];
  stage: LeadsBreakdownItem[];
  product: LeadsBreakdownItem[];
  outcome: LeadsBreakdownItem[];
  source: LeadsBreakdownItem[];
  competitor: LeadsBreakdownItem[];
  tag: LeadsBreakdownItem[];
  territory: LeadsBreakdownItem[];
  age: LeadsBreakdownItem[];
  value_bracket: LeadsBreakdownItem[];
  channel: LeadsBreakdownItem[];
}

export interface LeadsAnalyticsResponse {
  summary: LeadsAnalyticsSummary;
  time_series: LeadsTimeSeriesItem[];
  breakdowns: LeadsBreakdowns;
}



