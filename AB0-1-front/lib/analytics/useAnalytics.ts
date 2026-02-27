import { useCallback } from 'react';
import { analytics, AnalyticsEventPayload } from './events';

/**
 * Hook para tracking de eventos com contexto automático
 */
export function useCategoryAnalytics(category: string) {
  const trackCardClick = useCallback(
    (companyId: number, placement: 'top' | 'sponsored' | 'organic', variant?: string) => {
      analytics.companyCardClick({
        company_id: companyId,
        placement,
        card_variant: (variant as any) || 'compact',
        category,
      });
    },
    [category]
  );

  const trackFilterClick = useCallback(
    (filterName: string, state: 'on' | 'off') => {
      analytics.quickFilterClick({
        filter_name: filterName,
        state,
        category,
      });
    },
    [category]
  );

  const trackLeadOpen = useCallback(
    (companyId: number, placement: 'card' | 'modal' | 'hero') => {
      analytics.leadOpenInternal({
        company_id: companyId,
        placement,
        category,
      });
    },
    [category]
  );

  const trackLeadSubmit = useCallback(
    (companyId: number, projectType?: string, success = true) => {
      analytics.leadSubmitInternal({
        company_id: companyId,
        category,
        project_type: projectType,
        success,
      });
    },
    [category]
  );

  const trackLeadSuccess = useCallback(
    (companyId: number) => {
      analytics.leadSuccess({
        company_id: companyId,
        category,
      });
    },
    [category]
  );

  const trackSort = useCallback(
    (sortBy: 'rating_desc' | 'reviews_desc' | 'name_asc' | 'recent') => {
      analytics.sortChange({
        sort_by: sortBy,
        category,
      });
    },
    [category]
  );

  const trackFilterRemove = useCallback(
    (filterKey: string, filterValue?: string) => {
      analytics.filterToolbarRemove({
        filter_key: filterKey,
        filter_value: filterValue,
        category,
      });
    },
    [category]
  );

  return {
    trackCardClick,
    trackFilterClick,
    trackLeadOpen,
    trackLeadSubmit,
    trackLeadSuccess,
    trackSort,
    trackFilterRemove,
  };
}
