import { fetchApi } from '@/lib/api';

export type IntentProvider = 'linkedin' | 'meta' | 'google';
export type IntentTab = 'overview' | 'audiences' | 'sources' | 'history';

export interface IntentSyncStatus {
  company_id: number;
  available: boolean;
  draft_only: boolean;
  sync_enabled: boolean;
  reason: 'rollout_disabled' | 'upgrade_required' | 'provider_approval_pending';
  roles: { membership: 'owner' | 'manager' | 'editor' };
  capabilities: {
    create_draft: boolean;
    sync: boolean;
    oauth: boolean;
    source_import: boolean;
  };
  providers: { key: IntentProvider; status: string; operational: boolean }[];
}

export interface ActivationSource {
  id: number;
  name: string;
  kind: string;
  verification_status: 'pending' | 'verified' | 'rejected' | 'revoked';
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ActivationAudience {
  id: number;
  name: string;
  status: 'draft' | 'archived';
  source_id: number | null;
  filter_definition: Record<string, string>;
  version: number;
  lock_version: number;
  created_at: string;
  updated_at: string;
}

export interface ActivationSyncJob {
  id: number;
  audience_segment_id: number;
  status: string;
  accepted_count: number | null;
  rejected_count: number | null;
  matched_count: number | null;
  error_code: string | null;
  created_at: string;
  updated_at: string;
}

const context = (companyId: string | number) => ({ company_id: companyId });

export const intentSyncApi = {
  status: (companyId: string | number) =>
    fetchApi<IntentSyncStatus>('/demand_activation/status', {
      params: context(companyId), silentStatusCodes: [403],
    }),

  audiences: (companyId: string | number, page = 1) =>
    fetchApi<{ audiences: ActivationAudience[]; pagination: { page: number; total: number; total_pages: number } }>(
      '/demand_activation/audiences', {
        params: { ...context(companyId), page }, silentStatusCodes: [403],
      }
    ),

  createAudience: (
    companyId: string | number,
    audience: { name: string; source_id?: number; filter_definition?: Record<string, string> }
  ) => fetchApi<{ audience: ActivationAudience }>('/demand_activation/audiences', {
    method: 'POST', params: context(companyId), body: { audience },
  }),

  archiveAudience: (companyId: string | number, audienceId: number) =>
    fetchApi<{ audience: ActivationAudience }>(
      `/demand_activation/audiences/${audienceId}/archive`,
      { method: 'POST', params: context(companyId) }
    ),

  sources: (companyId: string | number) =>
    fetchApi<{ sources: ActivationSource[] }>('/demand_activation/sources', {
      params: context(companyId), silentStatusCodes: [403],
    }),

  registerSource: (
    companyId: string | number,
    source: { name: string; provenance: { purpose: string; legal_basis: string; attestation_version: string } }
  ) => fetchApi<{ source: ActivationSource }>('/demand_activation/sources', {
    method: 'POST', params: context(companyId), body: { source },
  }),

  connections: (companyId: string | number) =>
    fetchApi<{ connections: { provider: IntentProvider; status: string; operational: boolean; account: string | null }[] }>(
      '/demand_activation/connections', {
        params: context(companyId), silentStatusCodes: [403],
      }
    ),

  history: (companyId: string | number) =>
    fetchApi<{ jobs: ActivationSyncJob[] }>('/demand_activation/syncs', {
      params: context(companyId), silentStatusCodes: [403],
    }),

  audit: (companyId: string | number) =>
    fetchApi<{ events: { id: number; action: string; subject_type: string; subject_id: number; created_at: string }[] }>(
      '/demand_activation/audit', {
        params: context(companyId), silentStatusCodes: [403],
      }
    ),
};
