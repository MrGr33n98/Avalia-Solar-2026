import { canRequestCompanyQuote, canContactCompanyWhatsApp, companyWhatsAppHref } from './company-conversion';

describe('native enterprise conversion access', () => {
  it('fails closed with missing entitlement', () => {
    expect(canRequestCompanyQuote({ has_paid_plan: true })).toBe(false);
    expect(canContactCompanyWhatsApp({ has_paid_plan: true })).toBe(false);
  });
  it('never grants a Free company a paid CTA', () => {
    const free = { has_paid_plan: false, cta_visibility: { effective: { quote: true, whatsapp: true } } };
    expect(canRequestCompanyQuote(free)).toBe(false);
    expect(canContactCompanyWhatsApp(free)).toBe(false);
  });
  it('keeps quote and WhatsApp independent for active paid plans', () => {
    const paid = { has_paid_plan: true, cta_visibility: { effective: { quote: true, whatsapp: false } } };
    expect(canRequestCompanyQuote(paid)).toBe(true);
    expect(canContactCompanyWhatsApp(paid)).toBe(false);
  });
  it('only exposes canonical company WhatsApp links with a paid effective entitlement', () => {
    const paid = { has_paid_plan: true,
      cta_visibility: { effective: { quote: false, whatsapp: true } },
      cta_whatsapp_url: 'https://wa.me/5548999700506' };
    expect(companyWhatsAppHref(paid)).toBe('https://wa.me/5548999700506');
    expect(companyWhatsAppHref({ ...paid, has_paid_plan: false })).toBeNull();
    expect(companyWhatsAppHref({ ...paid, cta_visibility: { effective: { quote: false, whatsapp: false } } })).toBeNull();
    expect(companyWhatsAppHref({ ...paid, cta_whatsapp_url: 'https://wa.me.evil.test/5548999700506' })).toBeNull();
    expect(companyWhatsAppHref({ ...paid, cta_whatsapp_url: 'javascript:alert(1)' })).toBeNull();
    expect(companyWhatsAppHref({ ...paid, cta_whatsapp_url: '' })).toBeNull();
    expect(companyWhatsAppHref({ ...paid, cta_whatsapp_url: 'https://wa.me/5548999700506?text=secret' })).toBeNull();
  });
});
