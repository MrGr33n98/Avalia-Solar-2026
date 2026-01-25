import { fetchApi } from './api';

export interface FaqItem {
  id: number;
  question: string;
  answer: string;
  category: string;
  position: number;
  active: boolean;
  helpful_yes?: number;
  helpful_no?: number;
  helpful_total?: number;
}

export interface FaqResponse {
  faqs: FaqItem[];
  pagination?: {
    count: number;
    page: number;
    per_page: number;
  };
}

type FaqListParams = { category?: string; q?: string; page?: number; per_page?: number; company_id?: number };

export const faqApi = {
  list: async (params?: FaqListParams): Promise<FaqResponse> => {
    const response = await fetchApi<FaqResponse>('/faqs', {
      params,
      retries: 1, // avoid repeated CORS/502 retries
      fallback: { faqs: [] },
    });
    return response;
  },
  vote: async (faqId: number, helpful: boolean): Promise<FaqItem> => {
    const response = await fetchApi<{ faq: FaqItem }>(`/faqs/${faqId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ helpful }),
    });
    return response.faq;
  },
};

export default faqApi;
