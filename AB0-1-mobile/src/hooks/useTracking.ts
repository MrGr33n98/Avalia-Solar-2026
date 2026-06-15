import { usePostHog } from 'posthog-react-native';

export function useTracking() {
  const posthog = usePostHog();

  const trackCompanyClick = (companyId: string | number, companyName: string, source: string) => {
    posthog?.capture('company_clicked', {
      company_id: String(companyId),
      company_name: companyName,
      source,
    });
  };

  const trackLeadSent = (companyId: string | number, leadType: 'whatsapp' | 'form') => {
    posthog?.capture('lead_sent', {
      company_id: String(companyId),
      lead_type: leadType,
    });
  };

  return { trackCompanyClick, trackLeadSent, posthog };
}
