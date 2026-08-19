import mixpanel from 'mixpanel-browser';
import * as analytics from '../../lib/analytics';
import * as consent from '../../lib/analytics/consent';
import * as utm from '../../lib/analytics/utm';
import * as gtag from '../../lib/analytics/gtag';
import * as dedupe from '../../lib/analytics/dedupe';

// Mock dependencies
jest.mock('mixpanel-browser', () => ({
  __esModule: true,
  default: {
    init: jest.fn(),
    track: jest.fn(),
  },
}));

jest.mock('../../lib/analytics/consent', () => ({
  hasAnalyticsConsent: jest.fn(),
  onConsentChange: jest.fn(),
}));

jest.mock('../../lib/analytics/utm', () => ({
  getCurrentUTMs: jest.fn(() => ({})),
  initializeUTMs: jest.fn(),
}));

jest.mock('../../lib/analytics/gtag', () => ({
  initializeGTag: jest.fn(),
  gtagEvent: jest.fn(),
  mapToGA4Event: jest.fn((name, props) => ({ name, params: props })),
}));

jest.mock('../../lib/analytics/dedupe', () => ({
  shouldTrackEvent: jest.fn(() => true),
  generateEventId: jest.fn(() => 'test-id'),
}));

describe('Analytics Core Logic', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_MIXPANEL_TOKEN: 'test-token',
      NEXT_PUBLIC_GA_MEASUREMENT_ID: 'test-ga-id',
      NODE_ENV: 'test',
    };

    // Default mock values
    (consent.hasAnalyticsConsent as jest.Mock).mockReturnValue(true);
    (utm.getCurrentUTMs as jest.Mock).mockReturnValue({});
    (dedupe.shouldTrackEvent as jest.Mock).mockReturnValue(true);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('track', () => {
    it('should send events to both Mixpanel and GA4 by default', () => {
      // Ensure it's "initialized" for the test
      // Note: Since we can't easily reset the internal 'initialized' flag without resetModules,
      // we just ensure initializeAnalytics is called at least once.
      analytics.initializeAnalytics();

      analytics.track('test_event', { prop1: 'val1' });

      // Check Mixpanel
      expect(mixpanel.track).toHaveBeenCalledWith(
        'Test Event',
        expect.objectContaining({
          prop1: 'val1',
        })
      );

      // Check GA4
      expect(gtag.gtagEvent).toHaveBeenCalledWith(
        'test_event',
        expect.objectContaining({
          prop1: 'val1',
        })
      );
    });

    it('should block events if no consent', () => {
      (consent.hasAnalyticsConsent as jest.Mock).mockReturnValue(false);

      analytics.track('blocked_event');

      expect(mixpanel.track).not.toHaveBeenCalledWith('Blocked Event', expect.anything());
    });
  });

  describe('getAnalyticsContext', () => {
    it('should return basic context', () => {
      const context = analytics.getAnalyticsContext();

      expect(context).toHaveProperty('platform', 'web');
      expect(context).toHaveProperty('pathname');
    });
  });
});
