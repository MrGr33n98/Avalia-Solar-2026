import {
  COMPARE_COMPANY_LOGO_FALLBACK,
  mapCompanyToCompareCompany,
} from '../mapCompanyToCompareCompany';

describe('mapCompanyToCompareCompany', () => {
  it('normaliza campos alternativos', () => {
    const result = mapCompanyToCompareCompany({
      id: 12,
      name: 'Voltaia Brasil',
      average_rating: 4.7,
      reviews_count: 31,
      is_verified: true,
      logo: '/voltaia.png',
    });

    expect(result).toMatchObject({
      id: 12,
      name: 'Voltaia Brasil',
      rating: 4.7,
      reviewsCount: 31,
      verified: true,
      logoUrl: '/voltaia.png',
    });
  });

  it('não quebra com null e aplica fallbacks seguros', () => {
    expect(mapCompanyToCompareCompany(null)).toMatchObject({
      id: 0,
      name: 'Empresa sem nome',
      rating: 0,
      reviewsCount: 0,
      verified: false,
      logoUrl: COMPARE_COMPANY_LOGO_FALLBACK,
    });
  });
});
