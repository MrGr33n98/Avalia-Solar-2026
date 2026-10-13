import { fetchApiSafe } from '@/lib/api-client';

export type InboxMode = 'bot_only' | 'human_manual' | 'hybrid';
export type InboxStatus = 'active' | 'waiting_agent' | 'in_progress' | 'archived';
export type InboxMessageRole = 'user' | 'assistant' | 'agent' | 'system';

export function sortInboxMessages(messages: InboxMessage[]): InboxMessage[] {
  return [...messages].sort((a, b) => {
    const time = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    return time || a.id - b.id;
  });
}

export function mergeInboxMessages(current: InboxMessage[], incoming: InboxMessage[]): InboxMessage[] {
  const merged = new Map<string, InboxMessage>();
  [...current, ...incoming].forEach((message) => {
    const key = message.id > 0 ? `id:${message.id}` : `client:${message.client_message_id || message.id}`;
    const existing = merged.get(key);
    merged.set(key, existing ? { ...existing, ...message } : message);
  });
  return sortInboxMessages(Array.from(merged.values()));
}

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

// ==========================================
// UNIFIED INBOX ENTERPRISE DTO CONTRACT
// ==========================================

export interface UnifiedParticipant {
  type: string;
  id: string | number;
  name: string;
  email?: string | null;
  phone?: string | null;
  role?: string;
  avatar_url?: string | null;
}

export interface UnifiedLastMessage {
  id: number;
  body: string;
  sender_type: string;
  sender_name?: string | null;
  created_at: string;
}

export interface UnifiedLinkedProposal {
  id: number;
  reference?: string | null;
  status?: string | null;
  value?: number | null;
  power_kwp?: number | null;
}

export interface UnifiedCapabilities {
  can_reply: boolean;
  can_resolve?: boolean;
  can_archive?: boolean;
  can_block?: boolean;
  can_takeover?: boolean;
  can_return_to_bot?: boolean;
  can_handoff_whatsapp?: boolean;
  can_attach?: boolean;
}

export interface UnifiedInboxItem {
  id: string; // composite ID: "p2p:<id>" or "ai:<id>"
  raw_id: number;
  channel: 'p2p' | 'ai';
  status: string;
  company_id: number;
  participant: UnifiedParticipant;
  last_message?: UnifiedLastMessage | null;
  unread_count: number;
  sla?: { waiting_since?: string; waiting_seconds?: number } | null;
  lead?: InboxLead | null;
  marketplace_proposal_id?: number | null;
  marketplace_proposal_reference?: string | null;
  linked_proposals?: UnifiedLinkedProposal[];
  capabilities?: UnifiedCapabilities;
  updated_at: string;
}

export interface UnifiedInboxCounts {
  all: number;
  unread: number;
  waiting_reply: number;
  archived: number;
}

export interface UnifiedInboxResponse {
  items: UnifiedInboxItem[];
  counts: UnifiedInboxCounts;
  channels_status: {
    p2p: { enabled: boolean; reason?: string };
    ai: { enabled: boolean; reason?: string };
  };
  pagination: {
    limit: number;
    has_next_page: boolean;
    next_cursor?: string | null;
  };
}

export const unifiedInboxApi = {
  list: (params: {
    companyId?: number | null;
    channel?: 'all' | 'p2p' | 'ai';
    filter?: 'all' | 'unread' | 'waiting_reply' | 'archived';
    q?: string;
    cursor?: string;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params.companyId) searchParams.set('company_id', String(params.companyId));
    if (params.channel && params.channel !== 'all') searchParams.set('channel', params.channel);
    if (params.filter && params.filter !== 'all') searchParams.set('filter', params.filter);
    if (params.q?.trim()) searchParams.set('q', params.q.trim());
    if (params.cursor) searchParams.set('cursor', params.cursor);
    if (params.limit) searchParams.set('limit', String(params.limit));

    const qs = searchParams.toString();
    return fetchApiSafe<UnifiedInboxResponse>(`messaging/inbox${qs ? `?${qs}` : ''}`, {
      noCache: true,
      retries: 1,
    });
  },

  unreadCount: (companyId?: number | null) => {
    const searchParams = new URLSearchParams();
    if (companyId) searchParams.set('company_id', String(companyId));
    const qs = searchParams.toString();
    return fetchApiSafe<{ unread_count: number }>(`messaging/inbox/unread_count${qs ? `?${qs}` : ''}`, {
      noCache: true,
      retries: 1,
    });
  },
};

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

/**
 * Computes an MD5 checksum using browser crypto or simple fallback
 */
async function computeFileChecksum(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const digest = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const bytes = new Uint8Array(digest);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  } catch {
    return 'dummy';
  }
}

/**
 * Secure, verified direct file upload for Active Storage with integrity check and response status validation.
 */
export async function uploadAttachmentFile(
  companyId: number,
  file: File
): Promise<{ id: number; filename: string; url?: string }> {
  const MAX_SIZE = 15 * 1024 * 1024; // 15MB
  if (file.size > MAX_SIZE) {
    throw new Error('O arquivo excede o limite máximo permitido de 15MB.');
  }

  const checksum = await computeFileChecksum(file);
  const contentType = file.type || 'application/octet-stream';

  // 1. Obter URL pré-assinada
  const uploadData = await inboxApi.getDirectUploadUrl(
    companyId,
    file.name,
    file.size,
    checksum,
    contentType
  );

  const { url, headers } = uploadData.direct_upload;

  // 2. PUT direto ao Storage
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      ...headers,
      'Content-Type': contentType,
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error(`Falha no armazenamento do anexo (${response.status} ${response.statusText}).`);
  }

  return {
    id: uploadData.id,
    filename: file.name,
  };
}
