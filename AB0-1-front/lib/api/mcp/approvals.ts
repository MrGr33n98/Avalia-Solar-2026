// ============================================================
// AI APPROVAL CONTROL PLANE — API CONTRACT & TANSTACK HOOKS
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { buildApiUrl, getApiRequestHeaders } from '@/lib/api-config';
import { toApiError } from '@/lib/api-error';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'executed' | 'expired';
export type ApprovalRiskTier = 'r0' | 'r1' | 'r2' | 'r3' | 'r4';

export interface ApprovalRequest {
  id: number;
  request_uuid: string;
  agent_id: string;
  tool_name: string;
  risk_tier: ApprovalRiskTier;
  status: ApprovalStatus;
  tenant_id?: number | null;
  tenant_name?: string | null;
  requested_by_user_id?: number | null;
  requester_name?: string | null;
  approved_by_user_id?: number | null;
  approver_name?: string | null;
  rejection_reason?: string | null;
  snoozed_until?: string | null;
  snoozed: boolean;
  execution_id?: string | null;
  parameters_payload: Record<string, any>;
  payload_digest: string;
  requested_at: string;
  expires_at: string;
  executed_at?: string | null;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface ApprovalStats {
  pending: number;
  active_pending: number;
  snoozed: number;
  high_risk_pending: number;
  expiring_soon: number;
  approved: number;
  executed: number;
  rejected: number;
  expired: number;
}

export interface ApprovalPolicyInfo {
  risk_policy: {
    tier: string;
    level: string;
    hitl_default: boolean;
    approver_requirement: string;
    auto_executable: boolean;
  };
  execution_policy: {
    tool_name: string;
    effect_type: string;
    idempotency_proven: boolean;
    async_execution_recommended: boolean;
    retry_strategy: string;
  };
  who_can_approve: string;
  user_can_approve: boolean;
}

export interface ApprovalDetailResponse {
  data: ApprovalRequest;
  policy: ApprovalPolicyInfo;
}

export interface ApprovalListResponse {
  data: ApprovalRequest[];
  meta: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export interface ApprovalFilters {
  status?: string;
  risk_tier?: string;
  agent_id?: string;
  tool_name?: string;
  tenant_id?: number;
  snoozed?: boolean;
  expiring_soon?: boolean;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
}

export interface ApprovalEvent {
  id: number;
  event_type: string;
  occurred_at: string;
  status: string;
  payload: Record<string, any>;
}

// ------------------------------------------------------------
// API Fetcher Functions
// ------------------------------------------------------------

export async function fetchApprovals(filters: ApprovalFilters = {}): Promise<ApprovalListResponse> {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.risk_tier) params.set('risk_tier', filters.risk_tier);
  if (filters.agent_id) params.set('agent_id', filters.agent_id);
  if (filters.tool_name) params.set('tool_name', filters.tool_name);
  if (filters.tenant_id) params.set('tenant_id', String(filters.tenant_id));
  if (filters.snoozed !== undefined) params.set('snoozed', String(filters.snoozed));
  if (filters.expiring_soon) params.set('expiring_soon', 'true');
  if (filters.page) params.set('page', String(filters.page));
  if (filters.per_page) params.set('per_page', String(filters.per_page));
  if (filters.date_from) params.set('date_from', filters.date_from);
  if (filters.date_to) params.set('date_to', filters.date_to);

  const query = params.toString();
  const url = buildApiUrl(`/mcp/approvals${query ? `?${query}` : ''}`);

  const res = await fetch(url, {
    method: 'GET',
    headers: getApiRequestHeaders(),
  });

  if (!res.ok) {
    throw toApiError(await res.json().catch(() => ({ message: 'Erro ao buscar aprovações.' })), { status: res.status });
  }

  return res.json();
}

export async function fetchApprovalStats(): Promise<ApprovalStats> {
  const url = buildApiUrl('/mcp/approvals/stats');
  const res = await fetch(url, {
    method: 'GET',
    headers: getApiRequestHeaders(),
  });

  if (!res.ok) {
    throw toApiError(await res.json().catch(() => ({ message: 'Erro ao buscar estatísticas.' })), { status: res.status });
  }

  const json = await res.json();
  return json.stats;
}

export async function fetchApprovalDetail(uuid: string): Promise<ApprovalDetailResponse> {
  const url = buildApiUrl(`/mcp/approvals/${encodeURIComponent(uuid)}`);
  const res = await fetch(url, {
    method: 'GET',
    headers: getApiRequestHeaders(),
  });

  if (!res.ok) {
    throw toApiError(await res.json().catch(() => ({ message: 'Erro ao carregar detalhes da aprovação.' })), { status: res.status });
  }

  return res.json();
}

export async function fetchApprovalEvents(uuid: string): Promise<ApprovalEvent[]> {
  const url = buildApiUrl(`/mcp/approvals/${encodeURIComponent(uuid)}/events`);
  const res = await fetch(url, {
    method: 'GET',
    headers: getApiRequestHeaders(),
  });

  if (!res.ok) {
    throw toApiError(await res.json().catch(() => ({ message: 'Erro ao carregar eventos da aprovação.' })), { status: res.status });
  }

  const json = await res.json();
  return json.events || [];
}

export async function approveRequest(uuid: string): Promise<ApprovalRequest> {
  const url = buildApiUrl(`/mcp/approvals/${encodeURIComponent(uuid)}/approve`);
  const res = await fetch(url, {
    method: 'POST',
    headers: getApiRequestHeaders({ 'Content-Type': 'application/json' }),
  });

  const json = await res.json();
  if (!res.ok || !json.ok) {
    throw toApiError(json.error || json, { status: res.status });
  }

  return json.data;
}

export async function rejectRequest(uuid: string, reason?: string): Promise<ApprovalRequest> {
  const url = buildApiUrl(`/mcp/approvals/${encodeURIComponent(uuid)}/reject`);
  const res = await fetch(url, {
    method: 'POST',
    headers: getApiRequestHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ reason }),
  });

  const json = await res.json();
  if (!res.ok || !json.ok) {
    throw toApiError(json.error || json, { status: res.status });
  }

  return json.data;
}

export async function snoozeRequest(uuid: string, until: string, reason?: string): Promise<ApprovalRequest> {
  const url = buildApiUrl(`/mcp/approvals/${encodeURIComponent(uuid)}/snooze`);
  const res = await fetch(url, {
    method: 'POST',
    headers: getApiRequestHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ until, reason }),
  });

  const json = await res.json();
  if (!res.ok || !json.ok) {
    throw toApiError(json.error || json, { status: res.status });
  }

  return json.data;
}

export async function unsnoozeRequest(uuid: string): Promise<ApprovalRequest> {
  const url = buildApiUrl(`/mcp/approvals/${encodeURIComponent(uuid)}/unsnooze`);
  const res = await fetch(url, {
    method: 'POST',
    headers: getApiRequestHeaders({ 'Content-Type': 'application/json' }),
  });

  const json = await res.json();
  if (!res.ok || !json.ok) {
    throw toApiError(json.error || json, { status: res.status });
  }

  return json.data;
}

export async function executeApproval(uuid: string, options: { executionId?: string; forceSync?: boolean } = {}): Promise<any> {
  const url = buildApiUrl(`/mcp/approvals/${encodeURIComponent(uuid)}/execute`);
  const res = await fetch(url, {
    method: 'POST',
    headers: getApiRequestHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      execution_id: options.executionId,
      force_sync: options.forceSync,
    }),
  });

  const json = await res.json();
  if (!res.ok || !json.ok) {
    throw toApiError(json.error || json, { status: res.status });
  }

  return json;
}

// ------------------------------------------------------------
// React Query Keys & Hooks
// ------------------------------------------------------------

export const approvalKeys = {
  all: ['mcp_approvals'] as const,
  lists: () => [...approvalKeys.all, 'list'] as const,
  list: (filters: ApprovalFilters) => [...approvalKeys.lists(), filters] as const,
  details: () => [...approvalKeys.all, 'detail'] as const,
  detail: (uuid: string) => [...approvalKeys.details(), uuid] as const,
  stats: () => [...approvalKeys.all, 'stats'] as const,
  events: (uuid: string) => [...approvalKeys.all, 'events', uuid] as const,
};

export function useApprovals(filters: ApprovalFilters = {}) {
  return useQuery({
    queryKey: approvalKeys.list(filters),
    queryFn: () => fetchApprovals(filters),
    staleTime: 10_000,
  });
}

export function useApprovalStats() {
  return useQuery({
    queryKey: approvalKeys.stats(),
    queryFn: fetchApprovalStats,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function useApprovalDetail(uuid: string | null) {
  return useQuery({
    queryKey: approvalKeys.detail(uuid || ''),
    queryFn: () => fetchApprovalDetail(uuid!),
    enabled: !!uuid,
    staleTime: 10_000,
  });
}

export function useApprovalEvents(uuid: string | null) {
  return useQuery({
    queryKey: approvalKeys.events(uuid || ''),
    queryFn: () => fetchApprovalEvents(uuid!),
    enabled: !!uuid,
    staleTime: 10_000,
  });
}

export function useApproveMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => approveRequest(uuid),
    onSuccess: (_data, uuid) => {
      queryClient.invalidateQueries({ queryKey: approvalKeys.all });
      queryClient.invalidateQueries({ queryKey: approvalKeys.detail(uuid) });
    },
  });
}

export function useRejectMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, reason }: { uuid: string; reason?: string }) => rejectRequest(uuid, reason),
    onSuccess: (_data, { uuid }) => {
      queryClient.invalidateQueries({ queryKey: approvalKeys.all });
      queryClient.invalidateQueries({ queryKey: approvalKeys.detail(uuid) });
    },
  });
}

export function useSnoozeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, until, reason }: { uuid: string; until: string; reason?: string }) =>
      snoozeRequest(uuid, until, reason),
    onSuccess: (_data, { uuid }) => {
      queryClient.invalidateQueries({ queryKey: approvalKeys.all });
      queryClient.invalidateQueries({ queryKey: approvalKeys.detail(uuid) });
    },
  });
}

export function useUnsnoozeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => unsnoozeRequest(uuid),
    onSuccess: (_data, uuid) => {
      queryClient.invalidateQueries({ queryKey: approvalKeys.all });
      queryClient.invalidateQueries({ queryKey: approvalKeys.detail(uuid) });
    },
  });
}

export function useExecuteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, options }: { uuid: string; options?: { executionId?: string; forceSync?: boolean } }) =>
      executeApproval(uuid, options),
    onSuccess: (_data, { uuid }) => {
      queryClient.invalidateQueries({ queryKey: approvalKeys.all });
      queryClient.invalidateQueries({ queryKey: approvalKeys.detail(uuid) });
    },
  });
}
