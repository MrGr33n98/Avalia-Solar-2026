// lib/icp-api.ts
import { getApiBaseUrl } from '@/lib/api-config';

export interface IcpProfile {
  id?: number;
  company_id?: number;
  min_monthly_bill: number;
  max_monthly_bill?: number | null;
  min_system_kwp: number;
  min_ev_chargers_count: number;
  strictness_level: 'flexible' | 'balanced' | 'strict';
  auto_reject_out_of_icp: boolean;
  notify_only_high_match: boolean;
  nationwide: boolean;
  target_audiences: string[];
  preferred_roof_types: string[];
  ev_charger_types: string[];
  target_cities: string[];
  target_states: string[];
  updated_at?: string;
}

export async function fetchIcpProfile(companyId?: number): Promise<IcpProfile> {
  const url = new URL(`${getApiBaseUrl()}/dashboard/icp_profile`);
  if (companyId) url.searchParams.set('company_id', companyId.toString());

  const res = await fetch(url.toString(), {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Falha ao carregar perfil de ICP');
  }

  return res.json();
}

export async function updateIcpProfile(profile: Partial<IcpProfile>, companyId?: number): Promise<IcpProfile> {
  const url = new URL(`${getApiBaseUrl()}/dashboard/icp_profile`);
  if (companyId) url.searchParams.set('company_id', companyId.toString());

  const res = await fetch(url.toString(), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(profile),
  });

  if (!res.ok) {
    throw new Error('Falha ao salvar perfil de ICP');
  }

  return res.json();
}
