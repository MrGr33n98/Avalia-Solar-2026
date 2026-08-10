import { getConsent, hasAnalyticsConsent, setConsent } from './consent';

describe('consentimento de analytics', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.restoreAllMocks();
  });

  it('não habilita analytics sem consentimento', () => {
    expect(getConsent()).toBeNull();
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it('persiste consentimento e habilita analytics somente quando concedido', () => {
    setConsent({ analytics: true, marketing: false });
    expect(getConsent()).toEqual(expect.objectContaining({ analytics: true, marketing: false }));
    expect(hasAnalyticsConsent()).toBe(true);
  });

  it('tolera estado corrompido no storage', () => {
    window.localStorage.setItem('avaliasolar_consent', '{invalid');
    expect(getConsent()).toBeNull();
    expect(hasAnalyticsConsent()).toBe(false);
  });
});
