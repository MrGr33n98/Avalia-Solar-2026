import { getSurfaceKindForHostname } from '../../../lib/analytics/contract';
import { pushAnalyticsDataLayerEvent } from '../../../lib/analytics/data-layer';
import { mapToGA4Event } from '../../../lib/analytics/gtag';

describe('Analytics v2 — integridade da mensuração', () => {
  beforeEach(() => {
    window.dataLayer = [];
  });

  it('distingue login de CRM e login do app pelo hostname', () => {
    expect(getSurfaceKindForHostname('crm.avaliasolar.com.br', '/login')).toBe('crm');
    expect(getSurfaceKindForHostname('app.avaliasolar.com.br', '/login')).toBe('app');
    expect(getSurfaceKindForHostname('www.avaliasolar.com.br', '/login')).toBe('auth');
    expect(getSurfaceKindForHostname('www.avaliasolar.com.br', '/companies/weg')).toBe('public');
  });

  it('bufferiza o evento antes do carregamento do GTM', () => {
    delete (window as any).dataLayer;
    expect(
      pushAnalyticsDataLayerEvent('contact', {
        original_event: 'whatsapp_click',
        company_id: '42',
        event: 'forged',
      })
    ).toBe(true);

    expect(window.dataLayer).toEqual([
      { original_event: 'whatsapp_click', company_id: '42', event: 'contact' },
    ]);
  });

  it('não transforma submissão de formulário ou wizard em purchase', () => {
    expect(mapToGA4Event('lead_submitted', {}).name).toBe('lead_submitted');
    expect(mapToGA4Event('lead_verified', {}).name).toBe('lead_verified');
    expect(mapToGA4Event('wizard_submitted', {}).name).toBe('wizard_submitted');
    expect(mapToGA4Event('generate_lead', {}).name).toBe('generate_lead');
  });
});
