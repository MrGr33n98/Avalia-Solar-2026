import { track, initializeAnalytics } from '@/lib/analytics';
import * as consent from '@/lib/analytics/consent';
import * as gtag from '@/lib/analytics/gtag';

jest.mock('@/lib/analytics/consent', () => ({
  hasAnalyticsConsent: jest.fn(),
  onConsentChange: jest.fn(),
}));

jest.mock('@/lib/analytics/gtag', () => ({
  gtagEvent: jest.fn(),
  mapToGA4Event: jest.requireActual('@/lib/analytics/gtag').mapToGA4Event,
}));

jest.mock('@/lib/offline/apiMutation', () => ({
  sendJsonApiMutationWithOfflineQueue: jest.fn().mockResolvedValue({ status: 200 }),
  isQueuedOfflineMutationResult: jest.fn(() => false),
}));

describe('Analytics Single Dispatcher GA4 Integration (TEST-02)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (consent.hasAnalyticsConsent as jest.Mock).mockReturnValue(true);
    initializeAnalytics();
  });

  it('dispatches whatsapp_click as GA4 recommended event "contact" with mapped params', () => {
    track('whatsapp_click', {
      company_id: 42,
      placement: 'company_card',
    });

    expect(gtag.gtagEvent).toHaveBeenCalledWith(
      'contact',
      expect.objectContaining({
        item_id: 42,
        creative_slot: 'company_card',
      })
    );
  });

  it('dispatches generate_lead with sanitized parameters', () => {
    track('generate_lead', {
      company_id: 101,
      category_name: 'Inversores',
    });

    expect(gtag.gtagEvent).toHaveBeenCalledWith(
      'generate_lead',
      expect.objectContaining({
        item_id: 101,
        item_category: 'Inversores',
      })
    );
  });

  it('respects options.sendTo.ga4 === false', () => {
    track(
      'whatsapp_click',
      { company_id: 42 },
      { sendTo: { ga4: false } }
    );

    expect(gtag.gtagEvent).not.toHaveBeenCalled();
  });

  it('blocks dispatch when user has denied analytics consent', () => {
    (consent.hasAnalyticsConsent as jest.Mock).mockReturnValue(false);

    track('whatsapp_click', { company_id: 42 });

    expect(gtag.gtagEvent).not.toHaveBeenCalled();
  });
});

