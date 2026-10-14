import { initializeGTag, getGaCookieDomain } from '@/lib/analytics/gtag';
import { buildCanonicalUrl, SURFACE_ORIGINS } from '@/lib/routing/surface-origins';

describe('REA Runtime Fixes — Testes de Regressão e Resiliência', () => {
  beforeEach(() => {
    delete window.gtag;
    window.dataLayer = [];
  });

  describe('EXP-05: GA4 Cookie Domain Resolution & Flags', () => {
    it('retorna "none" em localhost para evitar rejeição de cookie no browser', () => {
      expect(getGaCookieDomain('localhost')).toBe('none');
      expect(getGaCookieDomain('127.0.0.1')).toBe('none');
    });

    it('retorna "none" em endereços IP diretos (ex: droplet 64.225.59.107)', () => {
      expect(getGaCookieDomain('64.225.59.107')).toBe('none');
    });

    it('retorna "auto" em subdomínios padrão na ausência de configuração específica', () => {
      expect(getGaCookieDomain('www.avaliasolar.com.br')).toBe('auto');
      expect(getGaCookieDomain('app.avaliasolar.com.br')).toBe('auto');
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
