import { requestApi } from '@/lib/api-campaigns';
import type {
  EmailTemplate,
  EmailTemplatePayload,
  TemplateListParams,
  TemplateListResponse,
  TemplateStats,
  VariableGroup,
  TemplatePreviewResult,
} from '@/components/sales/campaigns/templates/types';

export async function listEmailTemplates(params: TemplateListParams = {}): Promise<TemplateListResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.per_page) query.set('per_page', String(params.per_page));
  if (params.q) query.set('q', params.q);
  if (params.category) query.set('category', params.category);
  if (params.status) query.set('status', params.status);
  if (params.scope) query.set('scope', params.scope);
  if (params.sort) query.set('sort', params.sort);
  if (params.direction) query.set('direction', params.direction);

  const url = `/email_templates${query.toString() ? `?${query.toString()}` : ''}`;
  return requestApi<TemplateListResponse>(url);
}

export async function getEmailTemplate(id: number): Promise<{ template: EmailTemplate }> {
  return requestApi<{ template: EmailTemplate }>(`/email_templates/${id}`);
}

export async function createEmailTemplate(payload: EmailTemplatePayload): Promise<{ template: EmailTemplate }> {
  return requestApi<{ template: EmailTemplate }>('/email_templates', {
    method: 'POST',
    body: JSON.stringify({ template: payload }),
  });
}

export async function updateEmailTemplate(id: number, payload: Partial<EmailTemplatePayload>): Promise<{ template: EmailTemplate }> {
  return requestApi<{ template: EmailTemplate }>(`/email_templates/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ template: payload }),
  });
}

export async function duplicateEmailTemplate(id: number): Promise<{ template: EmailTemplate }> {
  return requestApi<{ template: EmailTemplate }>(`/email_templates/${id}/duplicate`, {
    method: 'POST',
  });
}

export async function archiveEmailTemplate(id: number): Promise<{ template: EmailTemplate }> {
  return requestApi<{ template: EmailTemplate }>(`/email_templates/${id}/archive`, {
    method: 'POST',
  });
}

export async function deleteEmailTemplate(id: number): Promise<{ message: string }> {
  return requestApi<{ message: string }>(`/email_templates/${id}`, {
    method: 'DELETE',
  });
}

export async function previewEmailTemplate(
  id: number,
  options: { to_email?: string; context?: Record<string, unknown>; context_ids?: Record<string, number> } = {}
): Promise<{ preview: TemplatePreviewResult }> {
  return requestApi<{ preview: TemplatePreviewResult }>(`/email_templates/${id}/preview`, {
    method: 'POST',
    body: JSON.stringify(options),
  });
}

export async function sendTemplateTest(
  id: number,
  options: { to_email: string; context_ids?: Record<string, number> }
): Promise<{ message: string; to_email: string; rendered: TemplatePreviewResult }> {
  return requestApi<{ message: string; to_email: string; rendered: TemplatePreviewResult }>(`/email_templates/${id}/test_send`, {
    method: 'POST',
    body: JSON.stringify(options),
  });
}

export async function getTemplateStats(): Promise<TemplateStats> {
  return requestApi<TemplateStats>('/email_templates/stats');
}

export async function getTemplateVariables(): Promise<{ groups: VariableGroup[] }> {
  return requestApi<{ groups: VariableGroup[] }>('/email_templates/variables');
}

export async function getTemplateCategories(): Promise<{ categories: string[] }> {
  return requestApi<{ categories: string[] }>('/email_templates/categories');
}
