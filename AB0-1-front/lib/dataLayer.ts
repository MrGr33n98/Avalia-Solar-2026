/**
 * @deprecated Use `@/lib/analytics/consolidated` instead.
 * This shim remains temporarily for backward compatibility during migration.
 */

export type { GTMEvent, PageData, UserData } from '@/lib/analytics/consolidated';
export {
  getGtmSessionId,
  pushToDataLayer,
  trackContactClick,
  trackFaqEngagement,
  trackLeadSuccess,
  trackPageView,
  trackSearchPerformance,
  trackWizardStart,
} from '@/lib/analytics/consolidated';

// Stubs for deprecated functions that were removed from consolidated
export function trackCompanyListImpression(..._args: any[]): void {
  // Deprecated: use consolidated analytics instead
}

export function trackMenuIntent(..._args: any[]): void {
  // Deprecated: use consolidated analytics instead
}

export function trackValueDataInteraction(..._args: any[]): void {
  // Deprecated: use consolidated analytics instead
}
