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

export const webhooksApi = {
  getWebhooks: async (): Promise<{ webhooks: CompanyWebhook[] }> => {
    return fetchApiSafe<{ webhooks: CompanyWebhook[] }>('company_webhooks');
  },

  createWebhook: async (
    payload: WebhookPayload
  ): Promise<{ webhook: CompanyWebhook }> => {
    return fetchApiSafe<{ webhook: CompanyWebhook }>('company_webhooks', {
      method: 'POST',
      body: JSON.stringify({ company_webhook: payload }),
    });
  },

  updateWebhook: async (
    id: string,
    payload: WebhookPayload,
    rotateSecret: boolean = false
  ): Promise<{ webhook: CompanyWebhook }> => {
    return fetchApiSafe<{ webhook: CompanyWebhook }>(`company_webhooks/${id}${rotateSecret ? '?rotate_secret=true' : ''}`, {
      method: 'PATCH',
      body: JSON.stringify({ company_webhook: payload }),
    });
  },

  deleteWebhook: async (id: string): Promise<void> => {
    return fetchApiSafe<void>(`company_webhooks/${id}`, {
      method: 'DELETE',
    });
  },
};
