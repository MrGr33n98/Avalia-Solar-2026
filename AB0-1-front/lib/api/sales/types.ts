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
  terminal_type?: 'won' | 'lost' | null;
  opportunities_count?: number;
  checklist?: string[];
}

export interface ApiPipeline {
  id: number;
  name: string;
  key: string;
  active: boolean;
  opportunities_count?: number;
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

export interface NextBestActionDTO {
  action_type: string;
  title: string;
  priority: 'low' | 'medium' | 'high' | 'urgent' | string;
  reason?: string;
  cta_label?: string;
  target_contact_id?: number | null;
  target_opportunity_id?: number | null;
}

export interface AccountMarketplaceDTO {
  id: number;
  name: string;
  slug?: string | null;
  rating_avg?: number | null;
  rating_count?: number | null;
  verified?: boolean;
  claimed?: boolean;
  claim_status?: 'claimed' | 'unclaimed' | 'pending' | 'unknown' | string;
  city?: string | null;
  state?: string | null;
  logo_url?: string | null;
  profile_url?: string | null;
}

export interface AccountSummaryDTO {
  contacts_count?: number;
  opportunities_count?: number;
  open_opportunities_count?: number;
  open_pipeline_value_cents?: number;
  won_opportunities_count?: number;
  won_pipeline_value_cents?: number;
  activities_count?: number;
  tasks_count?: number;
  emails_sent_count?: number;
  emails_opened_count?: number;
  last_email_sent_at?: string | null;
  last_activity_at?: string | null;
}

export interface AccountContactItem {
  id: number;
  first_name: string;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  job_title?: string | null;
  decision_role?: string | null;
  is_primary?: boolean;
}

export interface AccountOpportunityItem {
  id: number;
  name: string;
  value_cents?: number | null;
  probability?: number | null;
  stage_id?: number | null;
  status?: string | null;
  expected_close_date?: string | null;
  created_at?: string;
}

export interface AccountActivityItem {
  id: number;
  activity_type: string;
  subject: string;
  body?: string | null;
  occurred_at: string;
  actor_name?: string | null;
}

export interface AccountTaskItem {
  id: number;
  title: string;
  due_at?: string | null;
  completed_at?: string | null;
  priority?: string | null;
  status?: string | null;
}

export interface DetailedAccount {
  id: number;
  name: string;
  domain?: string | null;
  website?: string | null;
  cnpj?: string | null;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  state?: string | null;
  segment?: string | null;
  status?: string | null;
  tags?: Array<{ id: number; name: string; color?: string | null }>;
  owner_name?: string | null;
  owner_id?: number | null;
  fit_score?: number | { score: number; breakdown: Record<string, unknown>[] } | null;
  data_quality?: number | { score: number; missing_fields: string[] } | null;
  next_best_action?: NextBestActionDTO | null;
  contacts?: AccountContactItem[];
  opportunities?: AccountOpportunityItem[];
  activities?: AccountActivityItem[];
  tasks?: AccountTaskItem[];
  marketplace?: AccountMarketplaceDTO | null;
  summary?: AccountSummaryDTO;
  solar_project_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AccountDetailResponse {
  account: DetailedAccount;
  meta?: Record<string, unknown>;
}

export interface AccountTimelineEvent {
  id: string;
  type: string;
  kind: string;
  title: string;
  description?: string | null;
  occurred_at: string;
  actor_name?: string | null;
  activity_type?: string | null;
  subject?: string | null;
  preview?: string | null;
  metadata?: Record<string, unknown>;
}

export interface AccountTimelineResponse {
  events: AccountTimelineEvent[];
  next_cursor?: string | null;
  meta?: Record<string, unknown>;
}

export type ContactMethodKind = 'email' | 'phone' | 'whatsapp' | 'linkedin' | 'instagram' | 'website';

export interface ApiContactMethod {
  id: number;
  contact_id?: number;
  kind: ContactMethodKind;
  value: string;
  normalized_value?: string;
  label: string;
  is_primary: boolean;
  position: number;
  source?: string;
  created_at: string;
  updated_at?: string;
}

export interface UpsertContactMethodPayload {
  kind: ContactMethodKind;
  value: string;
  label?: string;
  is_primary?: boolean;
  position?: number;
  source?: string;
}

export interface ApiContact {
  id: number;
  first_name: string;
  last_name?: string | null;
  name?: string;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  linkedin_url?: string | null;
  job_title?: string | null;
  sales_account_id?: number | null;
  account_name?: string | null;
  contact_methods?: ApiContactMethod[];
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
  tags?: ApiTag[];
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
    already_count?: number;
    remain_count?: number;
    added_count?: number;
    average_time_days?: number;
    advanced_count?: number;
    conversion_rate?: number;
    closed_count?: number;
    closed_rate?: number;
    won_count?: number;
    won_rate?: number;
    lost_count?: number;
    lost_rate?: number;
    cancelled_count?: number;
    cancelled_rate?: number;
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
  activity_metrics?: {
    total_activities: number;
    with_notes_count: number;
    ai_summarized_count: number;
    avg_duration_seconds: number | null;
    total_duration_hours: number | null;
    avg_per_week: number;
    has_real_duration: boolean;
  };
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

export interface ActivityFilterCriteria {
  from?: string;
  to?: string;
  granularity?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  types?: string[];
  actor_ids?: number[];
  log_statuses?: string[];
  include_emails?: boolean;
  include_notes?: boolean;
  segment_by?: 'type' | 'actor' | 'status';
}

export interface ApiActivityReportResponse {
  period: {
    from: string;
    to: string;
    granularity: 'day' | 'week' | 'month' | 'quarter' | 'year';
  };
  kpis: {
    total_activities: number;
    ai_summarized: number;
    with_notes: number;
    avg_duration_seconds: number | null;
    total_duration_hours: number | null;
    avg_per_week: number;
    has_real_duration: boolean;
  };
  series: Array<{
    date: string;
    total: number;
    [key: string]: string | number;
  }>;
  by_actor: Array<{
    id: number;
    name: string;
    email: string;
    total_activities: number;
    calls: number;
    meetings: number;
    emails: number;
    notes: number;
    tasks: number;
    total_duration_seconds: number;
  }>;
  by_type: Array<{
    type: string;
    name: string;
    count: number;
    percentage: number;
    color: string;
  }>;
  recent_activities: Array<{
    id: number;
    activity_type: string;
    direction?: string;
    subject: string;
    occurred_at: string;
    actor?: { id: number; name: string } | null;
    account?: { id: number; name: string } | null;
    contact?: { id: number; name: string } | null;
    opportunity?: { id: number; name: string } | null;
    duration_seconds?: number | null;
    log_status?: string;
  }>;
  meta: {
    filters: {
      types: string[];
      actor_ids: number[];
      log_statuses: string[];
      include_emails: boolean;
      include_notes: boolean;
      segment_by: string;
    };
  };
}

export interface ApiWidgetEngagementReportResponse {
  period: {
    from: string;
    to: string;
    granularity: 'day' | 'week' | 'month';
  };
  widget_status: 'enabled' | 'disabled';
  surface: string;
  kpis: {
    visitors: number;
    opens: number;
    actions: number;
    contacts: number;
    sales: number;
    attributed_value_cents: number;
  };
  rates: {
    open_rate: number;
    action_rate: number;
    contact_rate: number;
    sales_rate: number;
  };
  series: Array<{
    date: string;
    visitors: number;
    opens: number;
    actions: number;
    contacts: number;
    sales: number;
  }>;
  meta: {
    attribution_model: string;
    coverage: string;
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

// -------------------------------------------------------------
// Sales Inbox (Opção A - Proposta Bidirecional)
// -------------------------------------------------------------
export interface InboxMailboxSyncState {
  folder_id: string;
  cursor?: string | null;
  last_started_at?: string | null;
  last_succeeded_at?: string | null;
  last_error_code?: string | null;
  retry_count?: number;
}

export interface InboxMailbox {
  id: number;
  email: string;
  provider: 'zoho' | 'ses' | 'google' | 'microsoft' | string;
  provider_account_id?: string | null;
  provider_region?: string | null;
  connection_status: 'pending' | 'healthy' | 'needs_reconnect' | 'paused' | 'disconnected' | string;
  sync_status: 'idle' | 'syncing' | 'healthy' | 'degraded' | 'error' | string;
  last_synced_at?: string | null;
  messages_imported?: number;
  messages_failed?: number;
  stored_messages?: number;
  stored_threads?: number;
  sync_error?: string | null;
  sync_states?: InboxMailboxSyncState[];
  token_expired?: boolean;
  created_at: string;
}

export interface InboxThreadSummary {
  id: number;
  sales_email_account_id?: number | null;
  subject: string;
  status: 'open' | 'pending' | 'resolved' | 'archived';
  first_message_at?: string | null;
  last_message_at: string;
  message_count: number;
  messages_count?: number;
  unread_count: number;
  assigned_user?: { id: number; name: string } | null;
  assigned_user_name?: string | null;
  contact?: { id: number; name: string; email: string; phone?: string | null } | null;
  contact_name?: string | null;
  sales_contact_id?: number | null;
  account?: { id: number; name: string } | null;
  company_name?: string | null;
  sales_account_id?: number | null;
  opportunity?: { id: number; name: string; stage?: string; value_cents?: number } | null;
  opportunity_title?: string | null;
  opportunity_stage?: string | null;
  sales_opportunity_id?: number | null;
  snippet?: string | null;
  latest_message_snippet?: string | null;
  sender_name?: string | null;
  sender_email?: string | null;
  latest_message_from?: string | null;
  direction?: 'inbound' | 'outbound' | null;
  latest_message_direction?: 'inbound' | 'outbound' | null;
}

export interface InboxMessageItem {
  id: number;
  from_name?: string;
  from_email: string;
  to_email: string;
  subject: string;
  direction: 'inbound' | 'outbound';
  status: string;
  delivery_status?: string | null;
  body_text?: string | null;
  body_html?: string | null;
  provider_message_id?: string | null;
  received_at?: string;
  created_at: string;
  cc?: string[];
  bcc?: string[];
  attachments?: Array<{
    id: number;
    file_name?: string;
    filename?: string;
    file_size?: number;
    content_type?: string;
    download_url?: string;
  }>;
}

export interface InboxThreadDetail extends InboxThreadSummary {
  provider_thread_id?: string | null;
  messages?: InboxMessageItem[];
}

export interface InboxCounts {
  inbox: number;
  sent: number;
  drafts?: number;
  unread?: number;
  all?: number;
  open: number;
  pending: number;
  resolved: number;
  archived: number;
}

export interface InboxThreadsResponse {
  threads: InboxThreadSummary[];
  counts: InboxCounts;
  meta: {
    page: number;
    per_page: number;
    total_records: number;
    total_pages: number;
  };
}




export interface MunicipalityLocationDTO {
  key: string;
  country: string;
  state: string;
  city: string;
  latitude: number;
  longitude: number;
  precision: 'municipality_centroid';
  lead_count: number;
  value_cents: number;
  status_counts: Record<string, number>;
}

export interface LeadsMapSummaryDTO {
  total_filtered: number;
  mappable: number;
  unmapped: number;
  missing_city_state: number;
  unsupported_municipality: number;
  total_value_cents: number;
  mapped_value_cents: number;
}

export interface LeadsMapMetaDTO {
  location_source: string;
  location_dataset_version: string;
  as_of: string;
  filters_applied: string[];
}

export interface LeadsMapResponse {
  summary: LeadsMapSummaryDTO;
  locations: MunicipalityLocationDTO[];
  meta: LeadsMapMetaDTO;
}

export interface LeadsMapParams {
  pipeline_id?: number | null;
  q?: string;
  status?: string;
  status_in?: string[];
  states?: string[];
  city?: string;
  filters?: NutshellFilterCriteria;
  [key: string]: unknown;
}
