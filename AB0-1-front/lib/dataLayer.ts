/**
 * @deprecated Use `@/lib/analytics/consolidated` instead.
 * This shim remains temporarily for backward compatibility during migration.
 */

export type { GTMEvent, PageData, UserData } from '@/lib/analytics/consolidated';
export {
  getGtmSessionId,
  pushToDataLayer,
  trackCompanyListImpression,
  trackContactClick,
  trackFaqEngagement,
  trackLeadSuccess,
  trackMenuIntent,
  trackPageView,
  trackSearchPerformance,
  trackValueDataInteraction,
  trackWizardStart,
} from '@/lib/analytics/consolidated';
