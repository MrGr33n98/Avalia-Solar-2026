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

  const trackPlanViewed = (companyId: string | number, currentPlan: string) => {
    posthog?.capture('plan_viewed', {
      company_id: String(companyId),
      current_plan: currentPlan,
    });
  };

  const trackUpgradeClicked = (companyId: string | number, targetPlan: string) => {
    posthog?.capture('upgrade_clicked', {
      company_id: String(companyId),
      target_plan: targetPlan,
    });
  };

  const trackPremiumFeatureBlocked = (companyId: string | number, featureName: string) => {
    posthog?.capture('premium_feature_blocked', {
      company_id: String(companyId),
      feature_name: featureName,
    });
  };

  const trackBannerViewed = (bannerId: string | number, placement: string, isSponsored: boolean) => {
    posthog?.capture('banner_viewed', {
      banner_id: String(bannerId),
      placement,
      is_sponsored: isSponsored,
    });
  };

  const trackBannerClicked = (bannerId: string | number, placement: string, isSponsored: boolean) => {
    posthog?.capture('banner_clicked', {
      banner_id: String(bannerId),
      placement,
      is_sponsored: isSponsored,
    });
  };

  return { 
    trackCompanyClick, 
    trackLeadSent, 
    trackPlanViewed, 
    trackUpgradeClicked, 
    trackPremiumFeatureBlocked, 
    trackBannerViewed, 
    trackBannerClicked, 
    posthog 
  };
}
