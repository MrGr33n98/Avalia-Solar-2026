import { fetchApiSafe } from '../api-client';

export interface CompanyWebhook {
  id: string;
  url: string;
  secret_key?: string;
  active: boolean;
  events: string[];
  created_at: string;
  updated_at: string;
}

export interface WebhookPayload {
  url: string;
  active?: boolean;
  events?: string[];
}

function withCompanyContext(path: string, companyId: string | number) {
  return `${path}${path.includes('?') ? '&' : '?'}company_id=${encodeURIComponent(String(companyId))}`;
}

export const webhooksApi = {
  getWebhooks: async (companyId: string | number): Promise<{ webhooks: CompanyWebhook[] }> => {
    return fetchApiSafe<{ webhooks: CompanyWebhook[] }>(withCompanyContext('company_webhooks', companyId));
  },

  createWebhook: async (
    companyId: string | number,
    payload: WebhookPayload
  ): Promise<{ webhook: CompanyWebhook }> => {
    return fetchApiSafe<{ webhook: CompanyWebhook }>(withCompanyContext('company_webhooks', companyId), {
      method: 'POST',
      body: JSON.stringify({ company_webhook: payload }),
    });
  },

  updateWebhook: async (
    companyId: string | number,
    id: string,
    payload: WebhookPayload,
    rotateSecret: boolean = false
  ): Promise<{ webhook: CompanyWebhook }> => {
    return fetchApiSafe<{ webhook: CompanyWebhook }>(withCompanyContext(`company_webhooks/${id}${rotateSecret ? '?rotate_secret=true' : ''}`, companyId), {
      method: 'PATCH',
      body: JSON.stringify({ company_webhook: payload }),
    });
  },

  deleteWebhook: async (companyId: string | number, id: string): Promise<void> => {
    return fetchApiSafe<void>(withCompanyContext(`company_webhooks/${id}`, companyId), {
      method: 'DELETE',
    });
  },
};
