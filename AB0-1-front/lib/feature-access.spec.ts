import { canUsePaidConversion, canShowMediaGallery } from './feature-access';

const company = (
  hasPaidPlan: boolean,
  featureAccess?: Record<string, { state: 'enabled' | 'locked' | 'hidden'; value?: boolean }>,
  planTier?: string
) => ({
  has_paid_plan: hasPaidPlan,
  feature_access: featureAccess,
  plan_tier: planTier,
});

describe('canUsePaidConversion', () => {
  it('bloqueia empresa gratuita mesmo com entitlement legado', () => {
    expect(
      canUsePaidConversion(
        company(false, { custom_ctas: { state: 'enabled', value: true } }),
        'quote'
      )
    ).toBe(false);
  });

  it('usa custom_ctas como chave canônica para orçamento', () => {
    expect(
      canUsePaidConversion(
        company(true, { custom_ctas: { state: 'enabled', value: true } }),
        'quote'
      )
    ).toBe(true);
  });

  it.each([
    undefined,
    {},
    { custom_ctas: { state: 'locked' as const, value: false } },
    { custom_ctas: { state: 'hidden' as const, value: false } },
  ])('falha fechado quando o entitlement não está habilitado: %j', (featureAccess) => {
    expect(canUsePaidConversion(company(true, featureAccess), 'quote')).toBe(false);
  });

  it('compartilha a mesma autorização canônica para WhatsApp', () => {
    expect(
      canUsePaidConversion(
        company(true, { custom_ctas: { state: 'enabled', value: true } }),
        'whatsapp'
      )
    ).toBe(true);
  });
});

describe('canShowMediaGallery', () => {
  it('bloqueia empresa gratuita sem plano pago', () => {
    expect(canShowMediaGallery(company(false))).toBe(false);
  });

  it('bloqueia empresa com plan_tier explicitamente free', () => {
    expect(
      canShowMediaGallery(
        company(false, { media_gallery: { state: 'enabled', value: true } }, 'free')
      )
    ).toBe(false);
  });

  it('bloqueia empresa com plano pago quando media_gallery está bloqueado (ex: plano essencial)', () => {
    expect(
      canShowMediaGallery(
        company(true, { media_gallery: { state: 'locked', value: false } }, 'essential')
      )
    ).toBe(false);
  });

  it('habilita empresa com plano pago e media_gallery habilitado (ex: plano pro/enterprise)', () => {
    expect(
      canShowMediaGallery(
        company(true, { media_gallery: { state: 'enabled', value: true } }, 'pro')
      )
    ).toBe(true);
  });

  it('habilita empresa com plano pago ativo mesmo na ausência transitória de feature_access', () => {
    expect(canShowMediaGallery(company(true, undefined, 'pro'))).toBe(true);
  });
});
