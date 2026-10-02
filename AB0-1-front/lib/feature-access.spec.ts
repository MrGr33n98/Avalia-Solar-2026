import { canUsePaidConversion } from './feature-access';

const company = (
  hasPaidPlan: boolean,
  featureAccess?: Record<string, { state: 'enabled' | 'locked' | 'hidden'; value?: boolean }>
) => ({
  has_paid_plan: hasPaidPlan,
  feature_access: featureAccess,
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
