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

  submitLead: async (payload: WizardPayload): Promise<{ lead_id: number; otp_sent_at: string; email_hint?: string; error?: any }> => {
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
  },

  resendOtp: async (leadId: number): Promise<void> => {
    await fetchApi(`/leads/${leadId}/resend_otp`, { method: 'POST' });
  },

  verifyOtp: async (leadId: number, otpCode: string): Promise<{ companies?: any[] }> => {
    const response = await fetchApi<any>(`/leads/${leadId}/verify_otp`, {
      method: 'POST',
      body: JSON.stringify({ otp_code: otpCode }),
    });
    return response;
  }
};

const getFallbackSchema = (categoryId: number): WizardSchema => ({
  source: 'default',
  category_id: categoryId,
  template_key: 'solar_fallback',
  template_version: 1,
  availability: {
    company_available: true,
    reason: 'fallback_client',
  },
  schema: {
    steps: [
      {
        id: 'contact_info',
        title: 'Seus Dados',
        description: 'Precisamos de alguns dados para enviar seu orçamento.',
        fields: [
          { key: 'full_name', target: 'lead', type: 'text', label: 'Nome Completo', required: true },
          { key: 'email', target: 'lead', type: 'email', label: 'E-mail', required: true },
          { key: 'phone', target: 'lead', type: 'tel', label: 'WhatsApp', required: true },
          { key: 'zipcode', target: 'lead', type: 'zipcode', label: 'CEP', required: true },
          { key: 'consent', target: 'lead', type: 'checkbox', label: 'Aceito os termos de uso e política de privacidade', required: true }
        ]
      },
      {
        id: 'project_details',
        title: 'Projeto',
        description: 'Conte um pouco sobre a sua necessidade.',
        fields: [
          {
            key: 'project_profile',
            target: 'lead',
            type: 'select',
            label: 'Perfil do Projeto',
            required: true,
            options: [
              { label: 'Residencial', value: 'residential' },
              { label: 'Comercial', value: 'commercial' },
              { label: 'Industrial', value: 'industrial' },
              { label: 'Rural', value: 'rural' }
            ]
          },
          {
            key: 'system_size_band',
            target: 'lead',
            type: 'select',
            label: 'Tamanho do Sistema',
            required: true,
            options: [
              { label: 'Até 7 kWp', value: 'up_to_7_kwp' },
              { label: '8 kWp ou mais', value: '8_kwp_plus' },
              { label: 'Não sei', value: 'dont_know' }
            ]
          },
          {
            key: 'decision_timeline',
            target: 'lead',
            type: 'select',
            label: 'Prazo de Decisão',
            required: true,
            options: [
              { label: 'Imediato', value: 'immediate' },
              { label: 'Em 3 meses', value: '3_months' },
              { label: 'Em 6 meses', value: '6_months' },
              { label: 'Apenas pesquisando', value: 'researching' }
            ]
          }
        ]
      }
    ]
  }
});
