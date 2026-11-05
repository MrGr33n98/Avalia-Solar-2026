import type { Company } from '@/lib/api';
import { canShowCompanyQuoteCTA, resolveCompanyConversionCTAs } from './company-cta-visibility';

const paid = {
  id: 372,
  name: 'Empresa Exemplo',
  has_paid_plan: true,
  quote_cta_enabled: true,
  whatsapp_enabled: true,
  whatsapp_url: 'https://wa.me/5548999545370',
  feature_access: {
    custom_ctas: { state: 'enabled', value: true },
    whatsapp_contact_button: { state: 'enabled', value: true },
  },
} as unknown as Company;

describe('Brand Page conversion policy — server entitlements + owner preferences', () => {
  it.each([
    ['ambos ligados', true, true, true, true],
    ['somente orçamento', true, false, true, false],
    ['somente WhatsApp', false, true, false, true],
    ['ambos desligados', false, false, false, false],
  ])('%s', (_name, quotePref, whatsappPref, expectedQuote, expectedWhatsapp) => {
    const result = resolveCompanyConversionCTAs({
      ...paid, quote_cta_enabled: quotePref, whatsapp_enabled: whatsappPref,
    });
    expect(result.quote).toBe(expectedQuote);
    expect(Boolean(result.whatsappHref)).toBe(expectedWhatsapp);
  });

  it('fails closed for a free plan even with both preferences set to true', () => {
    const result = resolveCompanyConversionCTAs({ ...paid, has_paid_plan: false });
    expect(result.quote).toBe(false);
    expect(result.whatsappHref).toBeNull();
  });

  it('requires the backend entitlement for each action independently', () => {
    const limited = {
      ...paid,
      feature_access: {
        custom_ctas: { state: 'enabled', value: true },
        whatsapp_contact_button: { state: 'locked', value: false },
      },
    } as Company;
    expect(resolveCompanyConversionCTAs(limited).quote).toBe(true);
    expect(resolveCompanyConversionCTAs(limited).whatsappHref).toBeNull();
  });

  it('preserves legacy quote visibility until an owner explicitly disables it', () => {
    expect(canShowCompanyQuoteCTA({ ...paid, quote_cta_enabled: undefined })).toBe(true);
    expect(canShowCompanyQuoteCTA(paid, false)).toBe(false);
  });
});
