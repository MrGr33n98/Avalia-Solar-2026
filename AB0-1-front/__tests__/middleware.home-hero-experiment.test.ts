import { shouldAssignHomeHeroExperimentCookie } from '@/lib/experiments/homeHeroExperiment';

describe('middleware home hero experiment', () => {
  it('assigns cookie for root path when experiment is enabled and cookie is missing', () => {
    expect(
      shouldAssignHomeHeroExperimentCookie({
        pathname: '/',
        enabled: true,
        cookieValue: undefined,
      })
    ).toBe(true);
  });

  it('does not assign cookie when variant is already valid', () => {
    expect(
      shouldAssignHomeHeroExperimentCookie({
        pathname: '/',
        enabled: true,
        cookieValue: 'control',
      })
    ).toBe(false);
  });

  it('does not assign cookie for non-home routes', () => {
    expect(
      shouldAssignHomeHeroExperimentCookie({
        pathname: '/companies',
        enabled: true,
        cookieValue: undefined,
      })
    ).toBe(false);
  });

  it('does not assign cookie when experiment is disabled', () => {
    expect(
      shouldAssignHomeHeroExperimentCookie({
        pathname: '/',
        enabled: false,
        cookieValue: undefined,
      })
    ).toBe(false);
  });
});
