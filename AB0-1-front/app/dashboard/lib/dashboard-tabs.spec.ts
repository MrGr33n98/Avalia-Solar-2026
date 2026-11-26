import { initialDashboardTab, resolveDashboardTab } from './dashboard-tabs';

describe('resolveDashboardTab', () => {
  it('usa overview quando não há aba', () => {
    expect(resolveDashboardTab(null)).toEqual({ kind: 'tab', tab: 'overview' });
    expect(resolveDashboardTab('')).toEqual({ kind: 'tab', tab: 'overview' });
  });

  it.each([
    ['info', 'product-general'],
    ['prospects', 'tracking-attribution'],
    ['track-your-prospects', 'tracking-attribution'],
    ['buyer_intent', 'buyer-intent'],
  ])('canonicaliza alias %s para %s', (alias, canonical) => {
    expect(resolveDashboardTab(alias)).toEqual({ kind: 'tab', tab: canonical });
  });

  it('é idempotente: aplicar duas vezes não muda o resultado', () => {
    for (const raw of ['info', 'prospects', 'buyer_intent', 'reviews', 'overview']) {
      const first = resolveDashboardTab(raw);
      if (first.kind !== 'tab') continue;
      expect(resolveDashboardTab(first.tab)).toEqual(first);
    }
  });

  it.each([
    ['live-inbox', '/dashboard/inbox'],
    ['icp-config', '/dashboard/icp'],
    ['proposals', '/dashboard/proposals'],
  ])('envia %s para a rota %s', (tab, href) => {
    expect(resolveDashboardTab(tab)).toEqual({ kind: 'route', href });
  });

  it('mantém abas comuns sem alteração', () => {
    expect(resolveDashboardTab('reviews')).toEqual({ kind: 'tab', tab: 'reviews' });
  });
});

describe('initialDashboardTab', () => {
  it('cai em overview para abas que são rotas', () => {
    expect(initialDashboardTab('proposals')).toBe('overview');
  });

  it('canonicaliza alias', () => {
    expect(initialDashboardTab('info')).toBe('product-general');
  });
});
