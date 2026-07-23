import {
  trackRecommendedSectionViewed,
  trackRecommendedFilterChanged,
  trackRecommendedCompanyImpression,
  trackRecommendedPrimaryCtaClicked,
} from '@/lib/analytics/recommendations';
import { track } from '@/lib/analytics/lazy';

jest.mock('@/lib/analytics/lazy', () => ({
  track: jest.fn(),
}));

describe('Analytics Recommendations Helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockMeta = {
    request_id: 'req_xyz_123',
    recommendation_version: 'v1.0',
    location: {
      city: 'Florianópolis',
      state: 'SC',
      source: 'explicit_param',
    },
    filters: {
      category_slug: 'instaladores',
      segment: 'installer',
    },
  };

  const mockItem = {
    id: 99,
    name: 'Empresa Teste Analytics',
    segment: 'installer',
    sponsored: true,
    recommendation_reason: {
      code: 'LOCAL_COVERAGE',
      label: 'Sede em Florianópolis, SC',
    },
    ranking: {
      position: 1,
      organic_score: 95,
      sponsored: true,
    },
    primary_cta: {
      type: 'request_quote',
      label: 'Solicitar orçamento',
      action: 'open_quote_modal',
    },
  };

  it('tracks recommended_section_viewed event', () => {
    trackRecommendedSectionViewed(mockMeta);

    expect(track).toHaveBeenCalledWith(
      'recommended_section_viewed',
      expect.objectContaining({
        request_id: 'req_xyz_123',
        city: 'Florianópolis',
        state: 'SC',
        location_source: 'explicit_param',
        algorithm_version: 'v1.0',
      })
    );
  });

  it('tracks recommended_filter_changed event', () => {
    trackRecommendedFilterChanged('installer', 'installer', mockMeta);

    expect(track).toHaveBeenCalledWith(
      'recommended_filter_changed',
      expect.objectContaining({
        request_id: 'req_xyz_123',
        tab_id: 'installer',
        filter_segment: 'installer',
      })
    );
  });

  it('tracks recommended_company_impression event', () => {
    trackRecommendedCompanyImpression(mockItem, mockMeta);

    expect(track).toHaveBeenCalledWith(
      'recommended_company_impression',
      expect.objectContaining({
        request_id: 'req_xyz_123',
        company_id: 99,
        position: 1,
        sponsored: true,
        recommendation_reason: 'LOCAL_COVERAGE',
      })
    );
  });

  it('tracks recommended_primary_cta_clicked event', () => {
    trackRecommendedPrimaryCtaClicked(mockItem, mockMeta);

    expect(track).toHaveBeenCalledWith(
      'recommended_primary_cta_clicked',
      expect.objectContaining({
        request_id: 'req_xyz_123',
        company_id: 99,
        cta_type: 'request_quote',
        cta_label: 'Solicitar orçamento',
        cta_action: 'open_quote_modal',
      })
    );
  });
});
