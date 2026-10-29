export interface SalesTimelineActor {
  id: number;
  name: string;
  avatar_url?: string | null;
}

export interface SalesTimelineEmailReply {
  id: number;
  from: string;
  preview: string;
  occurred_at: string;
  classification?: string;
}

export interface SalesTimelineEmail {
  id: number;
  parent_id?: number | null;
  direction: 'inbound' | 'outbound';
  subject: string;
  preview: string;
  from: string;
  to: string[];
  delivery_status: string;
  engagement_status: string;
  error_message?: string | null;
  replies_count?: number;
  replies?: SalesTimelineEmailReply[];
  body_text?: string;
  body_html?: string;
}

export interface SalesEmailEngagement {
  raw_open_signals: number;
  unique_open_signals: number;
  human_likely_open_signals: number;
  proxy_open_signals: number;
  bot_open_signals: number;
  scanner_open_signals: number;
  raw_clicks: number;
  unique_clicks: number;
  replies: number;
}

export interface SalesEmailLifecycleEvent {
  type: string;
  occurred_at: string;
  signal_class?: string;
  source?: string;
  classification_reasons?: string[];
}

export interface SalesTimelineEvent {
  id: string;
  kind: 'activity' | 'call' | 'email' | 'note' | 'task' | 'stage_changed' | 'quote' | 'won' | 'lost' | 'website';
  type?: string;
  title?: string;
  activity_type?: string;
  preview?: string;
  occurred_at: string;
  actor?: SalesTimelineActor;
  email?: SalesTimelineEmail;
  engagement?: SalesEmailEngagement;
  lifecycle?: SalesEmailLifecycleEvent[];
  body_text?: string;
  body_html?: string;
  opens_count?: number;
  clicks_count?: number;
}

export interface SalesTimelineResponse {
  timeline: SalesTimelineEvent[];
  meta: { cursor: string };
}
