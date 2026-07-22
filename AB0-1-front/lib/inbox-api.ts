import { fetchApiSafe } from '@/lib/api-client';

export type InboxMode = 'bot_only' | 'human_manual' | 'hybrid';
export type InboxStatus = 'active' | 'waiting_agent' | 'in_progress' | 'archived';
export type InboxMessageRole = 'user' | 'assistant' | 'agent' | 'system';

export interface InboxMessage {
  id: number;
  role: InboxMessageRole;
  content: string;
  sender_id?: number | null;
  sender_name?: string | null;
  client_message_id?: string | null;
  created_at: string;
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
  lead?: InboxLead | null;
  last_message?: InboxMessage | null;
}

export interface InboxCounts {
  all: number;
  waiting_agent: number;
  in_progress: number;
  archived: number;
}

export const inboxApi = {
  sessions: (companyId: number, status: string, query = '') => {
    const params = new URLSearchParams({ company_id: String(companyId), status });
    if (query.trim()) params.set('q', query.trim());
    return fetchApiSafe<{ sessions: InboxSession[]; counts: InboxCounts }>(
      `inbox/sessions?${params.toString()}`,
      { noCache: true }
    );
  },
  messages: (companyId: number, sessionId: number) =>
    fetchApiSafe<{ messages: InboxMessage[] }>(
      `inbox/sessions/${sessionId}/messages?company_id=${companyId}`,
      { noCache: true }
    ),
  send: (companyId: number, sessionId: number, content: string, clientMessageId: string) =>
    fetchApiSafe<InboxMessage>(`inbox/sessions/${sessionId}/messages?company_id=${companyId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, client_message_id: clientMessageId }),
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
};
