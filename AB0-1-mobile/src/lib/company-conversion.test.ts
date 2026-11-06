import { canRequestCompanyQuote, canContactCompanyWhatsApp } from './company-conversion';

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
});
