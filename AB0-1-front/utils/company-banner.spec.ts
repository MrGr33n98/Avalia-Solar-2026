import { resolveCompanyHeroBannerState, resolveCompanyFallbackBanner } from "./company-banner";

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

describe('isEVCompanyCategory & resolveCompanyFallbackBanner', () => {
  it('identifica empresa de mobilidade elétrica pelo slug ou nome da categoria', () => {
    expect(
      resolveCompanyFallbackBanner({
        category: 'carregadores-residenciais',
      }).src
    ).toBe('/assets/avalia-solar-ev-banner-categories.webp');

    expect(
      resolveCompanyFallbackBanner({
        primary_category: 'Frotas Elétricas Corporativas',
      }).src
    ).toBe('/assets/avalia-solar-ev-banner-categories.webp');

    expect(
      resolveCompanyFallbackBanner({
        categories: [{ id: 1, name: 'Instaladores de Carregadores EV', seo_url: 'instaladores-carregadores' } as unknown as import('@/lib/api').Category],
      }).src
    ).toBe('/assets/avalia-solar-ev-banner-categories.webp');

    expect(
      resolveCompanyFallbackBanner({
        identity: {
          primary_category: { id: 2, name: 'Hubs de Eletromobilidade e Recarga', slug: 'hubs-eletromobilidade' },
        },
      }).src
    ).toBe('/assets/avalia-solar-ev-banner-categories.webp');
  });

  it('retorna fallback padrão solar para empresas fotovoltaicas', () => {
    expect(
      resolveCompanyFallbackBanner({
        category: 'energia-solar-residencial',
      }).src
    ).toBe('/assets/avalia-solar-banner-v3.webp');

    expect(
      resolveCompanyFallbackBanner(null).src
    ).toBe('/assets/avalia-solar-banner-v3.webp');
  });
});
