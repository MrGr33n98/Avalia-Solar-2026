import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { buildApiUrl, getApiRequestHeaders } from '@/lib/api-config';
import { toApiError } from '@/lib/api-error';

export type FounderInboxStatus = 'open' | 'acknowledged' | 'resolved' | 'dismissed';

export interface FounderInboxItem {
  id: number;
  kind: string;
  status: FounderInboxStatus;
  title: string;
  why: string;
  evidence: Array<Record<string, unknown>>;
  recommended_action: string;
  risk_tier: 'r0' | 'r1' | 'r2' | 'r3' | 'r4';
  approval_required: boolean;
  account_id: number | null;
  opportunity_id: number | null;
  observed_at: string;
  resolved_at: string | null;
}

interface FounderInboxResponse {
  records: FounderInboxItem[];
  total_count: number;
}

const queryKey = ['sales', 'founder-inbox'] as const;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const extraHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
  new Headers(init?.headers).forEach((value, key) => {
    extraHeaders[key] = value;
  });

  const response = await fetch(buildApiUrl(path), {
    ...init,
    headers: getApiRequestHeaders(extraHeaders),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw toApiError(body, { status: response.status });
  return body as T;
}

export function useFounderInbox(status?: FounderInboxStatus) {
  return useQuery({
    queryKey: [...queryKey, status || 'active'],
    queryFn: () =>
      request<FounderInboxResponse>(`/sales/founder_inbox${status ? `?status=${status}` : ''}`),
  });
}

export function useRefreshFounderInbox() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => request('/sales/founder_inbox/refresh', { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });
}

export function useUpdateFounderInboxItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: FounderInboxStatus }) =>
      request<FounderInboxItem>(`/sales/founder_inbox/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });
}
