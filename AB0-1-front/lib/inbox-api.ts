import { fetchApiSafe } from '@/lib/api-client';

export type InboxMode = 'bot_only' | 'human_manual' | 'hybrid';
export type InboxStatus = 'active' | 'waiting_agent' | 'in_progress' | 'archived';
export type InboxMessageRole = 'user' | 'assistant' | 'agent' | 'system';

export interface InboxActivity {
  id: number;
  type: string;
  old_status?: string | null;
  new_status?: string | null;
  performed_by_id?: number | null;
  created_at: string;
}

export interface InboxMessage {
  id: number;
  role: InboxMessageRole;
  content: string;
  sender_id?: number | null;
  sender_name?: string | null;
  client_message_id?: string | null;
  created_at: string;
  attachments?: {
    id: number;
    filename: string;
    url: string;
    content_type: string;
  }[];
}

export interface InboxLead {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  score: number;
  temperature: string;
  monthly_bill?: string | number | null;
  solution_type?: string | null;
  project_type?: string | null;
  recommended_next_action?: string | null;
}

export interface InboxSession {
  id: number;
  company_id: number;
  mode: InboxMode;
  status: InboxStatus;
  unread_count: number;
  last_message_at?: string | null;
  vertical?: string | null;
  assigned_agent?: { id: number; name: string } | null;
  human_requested_at?: string | null;
  human_taken_over_at?: string | null;
  summary_card?: string | null;
  lead?: InboxLead | null;
  last_message?: InboxMessage | null;
  sla_breached_tracked?: boolean;
  is_online?: boolean;
}

export interface InboxCounts {
  all: number;
  waiting_agent: number;
  in_progress: number;
  archived: number;
}

export const inboxApi = {
  sessions: (companyId: number, status: string, query = '', cursor?: string) => {
    const params = new URLSearchParams({ company_id: String(companyId), status });
    if (query.trim()) params.set('q', query.trim());
    if (cursor) params.set('cursor', cursor);
    return fetchApiSafe<{
      sessions: InboxSession[];
      counts: InboxCounts;
      next_cursor?: string | null;
    }>(`inbox/sessions?${params.toString()}`, { noCache: true, retries: 1 });
  },
  activities: (companyId: number, sessionId: number) =>
    fetchApiSafe<{ activities: InboxActivity[] }>(
      `inbox/sessions/${sessionId}/activities?company_id=${companyId}`,
      { noCache: true, retries: 1 }
    ),
  messages: (companyId: number, sessionId: number, cursor?: string) =>
    fetchApiSafe<{ messages: InboxMessage[]; next_cursor?: string | null }>(
      `inbox/sessions/${sessionId}/messages?company_id=${companyId}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`,
      { noCache: true, retries: 1 }
    ),
  send: (
    companyId: number,
    sessionId: number,
    content: string,
    clientMessageId: string,
    attachmentIds?: number[]
  ) =>
    fetchApiSafe<InboxMessage>(`inbox/sessions/${sessionId}/messages?company_id=${companyId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        client_message_id: clientMessageId,
        attachment_ids: attachmentIds,
      }),
      noCache: true,
    }),
  updateMode: (companyId: number, sessionId: number, mode: InboxMode) =>
    fetchApiSafe<InboxSession>(`inbox/sessions/${sessionId}/mode?company_id=${companyId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
      noCache: true,
    }),
  markRead: (companyId: number, sessionId: number) =>
    fetchApiSafe<InboxSession>(`inbox/sessions/${sessionId}/read?company_id=${companyId}`, {
      method: 'POST',
      noCache: true,
    }),
  archive: (companyId: number, sessionId: number) =>
    fetchApiSafe<InboxSession>(`inbox/sessions/${sessionId}/archive?company_id=${companyId}`, {
      method: 'POST',
      noCache: true,
    }),
  handoffToWhatsApp: (companyId: number, sessionId: number) =>
    fetchApiSafe<InboxMessage>(
      `inbox/sessions/${sessionId}/handoff_whatsapp?company_id=${companyId}`,
      {
        method: 'POST',
        noCache: true,
      }
    ),
  getDirectUploadUrl: (
    companyId: number,
    filename: string,
    byteSize: number,
    checksum: string,
    contentType: string
  ) =>
    fetchApiSafe<{
      id: number;
      signed_id: string;
      direct_upload: { url: string; headers: Record<string, string> };
    }>(`chat/attachments?company_id=${companyId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, byte_size: byteSize, checksum, content_type: contentType }),
      noCache: true,
    }),
};
