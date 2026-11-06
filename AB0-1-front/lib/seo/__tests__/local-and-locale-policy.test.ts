import {
  DEFAULT_CATEGORY_LOCALE,
  DEFAULT_OPENGRAPH_LOCALE,
  buildCategoryLocaleAlternates,
} from '@/lib/seo/locale-policy';
import { buildCategoryPageMetadata } from '@/lib/seo/category-metadata';

describe('Locale & Local Anti-Doorway Policy (CDSI-096..CDSI-105)', () => {
  it('CDSI-103: returns only canonical without fake hreflang languages when no translations exist', () => {
    const alternates = buildCategoryLocaleAlternates({
      canonicalUrl: 'https://www.avaliasolar.com.br/categories/inversores-solares',
    });

    expect(DEFAULT_CATEGORY_LOCALE).toBe('pt-BR');
    expect(DEFAULT_OPENGRAPH_LOCALE).toBe('pt_BR');
    expect(alternates).toEqual({
      canonical: 'https://www.avaliasolar.com.br/categories/inversores-solares',
    });
    expect(alternates.languages).toBeUndefined();
  });

  it('CDSI-101: prevents city query filters on category pages from generating doorway titles or self-canonicals', () => {
    const metadata = buildCategoryPageMetadata({
      category: {
        id: 10,
        name: 'Inversores',
        seo_url: 'inversores-solares',
        seo_title: 'Inversores Solares 2026 | Avalia Solar',
        short_description: 'Compare inversores solares.',
      },
      searchParams: { state: 'SP', city: 'Sorocaba' },
    });

    expect(metadata.title).toBe('Inversores Solares 2026 | Avalia Solar');
    expect(String(metadata.title)).not.toContain('Sorocaba');
    expect(metadata.alternates?.canonical).toBe(
      'https://www.avaliasolar.com.br/categories/inversores-solares'
    );
    expect(metadata.robots).toEqual({ index: false, follow: true });
  });
});
