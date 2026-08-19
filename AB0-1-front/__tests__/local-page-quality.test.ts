import { isLocalPageIndexable, LOCAL_PAGE_MIN_COMPANIES } from '@/lib/seo/local-page-quality';

const strongLocalPage = {
  location: {
    scope: 'city',
    city: 'Florianópolis',
    state: 'SC',
    canonical_path: '/companies/energia-solar/sc/florianopolis',
  },
  seo: {
    title: 'Empresas de energia solar em Florianópolis | Avalia Solar',
    description:
      'Compare empresas de energia solar em Florianópolis com avaliações e dados locais.',
    indexable: true,
  },
  stats: {
    total_companies: LOCAL_PAGE_MIN_COMPANIES,
  },
  companies: [{ id: 1 }, { id: 2 }, { id: 3 }],
};

describe('local page SEO quality gate', () => {
  it('allows strong local pages to be indexable', () => {
    expect(isLocalPageIndexable(strongLocalPage)).toBe(true);
  });

  it('blocks pages below the minimum company count', () => {
    expect(
      isLocalPageIndexable({
        ...strongLocalPage,
        stats: { total_companies: LOCAL_PAGE_MIN_COMPANIES - 1 },
      })
    ).toBe(false);
  });

  it('blocks pages with filters/search params', () => {
    expect(isLocalPageIndexable(strongLocalPage, { hasSearchParams: true })).toBe(false);
  });

  it('blocks pages without backend indexability approval', () => {
    expect(
      isLocalPageIndexable({
        ...strongLocalPage,
        seo: { ...strongLocalPage.seo, indexable: false },
      })
    ).toBe(false);
  });

  it('blocks pages without a local canonical path or local context', () => {
    expect(
      isLocalPageIndexable({
        ...strongLocalPage,
        location: { ...strongLocalPage.location, canonical_path: '/' },
      })
    ).toBe(false);

    expect(
      isLocalPageIndexable({
        ...strongLocalPage,
        location: { scope: 'city', canonical_path: '/companies/energia-solar/sc/florianopolis' },
      })
    ).toBe(false);
  });
});
