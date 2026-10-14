import { initializeGTag, getGaCookieDomain } from '@/lib/analytics/gtag';
import { getPostHogCookieDomain } from '@/components/PostHogProvider';
import { buildCanonicalUrl, SURFACE_ORIGINS } from '@/lib/routing/surface-origins';

describe('REA Runtime Fixes — Testes de Regressão e Resiliência', () => {
  beforeEach(() => {
    delete window.gtag;
    window.dataLayer = [];
  });

  describe('EXP-05: GA4 & PostHog Cookie Domain Resolution & Flags', () => {
    it('retorna "none" em localhost e IP para GA4', () => {
      expect(getGaCookieDomain('localhost')).toBe('none');
      expect(getGaCookieDomain('127.0.0.1')).toBe('none');
      expect(getGaCookieDomain('64.225.59.107')).toBe('none');
    });

    it('retorna domínio raiz para GA4 em subdomínios de avaliasolar.com.br', () => {
      expect(getGaCookieDomain('www.avaliasolar.com.br')).toBe('avaliasolar.com.br');
      expect(getGaCookieDomain('app.avaliasolar.com.br')).toBe('avaliasolar.com.br');
      expect(getGaCookieDomain('outro-site.com')).toBe('auto');
    });

    it('resolve domínio do PostHog sem disparar probes dmn_chk', () => {
      expect(getPostHogCookieDomain('localhost')).toBe('localhost');
      expect(getPostHogCookieDomain('127.0.0.1')).toBe('127.0.0.1');
      expect(getPostHogCookieDomain('64.225.59.107')).toBe('64.225.59.107');
      expect(getPostHogCookieDomain('www.avaliasolar.com.br')).toBe('.avaliasolar.com.br');
      expect(getPostHogCookieDomain('app.avaliasolar.com.br')).toBe('.avaliasolar.com.br');
      expect(getPostHogCookieDomain('desconhecido.com')).toBeUndefined();
    });

    it('inicializa o gtag com cookie_domain e flags seguras', () => {
      initializeGTag('G-TEST1234');

      expect(window.dataLayer).toBeDefined();
      const configCall = window.dataLayer.find(
        (args) => Array.isArray(args) && args[0] === 'config' && args[1] === 'G-TEST1234'
      );
      expect(configCall).toBeDefined();
      expect(configCall[2].cookie_flags).toBeDefined();
      expect(configCall[2].cookie_flags).toContain('SameSite=Lax');
      expect(configCall[2].cookie_update).toBe(true);
    });
  });

  describe('EXP-02: Cross-Surface URL Building', () => {
    it('constrói URL canônica correta para superfície company_app', () => {
      const url = buildCanonicalUrl('company_app', '/dashboard/notifications');
      expect(url).toBe(`${SURFACE_ORIGINS.company}/dashboard/notifications`);
    });

    it('constrói URL canônica correta para superfície crm', () => {
      const url = buildCanonicalUrl('crm', '/dashboard/sales/leads');
      expect(url).toBe(`${SURFACE_ORIGINS.crm}/dashboard/sales/leads`);
    });
  });
});
