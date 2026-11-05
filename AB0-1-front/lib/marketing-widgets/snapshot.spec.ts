import {
  createMarketingWidgetHtml, escapeHtml, MARKETING_WIDGETS,
  type MarketingWidgetSnapshot,
} from './snapshot';

const BASE: MarketingWidgetSnapshot = {
  companyName: 'KAJU Energia Solar',
  slug: 'kaju-energia-solar',
  approvedCount: 12,
  rating: 4.5,
  rankPosition: null,
  rankPopulation: null,
  testimonial: null,
  testimonialAllowed: false,
};

describe('reputation marketing widget snapshots', () => {
  it('registers all four marketing assets with unique ids', () => {
    expect(MARKETING_WIDGETS.map((asset) => asset.id)).toEqual([
      'ranking', 'summary', 'stars', 'testimonial',
    ]);
    expect(new Set(MARKETING_WIDGETS.map((asset) => asset.id)).size).toBe(4);
  });

  it('does not invent ratings when there are no approved reviews', () => {
    const empty = { ...BASE, rating: null, approvedCount: 0 };
    expect(createMarketingWidgetHtml('summary', empty, 'light')).toBeNull();
    expect(createMarketingWidgetHtml('stars', empty, 'dark')).toBeNull();
  });

  it('exports only an official ranking, never guessed quadrant data', () => {
    expect(createMarketingWidgetHtml('ranking', BASE, 'light')).toBeNull();
    const markup = createMarketingWidgetHtml('ranking',
      { ...BASE, rankPosition: 2, rankPopulation: 18 }, 'light');
    expect(markup).toContain('Posição 2 de 18');
    expect(markup).toContain('captura estática');
    expect(markup).not.toContain('<script');
  });

  it('gates testimonial publishing by permission and real, approved featured data', () => {
    const example = { ...BASE, testimonial: { author: 'Maria', quote: 'Bom serviço', rating: 5 } };
    expect(createMarketingWidgetHtml('testimonial', example, 'light')).toBeNull();
    expect(createMarketingWidgetHtml('testimonial',
      { ...example, testimonialAllowed: true }, 'light')).toContain('Bom serviço');
  });

  it('escapes all untrusted company name and review markup', () => {
    const dangerous = {
      ...BASE,
      companyName: '<img src=x onerror="alert(1)">',
      testimonialAllowed: true,
      testimonial: { author: 'João & Ana', quote: '<script>alert("x")</script>', rating: 5 },
    };
    const html = createMarketingWidgetHtml('testimonial', dangerous, 'dark')!;
    expect(html).toContain('&lt;img');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('João &amp; Ana');
    expect(html).not.toContain('<script>');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(escapeHtml('A&B"\'<')).toBe('A&amp;B&quot;&#39;&lt;');
  });

  it('uses encoded path and only controlled theme values', () => {
    const html = createMarketingWidgetHtml('stars', { ...BASE, slug: 'empresa/solar' }, 'dark')!;
    expect(html).toContain('/companies/empresa%2Fsolar?');
    expect(html).toContain('utm_medium=embed');
    expect(html).toContain('background:#0A1F44');
  });
});
