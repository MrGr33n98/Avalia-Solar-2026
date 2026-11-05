import {
  createMarketingWidgetHtml, escapeHtml, MARKETING_WIDGETS, STAR_WIDGET_DIMENSIONS, STAR_WIDGET_VARIANTS, safeCompanyLogoUrl,
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

  it('exports all three independently selectable 120x54 badges matching the compact reference proportions', () => {
    expect(STAR_WIDGET_DIMENSIONS).toEqual({ width: 120, height: 54 });
    expect(STAR_WIDGET_VARIANTS.map((v) => v.id)).toEqual(['blue', 'navy', 'light']);
    const logoUrl = 'https://api.avaliasolar.com.br/rails/active_storage/blobs/weg-logo.png';
    for (const variant of ['blue', 'navy', 'light'] as const) {
      const html = createMarketingWidgetHtml('stars', { ...BASE, logoUrl }, 'light', variant)!;
      expect(html).toContain('width:120px;height:54px');
      expect(html).toContain('border-radius:50%');
      expect(html).toContain('src="' + logoUrl + '"');
      expect(html).toContain('utm_campaign=stars');
      expect(html).toContain('captura estática');
    }
    const dark = createMarketingWidgetHtml('stars', BASE, 'light', 'navy')!;
    expect(dark).toContain('background:#0A1F44');
  });

  it('includes the real company avatar in the summary without inventing progress bars', () => {
    const html = createMarketingWidgetHtml('summary', {
      ...BASE,
      logoUrl: 'https://api.avaliasolar.com.br/assets/companies/company-logo.webp',
    }, 'light')!;
    expect(html).toContain('width:36px;height:36px;min-width:36px;min-height:36px');
    expect(html).toContain('padding:4px');
    expect(html).toContain('border-radius:50%');
    expect(html).toContain('width:100%;height:100%');
    expect(html).toContain('object-fit:contain');
    expect(html).toContain('object-position:center center');
    expect(html).toContain('<img src="https://api.avaliasolar.com.br/');
    expect(html).toContain('12 avaliações aprovadas');
    expect(html).not.toContain('width:66%');
  });

  it.each(['blue', 'navy', 'light'] as const)(
    'keeps rectangular logos contained and centered for the %s badge',
    (variant) => {
      const html = createMarketingWidgetHtml('stars', {
        ...BASE,
        logoUrl: 'https://api.avaliasolar.com.br/rails/active_storage/blobs/weg-wide.png',
      }, 'light', variant)!;

      expect(html).toContain('width:22px;height:22px;min-width:22px;min-height:22px');
      expect(html).toContain('padding:3px');
      expect(html).toContain('overflow:hidden;border-radius:50%');
      expect(html).toContain('display:block;width:100%;height:100%');
      expect(html).toContain('object-fit:contain');
      expect(html).toContain('object-position:center center');
      expect(html).toContain('border-radius:50%');
      expect(html).toContain('width:120px;height:54px');
    }
  );

  it('uses navy monochrome treatment exclusively for WEG on the navy badge', () => {
    const sample = { ...BASE, companyName: 'WEG', logoUrl: 'https://api.avaliasolar.com.br/assets/weg.png' };
    const navy = createMarketingWidgetHtml('stars', sample, 'dark', 'navy')!;
    expect(navy).toContain('background:#0B132B');
    expect(navy).toContain('filter:grayscale(1) invert(1) contrast(3);mix-blend-mode:screen');
    expect(navy).toContain('object-fit:contain');

    for (const variant of ['blue', 'light'] as const) {
      const neutral = createMarketingWidgetHtml('stars', sample, 'light', variant)!;
      expect(neutral).toContain('background:#FFFFFF');
      expect(neutral).not.toContain('mix-blend-mode:screen');
    }

    const otherBrand = createMarketingWidgetHtml('stars', { ...sample, companyName: 'KAJU' }, 'dark', 'navy')!;
    expect(otherBrand).not.toContain('mix-blend-mode:screen');
    expect(otherBrand).toContain('background:#FFFFFF');
  });

  it('rejects untrusted and non-HTTPS logo sources in exported snapshots', () => {
    expect(safeCompanyLogoUrl('javascript:alert(1)')).toBeNull();
    expect(safeCompanyLogoUrl('https://avaliasolar.com.br.attacker.test/avatar.png')).toBeNull();
    expect(safeCompanyLogoUrl('http://api.avaliasolar.com.br/logo.png')).toBeNull();
    expect(safeCompanyLogoUrl('https://images.bad-example.com/logo.svg')).toBeNull();
    const html = createMarketingWidgetHtml('stars', {
      ...BASE,
      logoUrl: 'https://attacker.test/pixel?x=<script>',
    }, 'light', 'blue')!;
    expect(html).not.toContain('attacker.test');
    expect(html).not.toContain('<img');
    expect(html).toContain('KE');
  });
});
