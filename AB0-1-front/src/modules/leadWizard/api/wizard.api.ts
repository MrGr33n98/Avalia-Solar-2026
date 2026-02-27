import { fetchApi } from '@/lib/api';
import { WizardSchema, WizardPayload } from '../types/wizard.types';

export const wizardApi = {
  resolveSchema: async (categoryId: number, preferredCompanyId?: number): Promise<WizardSchema> => {
    try {
      const params = new URLSearchParams();
      params.append('category_id', categoryId.toString());
      if (preferredCompanyId) {
        params.append('preferred_company_id', preferredCompanyId.toString());
      }
      
      const response = await fetchApi<WizardSchema>(`/lead_wizards/resolve?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('[LeadWizard API] Failed to resolve schema, using fallback', error);
      return getFallbackSchema(categoryId);
    }
  },

  submitLead: async (payload: WizardPayload): Promise<{ lead_id: number; otp_sent_at: string; error?: any }> => {
    try {
      const response = await fetchApi<any>('/leads/wizard_create', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return response;
    } catch (error: any) {
      console.error('[LeadWizard API] Submission failed', error);
      throw error;
    }
  }
};

const getFallbackSchema = (categoryId: number): WizardSchema => ({
  source: 'default',
  category_id: categoryId,
  template_key: 'solar_fallback',
  template_version: 1,
  schema: {
    steps: [
      {
        id: 'contact_info',
        title: 'Seus Dados',
        description: 'Precisamos de alguns dados para enviar seu orçamento.',
        fields: [
          { key: 'full_name', type: 'text', label: 'Nome Completo', required: true },
          { key: 'email', type: 'email', label: 'E-mail', required: true },
          { key: 'phone', type: 'tel', label: 'WhatsApp', required: true },
          { key: 'zipcode', type: 'zipcode', label: 'CEP', required: true },
          { key: 'consent', type: 'checkbox', label: 'Aceito os termos de uso e política de privacidade', required: true }
        ]
      }
    ]
  }
});
