import { resolveCompanyHeroBannerState } from './company-banner';

const access = (state: 'enabled' | 'locked', value = state === 'enabled') => ({
  promo_banner: { state, value },
});

describe('resolveCompanyHeroBannerState', () => {
  it('prioriza placeholder Free mesmo com attachment legado', () => {
    expect(
      resolveCompanyHeroBannerState({ feature_access: access('locked') }, '/legacy.png')
    ).toEqual({ kind: 'free-plan-placeholder' });
  });
  it('preserva banner real quando empresa tem entitlement', () => {
    expect(
      resolveCompanyHeroBannerState({ feature_access: access('enabled') }, '/company.png')
    ).toEqual({ kind: 'company-banner', src: '/company.png' });
  });
  it('separa paid-empty de erro técnico', () => {
    expect(resolveCompanyHeroBannerState({ feature_access: access('enabled') })).toEqual({
      kind: 'paid-empty',
    });
    expect(
      resolveCompanyHeroBannerState({ feature_access: access('enabled') }, '/company.png', true)
    ).toEqual({ kind: 'paid-load-error' });
  });
});
