import type { Company } from '@/lib/api';
import { getCompanyWhatsAppHref, normalizeCompanyWhatsAppLink } from './whatsapp-contact';

const paidCompany = {
  id: 12,
  name: 'Kaju Energia Solar',
  has_paid_plan: true,
  cta_whatsapp_enabled: true,
  cta_whatsapp_url: '48999700506',
  feature_access: {
    custom_ctas: { state: 'enabled', value: true },
    whatsapp_contact_button: { state: 'enabled', value: true },
  },
} as unknown as Company;

describe('WhatsApp público da Brand Page — permissões', () => {
  it('normaliza celular brasileiro sem alterar URLs wa.me já configuradas', () => {
    expect(normalizeCompanyWhatsAppLink('48999700506')).toBe('https://wa.me/5548999700506');
    expect(normalizeCompanyWhatsAppLink('https://wa.me/5548999700506?text=Oi'))
      .toBe('https://wa.me/5548999700506?text=Oi');
  });

  it('nega esquemas externos ou URLs inseguras', () => {
    expect(normalizeCompanyWhatsAppLink('javascript:alert(1)')).toBeNull();
    expect(normalizeCompanyWhatsAppLink('https://wa.me.evil.example/5548999700506')).toBeNull();
    expect(normalizeCompanyWhatsAppLink('https://example.org/5548999700506')).toBeNull();
    expect(normalizeCompanyWhatsAppLink('')).toBeNull();
  });

  it('concede apenas empresa paga com flag ativa, contato e entitlement', () => {
    expect(getCompanyWhatsAppHref(paidCompany)).toBe('https://wa.me/5548999700506');
  });

  it.each([
    ['Free', { has_paid_plan: false }],
    ['sem entitlement', { feature_access: {} }],
    ['entitlement locked', { feature_access: { whatsapp_contact_button: { state: 'locked', value: false } } }],
    ['entitlement hidden', { feature_access: { whatsapp_contact_button: { state: 'hidden', value: false } } }],
    ['flag disabled', { cta_whatsapp_enabled: false }],
    ['sem número', { cta_whatsapp_url: null }],
  ])('bloqueia %s', (_case, override) => {
    expect(getCompanyWhatsAppHref({ ...paidCompany, ...override } as Company)).toBeNull();
  });
});
