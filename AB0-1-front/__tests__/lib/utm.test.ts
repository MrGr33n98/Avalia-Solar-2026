import { clearUTMs, getAttribution, getCurrentUTMs, updateAttribution } from '../../lib/analytics/utm';

describe('UTM attribution persistence', () => {
  beforeEach(() => {
    clearUTMs();
  });

  it('preserves last touch values on internal navigation without new utms', () => {
    updateAttribution('/landing', new URLSearchParams('utm_source=google&utm_medium=cpc&utm_campaign=launch'), 'https://google.com');

    updateAttribution('/companies/lin-energia-solar', new URLSearchParams(''), 'https://localhost/landing');

    const attribution = getAttribution();
    expect(attribution?.last_touch?.values?.utm_source).toBe('google');
    expect(attribution?.last_touch?.values?.utm_medium).toBe('cpc');
    expect(attribution?.last_touch?.values?.utm_campaign).toBe('launch');
    expect(getCurrentUTMs().utm_source).toBe('google');
  });

  it('updates referrer metadata for a new external referrer but keeps attribution values', () => {
    updateAttribution('/landing', new URLSearchParams('utm_source=meta&utm_medium=paid_social'), 'https://facebook.com');

    updateAttribution('/companies/genial-solar', new URLSearchParams(''), 'https://instagram.com');

    const attribution = getAttribution();
    expect(attribution?.last_touch?.referrer_host).toBe('instagram.com');
    expect(attribution?.last_touch?.values?.utm_source).toBe('meta');
    expect(attribution?.last_touch?.values?.utm_medium).toBe('paid_social');
  });
});
