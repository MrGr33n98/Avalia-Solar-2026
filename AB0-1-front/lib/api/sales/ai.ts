import { requestApi } from '@/lib/api-campaigns';
import type {
  CrmAiDecision,
  CrmAiGenerationRequest,
  CrmAiGenerationResponse,
  CrmAiModelProfile,
  CrmAiProviderInfo,
  CrmAiSetting,
  CrmAiUsageResponse,
  OpenRouterCatalogModel,
} from './aiTypes';

export async function getAiProviders(): Promise<{
  providers: CrmAiProviderInfo[];
  catalog: OpenRouterCatalogModel[];
}> {
  return requestApi('/ai/providers');
}

export async function updateOpenRouterCredentials(payload: {
  api_key?: string;
  revoke?: boolean;
}): Promise<{
  message: string;
  provider: Partial<CrmAiProviderInfo>;
}> {
  return requestApi('/ai/providers/openrouter/credentials', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function testOpenRouterConnection(payload?: {
  api_key?: string;
  model_id?: string;
}): Promise<{
  status: string;
  message: string;
  latency_ms: number;
  tested_model: string;
  provider: Partial<CrmAiProviderInfo>;
}> {
  return requestApi('/ai/providers/openrouter/test', {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
}

export async function getAiSettings(): Promise<{
  settings: CrmAiSetting;
  model_profiles: CrmAiModelProfile[];
  catalog: OpenRouterCatalogModel[];
  available_features: string[];
  can_edit: boolean;
}> {
  return requestApi('/ai/settings');
}

export async function updateAiSettings(payload: {
  settings?: Partial<CrmAiSetting>;
  model_profiles?: Array<Partial<CrmAiModelProfile> & { feature: string }>;
}): Promise<{
  message: string;
  settings: CrmAiSetting;
  model_profiles: CrmAiModelProfile[];
}> {
  return requestApi('/ai/settings', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function createAiGeneration(
  payload: CrmAiGenerationRequest
): Promise<CrmAiGenerationResponse> {
  return requestApi('/ai/generations', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getAiGeneration(id: number | string): Promise<CrmAiGenerationResponse> {
  return requestApi(`/ai/generations/${id}`);
}

export async function submitAiGenerationFeedback(
  id: number | string,
  payload: { decision: CrmAiDecision; notes?: string }
): Promise<{
  message: string;
  generation: CrmAiGenerationResponse;
}> {
  return requestApi(`/ai/generations/${id}/feedback`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getAiUsage(): Promise<CrmAiUsageResponse> {
  return requestApi('/ai/usage');
}

